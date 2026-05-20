export default function ManualSection({ section, onBack }) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex-shrink-0 px-4 py-3 border-b border-panel-border">
        <button
          onClick={onBack}
          className="text-xs text-text-muted hover:text-accent transition-colors mb-2"
        >
          ← Índice
        </button>
        <div className="flex items-center gap-2">
          <span className="text-xl">{section.icon}</span>
          <h2 className="text-text-primary text-sm font-semibold">{section.title}</h2>
        </div>
        <p className="text-text-muted text-xs mt-1">{section.summary}</p>
      </div>

      <div className="flex-1 overflow-y-auto panel-scroll px-4 py-4 space-y-4">
        {/* Main content */}
        <p className="text-text-muted text-sm leading-relaxed whitespace-pre-line">
          {section.content}
        </p>

        {/* Subsections */}
        {section.sections?.map((sub, i) => (
          <div key={i} className="space-y-2">
            <h3 className="text-text-primary text-xs font-semibold uppercase tracking-wider border-b border-panel-border pb-1">
              {sub.subtitle}
            </h3>
            <p className="text-text-muted text-sm leading-relaxed whitespace-pre-line">
              {sub.body}
            </p>
          </div>
        ))}

        {/* Concepts */}
        {section.concepts?.length > 0 && (
          <div className="mt-4">
            <p className="text-[10px] text-text-muted uppercase tracking-wider mb-2">Conceptos clave</p>
            <div className="flex flex-wrap gap-1.5">
              {section.concepts.map((c) => (
                <span
                  key={c}
                  className="text-[10px] bg-accent/15 text-accent border border-accent/20 rounded px-2 py-0.5"
                >
                  {c}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
