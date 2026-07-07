import { createContext, useContext, useReducer, useRef } from 'react'

const initialState = {
  workspaceMode:   'ejercicios',   // 'explicar' | 'ejercicios' | 'manual' | 'configuracion'
  panelState:      'expanded',     // 'hidden' | 'compact' | 'expanded'
  interactionMode: 'interact',     // 'interact' | 'explicar' | 'disabled'
  selectedControl: null,
  activeExercise:  null,
  exerciseStep:    0,
  cameraPreset:    null,
}

function reducer(state, action) {
  switch (action.type) {

    case 'SET_WORKSPACE_MODE': {
      const mode = action.payload
      const interactionMode = mode === 'explicar' ? 'explicar' : 'interact'
      const selectedControl = mode === 'explicar' ? null : state.selectedControl
      return {
        ...state,
        workspaceMode: mode,
        panelState: 'expanded',
        interactionMode,
        selectedControl,
      }
    }

    case 'SET_PANEL_STATE':
      return { ...state, panelState: action.payload }

    case 'EXPAND_PANEL':
      return { ...state, panelState: 'expanded' }

    case 'COLLAPSE_PANEL':
      return { ...state, panelState: 'compact' }

    case 'SET_INTERACTION_MODE':
      return { ...state, interactionMode: action.payload }

    case 'SELECT_CONTROL': {
      const nextState = { ...state, selectedControl: action.payload }
      if (state.interactionMode === 'explicar' && action.payload) {
        nextState.panelState = 'expanded'
      }
      return nextState
    }

    case 'START_EXERCISE':
      return { ...state, activeExercise: action.payload, exerciseStep: 0, workspaceMode: 'ejercicios', panelState: 'expanded', interactionMode: 'interact' }

    case 'SET_EXERCISE_STEP':
      return { ...state, exerciseStep: action.payload }

    case 'NEXT_STEP':
      return { ...state, exerciseStep: state.exerciseStep + 1 }

    case 'PREV_STEP':
      return { ...state, exerciseStep: Math.max(0, state.exerciseStep - 1) }

    case 'END_EXERCISE':
      return { ...state, activeExercise: null, exerciseStep: 0 }

    case 'SET_CAMERA_PRESET':
      return { ...state, cameraPreset: action.payload }

    default:
      return state
  }
}

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState)
  const sceneRef = useRef(null)
  const signalManagerRef = useRef(null)
  const exerciseManagerRef = useRef(null)

  return (
    <AppContext.Provider value={{ state, dispatch, sceneRef, signalManagerRef, exerciseManagerRef }}>
      {children}
    </AppContext.Provider>
  )
}

export function useAppState() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useAppState must be used within AppProvider')
  return ctx
}
