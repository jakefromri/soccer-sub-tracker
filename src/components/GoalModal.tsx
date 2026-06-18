import { useState } from 'react'
import type { Player } from '../store/gameReducer'

type Props = {
  players: Player[]
  onConfirm: (scorerId: string, assistId?: string) => void
  onCancel: () => void
}

export default function GoalModal({ players, onConfirm, onCancel }: Props) {
  const [scorerId, setScorerId] = useState<string | null>(null)
  const [assistId, setAssistId] = useState<string | null>(null)

  const activePlayers = players.filter(p => p.status !== 'inactive')

  return (
    <div className="fixed inset-0 bg-black/70 flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-2xl w-full max-w-sm p-5 space-y-4">
        <h3 className="text-lg font-bold text-white text-center">⚽ home goal!</h3>

        <div>
          <p className="text-sm font-medium text-slate-300 mb-2">who scored?</p>
          <div className="grid grid-cols-2 gap-2">
            {activePlayers.map(p => (
              <button
                key={p.id}
                onClick={() => {
                  setScorerId(p.id)
                  if (assistId === p.id) setAssistId(null)
                }}
                className={`py-2.5 px-3 rounded-lg text-sm font-medium transition-colors ${
                  scorerId === p.id
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-700 text-slate-200 hover:bg-slate-600'
                }`}
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>

        {scorerId && (
          <div>
            <p className="text-sm font-medium text-slate-300 mb-2">assist? (optional)</p>
            <div className="grid grid-cols-2 gap-2">
              {activePlayers.filter(p => p.id !== scorerId).map(p => (
                <button
                  key={p.id}
                  onClick={() => setAssistId(assistId === p.id ? null : p.id)}
                  className={`py-2.5 px-3 rounded-lg text-sm font-medium transition-colors ${
                    assistId === p.id
                      ? 'bg-blue-500 text-white'
                      : 'bg-slate-700 text-slate-200 hover:bg-slate-600'
                  }`}
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-3 pt-1">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-xl bg-slate-700 text-slate-300 font-semibold hover:bg-slate-600 transition-colors"
          >
            cancel
          </button>
          <button
            onClick={() => scorerId && onConfirm(scorerId, assistId ?? undefined)}
            disabled={!scorerId}
            className="flex-1 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-white font-bold transition-colors"
          >
            confirm
          </button>
        </div>
      </div>
    </div>
  )
}
