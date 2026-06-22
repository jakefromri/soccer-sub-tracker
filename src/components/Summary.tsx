import { fmtMs } from '../utils'
import type { GameState } from '../store/gameReducer'

type Props = {
  state: GameState
  onClose?: () => void
  onReset?: () => void
  isFinal?: boolean
  // only used when Summary is the top-level final screen (not inside a modal)
  modal?: string | null
  onModalClose?: () => void
  onConfirmReset?: () => void
}

export default function Summary({ state, onClose, onReset, isFinal = false, modal, onModalClose, onConfirmReset }: Props) {
  const { players, events, score, teamName } = state
  const byId = Object.fromEntries(players.map(p => [p.id, p.name]))

  const activePlayers = [...players]
    .filter(p => p.status !== 'inactive')
    .sort((a, b) => b.timeOnFieldMs - a.timeOnFieldMs)

  const goalsByPlayer: Record<string, number> = Object.fromEntries(players.map(p => [p.id, 0]))
  const assistsByPlayer: Record<string, number> = Object.fromEntries(players.map(p => [p.id, 0]))
  events.forEach(ev => {
    if (ev.type === 'goal_home') {
      if (ev.scorerId && goalsByPlayer[ev.scorerId] !== undefined) goalsByPlayer[ev.scorerId]++
      if (ev.assistId && assistsByPlayer[ev.assistId] !== undefined) assistsByPlayer[ev.assistId]++
    }
  })

  function copyText() {
    const lines: string[] = []
    const home = teamName || 'Home'
    lines.push(`${home} ${score.home} — Away ${score.away}`)
    lines.push('')
    lines.push('player stats:')
    lines.push('  name              min    G  A')
    activePlayers.forEach(p => {
      const min = fmtMs(p.timeOnFieldMs)
      const g = goalsByPlayer[p.id] ?? 0
      const a = assistsByPlayer[p.id] ?? 0
      lines.push(`  ${p.name.padEnd(16)}  ${min}  ${g}  ${a}`)
    })
    if (events.length > 0) {
      lines.push('')
      lines.push('goals:')
      events.forEach(ev => {
        const t = fmtMs(ev.gameClockMs)
        if (ev.type === 'goal_away') {
          lines.push(`  ${t}  Away goal`)
        } else {
          const scorer = ev.scorerId ? byId[ev.scorerId] : '?'
          const assist = ev.assistId ? ` (assist: ${byId[ev.assistId]})` : ''
          lines.push(`  ${t}  ${scorer} — goal${assist}`)
        }
      })
    }
    navigator.clipboard.writeText(lines.join('\n'))
  }

  const home = teamName || 'Home'

  return (
    <div className={isFinal ? 'min-h-svh flex flex-col' : ''}>
      {isFinal && (
        <div className="bg-slate-900 border-b border-slate-700 px-4 py-4 text-center">
          <div className="text-2xl mb-1">🏁</div>
          <h2 className="text-xl font-bold text-white">full time</h2>
        </div>
      )}

      <div className="flex-1 overflow-auto p-4 space-y-5">
        {/* Score */}
        <div className="bg-slate-800 rounded-2xl p-5 text-center">
          <p className="text-sm text-slate-400 mb-1">{home} vs Away</p>
          <p className="text-5xl font-bold text-white tracking-tight">
            {score.home} <span className="text-slate-500">—</span> {score.away}
          </p>
        </div>

        {/* Player stats */}
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">player stats</p>
          <div className="bg-slate-800 rounded-xl overflow-hidden">
            <div className="flex items-center px-4 py-2 border-b border-slate-700">
              <span className="flex-1 text-xs font-semibold text-slate-500 uppercase tracking-wider">player</span>
              <span className="w-14 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">min</span>
              <span className="w-8 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">G</span>
              <span className="w-8 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">A</span>
            </div>
            {activePlayers.map(p => (
              <div key={p.id} className="flex items-center px-4 py-2.5 border-b border-slate-700/50 last:border-0">
                <span className="flex-1 text-white font-medium">{p.name}</span>
                <span className="w-14 text-right font-mono tabular-nums text-emerald-400 text-sm">{fmtMs(p.timeOnFieldMs)}</span>
                <span className="w-8 text-center text-sm font-semibold text-white">{goalsByPlayer[p.id] || '—'}</span>
                <span className="w-8 text-center text-sm font-semibold text-slate-300">{assistsByPlayer[p.id] || '—'}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Events */}
        {events.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">goals & assists</p>
            <div className="space-y-1.5">
              {events.map(ev => {
                const t = fmtMs(ev.gameClockMs)
                if (ev.type === 'goal_away') {
                  return (
                    <div key={ev.id} className="flex gap-3 px-4 py-2.5 bg-slate-800 rounded-xl text-sm">
                      <span className="text-slate-500 font-mono tabular-nums">{t}</span>
                      <span className="text-slate-300">Away goal</span>
                    </div>
                  )
                }
                const scorer = ev.scorerId ? byId[ev.scorerId] : '?'
                const assist = ev.assistId ? ` · assist: ${byId[ev.assistId]}` : ''
                return (
                  <div key={ev.id} className="flex gap-3 px-4 py-2.5 bg-slate-800 rounded-xl text-sm items-center">
                    <span className="text-slate-500 font-mono tabular-nums">{t}</span>
                    <span className="text-emerald-400">⚽</span>
                    <span className="text-white">{scorer}{assist}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={copyText}
            className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold rounded-xl transition-colors"
          >
            copy summary
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold rounded-xl transition-colors"
            >
              {isFinal ? 'back to review' : 'back to game'}
            </button>
          )}
        </div>

        {onReset && (
          <button
            onClick={onReset}
            className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white font-semibold rounded-xl transition-colors border border-slate-700"
          >
            new game
          </button>
        )}
      </div>

      {/* Confirm reset modal — only rendered when Summary is the top-level final screen */}
      {modal === 'confirm_reset' && onModalClose && onConfirmReset && (
        <div className="fixed inset-0 bg-black/70 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl w-full max-w-sm p-6 space-y-4">
            <h3 className="text-lg font-bold text-white text-center">start a new game?</h3>
            <p className="text-slate-400 text-sm text-center">this will clear the current game and all stats.</p>
            <div className="flex gap-3">
              <button
                onClick={onModalClose}
                className="flex-1 py-3 rounded-xl bg-slate-700 text-slate-300 font-semibold hover:bg-slate-600 transition-colors"
              >
                cancel
              </button>
              <button
                onClick={onConfirmReset}
                className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold transition-colors"
              >
                yes, reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
