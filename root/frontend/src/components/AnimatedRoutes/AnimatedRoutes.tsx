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
 * Determina la dirección de navegación según los cambios de ruta.
 * Ir a /cart es "forward"; salir de /cart es "backward".
 * El resto de transiciones son "forward" por defecto.
 */
const getDirection = (prev: string, next: string): TransitionDirection => {
  if (next === '/cart') return 'forward'
  if (prev === '/cart') return 'backward'
  return 'forward'
}

const AnimatedRoutes = ({ onLoadingChange }: AnimatedRoutesProps) => {
  const location = useLocation()

  // Actualización de estado en tiempo de render: guarda prevPath y direction juntos
  // para que la dirección calculada esté disponible en el mismo render que se aplica al DOM.
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
