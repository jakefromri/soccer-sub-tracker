import { useEffect, useReducer } from 'react'
import { gameReducer, initialState } from './store/gameReducer'
import type { GameState } from './store/gameReducer'
import Setup from './components/Setup'
import Game from './components/Game'

const STORAGE_KEY = 'sst-game-v1'

export default function App() {
  const [state, dispatch] = useReducer(gameReducer, initialState)

  // Restore saved game on mount
  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return
    try {
      const saved = JSON.parse(raw)
      if (saved?.phase && saved.phase !== 'setup') {
        dispatch({ type: 'RESTORE', saved })
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY)
    }
  }, [])

  // Persist state on every change
  useEffect(() => {
    if (state.phase === 'setup') {
      localStorage.removeItem(STORAGE_KEY)
    } else {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...state, savedAt: Date.now() }))
    }
  }, [state])

  function handleUpdateConfig(updates: Partial<Pick<GameState, 'teamName' | 'playersOnField' | 'halfDurationMs' | 'numHalves' | 'players'>>) {
    dispatch({ type: 'PATCH_SETUP', updates })
  }

  if (state.phase === 'setup') {
    return (
      <Setup
        state={state}
        onUpdateConfig={handleUpdateConfig}
        onStartGame={() => dispatch({ type: 'START_GAME', now: Date.now() })}
      />
    )
  }

  return <Game state={state} dispatch={dispatch} />
}
