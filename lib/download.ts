/** Сохраняет текст в файл через временную ссылку-загрузку. */
export function downloadText(filename: string, text: string, type = 'application/json'): void {
  const url = URL.createObjectURL(new Blob([text], { type }))
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  // Safari прерывает загрузку, если отозвать ссылку сразу после click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
