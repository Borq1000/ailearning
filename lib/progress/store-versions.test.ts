import { describe, expect, it, vi } from 'vitest'
import { CURRENT_VERSION, emptyProgress, isEmptyProgress } from './migrate'
import { BACKUP_KEY, LEGACY_IMPORTED_KEY, LEGACY_STORAGE_KEY, STORAGE_KEY } from './storage'

/**
 * Открывает сайт заново, как после перезагрузки страницы: модули прогресса загружаются с нуля
 * (пустое состояние, флаги «загружено» и «заблокировано» сброшены), а localStorage остаётся.
 */
async function openSite() {
  vi.resetModules()
  const { useProgress } = await import('./store')
  const guard = await import('./version-guard')
  const { resetStoredProgress } = await import('./storage')
  await useProgress.persist.rehydrate()
  return { useProgress, resetStoredProgress, ...guard }
}

const v1Lessons = { '0.1': { status: 'completed', unlockedStep: 3 } }
const legacyV1 = JSON.stringify({ version: 1, state: { ...emptyProgress(), version: 1, lessons: v1Lessons } })
const scopedState = { ...emptyProgress(), lessons: { 'attention/0.1': { status: 'completed', unlockedStep: 3 } } }

describe('storage keys', () => {
  it('keeps progress under ailearning:v2 and reads the old key only for a one-time import', () => {
    expect(STORAGE_KEY).toBe('ailearning:v2')
    expect(LEGACY_STORAGE_KEY).toBe('ailearning:v1')
    expect(LEGACY_IMPORTED_KEY).toBe('ailearning:v1-imported')
    expect(BACKUP_KEY).toBe('ailearning:backup')
  })
})

describe('one-time import of progress saved under the previous key', () => {
  it('migrates v1 progress, writes only ailearning:v2 and leaves the old key byte-identical', async () => {
    localStorage.setItem('ailearning:v1', legacyV1)
    const { useProgress } = await openSite()
    expect(useProgress.getState().lessons['attention/0.1']).toEqual({ status: 'completed', unlockedStep: 3 })

    useProgress.getState().saveCode('attention/dot', 'function dot() {}')
    const saved = JSON.parse(localStorage.getItem('ailearning:v2')!)
    expect(saved.version).toBe(2)
    expect(saved.state.lessons['attention/0.1'].status).toBe('completed')
    expect(saved.state.code['attention/dot']).toBe('function dot() {}')
    expect(localStorage.getItem('ailearning:v1')).toBe(legacyV1)
    expect(localStorage.getItem('ailearning:v1-imported')).toBe('1')
  })

  it('loads a version-2 envelope written under the old key by an earlier build as is', async () => {
    localStorage.setItem('ailearning:v1', JSON.stringify({ version: 2, state: scopedState }))
    const { useProgress } = await openSite()
    expect(useProgress.getState().lessons['attention/0.1']).toEqual({ status: 'completed', unlockedStep: 3 })
    expect(localStorage.getItem('ailearning:v1-imported')).toBe('1')
  })

  it('keeps the imported progress after a reload even if nothing was changed on the first visit', async () => {
    localStorage.setItem('ailearning:v1', legacyV1)
    await openSite()
    const { useProgress } = await openSite()
    expect(useProgress.getState().lessons['attention/0.1']?.status).toBe('completed')
    expect(localStorage.getItem('ailearning:v1')).toBe(legacyV1)
  })

  it('does not bring the old progress back after an emergency reset', async () => {
    localStorage.setItem('ailearning:v1', legacyV1)
    const first = await openSite()
    expect(first.useProgress.getState().lessons['attention/0.1']).toBeDefined()
    first.resetStoredProgress()

    const { useProgress } = await openSite()
    expect(isEmptyProgress(useProgress.getState())).toBe(true)
    expect(localStorage.getItem('ailearning:v2')).toBeNull()
    expect(localStorage.getItem('ailearning:v1')).toBe(legacyV1)
  })

  it('does not import when ailearning:v2 already holds progress', async () => {
    localStorage.setItem('ailearning:v1', legacyV1)
    localStorage.setItem('ailearning:v2', JSON.stringify({ version: 2, state: emptyProgress() }))
    const { useProgress } = await openSite()
    expect(useProgress.getState().lessons).toEqual({})
    expect(localStorage.getItem('ailearning:v1-imported')).toBeNull()
  })

  it('ignores a corrupted old key without touching it', async () => {
    localStorage.setItem('ailearning:v1', '{broken')
    const { useProgress } = await openSite()
    expect(isEmptyProgress(useProgress.getState())).toBe(true)
    expect(localStorage.getItem('ailearning:v1')).toBe('{broken')
    expect(localStorage.getItem(BACKUP_KEY)).toBeNull()
  })
})

describe('progress saved by a newer version of the site', () => {
  const newer = JSON.stringify({ version: 3, state: { lessons: { 'attention/9.9': { status: 'completed' } } } })

  it('is neither loaded nor overwritten nor backed up, and the tab is marked as outdated', async () => {
    localStorage.setItem('ailearning:v2', newer)
    const { useProgress, isBlockedByNewerVersion } = await openSite()
    expect(isEmptyProgress(useProgress.getState())).toBe(true)
    expect(isBlockedByNewerVersion()).toBe(true)

    useProgress.getState().saveCode('attention/dot', 'function dot() {}')
    expect(useProgress.getState().code['attention/dot']).toBe('function dot() {}')
    expect(localStorage.getItem('ailearning:v2')).toBe(newer)
    expect(localStorage.getItem('ailearning:backup')).toBeNull()
  })

  it('keeps the progress of an open tab in memory when another tab saves a newer version', async () => {
    localStorage.setItem('ailearning:v2', JSON.stringify({ version: 2, state: scopedState }))
    const { useProgress, isBlockedByNewerVersion } = await openSite()
    expect(isBlockedByNewerVersion()).toBe(false)

    localStorage.setItem('ailearning:v2', newer)
    await useProgress.persist.rehydrate()
    expect(isBlockedByNewerVersion()).toBe(true)
    expect(useProgress.getState().lessons['attention/0.1']?.status).toBe('completed')
    useProgress.getState().passGate('attention/g')
    expect(localStorage.getItem('ailearning:v2')).toBe(newer)
    expect(localStorage.getItem('ailearning:backup')).toBeNull()
  })

  it('migrateProgress does not back up a newer version, marks the guard and returns empty progress', async () => {
    vi.resetModules()
    const { migrateProgress } = await import('./migrate')
    const { isBlockedByNewerVersion } = await import('./version-guard')
    expect(migrateProgress({ lessons: { x: 1 } }, CURRENT_VERSION + 1)).toEqual(emptyProgress())
    expect(localStorage.getItem('ailearning:backup')).toBeNull()
    expect(isBlockedByNewerVersion()).toBe(true)
  })
})
