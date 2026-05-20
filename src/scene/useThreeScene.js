import { useEffect, useRef } from 'react'
import { SceneManager } from './SceneManager.js'

export function useThreeScene(canvasRef) {
  const sceneRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const manager = new SceneManager(canvas)
    manager.setup()
    sceneRef.current = manager

    return () => {
      manager.dispose()
      sceneRef.current = null
    }
  }, [])

  return sceneRef
}
