import { useState } from 'react'

export default function NumericInputBlock({ step, onValidated }) {
  const [value, setValue] = useState('')
  const [result, setResult] = useState(null) // null | 'correct' | 'incorrect'
  const [showHint, setShowHint] = useState(false)

  function validate() {
    const num = parseFloat(value)
    if (isNaN(num)) return
    const diff = Math.abs(num - step.expectedValue)
    if (diff <= step.tolerance) {
      setResult('correct')
      onValidated?.(true)
    } else {
      setResult('incorrect')
    }
  }

  return (
    <div className="space-y-3">
      <h3 className="text-text-primary font-semibold text-sm">{step.title}</h3>
      <p className="text-text-muted text-sm leading-relaxed">{step.body}</p>

      <div className="flex gap-2 items-center">
        <input
          type="number"
          value={value}
          onChange={(e) => { setValue(e.target.value); setResult(null) }}
          placeholder="Ingresá el valor..."
          className="
            flex-1 bg-white/6 border border-panel-border rounded-lg px-3 py-2
            text-text-primary text-sm placeholder:text-text-muted/50
            focus:outline-none focus:border-accent/60 focus:bg-white/8
            transition-colors
          "
        />
        {step.unit && (
          <span className="text-text-muted text-xs shrink-0">{step.unit}</span>
        )}
      </div>

      {result === 'correct' && (
        <div className="flex items-center gap-2 text-emerald-400 text-sm bg-emerald-400/10 border border-emerald-400/20 rounded-lg px-3 py-2">
          <span>✓</span>
          <span>¡Correcto!</span>
        </div>
      )}
      {result === 'incorrect' && (
        <div className="flex items-center gap-2 text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
          <span>✗</span>
          <span>El valor no es correcto. Revisá el cálculo.</span>
        </div>
      )}

      {step.hint && (
        <div>
          <button
            onClick={() => setShowHint(!showHint)}
            className="text-xs text-text-muted hover:text-accent transition-colors"
          >
            {showHint ? '▾ Ocultar pista' : '▸ Ver pista'}
          </button>
          {showHint && (
            <p className="mt-1 text-xs text-text-muted bg-white/4 rounded px-3 py-2 italic">
              {step.hint}
            </p>
          )}
        </div>
      )}

      <button
        onClick={validate}
        disabled={!value}
        className="
          w-full py-2 rounded-lg text-sm font-medium
          bg-accent hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed
          text-white transition-colors active:scale-95
        "
      >
        Validar
      </button>
    </div>
  )
}
