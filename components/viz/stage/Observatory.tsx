import type { ReactNode } from 'react'

/** Тёмное «окно» для интерактивных сцен: сразу видно, что здесь можно трогать. */
export function Observatory({
  caption,
  hint,
  wide,
  footer,
  children,
}: {
  caption?: ReactNode
  hint?: string
  wide?: boolean
  footer?: ReactNode
  children?: ReactNode
}) {
  return (
    <figure className={`observatory-figure ${wide ? 'breakout' : ''}`}>
      <div className="observatory">
        {hint && <span className="observatory-hint">{hint}</span>}
        {children}
        {footer && <div className="observatory-footer">{footer}</div>}
      </div>
      {caption && <figcaption className="mt-2 text-sm text-muted">{caption}</figcaption>}
    </figure>
  )
}
