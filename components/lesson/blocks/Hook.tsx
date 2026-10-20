import type { ReactNode } from 'react'

export function Hook({ title = 'Загадка', children }: { title?: string; children?: ReactNode }) {
  return (
    <div className="hook">
      <p className="gate-label m-0">🧩 {title}</p>
      <div>{children}</div>
    </div>
  )
}
