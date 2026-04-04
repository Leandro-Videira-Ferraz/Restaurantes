import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { StoreProvider, useStore } from './store/StoreContext'
import { CartProvider } from './store/CartContext'
import { UserProvider } from './store/UserContext'
import { OrdersProvider } from './store/OrdersContext'
import Header from './components/Header'
import Tabs from './components/Tabs'
import CategoryForm from './components/CategoryForm'
import ProductForm from './components/ProductForm'
import AddonsForm from './components/AddonsForm'
import Menu from './components/Menu'
import Settings from './components/Settings'
import Cart from './components/Cart'
import Checkout from './components/Checkout'
import DeliveryForm from './components/DeliveryForm'
import Orders from './components/Orders'
import OrderQueue from './components/OrderQueue'
import CouponsForm from './components/CouponsForm'

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `${r}, ${g}, ${b}`
}

export default function App() {
  return (
    <StoreProvider>
      <CartProvider>
        <UserProvider>
          <OrdersProvider>
            <AppShell />
          </OrdersProvider>
        </UserProvider>
      </CartProvider>
    </StoreProvider>
  )
}

function AppShell() {
  const { state } = useStore()
  const accent = state.settings.accentColor || '#f59e0b'
  const isLight = state.settings.themeMode === 'light'

  useEffect(() => {
    const root = document.documentElement
    root.style.setProperty('--accent', accent)
    root.style.setProperty('--color-amber-500', accent)
    root.style.setProperty('--color-amber-400', `color-mix(in srgb, ${accent} 85%, white)`)
    root.style.setProperty('--color-amber-600', `color-mix(in srgb, ${accent} 85%, black)`)
    root.style.setProperty('--bg-base', isLight ? '#f5f5f5' : '#050505')
    root.style.setProperty('--bg-card', isLight ? 'rgba(255,255,255,0.9)' : 'rgba(23,23,23,0.7)')
    root.style.setProperty('--bg-card-hover', isLight ? 'rgba(255,255,255,1)' : 'rgba(28,28,28,0.8)')
    root.style.setProperty('--bg-input', isLight ? '#ffffff' : '#121212')
    root.style.setProperty('--bg-header', isLight ? 'rgba(245,245,245,0.9)' : 'rgba(10,10,10,0.8)')
    root.style.setProperty('--text-primary', isLight ? '#111111' : '#f5f5f5')
    root.style.setProperty('--text-secondary', isLight ? '#555555' : '#9ca3af')
    root.style.setProperty('--text-muted', isLight ? '#888888' : '#6b7280')
    root.style.setProperty('--border-color', isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.06)')
    document.body.style.backgroundColor = isLight ? '#f5f5f5' : '#050505'
    document.body.style.color = isLight ? '#111111' : '#f5f5f5'
  }, [accent, isLight])

  return (
    <div className={`min-h-screen flex flex-col relative overflow-hidden ${isLight ? 'theme-light' : ''}`}>
      <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] blur-[150px] rounded-full pointer-events-none" style={{ background: `${accent}${isLight ? '12' : '08'}` }}></div>
      <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] blur-[150px] rounded-full pointer-events-none" style={{ background: `${accent}${isLight ? '12' : '08'}` }}></div>

      <Routes>
        {/* Rota Limpa para Modo Cozinha - Sem Header, Sem Sidebar */}
        <Route path="/admin/kitchen" element={<OrderQueue kitchenOnly={true} />} />

        <Route path="/" element={
          <>
            <Header />
            <main className="max-w-5xl mx-auto px-6 py-12 relative z-10 w-full">
              <Menu />
              <Cart />
            </main>
          </>
        } />

        <Route path="/checkout" element={
          <>
            <Header />
            <Checkout />
          </>
        } />
        
        <Route path="/orders" element={
          <>
            <Header />
            <Orders />
          </>
        } />

        <Route path="/admin/*" element={
          <>
            <Header />
            <div className="flex-1 flex flex-col md:flex-row gap-8 max-w-[1600px] w-full mx-auto px-6 py-8 relative z-10">
              <aside className="shrink-0">
                <Tabs />
              </aside>
              <main className="flex-1 min-w-0">
                <Routes>
                  <Route index element={<Navigate to="orders" replace />} />
                  <Route path="menu" element={<Menu />} />
                  <Route path="categories" element={<CategoryForm />} />
                  <Route path="products" element={<ProductForm />} />
                  <Route path="addons" element={<AddonsForm />} />
                  <Route path="orders" element={<OrderQueue />} />
                  <Route path="delivery" element={<DeliveryForm />} />
                  <Route path="coupons" element={<CouponsForm />} />
                  <Route path="settings" element={<Settings />} />
                </Routes>
              </main>
            </div>
          </>
        } />
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}
