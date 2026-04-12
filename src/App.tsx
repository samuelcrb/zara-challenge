import { useCallback, useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { CartProvider } from '@/features/cart/CartContext'
import Navbar from '@/components/Navbar/Navbar'
import styles from './App.module.scss'
import PhoneList from '@/features/products/page/PhoneList/PhoneList'
import PhoneDetail from '@/features/products/page/PhoneDetail/PhoneDetail'

const App = () => {
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const handleInitialLoadComplete = useCallback(() => setIsInitialLoading(false), [])

  return (
    <CartProvider>
      <BrowserRouter>
        <Navbar isLoading={isInitialLoading} />
        <main className={styles.main}>
          <Routes>
            <Route
              path="/"
              element={<PhoneList onInitialLoadComplete={handleInitialLoadComplete} />}
            />
            <Route path="/product/:id" element={<PhoneDetail />} />
            <Route path="/cart" element={<div>Cart</div>} />
          </Routes>
        </main>
      </BrowserRouter>
    </CartProvider>
  )
}

export default App
