import exercises from '../data/exercises.json'

export class ExerciseManager {
  constructor(signalManager, dispatch) {
    this._signalManager = signalManager
    this._dispatch = dispatch
  }

  start(exerciseId) {
    const exercise = exercises.find((e) => e.id === exerciseId)
    if (!exercise) {
      console.warn(`ExerciseManager: exercise "${exerciseId}" not found`)
      return
    }
    if (!exercise.ch1) {
      console.warn(`ExerciseManager: exercise "${exerciseId}" has no ch1 signal`)
    }
    this._signalManager.acquireForExercise({ ch1: exercise.ch1, ch2: exercise.ch2 })
    this._dispatch({ type: 'START_EXERCISE', payload: exerciseId })
  }

  next() { this._dispatch({ type: 'NEXT_STEP' }) }
  prev() { this._dispatch({ type: 'PREV_STEP' }) }

  end() {
    this._signalManager.releaseFromExercise()
    this._dispatch({ type: 'END_EXERCISE' })
  }
}
