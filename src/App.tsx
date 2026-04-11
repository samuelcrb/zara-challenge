import { BrowserRouter } from 'react-router-dom'
import { CartProvider } from '@/features/cart/CartContext'

const App = () => {
  return (
    <CartProvider>
      <BrowserRouter>
        <div>Zara Challenge</div>
      </BrowserRouter>
    </CartProvider>
  )
}

export default App
