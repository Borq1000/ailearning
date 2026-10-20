import { describe, expect, it } from 'vitest'
import { parseNumber } from './parse-number'

describe('parseNumber', () => {
  it.each([
    ['0,5', 0.5],
    ['0.5', 0.5],
    [' 2 ', 2],
    ['−4', -4],
    ['-4', -4],
    ['+2', 2],
    ['.5', 0.5],
    ['3.', 3],
    ['1 000', 1000],
    ['−4,0', -4],
  ])('reads %j as %d', (input, expected) => {
    expect(parseNumber(input)).toBe(expected)
  })

  it.each(['', '   ', 'два', '1,2,3', '1e3', '--1'])('rejects %j', (input) => {
    expect(parseNumber(input)).toBeNull()
  })
})
