import { useCallback, useRef, useState } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { CartProvider } from '@/features/cart/CartContext'
import Navbar from '@/components/Navbar/Navbar'
import ScrollToTop from '@/components/ScrollToTop/ScrollToTop'
import AnimatedRoutes from '@/components/AnimatedRoutes/AnimatedRoutes'
import styles from './App.module.scss'

const App = () => {
  const startsWithLoading = window.location.pathname !== '/cart'
  const [isLoading, setIsLoading] = useState(startsWithLoading)
  const initialLoadDone = useRef(!startsWithLoading)

  const handleLoadingChange = useCallback((loading: boolean) => {
    if (initialLoadDone.current) return
    setIsLoading(loading)
    if (!loading) initialLoadDone.current = true
  }, [])

  return (
    <CartProvider>
      <BrowserRouter>
        <ScrollToTop />
        <Navbar isLoading={isLoading} />
        <main className={styles.main}>
          <AnimatedRoutes onLoadingChange={handleLoadingChange} />
        </main>
      </BrowserRouter>
    </CartProvider>
  )
}

export default App
