import { useAppState } from '../../state/AppContext.jsx'

export default function PanelFooter() {
  const { state, dispatch } = useAppState()

  // Footer only shows contextual actions in ejercicios mode with an active exercise
  if (state.workspaceMode !== 'ejercicios' || !state.activeExercise) {
    return null
  }

  // Exercise navigation is handled by ExerciseWizard internally,
  // so the footer here is a no-op when the wizard is active.
  return null
}
