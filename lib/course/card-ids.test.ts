// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { cardIdsInSource } from './card-ids'

describe('cardIdsInSource', () => {
  it('reads the ids of the exported cards only', () => {
    const source = [
      'export const metadata = { description: "id: \'not-a-card\'", objectives: [] }',
      '',
      'export const cards = [',
      '  { id: \'c-a\', kind: \'flip\', prompt: \'Вопрос\', answer: \'Ответ\' },',
      '  {',
      '    id: "c-b",',
      "    kind: 'choice',",
      "    options: ['да', 'нет'],",
      '    correct: 0,',
      "    prompt: 'Вопрос',",
      "    answer: 'Да.',",
      '  },',
      ']',
      '',
      '<Check id="gate-id" question="?" answer={1} />',
    ].join('\n')
    expect(cardIdsInSource(source)).toEqual(['c-a', 'c-b'])
  })

  it('returns nothing for a lesson without cards', () => {
    expect(cardIdsInSource('# Урок без карточек')).toEqual([])
  })
})
