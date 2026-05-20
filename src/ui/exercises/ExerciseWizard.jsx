import { useAppState } from '../../state/AppContext.jsx'
import exercises from '../../data/exercises.json'
import InstructionBlock from './blocks/InstructionBlock.jsx'
import TheoryBlock from './blocks/TheoryBlock.jsx'
import NumericInputBlock from './blocks/NumericInputBlock.jsx'
import MultipleChoiceBlock from './blocks/MultipleChoiceBlock.jsx'
import ControlTargetBlock from './blocks/ControlTargetBlock.jsx'

function StepBlock({ step, onValidated }) {
  switch (step.type) {
    case 'instruction':     return <InstructionBlock step={step} />
    case 'theory':          return <TheoryBlock step={step} />
    case 'numeric_input':   return <NumericInputBlock step={step} onValidated={onValidated} />
    case 'multiple_choice': return <MultipleChoiceBlock step={step} onValidated={onValidated} />
    case 'control_target':  return <ControlTargetBlock step={step} />
    default:
      return <p className="text-text-muted text-sm">Paso desconocido: {step.type}</p>
  }
}

export default function ExerciseWizard() {
  const { state, dispatch } = useAppState()
  const exercise = exercises.find((e) => e.id === state.activeExercise)

  if (!exercise) return null

  const { steps } = exercise
  const currentIdx = state.exerciseStep
  const step = steps[currentIdx]
  const isFirst = currentIdx === 0
  const isLast = currentIdx === steps.length - 1
  const progress = ((currentIdx + 1) / steps.length) * 100

  function goBack() {
    if (isFirst) {
      dispatch({ type: 'END_EXERCISE' })
    } else {
      dispatch({ type: 'PREV_STEP' })
    }
  }

  function goNext() {
    if (isLast) {
      dispatch({ type: 'END_EXERCISE' })
    } else {
      dispatch({ type: 'NEXT_STEP' })
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Exercise header info */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-panel-border">
        <p className="text-text-muted text-xs uppercase tracking-wider">{exercise.subtitle}</p>
        <h2 className="text-text-primary text-sm font-semibold mt-0.5">{exercise.title}</h2>
        {/* Progress bar */}
        <div className="mt-2 h-1 bg-white/8 rounded-full overflow-hidden">
          <div
            className="h-full bg-accent rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="mt-1 text-[10px] text-text-muted">
          Paso {currentIdx + 1} de {steps.length}
        </p>
      </div>

      {/* Step content */}
      <div className="flex-1 overflow-y-auto panel-scroll px-4 py-4">
        <StepBlock key={`${exercise.id}-${currentIdx}`} step={step} />
      </div>

      {/* Navigation footer */}
      <div className="flex-shrink-0 flex gap-2 px-4 py-3 border-t border-panel-border">
        <button
          onClick={goBack}
          className="
            flex-1 py-2 rounded-lg text-sm font-medium border border-panel-border
            text-text-muted hover:text-text-primary hover:bg-white/8
            transition-all duration-150 active:scale-95
          "
        >
          {isFirst ? 'Salir' : '← Anterior'}
        </button>
        <button
          onClick={goNext}
          className="
            flex-1 py-2 rounded-lg text-sm font-medium
            bg-accent hover:bg-accent-hover text-white
            transition-all duration-150 active:scale-95
          "
        >
          {isLast ? 'Finalizar ✓' : 'Siguiente →'}
        </button>
      </div>
    </div>
  )
}
