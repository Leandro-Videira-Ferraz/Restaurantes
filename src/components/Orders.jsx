import { useState } from 'react'
import { useUser } from '../store/UserContext'
import { useOrders, STATUS_FLOW, STATUS_FLOW_PICKUP } from '../store/OrdersContext'
import { useStore } from '../store/StoreContext'
import { useNavigate } from 'react-router-dom'
import {
  ChevronLeft,
  Clock,
  MapPin,
  CheckCircle2,
  ShoppingBag,
  ChefHat,
  PackageCheck,
  Bike,
  XCircle,
  Store,
  Bell,
  CreditCard,
  MessageCircle,
  AlertTriangle
} from 'lucide-react'

const STATUS_CONFIG = {
  RECEBIDO:   { label: 'Recebido',   icon: Bell,         bg: 'bg-amber-500/10',  border: 'border-amber-500/30', text: 'text-amber-500',  description: 'Seu pedido foi recebido pelo restaurante' },
  PREPARANDO: { label: 'Preparando', icon: ChefHat,      bg: 'bg-blue-500/10',   border: 'border-blue-500/30',  text: 'text-blue-500',   description: 'Sua comida está sendo preparada com carinho' },
  PRONTO:     { label: 'Pronto',     icon: PackageCheck,  bg: 'bg-emerald-500/10',border: 'border-emerald-500/30',text: 'text-emerald-500',description: 'Seu pedido está prontinho!' },
  'EM ROTA':  { label: 'Em Rota',    icon: Bike,         bg: 'bg-purple-500/10', border: 'border-purple-500/30',text: 'text-purple-500', description: 'O entregador está a caminho' },
  ENTREGUE:   { label: 'Entregue',   icon: CheckCircle2, bg: 'bg-green-500/10',  border: 'border-green-500/30', text: 'text-green-500',  description: 'Pedido entregue com sucesso' },
  RETIRADO:   { label: 'Retirado',   icon: Store,        bg: 'bg-green-500/10',  border: 'border-green-500/30', text: 'text-green-500',  description: 'Pedido retirado com sucesso' },
  CANCELADO:  { label: 'Cancelado',  icon: XCircle,      bg: 'bg-red-500/10',    border: 'border-red-500/30',   text: 'text-red-500',    description: 'Pedido cancelado' },
}

const PAYMENT_LABELS = { pix: 'PIX', card: 'Cartão', cash: 'Dinheiro' }

export default function Orders() {
  const { user, dispatch: userDispatch } = useUser()
  const { orders: adminOrders, dispatch: ordersDispatch } = useOrders()
  const { state } = useStore()
  const navigate = useNavigate()
  const [cancellingId, setCancellingId] = useState(null)

  // Mesclar pedidos: usa a lista do UserContext mas pega o status atualizado do OrdersContext
  const mergedOrders = user.orders.map(userOrder => {
    const adminOrder = adminOrders.find(o => o.id === userOrder.id)
    return adminOrder 
      ? { ...userOrder, status: adminOrder.status } 
      : userOrder
  })

  const activeOrders = mergedOrders.filter(o => !['ENTREGUE', 'RETIRADO', 'CANCELADO'].includes(o.status))
  const pastOrders = mergedOrders.filter(o => ['ENTREGUE', 'RETIRADO', 'CANCELADO'].includes(o.status))

  const confirmCancel = (orderId) => {
    userDispatch({ type: 'CANCEL_ORDER', payload: orderId })
    ordersDispatch({ type: 'CANCEL_ORDER', payload: orderId })
    setCancellingId(null)
  }

  return (
    <div className="min-h-screen pb-20 animate-fade-in">
      {/* Header */}
      <div className="sticky top-0 z-50 backdrop-blur-xl px-6 py-6" style={{ background: 'var(--bg-header)', borderBottom: '1px solid var(--border-color)' }}>
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <button onClick={() => navigate('/')} className="p-2 hover:bg-white/5 rounded-xl text-gray-400 transition-all">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h2 className="text-sm font-black uppercase tracking-[0.3em] italic" style={{ color: 'var(--text-primary)' }}>Meus <span className="text-amber-500">Pedidos</span></h2>
          <div className="w-10"></div>
        </div>
      </div>

      <main className="max-w-xl mx-auto px-6 py-8 space-y-10">
        {mergedOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
             <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center text-gray-700">
                <ShoppingBag className="w-10 h-10" />
             </div>
             <p className="text-sm font-black text-gray-500 uppercase tracking-widest leading-relaxed">Você ainda não fez nenhum pedido conosco.</p>
             <button 
                onClick={() => navigate('/')}
                className="bg-amber-500 text-black px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] cursor-pointer"
             >
                Pedir agora
             </button>
          </div>
        ) : (
          <>
            {/* Pedidos Ativos */}
            {activeOrders.length > 0 && (
              <div className="space-y-5">
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-500">
                  Pedidos em Andamento ({activeOrders.length})
                </h3>
                {activeOrders.map(order => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    isActive={true}
                    settings={state.settings}
                    onRequestCancel={() => setCancellingId(order.id)}
                  />
                ))}
              </div>
            )}

            {/* Pedidos Anteriores */}
            {pastOrders.length > 0 && (
              <div className="space-y-5">
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-600">
                  Histórico ({pastOrders.length})
                </h3>
                {pastOrders.map(order => (
                  <OrderCard key={order.id} order={order} isActive={false} settings={state.settings} />
                ))}
              </div>
            )}

            {/* Modal de Confirmação de Cancelamento */}
            {cancellingId && (
              <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
                <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setCancellingId(null)} />
                <div className="glass-card max-w-sm w-full p-8 border-red-500/20 relative z-10 space-y-6 text-center animate-slide-up">
                  <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto text-red-500">
                    <AlertTriangle className="w-8 h-8" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-black text-white italic uppercase">Cancelar Pedido?</h3>
                    <p className="text-sm text-gray-400 font-medium leading-relaxed">
                      Essa ação não pode ser desfeita. Confirme apenas se desejar cancelar o pedido.
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setCancellingId(null)}
                      className="flex-1 px-4 py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer"
                    >
                      Voltar
                    </button>
                    <button
                      onClick={() => confirmCancel(cancellingId)}
                      className="flex-1 px-4 py-4 bg-red-500 hover:bg-red-400 text-black rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer"
                    >
                      Cancelar Pedido
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}

function OrderCard({ order, isActive, settings, onRequestCancel }) {
  const config = STATUS_CONFIG[order.status] || STATUS_CONFIG.RECEBIDO
  const Icon = config.icon
  const flow = order.deliveryMethod === 'pickup' ? STATUS_FLOW_PICKUP : STATUS_FLOW
  const currentIdx = flow.indexOf(order.status)
  const isCancelled = order.status === 'CANCELADO'

  const canCancel = order.status === 'RECEBIDO'
  const estimatedTime = order.deliveryMethod === 'delivery'
    ? (settings?.estimatedDeliveryTime || 40)
    : (settings?.estimatedPickupTime || 20)

  return (
    <div className={`glass-card overflow-hidden transition-all ${isActive ? `border ${config.border} animate-pulse-subtle` : 'border-white/5 opacity-80'}`}>
      {/* Status Banner — apenas pedidos ativos */}
      {isActive && (
        <div className={`px-6 py-4 ${config.bg} flex items-center gap-4`}>
          <div className={`w-10 h-10 rounded-xl ${config.bg} border ${config.border} flex items-center justify-center`}>
            <Icon className={`w-5 h-5 ${config.text}`} />
          </div>
          <div className="flex-1">
            <p className={`text-sm font-black uppercase tracking-widest ${config.text}`}>{config.label}</p>
            <p className="text-[11px] text-gray-400 font-medium mt-0.5">{config.description}</p>
          </div>
        </div>
      )}

      {/* Tempo estimado — apenas pedidos em andamento (não pronto/rota/entregue) */}
      {isActive && !isCancelled && ['RECEBIDO', 'PREPARANDO'].includes(order.status) && (
        <div className="px-6 py-3 bg-amber-500/5 border-b border-white/5 flex items-center gap-3">
          <Clock className="w-4 h-4 text-amber-500 shrink-0" />
          <p className="text-[11px] font-bold text-gray-400">
            Previsão:{' '}
            <span className="text-amber-500 font-black">
              ~{estimatedTime} min {order.deliveryMethod === 'delivery' ? 'para entrega' : 'para retirada'}
            </span>
          </p>
        </div>
      )}

      {/* Progress Bar — apenas pedidos ativos e não cancelados */}
      {isActive && !isCancelled && (
        <div className="px-6 py-4 border-b border-white/5">
          <div className="flex items-center justify-between">
            {flow.map((s, idx) => {
              const sConfig = STATUS_CONFIG[s]
              const SIcon = sConfig.icon
              const isDone = idx <= currentIdx
              const isCurrent = idx === currentIdx

              return (
                <div key={s} className="flex items-center flex-1">
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                      isDone 
                        ? `${sConfig.bg} border ${sConfig.border}` 
                        : 'bg-white/5 border border-white/10'
                    } ${isCurrent ? 'scale-110 shadow-lg' : ''}`}>
                      <SIcon className={`w-4 h-4 ${isDone ? sConfig.text : 'text-gray-700'} ${isCurrent ? 'animate-pulse' : ''}`} />
                    </div>
                    <span className={`text-[7px] mt-1.5 font-black uppercase tracking-widest ${isDone ? sConfig.text : 'text-gray-700'}`}>
                      {sConfig.label}
                    </span>
                  </div>
                  {idx < flow.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-1.5 rounded-full transition-all ${isDone ? 'bg-amber-500/40' : 'bg-white/5'}`} />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Order Header */}
      <div className="p-5 border-b border-white/5 flex items-center justify-between">
         <div className="space-y-1">
            <div className="flex items-center gap-3">
              <span className="text-sm font-black text-amber-500 italic">{order.id}</span>
              {!isActive && (
                <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-lg ${config.bg} ${config.text}`}>
                  {config.label}
                </span>
              )}
              <span className="text-[8px] font-bold text-gray-600 uppercase tracking-widest px-2 py-1 rounded-lg bg-white/5">
                {order.deliveryMethod === 'delivery' ? '🛵 Delivery' : '🏪 Retirada'}
              </span>
            </div>
            <p className="text-[10px] font-bold text-gray-500">
              {new Date(order.date).toLocaleDateString('pt-BR')} às {new Date(order.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </p>
         </div>
      </div>

      {/* Order Items */}
      <div className="p-5 space-y-3">
         <div className="space-y-2">
            {order.items.map((item, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between items-center text-xs font-medium">
                   <span style={{ color: 'var(--text-primary)' }}>
                     <b className="text-amber-500">{item.quantity}x</b> {item.name}
                   </span>
                   <span className="text-gray-500 font-bold">
                     R$ {((item.finalPrice || item.price) * item.quantity).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                   </span>
                </div>

                {/* Personalizações */}
                {item.customizations?.removedIngredients?.length > 0 && (
                  <div className="flex flex-wrap gap-1 ml-6">
                    {item.customizations.removedIngredients.map((ing, i) => (
                      <span key={i} className="text-[9px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-500/80 font-bold line-through">
                        {ing}
                      </span>
                    ))}
                  </div>
                )}
                {item.customizations?.addons?.length > 0 && (
                  <div className="flex flex-wrap gap-1 ml-6">
                    {item.customizations.addons.map((addon, i) => (
                      <span key={i} className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500 font-bold">
                        +{addon.quantity}x {addon.name}
                      </span>
                    ))}
                  </div>
                )}
                {item.customizations?.observation && (
                  <p className="text-[9px] text-gray-500 italic ml-6 flex items-center gap-1">
                    <MessageCircle className="w-3 h-3 shrink-0" />
                    {item.customizations.observation}
                  </p>
                )}
              </div>
            ))}
         </div>

         <div className="h-px bg-white/5 w-full"></div>

         {/* Footer: Entrega + Total */}
         <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 text-gray-600">
               {order.deliveryMethod === 'delivery' ? (
                 <>
                   <MapPin className="w-3 h-3" />
                   <span className="text-[10px] font-bold uppercase tracking-widest">{order.address?.neighborhood || 'Endereço'}</span>
                 </>
               ) : (
                 <>
                   <Store className="w-3 h-3" />
                   <span className="text-[10px] font-bold uppercase tracking-widest">Retirada no local</span>
                 </>
               )}
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-gray-600">
                <CreditCard className="w-3 h-3" />
                <span className="text-[9px] font-bold uppercase tracking-widest">{PAYMENT_LABELS[order.paymentMethod] || order.paymentMethod}</span>
              </div>
              <div className="text-sm font-black italic" style={{ color: 'var(--text-primary)' }}>
                 <span className="text-[10px] text-amber-500 mr-1 not-italic font-bold tracking-tight">TOTAL</span>
                 R$ {order.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
            </div>
         </div>

         {/* Cancelar — só visível quando status é RECEBIDO */}
         {isActive && canCancel && onRequestCancel && (
           <div className="pt-3 border-t border-white/5">
             <button
               onClick={onRequestCancel}
               className="w-full py-3 rounded-xl border border-red-500/20 text-red-500/80 hover:bg-red-500/10 hover:text-red-500 text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer"
             >
               Cancelar Pedido
             </button>
           </div>
         )}
      </div>
    </div>
  )
}
