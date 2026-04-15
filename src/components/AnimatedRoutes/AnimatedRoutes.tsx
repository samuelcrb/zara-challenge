import { useRef, useMemo } from 'react'
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
  const prevPathRef = useRef(location.pathname)

  const direction = useMemo(() => {
    const dir = getDirection(prevPathRef.current, location.pathname)
    prevPathRef.current = location.pathname
    return dir
  }, [location.pathname])

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
