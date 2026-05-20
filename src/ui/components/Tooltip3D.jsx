export default function Tooltip3D({ tooltip }) {
  if (!tooltip.visible) return null

  const { x, y, title, description, liveValue } = tooltip

  // Offset so tooltip doesn't cover the mesh
  const left = x + 14
  const top  = y - 8

  return (
    <div
      className="absolute z-50 pointer-events-none animate-fade-in"
      style={{ left, top }}
    >
      <div className="glass-panel rounded-lg px-3 py-2 max-w-[200px] shadow-xl shadow-black/30">
        <p className="text-text-primary text-xs font-semibold leading-tight">{title}</p>
        {liveValue && (
          <p className="text-accent text-xs font-mono mt-0.5">{liveValue}</p>
        )}
        {description && !liveValue && (
          <p className="text-text-muted text-[10px] mt-1 leading-relaxed">{description}</p>
        )}
      </div>
    </div>
  )
}
