import { createContext, useContext } from 'react'

export type TransitionDirection = 'forward' | 'backward'

const TransitionContext = createContext<TransitionDirection>('forward')

export const TransitionProvider = TransitionContext.Provider

export const useTransitionDirection = () => useContext(TransitionContext)
