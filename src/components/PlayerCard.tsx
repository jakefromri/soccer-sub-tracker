import { fmtMs } from '../utils'
import type { Player } from '../store/gameReducer'

type FieldCardProps = {
  player: Player
  gameClockMs: number
  isPendingOff: boolean
  onSubOff: () => void
}

export function FieldPlayerCard({ player, gameClockMs, isPendingOff, onSubOff }: FieldCardProps) {
  const timeMs = player.currentStintStartMs !== null
    ? player.timeOnFieldMs + (gameClockMs - player.currentStintStartMs)
    : player.timeOnFieldMs

  return (
    <div className={`flex items-center justify-between px-4 py-3 rounded-xl border transition-colors ${
      isPendingOff
        ? 'bg-amber-900/60 border-amber-500 shadow-lg shadow-amber-900/30'
        : 'bg-slate-800 border-slate-700'
    }`}>
      <div>
        <p className="font-semibold text-white text-base">{player.name}</p>
        <p className={`text-sm font-mono tabular-nums ${isPendingOff ? 'text-amber-400' : 'text-emerald-400'}`}>
          {fmtMs(timeMs)}
        </p>
      </div>
      <button
        onClick={onSubOff}
        className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
          isPendingOff
            ? 'bg-amber-500 text-white hover:bg-amber-400'
            : 'bg-slate-700 text-slate-200 hover:bg-amber-700 hover:text-white'
        }`}
      >
        {isPendingOff ? 'pending ✓' : 'sub off'}
      </button>
    </div>
  )
}

type BenchCardProps = {
  player: Player
  isPendingOn: boolean
  onSubOn: () => void
}

export function BenchPlayerCard({ player, isPendingOn, onSubOn }: BenchCardProps) {
  return (
    <div className={`flex items-center justify-between px-4 py-3 rounded-xl border transition-colors ${
      isPendingOn
        ? 'bg-emerald-900/60 border-emerald-500 shadow-lg shadow-emerald-900/30'
        : 'bg-slate-900 border-slate-700'
    }`}>
      <div>
        <p className="font-semibold text-white text-base">{player.name}</p>
        <p className={`text-sm font-mono tabular-nums ${isPendingOn ? 'text-emerald-400' : 'text-slate-400'}`}>
          {fmtMs(player.timeOnFieldMs)} played
        </p>
      </div>
      <button
        onClick={onSubOn}
        className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
          isPendingOn
            ? 'bg-emerald-500 text-white hover:bg-emerald-400'
            : 'bg-emerald-600 hover:bg-emerald-500 text-white'
        }`}
      >
        {isPendingOn ? 'pending ✓' : 'sub on'}
      </button>
    </div>
  )
}
