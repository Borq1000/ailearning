import type { Card } from '@/lib/course/types'
import { scopeId, scopeKeys } from './scope'
import { BACKUP_KEY } from './storage'
import type { Box, CardState, GateProgress, LessonProgress, ProgressData } from './types'
import { markNewerVersion } from './version-guard'

export const CURRENT_VERSION = 2
/** Курс, под которым жил весь прогресс до появления префиксов (схема v1): другого курса тогда не было. */
export const LEGACY_COURSE_ID = 'attention'

export function emptyProgress(): ProgressData {
  return { version: 2, lessons: {}, gates: {}, code: {}, explanations: {}, cards: {}, customCards: {} }
}

/** Нет ни уроков, ни ворот, ни кода, ни объяснений, ни карточек. */
export function isEmptyProgress(p: ProgressData): boolean {
  return [p.lessons, p.gates, p.code, p.explanations, p.cards, p.customCards].every((m) => Object.keys(m).length === 0)
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

const isCount = (v: unknown): v is number => typeof v === 'number' && Number.isInteger(v) && v >= 0
const isFiniteNumber = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v)
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

function toLesson(v: unknown): LessonProgress | null {
  if (!isPlainObject(v)) return null
  if (v.status !== 'in-progress' && v.status !== 'completed') return null
  if (!isCount(v.unlockedStep)) return null
  const lesson: LessonProgress = { status: v.status, unlockedStep: v.unlockedStep }
  if (typeof v.completedAt === 'string') lesson.completedAt = v.completedAt
  return lesson
}

function toGate(v: unknown): GateProgress | null {
  if (!isPlainObject(v)) return null
  if (typeof v.passed !== 'boolean') return null
  if (!isFiniteNumber(v.attempts) || v.attempts < 0) return null
  if (v.revealed !== undefined && typeof v.revealed !== 'boolean') return null
  const gate: GateProgress = { passed: v.passed, attempts: v.attempts, revealed: v.revealed ?? false }
  // Неверный «последний выбор» — лишь подсказка интерфейсу: теряем его, а не всю запись.
  if (isFiniteNumber(v.choice)) gate.choice = v.choice
  return gate
}

function toCardState(v: unknown): CardState | null {
  if (!isPlainObject(v)) return null
  if (!Number.isInteger(v.box) || (v.box as number) < 1 || (v.box as number) > 5) return null
  if (typeof v.due !== 'string' || !ISO_DATE.test(v.due)) return null
  return { box: v.box as Box, due: v.due }
}

const toText = (v: unknown): string | null => (typeof v === 'string' ? v : null)

function toCard(v: unknown): Card | null {
  if (!isPlainObject(v)) return null
  const { id, prompt, answer, kind } = v
  if (typeof id !== 'string' || typeof prompt !== 'string' || typeof answer !== 'string') return null
  if (kind === 'flip') return { id, kind, prompt, answer }
  if (kind !== 'choice') return null
  const { options, correct } = v
  if (!Array.isArray(options) || options.length < 2 || !options.every((o) => typeof o === 'string')) return null
  if (!Number.isInteger(correct) || (correct as number) < 0 || (correct as number) >= options.length) return null
  return { id, kind, prompt, answer, options: options as string[], correct: correct as number }
}

function validEntries<T>(section: unknown, parse: (v: unknown) => T | null): Record<string, T> {
  const result: Record<string, T> = {}
  if (!isPlainObject(section)) return result
  for (const [id, raw] of Object.entries(section)) {
    const value = parse(raw)
    if (value !== null) result[id] = value
  }
  return result
}

/**
 * Берёт из сырых данных только записи правильной формы; разделы и записи неверной формы отбрасывает.
 * Неизвестные id (удалённые уроки, карточки) сохраняются: интерфейс их просто не показывает.
 */
export function normalizeProgress(raw: unknown): ProgressData {
  const data = isPlainObject(raw) ? raw : {}
  return {
    version: 2,
    lessons: validEntries(data.lessons, toLesson),
    gates: validEntries(data.gates, toGate),
    code: validEntries(data.code, toText),
    explanations: validEntries(data.explanations, toText),
    cards: validEntries(data.cards, toCardState),
    customCards: validEntries(data.customCards, toCard),
  }
}

function backupRaw(data: unknown): void {
  try {
    if (typeof window !== 'undefined') window.localStorage.setItem(BACKUP_KEY, JSON.stringify(data))
  } catch {
    // хранилище недоступно — резервную копию сделать нельзя
  }
}

/** v1 → v2: все ключи получают префикс курса «attention»; у карточек-копий меняется и внутренний id. */
export function upgradeV1(data: ProgressData): ProgressData {
  const customCards = Object.fromEntries(
    Object.entries(data.customCards).map(([id, card]) => {
      const scoped = scopeId(LEGACY_COURSE_ID, id)
      return [scoped, { ...card, id: scoped }]
    }),
  )
  return {
    version: 2,
    lessons: scopeKeys(data.lessons, LEGACY_COURSE_ID),
    gates: scopeKeys(data.gates, LEGACY_COURSE_ID),
    code: scopeKeys(data.code, LEGACY_COURSE_ID),
    explanations: scopeKeys(data.explanations, LEGACY_COURSE_ID),
    cards: scopeKeys(data.cards, LEGACY_COURSE_ID),
    customCards,
  }
}

/** Схема новее этой версии сайта: такие данные записала более новая вкладка. */
export function isNewerVersion(version: unknown): boolean {
  return typeof version === 'number' && version > CURRENT_VERSION
}

/** Сохранённый JSON — запись zustand persist `{ version, state }` или экспорт — сделан более новой версией сайта. */
export function isFromNewerVersion(raw: string): boolean {
  try {
    const parsed: unknown = JSON.parse(raw)
    return isPlainObject(parsed) && isNewerVersion(parsed.version)
  } catch {
    return false
  }
}

/**
 * v2 — текущая схема (ключи под курсом). v1 — та же схема без префиксов: поднимаем.
 * Более новую схему не трогаем: вкладка помечается устаревшей (и больше не пишет), копия не делается —
 * иначе пустой прогресс этой вкладки затёр бы хорошую копию.
 * Остальные версии (0, мусор) неизвестны: сохраняем копию и начинаем с чистого листа.
 */
export function migrateProgress(persisted: unknown, version: number): ProgressData {
  if (version === CURRENT_VERSION) return normalizeProgress(persisted)
  if (version === 1) return upgradeV1(normalizeProgress(persisted))
  if (isNewerVersion(version)) {
    markNewerVersion()
    return emptyProgress()
  }
  backupRaw(persisted)
  return emptyProgress()
}
