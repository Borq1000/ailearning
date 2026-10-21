import { create } from 'zustand'
import type { ConceptKey } from '@/lib/theme/concepts'

interface HighlightState {
  /** Понятие, над которым сейчас курсор в сцене. */
  concept: ConceptKey | null
  highlight: (concept: ConceptKey) => void
  release: (concept: ConceptKey) => void
}

/** Сигналинг (Майер): наведение на объект сцены подсвечивает термины <C> того же понятия в тексте. */
export const useHighlight = create<HighlightState>()((set) => ({
  concept: null,
  highlight: (concept) => set({ concept }),
  // снимаем подсветку, только если её не перехватил другой объект
  release: (concept) => set((s) => (s.concept === concept ? { concept: null } : {})),
}))
