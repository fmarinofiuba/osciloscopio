export default function TheoryBlock({ step }) {
  return (
    <div className="space-y-3">
      <h3 className="text-text-primary font-semibold text-sm">{step.title}</h3>
      <div className="bg-white/4 border border-panel-border rounded-lg p-3">
        <p className="text-text-muted text-sm leading-relaxed whitespace-pre-line font-mono text-xs">
          {step.body}
        </p>
      </div>
      {step.concepts?.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {step.concepts.map((c) => (
            <span
              key={c}
              className="text-[10px] bg-accent/15 text-accent border border-accent/20 rounded px-2 py-0.5"
            >
              {c}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
