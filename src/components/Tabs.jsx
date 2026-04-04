import { useState } from 'react'
import { Tag, ShoppingBag, Settings as SettingsIcon, Bike, Power, AlertTriangle, Layers, ClipboardList, Ticket, UtensilsCrossed } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useStore, checkOpenStatus } from '../store/StoreContext'
import { useOrders } from '../store/OrdersContext'

const tabs = [
  { id: 'orders', label: 'Pedidos', icon: ClipboardList, path: '/admin/orders' },
  { id: 'categories', label: 'Categorias', icon: Tag, path: '/admin/categories' },
  { id: 'products', label: 'Produtos', icon: ShoppingBag, path: '/admin/products' },
  { id: 'addons', label: 'Adicionais', icon: Layers, path: '/admin/addons' },
  { id: 'delivery', label: 'Entrega', icon: Bike, path: '/admin/delivery' },
  { id: 'coupons', label: 'Cupons', icon: Ticket, path: '/admin/coupons' },
  { id: 'settings', label: 'Configurações', icon: SettingsIcon, path: '/admin/settings' },
]

export default function Tabs() {
  const navigate = useNavigate()
  const location = useLocation()
  const { state, dispatch } = useStore()
  const { settings } = state
  const [showWarning, setShowWarning] = useState(false)

  const { activeOrders } = useOrders()
  const newOrdersCount = activeOrders.filter(o => o.status === 'RECEBIDO').length

  const isOpen = settings.isOpen
  const shouldBeOpen = checkOpenStatus(settings)

  const handleToggleStore = () => {
    if (!isOpen && !shouldBeOpen) {
      setShowWarning(true)
      return
    }
    dispatch({ type: 'UPDATE_SETTINGS', payload: { isOpen: !isOpen } })
  }

  const confirmForceOpen = () => {
    dispatch({ type: 'UPDATE_SETTINGS', payload: { isOpen: true } })
    setShowWarning(false)
  }

  return (
    <>
      {/* Sidebar Desktop */}
      <nav className="hidden md:flex glass-card p-3 flex-col gap-3 w-64 h-fit min-h-[600px] shadow-2xl relative sticky top-8">
        <p className="text-[10px] font-black text-gray-600 uppercase tracking-[0.3em] ml-4 mb-2 mt-4">Gestão Operacional</p>
        
        {/* Botão Abrir/Fechar Loja */}
        <button
          onClick={handleToggleStore}
          className={`flex items-center gap-4 px-6 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all duration-300 cursor-pointer group border ${
            isOpen 
              ? 'bg-green-500/10 border-green-500/20 text-green-500 hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-500' 
              : 'bg-red-500/10 border-red-500/20 text-red-500 hover:bg-green-500/10 hover:border-green-500/20 hover:text-green-500'
          }`}
        >
          <Power className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />
          <span className="flex-1 text-left">{isOpen ? 'Aberta' : 'Fechada'}</span>
          <span className={`w-2 h-2 rounded-full ${isOpen ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
        </button>

        <div className="h-px bg-white/5 mx-4 my-1"></div>

        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = location.pathname === tab.path
          const ordersBadge = tab.id === 'orders' && activeOrders.length > 0
          return (
            <button
              key={tab.id}
              onClick={() => navigate(tab.path)}
              className={`flex items-center gap-4 px-6 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all duration-300 cursor-pointer group relative ${
                isActive 
                  ? 'bg-amber-500 text-black shadow-[0_10px_30px_rgba(245,158,11,0.15)] translate-x-2' 
                  : 'text-gray-500 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon className={`w-5 h-5 transition-transform duration-300 group-hover:scale-110 ${isActive ? 'fill-black/20' : ''}`} />
              <span className="flex-1 text-left">{tab.label}</span>
              {ordersBadge && (
                <span className={`min-w-[22px] h-[22px] flex items-center justify-center rounded-full text-[10px] font-black ${
                  isActive
                    ? 'bg-black/20 text-black'
                    : newOrdersCount > 0
                      ? 'bg-green-500 text-black animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]'
                      : 'bg-amber-500/20 text-amber-500'
                }`}>
                  {activeOrders.length}
                </span>
              )}
            </button>
          )
        })}

        <div className="mt-auto p-4 space-y-2">
           <button
             onClick={() => navigate('/')}
             className="w-full flex items-center justify-center gap-3 py-3 rounded-xl border border-amber-500/20 bg-amber-500/10 text-[10px] font-black uppercase tracking-widest text-amber-500 hover:bg-amber-500/20 transition-all cursor-pointer"
           >
             <UtensilsCrossed className="w-4 h-4" />
             Ver Cardapio
           </button>
        </div>
      </nav>

      {/* Bottom Nav Mobile */}
      <nav className="md:hidden fixed bottom-6 left-6 right-6 z-[100] glass-card p-2 flex justify-between shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/10">
        {/* Botão Abrir/Fechar no Mobile */}
        <button
          onClick={handleToggleStore}
          className={`flex flex-col items-center gap-1 flex-1 py-3 rounded-xl transition-all ${
            isOpen ? 'text-green-500' : 'text-red-500'
          }`}
        >
          <Power className="w-5 h-5" />
          <span className="text-[8px] font-black uppercase tracking-widest">{isOpen ? 'Aber' : 'Fech'}</span>
          <span className={`w-1 h-1 rounded-full ${isOpen ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
        </button>

        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = location.pathname === tab.path
          const ordersBadge = tab.id === 'orders' && activeOrders.length > 0
          return (
            <button
              key={tab.id}
              onClick={() => navigate(tab.path)}
              className={`flex flex-col items-center gap-1 flex-1 py-3 rounded-xl transition-all relative ${
                isActive ? 'text-amber-500' : 'text-gray-500'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'fill-amber-500/10' : ''}`} />
              <span className="text-[8px] font-black uppercase tracking-widest">{tab.label.substring(0, 4)}</span>
              {isActive && (
                <div className="w-1 h-1 bg-amber-500 rounded-full mt-0.5 animate-pulse"></div>
              )}
              {ordersBadge && (
                <span className={`absolute -top-0.5 right-1/4 min-w-[16px] h-[16px] flex items-center justify-center rounded-full text-[8px] font-black ${
                  newOrdersCount > 0
                    ? 'bg-green-500 text-black animate-pulse'
                    : 'bg-amber-500/80 text-black'
                }`}>
                  {activeOrders.length}
                </span>
              )}
            </button>
          )
        })}
      </nav>

      {/* Modal de Aviso de Horário */}
      {showWarning && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
           <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowWarning(false)}></div>
           <div className="glass-card max-w-md w-full p-8 border-red-500/20 relative z-10 space-y-6 text-center animate-slide-up">
              <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto text-red-500">
                 <AlertTriangle className="w-10 h-10" />
              </div>
              <div className="space-y-2">
                 <h3 className="text-2xl font-black text-white italic uppercase tracking-tight">Atenção!</h3>
                 <p className="text-sm text-gray-400 font-medium leading-relaxed">
                   Você está tentando abrir a loja <span className="text-red-500 font-black">FORA DO HORÁRIO</span> da sua escala semanal configurada.
                 </p>
              </div>
              <div className="pt-4 flex flex-col sm:flex-row gap-4">
                 <button 
                  onClick={() => setShowWarning(false)}
                  className="flex-1 px-6 py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all"
                 >
                   Cancelar
                 </button>
                 <button 
                  onClick={confirmForceOpen}
                  className="flex-1 px-6 py-4 bg-red-500 hover:bg-red-400 text-black rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl shadow-red-500/20"
                 >
                   Abrir Mesmo Assim
                 </button>
              </div>
           </div>
        </div>
      )}
    </>
  )
}
