import { beforeEach, describe, expect, it } from 'vitest'
import { useProgress } from './store'
import { emptyProgress, migrateProgress, normalizeProgress } from './migrate'
import { BACKUP_KEY, STORAGE_KEY, createSafeStorage, readRawProgress, resetStoredProgress } from './storage'

const today = '2026-10-20'
const s = () => useProgress.getState()

beforeEach(() => {
  useProgress.setState(emptyProgress())
})

describe('progress store', () => {
  it('unlocks steps monotonically and marks the lesson in progress', () => {
    s().unlockStep('1.1', 2)
    s().unlockStep('1.1', 1)
    expect(s().lessons['1.1']).toEqual({ status: 'in-progress', unlockedStep: 2 })
  })

  it('does not reopen a completed lesson as in progress', () => {
    s().completeLesson('1.1', [], today)
    s().unlockStep('1.1', 5)
    expect(s().lessons['1.1'].status).toBe('completed')
  })

  it('completes a lesson and enrolls its cards without resetting known ones', () => {
    useProgress.setState({ cards: { old: { box: 3, due: '2026-10-25' } } })
    s().completeLesson('1.1', ['old', 'new'], today)
    expect(s().lessons['1.1'].status).toBe('completed')
    expect(s().lessons['1.1'].completedAt).toBeTypeOf('string')
    expect(s().cards.old).toEqual({ box: 3, due: '2026-10-25' })
    expect(s().cards.new).toEqual({ box: 1, due: '2026-10-21' })
  })

  it('counts attempts, remembers success and the last choice', () => {
    s().recordAttempt('g', false, 1)
    s().recordAttempt('g', true, 0)
    expect(s().gates.g).toEqual({ passed: true, attempts: 2, revealed: false, choice: 0 })
  })

  it('reveals a gate and schedules its question for review tomorrow', () => {
    const card = { id: 'check:g', kind: 'flip' as const, prompt: 'Вопрос', answer: 'Ответ' }
    s().revealGate('g', card, today)
    expect(s().gates.g).toMatchObject({ passed: true, revealed: true })
    expect(s().customCards['check:g']).toEqual(card)
    expect(s().cards['check:g']).toEqual({ box: 1, due: '2026-10-21' })
  })

  it('reviews cards with the Leitner scheduler', () => {
    s().completeLesson('x', ['c'], today)
    s().reviewCard('c', true, '2026-10-21')
    expect(s().cards.c).toEqual({ box: 2, due: '2026-10-24' })
  })

  it('round-trips progress through export and import', () => {
    s().saveCode('dot', 'function dot() {}')
    s().saveExplanation('e', 'моё объяснение')
    const json = s().exportProgress()
    s().resetProgress()
    expect(s().code).toEqual({})
    expect(s().importProgress(json)).toBe(true)
    expect(s().code.dot).toBe('function dot() {}')
    expect(s().explanations.e).toBe('моё объяснение')
  })

  it('imports a file with corrupted entries but stores only the valid ones', () => {
    const file = {
      version: 1,
      lessons: { a: null, ok: { status: 'completed', unlockedStep: 2 } },
      cards: { c: 'x', d: { box: 9, due: 'x' }, good: { box: 2, due: '2026-10-22' } },
      code: { e: 5, dot: 'function dot() {}' },
      customCards: { f: null },
    }
    expect(s().importProgress(JSON.stringify(file))).toBe(true)
    expect(s().lessons).toEqual({ ok: { status: 'completed', unlockedStep: 2 } })
    expect(s().cards).toEqual({ good: { box: 2, due: '2026-10-22' } })
    expect(s().code).toEqual({ dot: 'function dot() {}' })
    expect(s().customCards).toEqual({})
  })

  it('rejects broken or foreign imports and keeps the current state', () => {
    s().saveCode('dot', 'keep me')
    expect(s().importProgress('{not json')).toBe(false)
    expect(s().importProgress(JSON.stringify({ version: 99, code: {} }))).toBe(false)
    expect(s().importProgress(JSON.stringify([1, 2]))).toBe(false)
    expect(s().code.dot).toBe('keep me')
  })

  it('loads saved progress from localStorage on rehydrate', async () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: 1,
        state: { ...emptyProgress(), lessons: { '0.1': { status: 'completed', unlockedStep: 3 } } },
      }),
    )
    await useProgress.persist.rehydrate()
    expect(s().lessons['0.1'].status).toBe('completed')
  })
})

describe('normalizeProgress / migrateProgress', () => {
  it('drops malformed sections but keeps valid ones', () => {
    const p = normalizeProgress({ lessons: 'oops', gates: null, cards: { c: { box: 2, due: '2026-10-22' } }, junk: 1 })
    expect(p.lessons).toEqual({})
    expect(p.gates).toEqual({})
    expect(p.cards.c).toEqual({ box: 2, due: '2026-10-22' })
  })

  it('drops invalid entries inside sections and keeps valid ones', () => {
    const p = normalizeProgress({
      lessons: { a: null, ok: { status: 'in-progress', unlockedStep: 1 } },
      cards: { c: 'x', d: { box: 9, due: 'x' }, good: { box: 3, due: '2026-11-02' } },
      code: { e: 5, dot: 'return 0' },
      customCards: { f: null },
    })
    expect(p.lessons).toEqual({ ok: { status: 'in-progress', unlockedStep: 1 } })
    expect(p.cards).toEqual({ good: { box: 3, due: '2026-11-02' } })
    expect(p.code).toEqual({ dot: 'return 0' })
    expect(p.customCards).toEqual({})
  })

  it('validates lesson entries: known status and a non-negative integer step', () => {
    const p = normalizeProgress({
      lessons: {
        done: { status: 'completed', unlockedStep: 4, completedAt: '2026-10-20T10:00:00.000Z' },
        badStatus: { status: 'done', unlockedStep: 0 },
        negative: { status: 'in-progress', unlockedStep: -1 },
        fraction: { status: 'in-progress', unlockedStep: 1.5 },
        text: { status: 'in-progress', unlockedStep: '2' },
        badDate: { status: 'completed', unlockedStep: 0, completedAt: 42 },
        list: [],
      },
    })
    expect(p.lessons).toEqual({
      done: { status: 'completed', unlockedStep: 4, completedAt: '2026-10-20T10:00:00.000Z' },
      badDate: { status: 'completed', unlockedStep: 0 },
    })
  })

  it('validates gate entries and defaults a missing «revealed» to false', () => {
    const p = normalizeProgress({
      gates: {
        full: { passed: true, attempts: 2, revealed: true, choice: 1 },
        old: { passed: false, attempts: 0 },
        badChoice: { passed: true, attempts: 1, revealed: false, choice: 'x' },
        notBool: { passed: 'yes', attempts: 1, revealed: false },
        negative: { passed: false, attempts: -1, revealed: false },
        badRevealed: { passed: false, attempts: 0, revealed: 'no' },
        nothing: null,
      },
    })
    expect(p.gates).toEqual({
      full: { passed: true, attempts: 2, revealed: true, choice: 1 },
      old: { passed: false, attempts: 0, revealed: false },
      badChoice: { passed: true, attempts: 1, revealed: false },
    })
  })

  it('validates card states: box 1–5 and a YYYY-MM-DD date', () => {
    const p = normalizeProgress({
      cards: {
        ok: { box: 5, due: '2026-12-01' },
        zero: { box: 0, due: '2026-12-01' },
        six: { box: 6, due: '2026-12-01' },
        half: { box: 2.5, due: '2026-12-01' },
        shortDate: { box: 1, due: '2026-1-1' },
        noDate: { box: 1 },
      },
    })
    expect(p.cards).toEqual({ ok: { box: 5, due: '2026-12-01' } })
  })

  it('keeps only strings in code and explanations', () => {
    const p = normalizeProgress({ code: { a: 'x', b: null, c: {} }, explanations: { d: 'моё', e: 1 } })
    expect(p.code).toEqual({ a: 'x' })
    expect(p.explanations).toEqual({ d: 'моё' })
  })

  it('validates custom cards, including the options of a choice card', () => {
    const flip = { id: 'check:a', kind: 'flip', prompt: 'Вопрос', answer: '42' }
    const choice = { id: 'check:b', kind: 'choice', prompt: 'Вопрос', answer: 'да', options: ['да', 'нет'], correct: 0 }
    const p = normalizeProgress({
      customCards: {
        'check:a': flip,
        'check:b': choice,
        noPrompt: { id: 'x', kind: 'flip', answer: '1' },
        badKind: { id: 'x', kind: 'essay', prompt: 'p', answer: 'a' },
        oneOption: { ...choice, options: ['да'] },
        notStrings: { ...choice, options: ['да', 2] },
        outOfRange: { ...choice, correct: 2 },
        fraction: { ...choice, correct: 0.5 },
        noCorrect: { ...choice, correct: undefined },
      },
    })
    expect(p.customCards).toEqual({ 'check:a': flip, 'check:b': choice })
  })

  it('keeps progress for lesson ids the course no longer has (the UI ignores them)', () => {
    const p = normalizeProgress({ lessons: { '9.9': { status: 'completed', unlockedStep: 0 } } })
    expect(p.lessons['9.9']).toBeDefined()
  })

  it('backs up unknown versions and starts fresh', () => {
    const p = migrateProgress({ lessons: { a: 1 } }, 99)
    expect(p).toEqual(emptyProgress())
    expect(JSON.parse(localStorage.getItem(BACKUP_KEY)!)).toEqual({ lessons: { a: 1 } })
  })
})

describe('createSafeStorage', () => {
  it('moves corrupted JSON to the backup key and reports no data', () => {
    localStorage.setItem(STORAGE_KEY, '{broken')
    const storage = createSafeStorage()
    expect(storage.getItem(STORAGE_KEY)).toBeNull()
    expect(localStorage.getItem(BACKUP_KEY)).toBe('{broken')
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
  })
})

describe('emergency recovery helpers', () => {
  // общий beforeEach уже записал пустой прогресс в localStorage
  beforeEach(() => localStorage.clear())

  it('reads the saved progress exactly as stored', () => {
    expect(readRawProgress()).toBeNull()
    localStorage.setItem(STORAGE_KEY, '{"version":1,"state":{"lessons":{"a":null}}}')
    expect(readRawProgress()).toBe('{"version":1,"state":{"lessons":{"a":null}}}')
  })

  it('backs the saved progress up before removing it', () => {
    localStorage.setItem(STORAGE_KEY, '{"version":1}')
    resetStoredProgress()
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
    expect(localStorage.getItem(BACKUP_KEY)).toBe('{"version":1}')
  })

  it('keeps an older backup when there is nothing to reset', () => {
    localStorage.setItem(BACKUP_KEY, 'older')
    resetStoredProgress()
    expect(localStorage.getItem(BACKUP_KEY)).toBe('older')
  })
})
