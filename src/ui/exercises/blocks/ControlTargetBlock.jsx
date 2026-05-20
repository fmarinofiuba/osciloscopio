export default function ControlTargetBlock({ step }) {
  return (
    <div className="space-y-3">
      <h3 className="text-text-primary font-semibold text-sm">{step.title}</h3>
      <p className="text-text-muted text-sm leading-relaxed">{step.body}</p>

      <div className="flex items-center gap-3 bg-amber-400/8 border border-amber-400/20 rounded-lg px-4 py-3">
        <span className="text-amber-300 text-lg">🎯</span>
        <div>
          <p className="text-xs text-text-muted uppercase tracking-wider">Control objetivo</p>
          <p className="text-text-primary text-sm font-mono font-semibold">
            {step.targetControl}
            {step.targetValue && (
              <span className="ml-2 text-amber-300">→ {step.targetValue}</span>
            )}
          </p>
        </div>
      </div>

      <p className="text-xs text-text-muted italic">
        Interactuá directamente con el control en el osciloscopio 3D.
      </p>
    </div>
  )
}
