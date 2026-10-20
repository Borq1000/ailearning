import type { ReactNode } from 'react'

/** Заметка на полях: справа от текста на широких экранах, внутри текста на узких. */
export function Sidenote({ children }: { children?: ReactNode }) {
  return <aside className="sidenote">{children}</aside>
}
