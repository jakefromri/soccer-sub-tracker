import { useEffect, useRef, useState } from 'react'
import type { GameState, GameAction } from '../store/gameReducer'
import { fmtMs } from '../utils'
import { FieldPlayerCard, BenchPlayerCard } from './PlayerCard'
import EventLog from './EventLog'
import GoalModal from './GoalModal'
import Summary from './Summary'

type Props = {
  state: GameState
  dispatch: React.Dispatch<GameAction>
}

type Modal = 'goal_home' | 'summary' | null

export default function Game({ state, dispatch }: Props) {
  const [modal, setModal] = useState<Modal>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Drive the clock with setInterval
  useEffect(() => {
    if (state.phase === 'playing') {
      intervalRef.current = setInterval(() => {
        dispatch({ type: 'TICK', now: Date.now() })
      }, 100)
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [state.phase, dispatch])

  // Catch up the clock immediately when the user returns to the tab.
  // Handles the case where the browser suspends intervals in the background
  // without killing the page. The TICK reducer uses lastTickAt so a single
  // dispatch with Date.now() advances the clock by the full elapsed gap.
  useEffect(() => {
    function onVisible() {
      if (document.visibilityState === 'visible') {
        dispatch({ type: 'TICK', now: Date.now() })
      }
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [dispatch])

  const fieldPlayers = state.players.filter(p => p.status === 'field')
  const benchPlayers = state.players.filter(p => p.status === 'bench')

  function handleSubOn(benchPlayerId: string) {
    dispatch({ type: 'SUB_ON', benchPlayerId, now: Date.now() })
  }

  function handleSubOff(playerId: string) {
    if (state.pendingSubOff === playerId) {
      dispatch({ type: 'SET_PENDING_SUB_OFF', playerId: null })
    } else {
      dispatch({ type: 'SET_PENDING_SUB_OFF', playerId })
    }
  }

  function handlePauseResume() {
    if (state.phase === 'playing') {
      dispatch({ type: 'PAUSE' })
    } else if (state.phase === 'paused') {
      dispatch({ type: 'RESUME', now: Date.now() })
    }
  }

  const halfLabel =
    state.phase === 'halftime' ? 'halftime' :
    state.phase === 'final' ? 'final' :
    state.half === 1 ? '1st half' : '2nd half'

  const isActive = state.phase === 'playing' || state.phase === 'paused'

  if (state.phase === 'final' && modal !== 'summary') {
    return <Summary state={state} isFinal />
  }

  return (
    <div className="min-h-svh flex flex-col max-w-lg mx-auto">
      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-700 sticky top-0 z-10">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2 min-w-0">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
              state.phase === 'halftime' ? 'bg-amber-900 text-amber-300' :
              state.phase === 'final' ? 'bg-slate-700 text-slate-300' :
              state.phase === 'paused' ? 'bg-slate-700 text-slate-300' :
              'bg-emerald-900 text-emerald-300'
            }`}>
              {halfLabel}
            </span>
            <span className="font-mono text-2xl font-bold text-white tabular-nums">
              {fmtMs(state.halfClockMs)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {isActive && (
              <button
                onClick={handlePauseResume}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
                  state.phase === 'playing'
                    ? 'bg-slate-700 hover:bg-slate-600 text-white'
                    : 'bg-amber-600 hover:bg-amber-500 text-white'
                }`}
              >
                {state.phase === 'playing' ? 'pause' : 'resume'}
              </button>
            )}
            <button
              onClick={() => setModal('summary')}
              className="px-3 py-2 rounded-lg text-sm bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              stats
            </button>
          </div>
        </div>

        {/* Score bar */}
        <div className="flex items-center justify-center gap-4 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-slate-300 text-sm font-medium">{state.teamName || 'home'}</span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => dispatch({ type: 'ADJUST_SCORE', team: 'home', delta: -1 })}
                className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-lg leading-none flex items-center justify-center transition-colors"
              >−</button>
              <span className="text-white text-2xl font-bold tabular-nums w-7 text-center">{state.score.home}</span>
              <button
                onClick={() => dispatch({ type: 'ADJUST_SCORE', team: 'home', delta: 1 })}
                className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-lg leading-none flex items-center justify-center transition-colors"
              >+</button>
            </div>
          </div>
          <span className="text-slate-600 font-bold text-xl">—</span>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => dispatch({ type: 'ADJUST_SCORE', team: 'away', delta: -1 })}
                className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-lg leading-none flex items-center justify-center transition-colors"
              >−</button>
              <span className="text-white text-2xl font-bold tabular-nums w-7 text-center">{state.score.away}</span>
              <button
                onClick={() => dispatch({ type: 'ADJUST_SCORE', team: 'away', delta: 1 })}
                className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-lg leading-none flex items-center justify-center transition-colors"
              >+</button>
            </div>
            <span className="text-slate-300 text-sm font-medium">away</span>
          </div>
        </div>
      </div>

      {/* Halftime banner */}
      {state.phase === 'halftime' && (
        <div className="bg-amber-900/40 border-b border-amber-700 px-4 py-4 text-center">
          <p className="text-amber-300 font-semibold">halftime</p>
          <p className="text-slate-400 text-sm mb-3">first half complete</p>
          <button
            onClick={() => dispatch({ type: 'START_SECOND_HALF', now: Date.now() })}
            className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white font-bold rounded-xl transition-colors"
          >
            start 2nd half
          </button>
        </div>
      )}

      <div className="flex-1 p-4 space-y-4 overflow-auto">
        {/* On field */}
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            on field ({fieldPlayers.length})
          </p>
          <div className="space-y-2">
            {fieldPlayers.map(p => (
              <FieldPlayerCard
                key={p.id}
                player={p}
                gameClockMs={state.gameClockMs}
                isPendingOff={state.pendingSubOff === p.id}
                onSubOff={() => handleSubOff(p.id)}
              />
            ))}
          </div>
        </div>

        {/* Bench */}
        {benchPlayers.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              bench ({benchPlayers.length})
            </p>
            <div className="space-y-2">
              {benchPlayers.map(p => (
                <BenchPlayerCard
                  key={p.id}
                  player={p}
                  onSubOn={() => handleSubOn(p.id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Sub hint */}
        {state.pendingSubOff && benchPlayers.length > 0 && (
          <p className="text-xs text-amber-400 text-center">
            tap "sub on" to complete the substitution
          </p>
        )}

        {/* Goal buttons */}
        <div className="flex gap-3">
          <button
            onClick={() => setModal('goal_home')}
            className="flex-1 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-colors"
          >
            + home goal
          </button>
          <button
            onClick={() => dispatch({ type: 'ADD_AWAY_GOAL' })}
            className="flex-1 py-3.5 bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold rounded-xl transition-colors"
          >
            + away goal
          </button>
        </div>

        <EventLog events={state.events} players={state.players} />
      </div>

      {/* Modals */}
      {modal === 'goal_home' && (
        <GoalModal
          players={state.players}
          onConfirm={(scorerId, assistId) => {
            dispatch({ type: 'ADD_HOME_GOAL', scorerId, assistId })
            setModal(null)
          }}
          onCancel={() => setModal(null)}
        />
      )}

      {modal === 'summary' && (
        <div className="fixed inset-0 bg-black/70 z-50 overflow-auto">
          <div className="min-h-svh bg-slate-900">
            <Summary state={state} onClose={() => setModal(null)} />
          </div>
        </div>
      )}
    </div>
  )
}
