import { useState } from 'react'

export default function MultipleChoiceBlock({ step, onValidated }) {
  const [selected, setSelected] = useState(null)
  const [submitted, setSubmitted] = useState(false)

  function submit() {
    if (selected === null) return
    setSubmitted(true)
    onValidated?.(selected === step.correctIndex)
  }

  const isCorrect = submitted && selected === step.correctIndex

  return (
    <div className="space-y-3">
      <h3 className="text-text-primary font-semibold text-sm">{step.title}</h3>
      <p className="text-text-muted text-sm leading-relaxed">{step.question}</p>

      <div className="space-y-2">
        {step.options.map((opt, i) => {
          let cls = 'w-full text-left px-3 py-2.5 rounded-lg border text-sm transition-all '
          if (!submitted) {
            cls += selected === i
              ? 'bg-accent/15 border-accent/50 text-text-primary'
              : 'bg-white/4 border-panel-border text-text-muted hover:bg-white/8 hover:text-text-primary'
          } else {
            if (i === step.correctIndex) {
              cls += 'bg-emerald-400/10 border-emerald-400/30 text-emerald-300'
            } else if (i === selected && selected !== step.correctIndex) {
              cls += 'bg-red-400/10 border-red-400/30 text-red-300'
            } else {
              cls += 'bg-white/2 border-panel-border text-text-muted/50'
            }
          }
          return (
            <button
              key={i}
              onClick={() => !submitted && setSelected(i)}
              className={cls}
            >
              <span className="text-xs mr-2 opacity-60">{String.fromCharCode(65 + i)}.</span>
              {opt}
            </button>
          )
        })}
      </div>

      {submitted && step.explanation && (
        <div className="bg-white/4 border border-panel-border rounded-lg p-3 text-xs text-text-muted leading-relaxed">
          <span className="text-text-primary font-medium">Explicación: </span>
          {step.explanation}
        </div>
      )}

      {!submitted && (
        <button
          onClick={submit}
          disabled={selected === null}
          className="
            w-full py-2 rounded-lg text-sm font-medium
            bg-accent hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed
            text-white transition-colors active:scale-95
          "
        >
          Confirmar respuesta
        </button>
      )}
    </div>
  )
}
