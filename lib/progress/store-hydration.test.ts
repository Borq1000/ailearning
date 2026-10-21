import { describe, expect, it } from 'vitest'
import { emptyProgress } from './migrate'
import { STORAGE_KEY } from './storage'
import { useProgress } from './store'

describe('progress store before the saved progress is loaded', () => {
  it('does not overwrite saved progress with changes made before rehydrate', async () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ version: 2, state: { ...emptyProgress(), lessons: { 'attention/0.1': { status: 'completed', unlockedStep: 3 } } } }),
    )
    useProgress.getState().saveCode('dot', 'early edit')
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).state.lessons['attention/0.1'].status).toBe('completed')
    await useProgress.persist.rehydrate()
    expect(useProgress.getState().lessons['attention/0.1'].status).toBe('completed')
  })

  it('keeps in-memory state when nothing has been saved yet', async () => {
    useProgress.setState({ lessons: { 'attention/1.1': { status: 'in-progress', unlockedStep: 2 } } })
    await useProgress.persist.rehydrate()
    expect(useProgress.getState().lessons['attention/1.1']).toEqual({ status: 'in-progress', unlockedStep: 2 })
  })
})
