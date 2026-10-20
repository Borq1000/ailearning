let cached: boolean | undefined

/** Есть ли в браузере WebGL. Проверяется один раз: каждая проверка создаёт контекст, а их число ограничено. */
export function detectWebGL(): boolean {
  if (typeof document === 'undefined') return false
  if (cached !== undefined) return cached
  try {
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl2') ?? canvas.getContext('webgl')
    cached = Boolean(gl)
    // пробный контекст сразу отдаём обратно, чтобы он не занимал место настоящих сцен
    gl?.getExtension('WEBGL_lose_context')?.loseContext()
  } catch {
    cached ??= false
  }
  return cached
}
