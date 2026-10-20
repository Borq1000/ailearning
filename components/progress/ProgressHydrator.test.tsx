import { act, render, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { emptyProgress } from '@/lib/progress/migrate'
import { STORAGE_KEY } from '@/lib/progress/storage'
import { useProgress } from '@/lib/progress/store'
import { ProgressHydrator } from './ProgressHydrator'

/** Другая вкладка сохранила прогресс: localStorage уже изменён. */
function saveInAnotherTab(unlockedStep: number) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      version: 1,
      state: { ...emptyProgress(), lessons: { '0.1': { status: 'in-progress', unlockedStep } } },
    }),
  )
}

/** …и браузер сообщает об этом остальным вкладкам событием `storage`. */
function notify(key: string) {
  act(() => {
    window.dispatchEvent(new StorageEvent('storage', { key }))
  })
}

const unlocked = () => useProgress.getState().lessons['0.1']?.unlockedStep

describe('ProgressHydrator', () => {
  it('loads saved progress and follows changes made in another tab', async () => {
    const { unmount } = render(<ProgressHydrator />)
    await waitFor(() => expect(useProgress.persist.hasHydrated()).toBe(true))

    saveInAnotherTab(1)
    notify(STORAGE_KEY)
    expect(useProgress.getState().lessons['0.1']).toEqual({ status: 'in-progress', unlockedStep: 1 })

    saveInAnotherTab(2)
    notify('some-other-key')
    expect(unlocked()).toBe(1)
    notify(STORAGE_KEY)
    expect(unlocked()).toBe(2)

    unmount()
    saveInAnotherTab(3)
    notify(STORAGE_KEY)
    expect(unlocked()).toBe(2)
  })
})
