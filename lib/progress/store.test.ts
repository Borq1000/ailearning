import { beforeEach, describe, expect, it } from 'vitest'
import { useProgress } from './store'
import { emptyProgress, migrateProgress, normalizeProgress } from './migrate'
import { BACKUP_KEY, STORAGE_KEY, createSafeStorage } from './storage'

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
