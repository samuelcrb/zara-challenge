import { useState } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { TransitionProvider, type TransitionDirection } from '@/context/transitionContext'
import PhoneList from '@/features/products/page/PhoneList/PhoneList'
import PhoneDetail from '@/features/products/page/PhoneDetail/PhoneDetail'
import Cart from '@/features/cart/page/Cart/Cart'

interface AnimatedRoutesProps {
  onLoadingChange: (loading: boolean) => void
}

/**
 * Determines the navigation direction based on path changes.
 * Going to /cart is "forward"; leaving /cart is "backward".
 * All other transitions default to "forward".
 */
const getDirection = (prev: string, next: string): TransitionDirection => {
  if (next === '/cart') return 'forward'
  if (prev === '/cart') return 'backward'
  return 'forward'
}

const AnimatedRoutes = ({ onLoadingChange }: AnimatedRoutesProps) => {
  const location = useLocation()

  // Render-time state update: store prevPath + direction together so the
  // computed direction is available on the same render that commits to the DOM.
  const [{ prevPath, direction }, setNavState] = useState({
    prevPath: location.pathname,
    direction: 'forward' as TransitionDirection,
  })

  if (prevPath !== location.pathname) {
    setNavState({
      prevPath: location.pathname,
      direction: getDirection(prevPath, location.pathname),
    })
  }

  return (
    <TransitionProvider value={direction}>
      <AnimatePresence mode="wait" initial={false}>
        <Routes location={location} key={location.pathname}>
          <Route
            path="/"
            element={<PhoneList onLoadingChange={onLoadingChange} />}
          />
          <Route
            path="/product/:id"
            element={<PhoneDetail onLoadingChange={onLoadingChange} />}
          />
          <Route path="/cart" element={<Cart />} />
        </Routes>
      </AnimatePresence>
    </TransitionProvider>
  )
}

export default AnimatedRoutes
