export type WordGroup = 'animals' | 'objects' | 'feelings' | 'actions'

export const GROUPS: Record<WordGroup, { label: string; color: string }> = {
  animals: { label: 'животные', color: '#22d3ee' },
  objects: { label: 'предметы', color: '#fb923c' },
  feelings: { label: 'чувства', color: '#a78bfa' },
  actions: { label: 'действия', color: '#a3e635' },
}

export const WORDS: { word: string; group: WordGroup; pos: [number, number, number] }[] = [
  { word: 'кот', group: 'animals', pos: [2.2, 1.0, 0.4] },
  { word: 'котёнок', group: 'animals', pos: [2.5, 1.3, -0.1] },
  { word: 'собака', group: 'animals', pos: [2.7, 0.6, 0.9] },
  { word: 'тигр', group: 'animals', pos: [1.9, 1.6, 1.0] },
  { word: 'лошадь', group: 'animals', pos: [3.0, 0.3, 0.2] },
  { word: 'забор', group: 'objects', pos: [-2.3, -0.5, 1.4] },
  { word: 'стол', group: 'objects', pos: [-2.7, -0.9, 0.8] },
  { word: 'стул', group: 'objects', pos: [-2.0, -1.2, 1.9] },
  { word: 'дверь', group: 'objects', pos: [-2.9, -0.2, 2.0] },
  { word: 'окно', group: 'objects', pos: [-2.4, 0.1, 2.4] },
  { word: 'радость', group: 'feelings', pos: [0.3, -1.9, -2.2] },
  { word: 'грусть', group: 'feelings', pos: [-0.4, -2.3, -2.6] },
  { word: 'страх', group: 'feelings', pos: [0.7, -2.6, -1.8] },
  { word: 'любовь', group: 'feelings', pos: [0.0, -1.5, -2.9] },
  { word: 'бежать', group: 'actions', pos: [-0.6, 2.4, -1.5] },
  { word: 'прыгать', group: 'actions', pos: [-1.1, 2.0, -1.0] },
  { word: 'перепрыгнуть', group: 'actions', pos: [-0.9, 2.7, -1.9] },
  { word: 'идти', group: 'actions', pos: [-0.2, 2.8, -1.1] },
]
