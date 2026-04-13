import { useCallback, useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { CartProvider } from '@/features/cart/CartContext'
import Navbar from '@/components/Navbar/Navbar'
import styles from './App.module.scss'
import PhoneList from '@/features/products/page/PhoneList/PhoneList'
import PhoneDetail from '@/features/products/page/PhoneDetail/PhoneDetail'
import Cart from '@/features/cart/page/Cart/Cart'

const App = () => {
  const [isLoading, setIsLoading] = useState(true)
  const handleLoadingChange = useCallback((loading: boolean) => setIsLoading(loading), [])

  return (
    <CartProvider>
      <BrowserRouter>
        <Navbar isLoading={isLoading} />
        <main className={styles.main}>
          <Routes>
            <Route
              path="/"
              element={<PhoneList onLoadingChange={handleLoadingChange} />}
            />
            <Route path="/product/:id" element={<PhoneDetail onLoadingChange={handleLoadingChange} />} />
            <Route path="/cart" element={<Cart />} />
          </Routes>
        </main>
      </BrowserRouter>
    </CartProvider>
  )
}

export default App
