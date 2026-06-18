import { fmtMs } from '../utils'
import type { GameEvent, Player } from '../store/gameReducer'

type Props = {
  events: GameEvent[]
  players: Player[]
}

export default function EventLog({ events, players }: Props) {
  if (events.length === 0) return null

  const byId = Object.fromEntries(players.map(p => [p.id, p.name]))

  return (
    <div className="mt-2">
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">event log</p>
      <div className="space-y-1">
        {[...events].reverse().map(ev => {
          const time = fmtMs(ev.gameClockMs)
          if (ev.type === 'goal_away') {
            return (
              <div key={ev.id} className="flex gap-3 px-3 py-2 bg-slate-900 rounded-lg text-sm">
                <span className="text-slate-500 font-mono tabular-nums">{time}</span>
                <span className="text-slate-300">Away goal</span>
              </div>
            )
          }
          const scorer = ev.scorerId ? byId[ev.scorerId] : '?'
          const assist = ev.assistId ? ` (assist: ${byId[ev.assistId]})` : ''
          return (
            <div key={ev.id} className="flex gap-3 px-3 py-2 bg-slate-900 rounded-lg text-sm">
              <span className="text-slate-500 font-mono tabular-nums">{time}</span>
              <span className="text-white font-medium">{scorer}</span>
              <span className="text-emerald-400">⚽ goal{assist}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
