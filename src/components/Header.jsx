import { Flame, ShoppingBag, Clock } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useStore, checkOpenStatus } from '../store/StoreContext'

export default function Header() {
  const { state } = useStore()
  const navigate = useNavigate()
  const location = useLocation()
  const { settings } = state

  const isStoreOpen = checkOpenStatus(settings)

  return (
    <header className="glass-header px-6 py-5 flex items-center justify-between">
      <div className="flex items-center gap-4">
        {settings.logoUrl ? (
          <div className="w-11 h-11 rounded-xl overflow-hidden shadow-lg" style={{ boxShadow: `0 0 20px ${settings.accentColor}30` }}>
            <img src={settings.logoUrl} alt="Logo" className="w-full h-full object-contain" />
          </div>
        ) : (
          <div className="p-2.5 rounded-xl shadow-lg" style={{ background: `linear-gradient(135deg, ${settings.accentColor}, ${settings.accentColor}dd)`, boxShadow: `0 0 20px ${settings.accentColor}30` }}>
            <Flame className="w-6 h-6 text-black fill-black/10" />
          </div>
        )}
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight uppercase italic">
            {settings.storeName?.split(' ')[0]}<span style={{ color: settings.accentColor }}>{settings.storeName?.split(' ').slice(1).join(' ') || ''}</span>
          </h1>
          <div className="flex items-center gap-2">
            <p className="text-[10px] text-gray-500 uppercase font-bold tracking-[0.2em]">{settings.storeDescription || 'Carregando...'}</p>
            <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border ${
              isStoreOpen ? 'bg-green-500/10 border-green-500/20 text-green-500' : 'bg-red-500/10 border-red-500/20 text-red-500'
            }`}>
               <span className={`w-1 h-1 rounded-full ${isStoreOpen ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
               <span className="text-[8px] font-black uppercase tracking-tighter">{isStoreOpen ? 'Aberta' : 'Fechada'}</span>
            </div>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-4">
        {!location.pathname.startsWith('/admin') && (
          <button 
            onClick={() => navigate('/orders')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-white/5 bg-white/[0.03] hover:bg-white/5 transition-all group active:scale-95 ${
              location.pathname === '/orders' ? 'text-amber-500 border-amber-500/20 bg-amber-500/10' : 'text-gray-400'
            }`}
          >
            <ShoppingBag className={`w-4 h-4 transition-transform group-hover:-rotate-12 ${location.pathname === '/orders' ? 'fill-amber-500/10' : ''}`} />
            <span className="text-[10px] font-black uppercase tracking-widest hidden sm:block">Meus Pedidos</span>
          </button>
        )}
        
        <div className="hidden md:flex flex-col items-end border-l border-white/5 pl-4">
          <span className="text-[9px] text-gray-600 font-black uppercase tracking-tighter">Terminal v2.0.4</span>
          <span className="text-[10px] text-green-500 flex items-center gap-1 font-bold animate-pulse">
            <span className="w-1 h-1 bg-green-500 rounded-full"></span> SERVER ONLINE
          </span>
        </div>
      </div>
    </header>
  )
}
