import { describe, expect, it } from 'vitest'
import { scopeId, scopeKeys } from './scope'

describe('scope', () => {
  it('prefixes an id with its course', () => {
    expect(scopeId('attention', '1.3')).toBe('attention/1.3')
    expect(scopeId('attention', 'check:1-3-check-unit')).toBe('attention/check:1-3-check-unit')
  })

  it('prefixes every key of a record and keeps the values', () => {
    expect(scopeKeys({ '1.1': 1, 'c-a': 2 }, 'math')).toEqual({ 'math/1.1': 1, 'math/c-a': 2 })
    expect(scopeKeys({}, 'math')).toEqual({})
  })
})
