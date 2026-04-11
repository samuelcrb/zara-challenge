import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { CartProvider } from '@/features/cart/CartContext'
import Navbar from '@/components/Navbar/Navbar'

const App = () => {
  return (
    <CartProvider>
      <BrowserRouter>
        <Navbar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<div>Phone List</div>} />
            <Route path="/product/:id" element={<div>Phone Detail</div>} />
            <Route path="/cart" element={<div>Cart</div>} />
          </Routes>
        </main>
      </BrowserRouter>
    </CartProvider>
  )
}

export default App
