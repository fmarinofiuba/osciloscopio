import { useAppState } from '../../state/AppContext.jsx'
import exercises from '../../data/exercises.json'
import ExerciseWizard from '../exercises/ExerciseWizard.jsx'

const SIGNAL_ICONS = {
  sine:   '〜',
  square: '⊓',
}

export default function EjerciciosMode() {
  const { state, exerciseManagerRef } = useAppState()

  if (state.activeExercise) {
    return <ExerciseWizard />
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-shrink-0 px-4 py-3 border-b border-panel-border">
        <h2 className="text-text-primary text-sm font-semibold">Ejercicios disponibles</h2>
        <p className="text-text-muted text-xs mt-0.5">Seleccioná un ejercicio para comenzar</p>
      </div>

      <div className="flex-1 overflow-y-auto panel-scroll px-3 py-3 space-y-2">
        {exercises.map((ex) => (
          <button
            key={ex.id}
            onClick={() => exerciseManagerRef.current?.start(ex.id)}
            className="
              w-full text-left p-3 rounded-xl border border-panel-border
              bg-white/3 hover:bg-white/7 hover:border-white/15
              transition-all duration-150 active:scale-[0.98]
              group
            "
          >
            <div className="flex items-start gap-3">
              <span className="w-8 flex-shrink-0 text-center text-2xl mt-0.5 text-text-primary group-hover:scale-110 transition-transform">
                {SIGNAL_ICONS[ex.ch1?.type] ?? '📊'}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-text-primary text-sm font-medium leading-tight">
                  {ex.title}
                </p>
                <p className="text-text-muted text-xs mt-0.5">{ex.subtitle}</p>
                <p className="text-text-muted/60 text-[10px] mt-1.5">
                  {ex.steps.length} pasos
                </p>
              </div>
              <span className="text-text-muted text-sm group-hover:text-accent transition-colors mt-0.5">
                →
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
