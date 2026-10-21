import { create } from 'zustand'
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware'
import type { Card } from '@/lib/course/types'
import { CURRENT_VERSION, emptyProgress, isEmptyProgress, migrateProgress, normalizeProgress } from './migrate'
import { addDays, newCard, nextReview } from './scheduler'
import { STORAGE_KEY, createSafeStorage, readBackup } from './storage'
import type { GateProgress, ProgressData } from './types'

export interface ProgressActions {
  unlockStep(lessonId: string, stepIndex: number): void
  completeLesson(lessonId: string, cardIds: string[], today: string): void
  recordAttempt(gateId: string, correct: boolean, choice?: number): void
  passGate(gateId: string): void
  revealGate(gateId: string, card: Card | undefined, today: string): void
  saveCode(exerciseId: string, code: string): void
  saveExplanation(id: string, text: string): void
  reviewCard(cardId: string, correct: boolean, today: string): void
  exportProgress(): string
  importProgress(json: string): boolean
  restoreBackup(): boolean
  resetProgress(): void
}

export type ProgressStore = ProgressData & ProgressActions

const EMPTY_GATE: GateProgress = { passed: false, attempts: 0, revealed: false }

function pickData(s: ProgressData): ProgressData {
  const { version, lessons, gates, code, explanations, cards, customCards } = s
  return { version, lessons, gates, code, explanations, cards, customCards }
}

// zustand persist пишет в хранилище при каждом set — даже до загрузки сохранённого прогресса.
// Пока прогресс не загружен, запись пропускаем, чтобы пустое состояние не затёрло сохранённое.
let loaded = false

function createGuardedStorage(): StateStorage {
  const storage = createSafeStorage()
  return { ...storage, setItem: (key, value) => (loaded ? storage.setItem(key, value) : undefined) }
}

export const useProgress = create<ProgressStore>()(
  persist(
    (set, get) => ({
      ...emptyProgress(),

      unlockStep: (lessonId, stepIndex) =>
        set((s) => {
          const current = s.lessons[lessonId]
          if (current?.status === 'completed') return {}
          const unlockedStep = Math.max(current?.unlockedStep ?? 0, stepIndex)
          return { lessons: { ...s.lessons, [lessonId]: { status: 'in-progress', unlockedStep } } }
        }),

      completeLesson: (lessonId, cardIds, today) =>
        set((s) => {
          const cards = { ...s.cards }
          for (const id of cardIds) if (!cards[id]) cards[id] = newCard(today)
          return {
            cards,
            lessons: {
              ...s.lessons,
              [lessonId]: {
                status: 'completed',
                unlockedStep: s.lessons[lessonId]?.unlockedStep ?? 0,
                completedAt: new Date().toISOString(),
              },
            },
          }
        }),

      recordAttempt: (gateId, correct, choice) =>
        set((s) => {
          const gate = s.gates[gateId] ?? EMPTY_GATE
          const next: GateProgress = { ...gate, attempts: gate.attempts + 1, passed: gate.passed || correct }
          if (choice !== undefined) next.choice = choice
          return { gates: { ...s.gates, [gateId]: next } }
        }),

      passGate: (gateId) =>
        set((s) => ({ gates: { ...s.gates, [gateId]: { ...(s.gates[gateId] ?? EMPTY_GATE), passed: true } } })),

      revealGate: (gateId, card, today) =>
        set((s) => {
          const gates = { ...s.gates, [gateId]: { ...(s.gates[gateId] ?? EMPTY_GATE), passed: true, revealed: true } }
          if (!card) return { gates }
          return {
            gates,
            customCards: { ...s.customCards, [card.id]: card },
            cards: { ...s.cards, [card.id]: { box: 1, due: addDays(today, 1) } },
          }
        }),

      saveCode: (exerciseId, code) => set((s) => ({ code: { ...s.code, [exerciseId]: code } })),

      saveExplanation: (id, text) => set((s) => ({ explanations: { ...s.explanations, [id]: text } })),

      reviewCard: (cardId, correct, today) =>
        set((s) => ({
          cards: { ...s.cards, [cardId]: nextReview(s.cards[cardId] ?? newCard(today), correct, today) },
        })),

      exportProgress: () => JSON.stringify(pickData(get())),

      importProgress: (json) => {
        try {
          const parsed: unknown = JSON.parse(json)
          if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return false
          const version = (parsed as { version?: unknown }).version
          // файлы старого формата (без префиксов курса) поднимаем так же, как сохранённый прогресс
          if (version !== 1 && version !== CURRENT_VERSION) return false
          set(migrateProgress(parsed, version))
          return true
        } catch {
          return false
        }
      },

      restoreBackup: () => {
        const raw = readBackup()
        if (raw === null) return false
        try {
          const parsed: unknown = JSON.parse(raw)
          if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return false
          const envelope = parsed as { version?: unknown; state?: unknown }
          // копия — либо запись zustand persist { version, state }, либо сырой экспорт прогресса
          const data = typeof envelope.state === 'object' && envelope.state !== null ? envelope.state : parsed
          const version = envelope.version
          if (version !== 1 && version !== CURRENT_VERSION) return false
          const restored = migrateProgress(data, version)
          // пустая копия не должна стирать то, что есть сейчас
          if (isEmptyProgress(restored)) return false
          set(restored)
          return true
        } catch {
          return false
        }
      },

      resetProgress: () => set(emptyProgress()),
    }),
    {
      name: STORAGE_KEY,
      version: CURRENT_VERSION,
      storage: createJSONStorage(createGuardedStorage),
      skipHydration: true,
      onRehydrateStorage: () => () => {
        loaded = true
      },
      partialize: (s) => pickData(s),
      migrate: (persisted, version) => migrateProgress(persisted, version) as unknown as ProgressStore,
      merge: (persisted, current) => (persisted === undefined ? current : { ...current, ...normalizeProgress(persisted) }),
    },
  ),
)
