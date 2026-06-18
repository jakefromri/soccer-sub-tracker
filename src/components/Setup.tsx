import { useRef, useState } from 'react'
import type { GameState, Player } from '../store/gameReducer'

type Props = {
  state: GameState
  onUpdateConfig: (updates: Partial<Pick<GameState, 'teamName' | 'playersOnField' | 'halfDurationMs' | 'numHalves' | 'players'>>) => void
  onStartGame: () => void
}

type SetupStep = 'config' | 'roster' | 'lineup'

export default function Setup({ state, onUpdateConfig, onStartGame }: Props) {
  const [step, setStep] = useState<SetupStep>('config')
  const [nameInput, setNameInput] = useState('')
  const [selectedOnField, setSelectedOnField] = useState<Set<string>>(new Set())
  const inputRef = useRef<HTMLInputElement>(null)

  const activePlayers = state.players.filter(p => p.status !== 'inactive')
  const n = state.playersOnField

  function addPlayer() {
    const name = nameInput.trim()
    if (!name) return
    const player: Player = {
      id: crypto.randomUUID(),
      name,
      status: 'bench',
      timeOnFieldMs: 0,
      currentStintStartMs: null,
    }
    onUpdateConfig({ players: [...state.players, player] })
    setNameInput('')
    inputRef.current?.focus()
  }

  function toggleInactive(id: string) {
    onUpdateConfig({
      players: state.players.map(p =>
        p.id === id ? { ...p, status: p.status === 'inactive' ? 'bench' : 'inactive' } : p
      ),
    })
    // remove from selected lineup if deactivated
    const updated = new Set(selectedOnField)
    updated.delete(id)
    setSelectedOnField(updated)
  }

  function removePlayer(id: string) {
    onUpdateConfig({ players: state.players.filter(p => p.id !== id) })
    const updated = new Set(selectedOnField)
    updated.delete(id)
    setSelectedOnField(updated)
  }

  function toggleLineup(id: string) {
    const updated = new Set(selectedOnField)
    if (updated.has(id)) {
      updated.delete(id)
    } else if (updated.size < n) {
      updated.add(id)
    }
    setSelectedOnField(updated)
  }

  function handleStartGame() {
    const players = state.players.map(p => ({
      ...p,
      status: (selectedOnField.has(p.id) ? 'field' : p.status === 'inactive' ? 'inactive' : 'bench') as Player['status'],
    }))
    onUpdateConfig({ players })
    onStartGame()
  }

  // ── Config step ──
  if (step === 'config') {
    return (
      <div className="min-h-svh flex flex-col items-center justify-center p-6 gap-8">
        <div className="text-center">
          <div className="text-4xl mb-2">⚽</div>
          <h1 className="text-3xl font-bold text-white">soccer sub tracker</h1>
          <p className="text-slate-400 mt-1">set up your game</p>
        </div>

        <div className="w-full max-w-sm space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">team name (optional)</label>
            <input
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              placeholder="e.g. Panthers"
              value={state.teamName}
              onChange={e => onUpdateConfig({ teamName: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">players on field per side</label>
            <div className="flex gap-2">
              {[3, 4, 5, 6, 7, 8, 9, 11].map(n => (
                <button
                  key={n}
                  onClick={() => onUpdateConfig({ playersOnField: n })}
                  className={`flex-1 py-3 rounded-lg font-semibold text-sm transition-colors ${
                    state.playersOnField === n
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {n}v{n}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-300 mb-1">minutes per half</label>
              <input
                type="number"
                min={1}
                max={60}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-emerald-500"
                value={state.halfDurationMs / 60000}
                onChange={e => onUpdateConfig({ halfDurationMs: Math.max(1, Number(e.target.value)) * 60000 })}
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-300 mb-1">number of halves</label>
              <div className="flex gap-2">
                {[1, 2].map(h => (
                  <button
                    key={h}
                    onClick={() => onUpdateConfig({ numHalves: h })}
                    className={`flex-1 py-3 rounded-lg font-semibold text-sm transition-colors ${
                      state.numHalves === h
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {h}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={() => setStep('roster')}
            className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-white font-bold rounded-xl text-lg transition-colors"
          >
            next: add players →
          </button>
        </div>
      </div>
    )
  }

  // ── Roster step ──
  if (step === 'roster') {
    return (
      <div className="min-h-svh flex flex-col p-4 gap-4 max-w-lg mx-auto">
        <div className="flex items-center gap-3 pt-2">
          <button onClick={() => setStep('config')} className="text-slate-400 hover:text-white text-lg">←</button>
          <div>
            <h2 className="text-xl font-bold text-white">add players</h2>
            <p className="text-slate-400 text-sm">need at least {n} active to continue</p>
          </div>
        </div>

        <div className="flex gap-2">
          <input
            ref={inputRef}
            className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            placeholder="player name"
            value={nameInput}
            onChange={e => setNameInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addPlayer()}
          />
          <button
            onClick={addPlayer}
            disabled={!nameInput.trim()}
            className="px-5 py-3 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-white font-bold rounded-lg transition-colors"
          >
            add
          </button>
        </div>

        <div className="space-y-2 flex-1">
          {state.players.length === 0 && (
            <p className="text-slate-500 text-center py-8">no players yet</p>
          )}
          {state.players.map(p => (
            <div
              key={p.id}
              className={`flex items-center justify-between px-4 py-3 rounded-xl border transition-colors ${
                p.status === 'inactive'
                  ? 'bg-slate-900 border-slate-700 opacity-50'
                  : 'bg-slate-800 border-slate-700'
              }`}
            >
              <span className={`font-medium ${p.status === 'inactive' ? 'line-through text-slate-500' : 'text-white'}`}>
                {p.name}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => toggleInactive(p.id)}
                  className="text-xs px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors"
                >
                  {p.status === 'inactive' ? 'activate' : 'inactive'}
                </button>
                <button
                  onClick={() => removePlayer(p.id)}
                  className="text-xs px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-red-900 text-slate-300 hover:text-red-300 transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={() => setStep('lineup')}
          disabled={activePlayers.length < n}
          className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl text-lg transition-colors"
        >
          next: set lineup →
        </button>
      </div>
    )
  }

  // ── Lineup step ──
  const benchPlayers = activePlayers.filter(p => !selectedOnField.has(p.id))
  const canStart = selectedOnField.size === n

  return (
    <div className="min-h-svh flex flex-col p-4 gap-4 max-w-lg mx-auto">
      <div className="flex items-center gap-3 pt-2">
        <button onClick={() => setStep('roster')} className="text-slate-400 hover:text-white text-lg">←</button>
        <div>
          <h2 className="text-xl font-bold text-white">starting lineup</h2>
          <p className="text-slate-400 text-sm">
            select {n} starters · {selectedOnField.size}/{n} chosen
          </p>
        </div>
      </div>

      {selectedOnField.size > 0 && (
        <div>
          <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2">starting ({selectedOnField.size})</p>
          <div className="space-y-2">
            {activePlayers.filter(p => selectedOnField.has(p.id)).map(p => (
              <button
                key={p.id}
                onClick={() => toggleLineup(p.id)}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-emerald-900 border border-emerald-700 text-white hover:bg-emerald-800 transition-colors"
              >
                <span className="font-medium">{p.name}</span>
                <span className="text-emerald-400 text-sm">starting ✓</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {benchPlayers.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">bench ({benchPlayers.length})</p>
          <div className="space-y-2">
            {benchPlayers.map(p => (
              <button
                key={p.id}
                onClick={() => toggleLineup(p.id)}
                disabled={selectedOnField.size >= n}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white disabled:opacity-40 hover:bg-slate-700 transition-colors"
              >
                <span className="font-medium">{p.name}</span>
                <span className="text-slate-400 text-sm">bench</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mt-auto">
        <button
          onClick={handleStartGame}
          disabled={!canStart}
          className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl text-lg transition-colors"
        >
          {canStart ? '⚽ start game' : `select ${n - selectedOnField.size} more`}
        </button>
      </div>
    </div>
  )
}
