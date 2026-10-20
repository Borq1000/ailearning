/** Русская форма слова для числа: plural(5, ['карточка', 'карточки', 'карточек']) → 'карточек'. */
export function plural(n: number, forms: readonly [string, string, string]): string {
  const mod100 = Math.abs(n) % 100
  const mod10 = mod100 % 10
  if (mod100 > 10 && mod100 < 20) return forms[2]
  if (mod10 === 1) return forms[0]
  if (mod10 >= 2 && mod10 <= 4) return forms[1]
  return forms[2]
}
