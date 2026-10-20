import { describe, expect, it } from 'vitest'
import type { CardState } from './types'
import { addDays, isDue, newCard, nextReview, pickRecallCards, seededShuffle, todayISO } from './scheduler'

describe('dates', () => {
  it('formats a local date as YYYY-MM-DD', () => {
    expect(todayISO(new Date(2026, 9, 20, 23, 59))).toBe('2026-10-20')
  })

  it('adds days across month, year and leap-day boundaries', () => {
    expect(addDays('2026-10-20', 1)).toBe('2026-10-21')
    expect(addDays('2026-01-31', 1)).toBe('2026-02-01')
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01')
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29')
  })
})

describe('Leitner scheduling', () => {
  it('enrolls a new card into box 1, due tomorrow', () => {
    expect(newCard('2026-10-20')).toEqual({ box: 1, due: '2026-10-21' })
  })

  it('moves a remembered card one box up with a longer interval', () => {
    expect(nextReview({ box: 1, due: '2026-10-21' }, true, '2026-10-21')).toEqual({ box: 2, due: '2026-10-24' })
    expect(nextReview({ box: 4, due: '2026-10-20' }, true, '2026-10-20')).toEqual({ box: 5, due: '2026-11-24' })
  })

  it('keeps a remembered card in the last box', () => {
    expect(nextReview({ box: 5, due: '2026-10-20' }, true, '2026-10-20')).toEqual({ box: 5, due: '2026-11-24' })
  })

  it('sends a forgotten card back to box 1', () => {
    expect(nextReview({ box: 4, due: '2026-10-20' }, false, '2026-10-20')).toEqual({ box: 1, due: '2026-10-21' })
  })

  it('knows when a card is due', () => {
    expect(isDue({ box: 1, due: '2026-10-20' }, '2026-10-20')).toBe(true)
    expect(isDue({ box: 1, due: '2026-10-19' }, '2026-10-20')).toBe(true)
    expect(isDue({ box: 1, due: '2026-10-21' }, '2026-10-20')).toBe(false)
  })
})

describe('seededShuffle', () => {
  it('is deterministic and keeps every item', () => {
    const items = ['a', 'b', 'c', 'd', 'e']
    const once = seededShuffle(items, 'x')
    expect(seededShuffle(items, 'x')).toEqual(once)
    expect([...once].sort()).toEqual(items)
  })
})

describe('pickRecallCards', () => {
  const today = '2026-10-20'
  const states: Record<string, CardState> = {
    due1: { box: 1, due: '2026-10-18' },
    due2: { box: 3, due: '2026-10-20' },
    due3: { box: 2, due: '2026-10-19' },
    due4: { box: 1, due: '2026-10-20' },
    later: { box: 2, due: '2026-10-25' },
  }

  it('returns nothing when there are no candidates', () => {
    expect(pickRecallCards([], states, today, 's')).toEqual([])
  })

  it('returns at most three due cards, all from the candidates', () => {
    const picked = pickRecallCards(['due1', 'due2', 'due3', 'due4', 'later'], states, today, 's')
    expect(picked).toHaveLength(3)
    for (const id of picked) expect(['due1', 'due2', 'due3', 'due4']).toContain(id)
  })

  it('ignores due cards that are not candidates', () => {
    expect(pickRecallCards(['due2', 'later'], states, today, 's')).toEqual(['due2'])
  })

  it('falls back to two distinct cards when nothing is due', () => {
    const picked = pickRecallCards(['later', 'never1', 'never2'], states, today, 's')
    expect(picked).toHaveLength(2)
    expect(new Set(picked).size).toBe(2)
  })

  it('falls back to whatever exists when there are fewer than two candidates', () => {
    expect(pickRecallCards(['never1'], states, today, 's')).toEqual(['never1'])
  })

  it('is deterministic for the same seed', () => {
    const ids = ['later', 'never1', 'never2', 'never3']
    expect(pickRecallCards(ids, states, today, 'lesson-1.2')).toEqual(pickRecallCards(ids, states, today, 'lesson-1.2'))
  })
})
