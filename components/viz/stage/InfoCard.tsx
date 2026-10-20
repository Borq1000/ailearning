import type { StageInfo } from '@/components/viz/stage/stage-context'

export function InfoCard({ info, onClose }: { info: StageInfo; onClose: () => void }) {
  return (
    <div role="dialog" aria-label={info.title} className="info-card">
      <div className="flex items-start justify-between gap-3">
        <p className="m-0 font-mono text-xs tracking-wider text-glow-cyan uppercase">{info.title}</p>
        <button type="button" aria-label="Закрыть" className="text-space-muted hover:text-space-text" onClick={onClose}>
          ✕
        </button>
      </div>
      <div className="mt-1 text-sm text-space-text">{info.body}</div>
    </div>
  )
}
