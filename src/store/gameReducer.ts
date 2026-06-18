export type Player = {
  id: string
  name: string
  status: 'field' | 'bench' | 'inactive'
  timeOnFieldMs: number
  currentStintStartMs: number | null
}

export type GameEvent = {
  id: string
  gameClockMs: number
  type: 'goal_home' | 'goal_away'
  scorerId?: string
  assistId?: string
}

export type GamePhase = 'setup' | 'playing' | 'paused' | 'halftime' | 'final'

export type GameState = {
  phase: GamePhase
  half: 1 | 2
  halfDurationMs: number
  numHalves: number
  playersOnField: number
  teamName: string
  players: Player[]
  events: GameEvent[]
  score: { home: number; away: number }
  gameClockMs: number
  halfClockMs: number
  lastTickAt: number | null
  pendingSubOff: string | null  // player id waiting to be subbed off
}

export type GameAction =
  | { type: 'TICK'; now: number }
  | { type: 'PATCH_SETUP'; updates: Partial<Pick<GameState, 'teamName' | 'playersOnField' | 'halfDurationMs' | 'numHalves' | 'players'>> }
  | { type: 'RESTORE'; saved: GameState & { savedAt: number } }
  | { type: 'PAUSE' }
  | { type: 'RESUME'; now: number }
  | { type: 'START_GAME'; now: number }
  | { type: 'START_SECOND_HALF'; now: number }
  | { type: 'SET_PENDING_SUB_OFF'; playerId: string | null }
  | { type: 'SUB_ON'; benchPlayerId: string; now: number }
  | { type: 'ADD_HOME_GOAL'; scorerId: string; assistId?: string }
  | { type: 'ADD_AWAY_GOAL' }
  | { type: 'ADJUST_SCORE'; team: 'home' | 'away'; delta: number }
  | { type: 'RESET' }

function computePlayerTimeAtMs(player: Player, gameClockMs: number): number {
  if (player.currentStintStartMs === null) return player.timeOnFieldMs
  return player.timeOnFieldMs + (gameClockMs - player.currentStintStartMs)
}

export function getPlayerTime(player: Player, gameClockMs: number): number {
  return computePlayerTimeAtMs(player, gameClockMs)
}

function longestOnFieldPlayerId(players: Player[], gameClockMs: number): string | null {
  const onField = players.filter(p => p.status === 'field')
  if (onField.length === 0) return null
  return onField.reduce((max, p) =>
    computePlayerTimeAtMs(p, gameClockMs) > computePlayerTimeAtMs(max, gameClockMs) ? p : max
  ).id
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'PATCH_SETUP':
      return { ...state, ...action.updates }

    case 'RESTORE': {
      const { savedAt, ...saved } = action.saved
      // Non-playing states need no clock math
      if (saved.phase !== 'playing') return { ...saved, lastTickAt: null }

      const elapsed = Date.now() - savedAt
      const halfRemaining = saved.halfDurationMs - saved.halfClockMs
      const halfAdded = Math.min(elapsed, halfRemaining)
      const newHalfClock = saved.halfClockMs + halfAdded
      const newGameClock = saved.gameClockMs + halfAdded
      const halfExpired = halfAdded >= halfRemaining

      if (halfExpired) {
        // Bank active player stints at the moment the half expired
        const players = saved.players.map(p =>
          p.status === 'field' && p.currentStintStartMs !== null
            ? { ...p, timeOnFieldMs: p.timeOnFieldMs + halfAdded, currentStintStartMs: null }
            : p
        )
        const phase = saved.half === 1 ? 'halftime' : 'final'
        return { ...saved, players, halfClockMs: saved.halfDurationMs, gameClockMs: newGameClock, phase, lastTickAt: null }
      }

      // Half didn't expire — advance game clock, keep stints running.
      // currentStintStartMs is relative to gameClockMs, so player times
      // auto-advance correctly as gameClockMs increases. Pause so coach
      // can review before resuming.
      return { ...saved, halfClockMs: newHalfClock, gameClockMs: newGameClock, phase: 'paused', lastTickAt: null }
    }

    case 'TICK': {
      if (state.lastTickAt === null) return state
      const elapsed = action.now - state.lastTickAt
      const newHalfClock = state.halfClockMs + elapsed
      const newGameClock = state.gameClockMs + elapsed

      if (newHalfClock >= state.halfDurationMs) {
        // Half expired
        const clampedElapsed = state.halfDurationMs - state.halfClockMs
        const clampedGameClock = state.gameClockMs + clampedElapsed

        if (state.half === 1) {
          // Freeze all player stints at halftime
          const players = state.players.map(p =>
            p.status === 'field' && p.currentStintStartMs !== null
              ? { ...p, timeOnFieldMs: p.timeOnFieldMs + (clampedGameClock - p.currentStintStartMs), currentStintStartMs: null }
              : p
          )
          return {
            ...state,
            phase: 'halftime',
            halfClockMs: state.halfDurationMs,
            gameClockMs: clampedGameClock,
            lastTickAt: null,
            players,
          }
        } else {
          // Game over
          const players = state.players.map(p =>
            p.status === 'field' && p.currentStintStartMs !== null
              ? { ...p, timeOnFieldMs: p.timeOnFieldMs + (clampedGameClock - p.currentStintStartMs), currentStintStartMs: null }
              : p
          )
          return {
            ...state,
            phase: 'final',
            halfClockMs: state.halfDurationMs,
            gameClockMs: clampedGameClock,
            lastTickAt: null,
            players,
          }
        }
      }

      return {
        ...state,
        halfClockMs: newHalfClock,
        gameClockMs: newGameClock,
        lastTickAt: action.now,
      }
    }

    case 'PAUSE':
      return { ...state, phase: 'paused', lastTickAt: null }

    case 'RESUME':
      return { ...state, phase: 'playing', lastTickAt: action.now }

    case 'START_GAME':
      return {
        ...state,
        phase: 'playing',
        lastTickAt: action.now,
        // stamp currentStintStartMs = 0 for all field players
        players: state.players.map(p =>
          p.status === 'field' ? { ...p, currentStintStartMs: 0 } : p
        ),
      }

    case 'START_SECOND_HALF': {
      const players = state.players.map(p =>
        p.status === 'field' ? { ...p, currentStintStartMs: state.gameClockMs } : p
      )
      return {
        ...state,
        phase: 'playing',
        half: 2,
        halfClockMs: 0,
        lastTickAt: action.now,
        players,
      }
    }

    case 'SET_PENDING_SUB_OFF':
      return { ...state, pendingSubOff: action.playerId }

    case 'SUB_ON': {
      const outId = state.pendingSubOff ?? longestOnFieldPlayerId(state.players, state.gameClockMs)
      if (!outId) return state

      const players = state.players.map(p => {
        if (p.id === outId) {
          // coming off — bank their time
          const banked = p.currentStintStartMs !== null
            ? p.timeOnFieldMs + (state.gameClockMs - p.currentStintStartMs)
            : p.timeOnFieldMs
          return { ...p, status: 'bench' as const, timeOnFieldMs: banked, currentStintStartMs: null }
        }
        if (p.id === action.benchPlayerId) {
          return { ...p, status: 'field' as const, currentStintStartMs: state.gameClockMs }
        }
        return p
      })

      return { ...state, players, pendingSubOff: null }
    }

    case 'ADD_HOME_GOAL': {
      const event: GameEvent = {
        id: crypto.randomUUID(),
        gameClockMs: state.gameClockMs,
        type: 'goal_home',
        scorerId: action.scorerId,
        assistId: action.assistId,
      }
      return {
        ...state,
        score: { ...state.score, home: state.score.home + 1 },
        events: [...state.events, event],
      }
    }

    case 'ADD_AWAY_GOAL': {
      const event: GameEvent = {
        id: crypto.randomUUID(),
        gameClockMs: state.gameClockMs,
        type: 'goal_away',
      }
      return {
        ...state,
        score: { ...state.score, away: state.score.away + 1 },
        events: [...state.events, event],
      }
    }

    case 'ADJUST_SCORE': {
      const current = state.score[action.team]
      const next = Math.max(0, current + action.delta)
      return { ...state, score: { ...state.score, [action.team]: next } }
    }

    case 'RESET':
      return initialState

    default:
      return state
  }
}

export const initialState: GameState = {
  phase: 'setup',
  half: 1,
  halfDurationMs: 12 * 60 * 1000,
  numHalves: 2,
  playersOnField: 4,
  teamName: '',
  players: [],
  events: [],
  score: { home: 0, away: 0 },
  gameClockMs: 0,
  halfClockMs: 0,
  lastTickAt: null,
  pendingSubOff: null,
}
