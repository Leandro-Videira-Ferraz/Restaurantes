import { useUser } from '../store/UserContext'
import { useNavigate } from 'react-router-dom'
import { 
  ChevronLeft, 
  Package, 
  Clock, 
  MapPin, 
  CheckCircle2, 
  Timer,
  ShoppingBag,
  ArrowRight
} from 'lucide-react'

export default function Orders() {
  const { user } = useUser()
  const navigate = useNavigate()

  const getStatusColor = (status) => {
    switch (status) {
      case 'RECEBIDO': return 'text-amber-500 bg-amber-500/10'
      case 'PREPARANDO': return 'text-blue-500 bg-blue-500/10'
      case 'EM ROTA': return 'text-purple-500 bg-purple-500/10'
      case 'ENTREGUE': return 'text-green-500 bg-green-500/10'
      default: return 'text-gray-500 bg-white/5'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'RECEBIDO': return <Clock className="w-4 h-4" />
      case 'PREPARANDO': return <Timer className="w-4 h-4 animate-pulse" />
      case 'EM ROTA': return <Package className="w-4 h-4" />
      case 'ENTREGUE': return <CheckCircle2 className="w-4 h-4" />
      default: return <Clock className="w-4 h-4" />
    }
  }

  return (
    <div className="min-h-screen pb-20 animate-fade-in">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-[#050505]/80 backdrop-blur-xl border-b border-white/5 px-6 py-6">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <button onClick={() => navigate('/')} className="p-2 hover:bg-white/5 rounded-xl text-gray-400 transition-all">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h2 className="text-sm font-black text-white uppercase tracking-[0.3em] italic">Meus <span className="text-amber-500">Pedidos</span></h2>
          <div className="w-10"></div>
        </div>
      </div>

      <main className="max-w-xl mx-auto px-6 py-12 space-y-12">
        {user.orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
             <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center text-gray-700">
                <ShoppingBag className="w-10 h-10" />
             </div>
             <p className="text-sm font-black text-gray-500 uppercase tracking-widest leading-relaxed">Você ainda não fez nenhum pedido conosco.</p>
             <button 
                onClick={() => navigate('/')}
                className="bg-amber-500 text-black px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px]"
             >
                Pedir agora
             </button>
          </div>
        ) : (
          <div className="space-y-6">
            {user.orders.map((order) => (
              <div key={order.id} className="glass-card overflow-hidden border-white/5 group">
                {/* Order Header */}
                <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
                   <div className="space-y-1">
                      <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">{order.id}</span>
                      <h3 className="text-xs font-bold text-gray-400">
                        {new Date(order.date).toLocaleDateString('pt-BR')} às {new Date(order.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </h3>
                   </div>
                   <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black tracking-widest uppercase ${getStatusColor(order.status)}`}>
                      {getStatusIcon(order.status)}
                      {order.status}
                   </div>
                </div>

                {/* Order Items */}
                <div className="p-6 space-y-4">
                   <div className="space-y-2">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center text-xs font-medium">
                           <span className="text-gray-300">
                             <b className="text-amber-500">{item.quantity}x</b> {item.name}
                           </span>
                           <span className="text-gray-500 font-bold">R$ {(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                   </div>

                   <div className="h-px bg-white/5 w-full"></div>

                   <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2 text-gray-600">
                         <MapPin className="w-3 h-3" />
                         <span className="text-[10px] font-bold uppercase tracking-widest">{order.deliveryMethod === 'delivery' ? order.address.neighborhood : 'Retirada'}</span>
                      </div>
                      <div className="text-sm font-black text-white italic">
                         <span className="text-[10px] text-amber-500 mr-1 not-italic font-bold tracking-tight">TOTAL</span>
                         R$ {order.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </div>
                   </div>
                </div>
                
                {/* Reorder Button Placeholder */}
                <div className="p-4 bg-white/[0.02] border-t border-white/5 opacity-0 group-hover:opacity-100 transition-all flex justify-end">
                   <button className="flex items-center gap-2 text-[9px] font-black text-amber-500 uppercase tracking-widest hover:text-white">
                      Repetir Pedido <ArrowRight className="w-3 h-3" />
                   </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
