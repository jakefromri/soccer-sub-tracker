import { useReducer } from 'react'
import { gameReducer, initialState } from './store/gameReducer'
import type { GameState } from './store/gameReducer'
import Setup from './components/Setup'
import Game from './components/Game'

export default function App() {
  const [state, dispatch] = useReducer(gameReducer, initialState)

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
