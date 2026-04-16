export type BarPhase = 'idle' | 'loading' | 'completing'

export type State = { barPhase: BarPhase; barWidth: number; cycle: number }
export type Action =
  | { type: 'start' }
  | { type: 'grow' }
  | { type: 'complete' }
  | { type: 'idle' }

export const initialState: State = { barPhase: 'idle', barWidth: 0, cycle: 0 }

export const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'start':    return { barPhase: 'loading',    barWidth: 0,   cycle: state.cycle + 1 }
    case 'grow':     return { ...state, barWidth: 85 }
    case 'complete': return { ...state, barPhase: 'completing', barWidth: 100 }
    case 'idle':     return { ...state, barPhase: 'idle' }
  }
}
