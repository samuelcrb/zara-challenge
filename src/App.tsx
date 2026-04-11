import { BrowserRouter } from 'react-router-dom'
import { CartProvider } from '@/features/cart/CartContext'
import Navbar from '@/components/Navbar/Navbar'

const App = () => {
  return (
    <CartProvider>
      <BrowserRouter>
        <Navbar />
        <div>Zara Challenge</div>
      </BrowserRouter>
    </CartProvider>
  )
}

export default App
