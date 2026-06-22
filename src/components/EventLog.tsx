import { fmtMs } from '../utils'
import type { GameEvent, Player } from '../store/gameReducer'

type Props = {
  events: GameEvent[]
  players: Player[]
  onDelete?: (id: string) => void
}

export default function EventLog({ events, players, onDelete }: Props) {
  if (events.length === 0) return null

  const byId = Object.fromEntries(players.map(p => [p.id, p.name]))

  return (
    <div className="mt-2">
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">event log</p>
      <div className="space-y-1">
        {[...events].reverse().map(ev => {
          const time = fmtMs(ev.gameClockMs)
          const label =
            ev.type === 'goal_away'
              ? <span className="text-slate-300">Away goal</span>
              : (() => {
                  const scorer = ev.scorerId ? byId[ev.scorerId] : '?'
                  const assist = ev.assistId ? ` (assist: ${byId[ev.assistId]})` : ''
                  return (
                    <>
                      <span className="text-white font-medium">{scorer}</span>
                      <span className="text-emerald-400">⚽ goal{assist}</span>
                    </>
                  )
                })()

          return (
            <div key={ev.id} className="flex items-center gap-3 px-3 py-2 bg-slate-900 rounded-lg text-sm">
              <span className="text-slate-500 font-mono tabular-nums shrink-0">{time}</span>
              <span className="flex gap-2 flex-1 min-w-0">{label}</span>
              {onDelete && (
                <button
                  onClick={() => onDelete(ev.id)}
                  className="ml-auto shrink-0 w-6 h-6 flex items-center justify-center rounded text-slate-500 hover:text-red-400 hover:bg-slate-800 transition-colors"
                  aria-label="delete event"
                >
                  ✕
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
