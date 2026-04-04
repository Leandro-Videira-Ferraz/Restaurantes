import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/StoreContext'
import { useOrders, STATUS_FLOW, STATUS_FLOW_PICKUP } from '../store/OrdersContext'
import {
  Clock,
  ChefHat,
  PackageCheck,
  Bike,
  CheckCircle2,
  XCircle,
  MapPin,
  User,
  ShoppingBag,
  ArrowRight,
  Store,
  Bell,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  AlertTriangle,
  Printer,
  Settings,
  ToggleLeft,
  ToggleRight,
  RotateCcw,
  LogOut
} from 'lucide-react'

// ─── Status Config ──────────────────────────────────────────
const STATUS_CONFIG = {
  RECEBIDO:   { label: 'Recebido',   icon: Bell,         bg: 'bg-orange-500/30', border: 'border-orange-500/60', text: 'text-orange-400', glow: 'shadow-[0_0_40px_rgba(249,115,22,0.4)]' },
  PREPARANDO: { label: 'Preparando', icon: ChefHat,      bg: 'bg-sky-500/30',    border: 'border-sky-500/60',    text: 'text-sky-400',    glow: 'shadow-[0_0_40px_rgba(14,165,233,0.4)]' },
  PRONTO:     { label: 'Pronto',     icon: PackageCheck,  bg: 'bg-emerald-500/30',border: 'border-emerald-500/60',text: 'text-emerald-400',glow: 'shadow-[0_0_40px_rgba(16,185,129,0.4)]' },
  'EM ROTA':  { label: 'Em Rota',    icon: Bike,         bg: 'bg-fuchsia-500/30',border: 'border-fuchsia-500/60',text: 'text-fuchsia-400',glow: 'shadow-[0_0_40px_rgba(217,70,239,0.4)]' },
  ENTREGUE:   { label: 'Entregue',   icon: CheckCircle2, bg: 'bg-emerald-500/15',border: 'border-emerald-500/30',text: 'text-emerald-400',glow: '' },
  RETIRADO:   { label: 'Retirado',   icon: Store,        bg: 'bg-emerald-500/15',border: 'border-emerald-500/30',text: 'text-emerald-400',glow: '' },
  CANCELADO:  { label: 'Cancelado',  icon: XCircle,      bg: 'bg-red-500/25',    border: 'border-red-600',      text: 'text-red-400',    glow: 'shadow-[0_0_50px_rgba(239,68,68,0.5)]' },
}

const PAYMENT_LABELS = { pix: 'PIX', card: 'Cartão', cash: 'Dinheiro' }
const TIME_WARNINGS = { RECEBIDO: 3, PREPARANDO: 20, PRONTO: 5, 'EM ROTA': 40 }

function playNotificationSound() {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext
    const ctx = new AudioContextClass()
    
    // Resume o contexto caso o navegador o tenha suspendido por falta de interação
    if (ctx.state === 'suspended') ctx.resume()

    const osc1 = ctx.createOscillator(); const gain1 = ctx.createGain()
    osc1.connect(gain1); gain1.connect(ctx.destination)
    osc1.frequency.setValueAtTime(783.99, ctx.currentTime)
    gain1.gain.setValueAtTime(0, ctx.currentTime); gain1.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.05); gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8)
    osc1.start(ctx.currentTime); osc1.stop(ctx.currentTime + 0.8)

    const osc2 = ctx.createOscillator(); const gain2 = ctx.createGain()
    osc2.connect(gain2); gain2.connect(ctx.destination)
    osc2.frequency.setValueAtTime(659.25, ctx.currentTime + 0.15)
    gain2.gain.setValueAtTime(0, ctx.currentTime + 0.15); gain2.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.2); gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.0)
    osc2.start(ctx.currentTime + 0.15); osc2.stop(ctx.currentTime + 1.0)
    
    setTimeout(() => ctx.close(), 1200)
  } catch (e) {
    console.error('Erro ao tocar som:', e)
  }
}

export default function OrderQueue({ kitchenOnly = false }) {
  const navigate = useNavigate()
  const { state } = useStore()
  const { orders, activeOrders, completedOrders, dispatch } = useOrders()
  const [filter, setFilter] = useState('active')
  const [expandedOrder, setExpandedOrder] = useState(null)
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const saved = localStorage.getItem('burger-sound-enabled')
    return saved === null ? true : saved === 'true'
  })
  const [autoAccept, setAutoAccept] = useState(() => localStorage.getItem('burger-auto-accept') === 'true')
  const [autoPrint, setAutoPrint] = useState(() => localStorage.getItem('burger-auto-print') === 'true')
  const [printingOrder, setPrintingOrder] = useState(null)
  const [cancellingOrderId, setCancellingOrderId] = useState(null)
  const [tick, setTick] = useState(0)
  const [audioBlocked, setAudioBlocked] = useState(false)
  const processedIdsRef = useRef(new Set())
  const isFirstMountRef = useRef(true)
  const autoAcceptedRef = useRef(new Set())

  const isLight = state.settings.themeMode === 'light'

  useEffect(() => { localStorage.setItem('burger-sound-enabled', soundEnabled) }, [soundEnabled])
  useEffect(() => { localStorage.setItem('burger-auto-accept', autoAccept) }, [autoAccept])
  useEffect(() => { localStorage.setItem('burger-auto-print', autoPrint) }, [autoPrint])

  // Tenta detectar se o áudio está bloqueado pelo navegador
  useEffect(() => {
    const checkAudio = async () => {
      try {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext
        const ctx = new AudioContextClass()
        if (ctx.state === 'suspended') {
          setAudioBlocked(true)
        }
        await ctx.close()
      } catch (e) {
        setAudioBlocked(true)
      }
    }
    checkAudio()
  }, [])

  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 20000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (activeOrders.length === 0) {
      isFirstMountRef.current = false
      return
    }

    const currentIds = activeOrders.map(o => o.id)

    // Na primeira carga, apenas registramos os IDs existentes como "já processados"
    if (isFirstMountRef.current) {
      processedIdsRef.current = new Set(currentIds)
      isFirstMountRef.current = false
      return
    }

    // Verifica se há algum ID novo que não estava no Set
    const hasNewOrder = currentIds.some(id => !processedIdsRef.current.has(id))

    if (hasNewOrder) {
      if (soundEnabled) {
        playNotificationSound()
        // Se tocou o som, assumimos que o áudio não está mais bloqueado (ou pelo menos tentamos)
        setAudioBlocked(false)
      }
      // Atualiza o set com todos os IDs atuais
      processedIdsRef.current = new Set(currentIds)
    }
  }, [activeOrders, soundEnabled])

  function triggerPrint(order) {
    if (!order) return
    setPrintingOrder(order)
    // Aumentado delay para 800ms para garantir renderização do cupom no DOM
    setTimeout(() => { window.print(); setPrintingOrder(null) }, 800)
  }

  function handleAdvance(orderId) {
    const order = orders.find(o => o.id === orderId)
    dispatch({ type: 'ADVANCE_STATUS', payload: orderId })
    if (order && order.status === 'RECEBIDO' && autoPrint) triggerPrint(order)
  }

  function handleRevert(orderId) {
    dispatch({ type: 'REVERT_STATUS', payload: orderId })
  }

  function handleCancel(orderId) {
    dispatch({ type: 'CANCEL_ORDER', payload: orderId })
    setCancellingOrderId(null)
  }

  useEffect(() => {
    if (!autoAccept) return
    activeOrders.filter(o => o.status === 'RECEBIDO').forEach(order => {
      if (!autoAcceptedRef.current.has(order.id)) {
        autoAcceptedRef.current.add(order.id)
        dispatch({ type: 'ADVANCE_STATUS', payload: order.id })
        if (autoPrint) setTimeout(() => triggerPrint(order), 500)
      }
    })
  }, [activeOrders, autoAccept, autoPrint, dispatch])

  function getTimeSince(dateStr) {
    const diff = Date.now() - new Date(dateStr).getTime()
    const minutes = Math.floor(diff / 60000)
    return minutes < 1 ? 'Agora' : `${minutes}m`
  }

  function getNextStatus(order) {
    const flow = order.deliveryMethod === 'pickup' ? STATUS_FLOW_PICKUP : STATUS_FLOW
    const idx = flow.indexOf(order.status)
    return idx < flow.length - 1 ? flow[idx + 1] : null
  }

  function getPrevStatus(order) {
    const flow = order.deliveryMethod === 'pickup' ? STATUS_FLOW_PICKUP : STATUS_FLOW
    const idx = flow.indexOf(order.status)
    return idx > 0 ? flow[idx - 1] : null
  }

  const statusCounts = {}
  orders.forEach(o => { statusCounts[o.status] = (statusCounts[o.status] || 0) + 1 })

  const displayOrders = filter === 'active' ? activeOrders : filter === 'completed' ? completedOrders : orders

  // Modal de confirmação de cancelamento
  const cancelModal = cancellingOrderId && (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setCancellingOrderId(null)} />
      <div className="glass-card max-w-sm w-full p-8 border-red-500/30 relative z-10 space-y-6 text-center animate-slide-up">
        <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto">
          <AlertTriangle className="w-10 h-10 text-red-500" />
        </div>
        <div className="space-y-2">
          <h3 className="text-2xl font-black text-white italic uppercase tracking-tight">Cancelar Pedido?</h3>
          <p className="text-sm text-gray-400 font-medium leading-relaxed">
            O pedido <span className="text-red-500 font-black">{cancellingOrderId}</span> será marcado como cancelado e a produção deve ser interrompida.
          </p>
        </div>
        <div className="pt-4 flex gap-4">
          <button
            onClick={() => setCancellingOrderId(null)}
            className="flex-1 px-6 py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer"
          >
            Voltar
          </button>
          <button
            onClick={() => handleCancel(cancellingOrderId)}
            className="flex-1 px-6 py-4 bg-red-600 hover:bg-red-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl shadow-red-600/30 cursor-pointer"
          >
            Sim, Cancelar
          </button>
        </div>
      </div>
    </div>
  )

  // RECUBO TÉRMICO DEFINITIVO (Fora de qualquer contexto flex)
  const thermalReceipt = printingOrder && (
    <div id="thermal-receipt" className="thermal-receipt" style={{ position: 'fixed', top: 0, left: 0, width: '80mm', background: 'white', color: 'black', padding: '10px', fontFamily: 'monospace', zIndex: 99999 }}>
      <div style={{ textAlign: 'center', borderBottom: '1px dashed black', paddingBottom: '10px', marginBottom: '10px' }}>
        <h2 style={{ fontSize: '20px', margin: '0' }}>PEDIDO: {printingOrder.id}</h2>
        <p style={{ fontSize: '12px', margin: '5px 0' }}>{new Date(printingOrder.date).toLocaleString('pt-BR')}</p>
      </div>
      <div style={{ fontSize: '13px', lineHeight: '1.4' }}>
        <p><strong>CLIENTE:</strong> {printingOrder.customerName}</p>
        <p><strong>FONE:</strong> {printingOrder.customerPhone || 'N/A'}</p>
        <p><strong>TIPO:</strong> {printingOrder.deliveryMethod === 'delivery' ? 'ENTREGA' : 'RETIRADA'}</p>
        {printingOrder.deliveryMethod === 'delivery' && printingOrder.address && (
          <p><strong>END:</strong> {printingOrder.address.street}, {printingOrder.address.number}<br/>{printingOrder.address.neighborhood}</p>
        )}
      </div>
      <div style={{ borderTop: '1px dashed black', margin: '10px 0' }} />
      <div style={{ fontSize: '13px' }}>
        {(printingOrder.items || []).map((item, idx) => (
          <div key={idx} style={{ marginBottom: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
              <span>{item.quantity}x {item.name}</span>
              <span>R$ {(item.finalPrice * item.quantity).toFixed(2)}</span>
            </div>
            {item.customizations?.removedIngredients?.map((ing, j) => <div key={j} style={{ fontSize: '11px', marginLeft: '10px' }}>- SEM {ing.toUpperCase()}</div>)}
            {item.customizations?.addons?.map((add, k) => <div key={k} style={{ fontSize: '11px', marginLeft: '10px' }}>+ {add.quantity}x {add.name}</div>)}
            {item.customizations?.observation && <div style={{ fontSize: '11px', marginLeft: '10px', fontStyle: 'italic', backgroundColor: '#eee', padding: '2px' }}>OBS: {item.customizations.observation}</div>}
          </div>
        ))}
      </div>
      <div style={{ borderTop: '1px dashed black', paddingTop: '8px', marginTop: '10px' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}><span>Subtotal:</span><span>R$ {(printingOrder.subtotal || printingOrder.total || 0).toFixed(2)}</span></div>
      {printingOrder.deliveryFee > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}><span>Taxa Entrega:</span><span>R$ {printingOrder.deliveryFee.toFixed(2)}</span></div>}
      {printingOrder.discount > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#16a34a' }}><span>Desconto{printingOrder.couponCode ? ` (${printingOrder.couponCode})` : ''}:</span><span>- R$ {printingOrder.discount.toFixed(2)}</span></div>}
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: 'bold', marginTop: '8px', borderTop: '2px solid black', paddingTop: '5px' }}><span>TOTAL:</span><span>R$ {printingOrder.total.toFixed(2)}</span></div>
      <div style={{ borderTop: '1px dashed black', marginTop: '15px', paddingTop: '10px', textAlign: 'center', fontSize: '12px' }}>
        <p>FORMA DE PAGAMENTO: {(PAYMENT_LABELS[printingOrder.paymentMethod] || printingOrder.paymentMethod || '').toUpperCase()}</p>
        {printingOrder.change && <p style={{ fontWeight: 'bold' }}>TROCO PARA: {printingOrder.change}</p>}
        <p style={{ marginTop: '15px', fontWeight: 'bold', fontSize: '14px' }}>CULINARY NOIR - BOM APETITE!</p>
      </div>
    </div>
  )

  if (kitchenOnly) {
    return (
      <>
        {thermalReceipt}
        {cancelModal}
        <div className="min-h-screen flex flex-col no-print transition-colors duration-500" style={{ background: 'var(--bg-base)', color: 'var(--text-primary)' }}>
          {/* Header e Grade da Cozinha */}
          <div className="flex items-center justify-between px-8 py-6 border-b shadow-2xl transition-all duration-500" style={{ backgroundColor: 'var(--bg-header)', borderColor: 'var(--border-color)' }}>
            <div className="flex items-center gap-6">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 flex items-center justify-center border border-amber-500/30">
                <ChefHat className="w-7 h-7 text-amber-500" />
              </div>
              <div>
                <h1 className="text-2xl font-black uppercase tracking-widest italic leading-none" style={{ color: 'var(--text-primary)' }}>Modo <span className="text-amber-500">Cozinha</span></h1>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mt-1">{activeOrders.length} pedido(s) ativo(s)</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {audioBlocked && (
                <button 
                  onClick={() => { playNotificationSound(); setAudioBlocked(false) }}
                  className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-red-500/20 border border-red-500/40 text-red-500 animate-pulse cursor-pointer"
                >
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-[9px] font-black uppercase">Ativar Áudio</span>
                </button>
              )}
              <button onClick={() => setSoundEnabled(!soundEnabled)} className={`flex items-center gap-3 px-5 py-3 rounded-2xl border transition-all cursor-pointer ${soundEnabled ? 'bg-amber-500/10 border-amber-500/40 text-amber-500' : 'bg-white/5 border-white/10 text-gray-600'}`}>
                {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                <span className="text-[10px] font-black uppercase tracking-widest">Som {soundEnabled ? 'Ligado' : 'Mudo'}</span>
              </button>
              <button 
                onClick={() => navigate('/admin/orders')} 
                className="flex items-center gap-3 px-8 py-4 rounded-2xl bg-white text-black font-black uppercase tracking-widest text-xs hover:bg-amber-400 transition-all shadow-[0_0_30px_rgba(255,255,255,0.15)] cursor-pointer relative z-50"
                style={{ pointerEvents: 'all' }}
              >
                <LogOut className="w-5 h-5" /> Voltar ao Painel
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-auto p-8">
            {activeOrders.length === 0 ? (
              <div className="h-[60vh] flex items-center justify-center text-gray-700 uppercase font-black tracking-[0.2em] italic text-2xl opacity-20">Aguardando pedidos...</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-8">
                {activeOrders.map(order => {
                  const config = STATUS_CONFIG[order.status] || STATUS_CONFIG.RECEBIDO
                  const nextStatus = getNextStatus(order); const prevStatus = getPrevStatus(order)
                  return (
                    <div key={order.id} className={`rounded-[2.5rem] border-2 overflow-hidden shadow-2xl transition-all duration-500 ${config.border} ${order.status === 'CANCELADO' ? config.glow : ''}`} style={{ backgroundColor: 'var(--bg-card)' }}>
                      {order.status === 'CANCELADO' && (
                        <div className="flex items-center gap-3 px-6 py-4 bg-red-600">
                          <XCircle className="w-6 h-6 text-white animate-pulse shrink-0" />
                          <div>
                            <p className="text-sm font-black text-white uppercase tracking-widest leading-none">Cancelado</p>
                            <p className="text-[10px] text-red-200 font-bold">Pare a producao</p>
                          </div>
                        </div>
                      )}
                      <div className={`p-6 flex justify-between items-center ${config.bg}`}>
                        <div className="flex items-center gap-4"><config.icon className={`w-8 h-8 ${config.text}`} /><span className="text-3xl font-black italic tracking-tighter" style={{ color: 'var(--text-primary)' }}>{order.id}</span></div>
                        <div className="flex items-center gap-3">
                          {order.status !== 'CANCELADO' && <button onClick={() => setCancellingOrderId(order.id)} className="p-3 rounded-xl bg-red-500/10 text-red-500/60 hover:bg-red-500/20 hover:text-red-400 transition-all border border-red-500/10" title="Cancelar pedido"><XCircle className="w-5 h-5" /></button>}
                          {prevStatus && <button onClick={() => handleRevert(order.id)} className="p-3 rounded-xl bg-black/10 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-all border border-black/5 dark:bg-black/30 dark:text-white/40 dark:hover:text-white dark:border-white/5"><RotateCcw className="w-5 h-5" /></button>}
                          <div className="text-right">
                             <p className="text-[10px] font-black uppercase opacity-40 mb-0.5 tracking-tighter" style={{ color: 'var(--text-primary)' }}>Tempo Fila</p>
                             <p className="text-sm font-black uppercase" style={{ color: 'var(--text-primary)' }}>{getTimeSince(order.updatedAt || order.date)}</p>
                          </div>
                        </div>
                      </div>
                      <div className="p-8 space-y-6">
                        <div className="flex justify-between items-center border-b pb-4" style={{ borderColor: 'var(--border-color)' }}>
                          <p className="text-[11px] font-black uppercase text-gray-500 tracking-widest">{order.customerName}</p>
                          <span className="px-3 py-1 rounded-full text-[9px] font-black uppercase" style={{ background: 'var(--bg-base)', border: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                            {order.deliveryMethod === 'delivery' ? 'Entrega' : 'Balcão'}
                          </span>
                        </div>
                        <div className="space-y-4">
                          {order.items.map((item, i) => (
                            <div key={i} className="text-xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}><span className="text-amber-500 mr-3 text-2xl font-black">{item.quantity}x</span> {item.name}</div>
                          ))}
                        </div>
                      </div>
                      {nextStatus && (
                        <button onClick={() => handleAdvance(order.id)} className={`w-full py-7 font-black text-sm uppercase tracking-[0.2em] ${order.status === 'RECEBIDO' ? 'bg-green-500' : 'bg-amber-500'} text-black hover:opacity-90 active:scale-[0.98] transition-all`}>
                          {order.status === 'RECEBIDO' ? 'ACEITAR PEDIDO' : `→ ${STATUS_CONFIG[nextStatus].label}`}
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      {thermalReceipt}
      {cancelModal}
      <div className="space-y-8 pb-20 no-print animate-fade-in transition-colors duration-500">
        <div className="flex items-center justify-between">
          <div onClick={() => { if(window.confirm('DEBUG: Forçar impressão teste?')) setPrintingOrder(orders[0]) }} className="cursor-help">
            <h2 className="text-3xl font-black italic uppercase tracking-tighter" style={{ color: 'var(--text-primary)' }}>Fila de <span className="text-amber-500">Pedidos</span></h2>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">{activeOrders.length} pedido(s) em andamento</p>
          </div>
          <div className="flex items-center gap-3">
             <div className="flex items-center bg-white/5 p-1 rounded-2xl border border-[var(--border-color)]">
              <button onClick={() => setSoundEnabled(!soundEnabled)} className={`p-3 rounded-xl flex items-center gap-2 transition-all ${soundEnabled ? 'bg-amber-500/20 text-amber-400' : 'text-gray-600'}`}>
                {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                <span className="text-[9px] font-black uppercase">Som</span>{soundEnabled ? <ToggleRight className="w-5 h-5 ml-1" /> : <ToggleLeft className="w-5 h-5 ml-1" />}
              </button>
              <div className="w-px h-4 bg-white/10 mx-1"></div>
              <button onClick={() => setAutoAccept(!autoAccept)} className={`p-3 rounded-xl flex items-center gap-2 transition-all ${autoAccept ? 'bg-green-500/20 text-green-400' : 'text-gray-600'}`}>
                <Settings className="w-4 h-4" /><span className="text-[9px] font-black uppercase">Auto Aceite</span>{autoAccept ? <ToggleRight className="w-5 h-5 ml-1" /> : <ToggleLeft className="w-5 h-5 ml-1" />}
              </button>
              <div className="w-px h-4 bg-white/10 mx-1"></div>
              <button onClick={() => setAutoPrint(!autoPrint)} className={`p-3 rounded-xl flex items-center gap-2 transition-all ${autoPrint ? 'bg-blue-500/20 text-blue-400' : 'text-gray-600'}`}>
                <Printer className="w-4 h-4" /><span className="text-[9px] font-black uppercase">Auto Print</span>{autoPrint ? <ToggleRight className="w-5 h-5 ml-1" /> : <ToggleLeft className="w-5 h-5 ml-1" />}
              </button>
            </div>
            {audioBlocked && (
              <button 
                onClick={() => { playNotificationSound(); setAudioBlocked(false) }}
                className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-red-500/20 border border-red-500/40 text-red-500 animate-pulse cursor-pointer"
              >
                <AlertTriangle className="w-4 h-4" />
                <span className="text-[9px] font-black uppercase tracking-tighter">Desbloquear Áudio</span>
              </button>
            )}
            <button onClick={() => navigate('/admin/kitchen')} className="flex items-center gap-3 px-6 py-4 rounded-2xl bg-amber-500 text-black font-black uppercase tracking-widest text-[10px] hover:bg-amber-400 transition-all shadow-xl">
              <Maximize className="w-4 h-4" /> Modo Cozinha
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {['RECEBIDO', 'PREPARANDO', 'PRONTO', 'EM ROTA'].map(status => {
            const config = STATUS_CONFIG[status]; const count = statusCounts[status] || 0
            return (
              <div key={status} onClick={() => setFilter(status.toLowerCase())} className={`p-6 rounded-[2rem] border-2 transition-all cursor-pointer ${config.bg} ${config.border} ${count > 0 ? config.glow : 'opacity-40'}`}>
                <div className="flex justify-between items-start mb-4">
                  <config.icon className={`w-8 h-8 ${config.text}`} /><span className={`text-4xl font-black italic ${config.text}`}>{count}</span>
                </div>
                <p className={`text-[10px] font-black uppercase tracking-widest ${config.text}`}>{config.label}</p>
              </div>
            )
          })}
        </div>

        <div className="space-y-4">
          {displayOrders.length === 0 ? (
             <div className="py-20 text-center text-gray-600 font-bold uppercase tracking-widest bg-white/[0.02] rounded-[3rem] border border-dashed border-white/10">Silêncio na cozinha...</div>
          ) : (
            displayOrders.map(order => {
              const config = STATUS_CONFIG[order.status] || STATUS_CONFIG.RECEBIDO
              const isExpanded = expandedOrder === order.id; const nextStatus = getNextStatus(order); const prevStatus = getPrevStatus(order)
              return (
                <div key={order.id} className={`rounded-[2rem] border transition-all ${config.bg} ${config.border} ${order.status === 'CANCELADO' ? config.glow : ''}`}>
                  {order.status === 'CANCELADO' && (
                    <div className="flex items-center gap-4 px-6 py-4 bg-red-600 rounded-t-[2rem]">
                      <XCircle className="w-6 h-6 text-white shrink-0 animate-pulse" />
                      <div>
                        <p className="text-sm font-black text-white uppercase tracking-widest leading-none">Pedido Cancelado pelo Cliente</p>
                        <p className="text-[11px] text-red-200 font-bold mt-0.5">Interrompa a produção imediatamente</p>
                      </div>
                    </div>
                  )}
                  <div className="p-6 flex items-center justify-between cursor-pointer" onClick={() => setExpandedOrder(isExpanded ? null : order.id)}>
                    <div className="flex items-center gap-5">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border ${config.border} bg-black/10`}><config.icon className={`w-7 h-7 ${config.text}`} /></div>
                      <div>
                        <div className="flex items-center gap-3">
                          <span className="text-xl font-black italic" style={{ color: 'var(--text-primary)' }}>{order.id}</span>
                          <span className={`text-[8px] font-black uppercase px-2 py-1 rounded bg-black/20 ${config.text}`}>{config.label}</span>
                        </div>
                        <p className="text-[10px] font-bold text-gray-500 uppercase mt-1">{order.customerName} • {getTimeSince(order.updatedAt || order.date)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                       {order.status !== 'CANCELADO' && <button onClick={(e) => { e.stopPropagation(); setCancellingOrderId(order.id) }} className="p-3 rounded-xl bg-red-500/10 text-red-500/60 hover:bg-red-500/20 hover:text-red-400 transition-all" title="Cancelar pedido"><XCircle className="w-5 h-5"/></button>}
                       {prevStatus && <button onClick={(e) => { e.stopPropagation(); handleRevert(order.id) }} className="p-3 rounded-xl bg-white/5 text-gray-500 hover:text-white transition-all"><RotateCcw className="w-5 h-5"/></button>}
                       <button onClick={(e) => { e.stopPropagation(); triggerPrint(order) }} className="p-3 rounded-xl bg-white/5 text-gray-400 hover:text-white transition-all"><Printer className="w-5 h-5"/></button>
                       {nextStatus && <button onClick={(e) => { e.stopPropagation(); handleAdvance(order.id) }} className="px-6 py-3 rounded-xl bg-white text-black font-black uppercase text-[10px] hover:bg-amber-500 transition-all font-sans">{order.status === 'RECEBIDO' ? 'Aceitar' : `→ ${STATUS_CONFIG[nextStatus].label}`}</button>}
                    </div>
                  </div>
                  {isExpanded && (
                    <div className="px-8 pb-8 pt-2 border-t border-white/5 grid grid-cols-1 md:grid-cols-2 gap-8">
                       <div className="space-y-3">
                          <p className="text-[9px] font-black uppercase text-gray-600 tracking-widest mb-2">Itens</p>
                          {order.items.map((item, i) => (
                            <div key={i} className="p-4 rounded-2xl bg-white/[0.03] border border-[var(--border-color)]">
                               <div className="flex justify-between font-bold uppercase text-xs" style={{ color: 'var(--text-primary)' }}><span>{item.quantity}x {item.name}</span><span>R$ {(item.finalPrice * item.quantity).toFixed(2)}</span></div>
                               {item.customizations?.removedIngredients?.map((ing, j) => <div key={j} style={{ fontSize: '10px', marginLeft: '10px' }}>- SEM {ing.toUpperCase()}</div>)}
                               {item.customizations?.addons?.map((add, k) => <div key={k} style={{ fontSize: '10px', marginLeft: '10px' }}>+ {add.quantity}x {add.name}</div>)}
                               {item.customizations?.observation && <p className="text-[10px] text-amber-500 italic mt-1">Obs: {item.customizations.observation}</p>}
                            </div>
                          ))}
                       </div>
                       <div className="space-y-4">
                          <div className="p-5 rounded-2xl bg-white/[0.03] border border-[var(--border-color)] space-y-2">
                             <p className="text-[9px] font-black uppercase text-gray-600 tracking-widest">Informações</p>
                             <p className="text-xs" style={{ color: 'var(--text-primary)' }}><strong>Telefone:</strong> {order.customerPhone}</p>
                             <p className="text-xs" style={{ color: 'var(--text-primary)' }}><strong>Pagamento:</strong> {PAYMENT_LABELS[order.paymentMethod]}</p>
                             {order.address && <p className="text-xs" style={{ color: 'var(--text-primary)' }}><strong>Endereço:</strong> {order.address.street}, {order.address.number}</p>}
                          </div>
                          <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex justify-between items-center">
                             <span className="text-xs font-black text-amber-500 uppercase">Total do Pedido</span>
                             <span className="text-2xl font-black italic" style={{ color: 'var(--text-primary)' }}>R$ {order.total.toFixed(2)}</span>
                          </div>
                       </div>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>
    </>
  )
}
