import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  User,
  MapPin,
  CreditCard,
  ChevronLeft,
  CheckCircle2,
  Bike,
  Store,
  MessageCircle,
  ArrowRight,
  Tag,
  X,
  Clock,
  AlertCircle
} from 'lucide-react'
import { useCart } from '../store/CartContext'
import { useStore } from '../store/StoreContext'
import { useUser } from '../store/UserContext'
import { useOrders } from '../store/OrdersContext'

export default function Checkout() {
  const navigate = useNavigate()
  const { cart, clearCart } = useCart()
  const { state, dispatch: storeDispatch } = useStore()
  const { user, dispatch: userDispatch } = useUser()
  const { dispatch: ordersDispatch } = useOrders()
  const { settings } = state
  const [step, setStep] = useState(1) // 1: Info, 2: Entrega, 3: Pagamento, 4: Sucesso

  const [formData, setFormData] = useState({
    name: user.profile.name || '',
    phone: user.profile.phone || '',
    deliveryMethod: 'delivery', // 'delivery' or 'pickup'
    address: {
      street: user.profile.address?.street || '',
      number: user.profile.address?.number || '',
      neighborhood: user.profile.address?.neighborhood || '',
      complement: user.profile.address?.complement || ''
    },
    paymentMethod: 'pix', // 'pix', 'card', 'cash'
    change: ''
  })

  const [couponInput, setCouponInput] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState(null)
  const [couponError, setCouponError] = useState('')

  const getDeliveryFee = () => {
    if (formData.deliveryMethod !== 'delivery') return 0
    if (appliedCoupon?.type === 'shipping') return 0
    return (settings.useNeighborhoodFees && settings.neighborhoodFees?.find(n => n.name === formData.address.neighborhood)?.fee) || settings.deliveryFee
  }

  const getDiscount = () => {
    if (!appliedCoupon) return 0
    if (appliedCoupon.type === 'percent') return cart.total * (appliedCoupon.value / 100)
    if (appliedCoupon.type === 'fixed') return Math.min(appliedCoupon.value, cart.total)
    return 0
  }

  const getFinalTotal = () => cart.total + getDeliveryFee() - getDiscount()

  const applyCoupon = () => {
    const coupons = settings.coupons || []
    const found = coupons.find(c => c.code === couponInput.toUpperCase().trim() && c.active)
    if (!found) {
      setCouponError('Cupom inválido ou expirado.')
      return
    }
    if (found.minOrder > 0 && cart.total < found.minOrder) {
      setCouponError(`Pedido mínimo de R$ ${found.minOrder.toFixed(2)} para este cupom.`)
      return
    }
    if (found.maxUses > 0 && (found.usedCount || 0) >= found.maxUses) {
      setCouponError('Este cupom atingiu o limite de usos.')
      return
    }
    setAppliedCoupon(found)
    setCouponError('')
  }

  const removeCoupon = () => {
    setAppliedCoupon(null)
    setCouponInput('')
    setCouponError('')
  }

  const minimumOrderValue = settings.minimumOrderValue || 0
  const belowMinimum = formData.deliveryMethod === 'delivery' && minimumOrderValue > 0 && cart.total < minimumOrderValue

  const estimatedTime = formData.deliveryMethod === 'delivery'
    ? (settings.estimatedDeliveryTime || 40)
    : (settings.estimatedPickupTime || 20)

  // Se o carrinho estiver vazio, volta para o menu
  if (cart.items.length === 0 && step !== 4) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center space-y-6">
        <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ background: 'var(--bg-card)', color: 'var(--text-muted)' }}>
           <MapPin className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-black uppercase italic" style={{ color: 'var(--text-primary)' }}>Seu carrinho está vazio</h2>
        <button 
          onClick={() => navigate('/')}
          className="bg-amber-500 text-black px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs"
        >
          Voltar ao Cardápio
        </button>
      </div>
    )
  }

  const handleFinalize = () => {
    // 1. Atualizar Perfil do Usuário (Nome, Telefone, Endereço Favorito)
    userDispatch({
      type: 'UPDATE_PROFILE',
      payload: {
        name: formData.name,
        phone: formData.phone,
        address: formData.address
      }
    })

    // 2. Criar Objeto do Pedido
    const deliveryFee = getDeliveryFee()
    const discount = getDiscount()
    const orderId = `#${Math.floor(1000 + Math.random() * 9000)}`

    // Normalizar itens: empacotar personalizações em 'customizations'
    const orderItems = cart.items.map(item => ({
      id: item.id,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      imageUrl: item.imageUrl,
      finalPrice: item.finalPrice || item.price,
      customizations: {
        removedIngredients: item.removedIngredients || [],
        addons: item.addons || [],
        observation: item.observation || '',
      }
    }))

    const newOrder = {
      id: orderId,
      date: new Date().toISOString(),
      items: orderItems,
      subtotal: cart.total,
      deliveryFee,
      discount,
      couponCode: appliedCoupon?.code || '',
      total: getFinalTotal(),
      status: 'RECEBIDO',
      paymentMethod: formData.paymentMethod,
      change: formData.paymentMethod === 'cash' ? formData.change : '',
      deliveryMethod: formData.deliveryMethod,
      address: formData.address,
      customerName: formData.name,
      customerPhone: formData.phone,
    }

    // 3. Adicionar ao Histórico do Cliente
    userDispatch({ type: 'ADD_ORDER', payload: newOrder })

    // 4. Enviar para a Fila de Pedidos do Restaurante
    ordersDispatch({ type: 'ADD_ORDER', payload: newOrder })

    // 5. Incrementar uso do cupom (se aplicado)
    if (appliedCoupon) {
      const updatedCoupons = (settings.coupons || []).map(c =>
        c.id === appliedCoupon.id ? { ...c, usedCount: (c.usedCount || 0) + 1 } : c
      )
      storeDispatch({ type: 'UPDATE_SETTINGS', payload: { coupons: updatedCoupons } })
    }

    // 6. Limpar Carrinho e mostrar sucesso
    setStep(4)
    clearCart()
  }

  const nextStep = () => setStep(s => s + 1)
  const prevStep = () => setStep(s => s - 1)

  return (
    <div className="min-h-screen pb-20 animate-fade-in">
      {/* Header Fixo */}
      <div className="sticky top-0 z-50 backdrop-blur-xl px-6 py-6" style={{ background: 'var(--bg-header)', borderBottom: '1px solid var(--border-color)' }}>
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <button onClick={() => step === 4 ? navigate('/') : prevStep()} className="p-2 hover:bg-white/5 rounded-xl text-gray-400 transition-all">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h2 className="text-sm font-black uppercase tracking-[0.3em] italic" style={{ color: 'var(--text-primary)' }}>Finalizar <span className="text-amber-500">Pedido</span></h2>
          <div className="w-10"></div>
        </div>
      </div>

      <main className="max-w-xl mx-auto px-6 py-12 space-y-12">
        {/* Progress Bar (Apenas se não for sucesso) */}
        {step < 4 && (
          <div className="flex justify-between relative px-2">
            {[1, 2, 3].map((s) => (
              <div key={s} className="relative z-10 flex flex-col items-center space-y-3">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border-2 transition-all duration-500 ${
                  step >= s ? 'bg-amber-500 border-amber-500 text-black shadow-[0_0_20px_rgba(245,158,11,0.3)]' : 'border-white/10 text-gray-700'
                }`}>
                  {s === 1 && <User className="w-4 h-4" />}
                  {s === 2 && <MapPin className="w-4 h-4" />}
                  {s === 3 && <CreditCard className="w-4 h-4" />}
                </div>
                <span className={`text-[10px] font-black uppercase tracking-widest ${step >= s ? '' : 'text-gray-700'}`} style={step >= s ? { color: 'var(--text-primary)' } : {}}>
                  {s === 1 ? 'Identidade' : s === 2 ? 'Entrega' : 'Pagamento'}
                </span>
              </div>
            ))}
            <div className="absolute top-5 left-0 w-full h-px bg-white/5 -z-0">
               <div className="h-full bg-amber-500/30 transition-all duration-500" style={{ width: `${((step - 1) / 2) * 100}%` }}></div>
            </div>
          </div>
        )}

        {/* STEP 1: IDENTIFICAÇÃO */}
        {step === 1 && (
          <div className="space-y-8 animate-slide-up">
            <div className="space-y-2">
              <h3 className="text-2xl font-black uppercase italic" style={{ color: 'var(--text-primary)' }}>Quem é <span className="text-amber-500">Você?</span></h3>
              <p className="text-xs text-gray-500 font-medium">Precisamos do seu contato para qualquer eventualidade.</p>
            </div>
            
            <div className="space-y-6">
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest ml-1">Seu Nome Completo</label>
                  <input 
                    type="text" 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Como devemos te chamar?"
                    className="w-full rounded-2xl px-6 py-5 font-bold focus:outline-none focus:border-amber-500/50 transition-all" style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                  />
               </div>
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest ml-1">WhatsApp para Contato</label>
                  <input 
                    type="tel" 
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    placeholder="(00) 00000-0000"
                    className="w-full rounded-2xl px-6 py-5 font-bold focus:outline-none focus:border-amber-500/50 transition-all" style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                  />
               </div>
            </div>

            <button 
              onClick={nextStep}
              disabled={!formData.name || !formData.phone}
              className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-20 text-black h-16 rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-xl flex items-center justify-center gap-3 cursor-pointer"
            >
              Próximo Passo
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* STEP 2: ENTREGA */}
        {step === 2 && (
          <div className="space-y-8 animate-slide-up">
            <div className="space-y-2">
              <h3 className="text-2xl font-black uppercase italic" style={{ color: 'var(--text-primary)' }}>Onde quer <span className="text-amber-500">Receber?</span></h3>
              <p className="text-xs text-gray-500 font-medium">Escolha a melhor forma de ter seu burguer.</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <button 
                onClick={() => setFormData({...formData, deliveryMethod: 'delivery'})}
                className={`p-6 rounded-3xl border-2 flex flex-col items-center gap-4 transition-all ${
                  formData.deliveryMethod === 'delivery' ? 'bg-amber-500/10 border-amber-500 text-white' : 'bg-white/5 border-transparent text-gray-600 hover:border-white/10'
                }`}
               >
                 <Bike className="w-8 h-8" />
                 <span className="text-[10px] font-black uppercase tracking-widest">Delivery</span>
               </button>
               <button 
                onClick={() => setFormData({...formData, deliveryMethod: 'pickup'})}
                className={`p-6 rounded-3xl border-2 flex flex-col items-center gap-4 transition-all ${
                  formData.deliveryMethod === 'pickup' ? 'bg-amber-500/10 border-amber-500 text-white' : 'bg-white/5 border-transparent text-gray-600 hover:border-white/10'
                }`}
               >
                 <Store className="w-8 h-8" />
                 <span className="text-[10px] font-black uppercase tracking-widest">Retirada</span>
               </button>
            </div>

            {formData.deliveryMethod === 'delivery' && (
              <div className="space-y-4 animate-fade-in">
                 <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest ml-1">Seu Bairro</label>
                    {settings.useNeighborhoodFees ? (
                      <select 
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-sm text-white focus:outline-none focus:border-amber-500/30 uppercase font-bold"
                        value={formData.address.neighborhood}
                        onChange={(e) => setFormData({...formData, address: {...formData.address, neighborhood: e.target.value}})}
                      >
                        <option value="" className="bg-black text-white">Escolha seu Bairro...</option>
                        {settings.neighborhoodFees?.map(n => (
                          <option key={n.id} value={n.name} className="bg-black text-white">{n.name} - R$ {n.fee.toFixed(2)}</option>
                        ))}
                      </select>
                    ) : (
                      <input 
                        type="text"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-sm text-white font-bold"
                        placeholder="Em qual bairro você está?"
                        value={formData.address.neighborhood}
                        onChange={(e) => setFormData({...formData, address: {...formData.address, neighborhood: e.target.value.toUpperCase()}})}
                      />
                    )}
                 </div>

                 <div className="grid grid-cols-4 gap-4">
                    <div className="col-span-3 space-y-1">
                      <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest ml-1">Rua / Avenida</label>
                      <input 
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white"
                        value={formData.address.street}
                        placeholder="Ex: Rua das Flores"
                        onChange={(e) => setFormData({...formData, address: {...formData.address, street: e.target.value}})}
                      />
                    </div>
                    <div className="col-span-1 space-y-1">
                      <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest ml-1">Nº</label>
                      <input 
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white"
                        value={formData.address.number}
                        placeholder="123"
                        onChange={(e) => setFormData({...formData, address: {...formData.address, number: e.target.value}})}
                      />
                    </div>
                 </div>
                 <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest ml-1">Complemento (Opcional)</label>
                    <input 
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white"
                      value={formData.address.complement}
                      placeholder="Ex: Apto 101 / Casa Altos"
                      onChange={(e) => setFormData({...formData, address: {...formData.address, complement: e.target.value}})}
                    />
                 </div>
              </div>
            )}

            {belowMinimum && (
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-red-500/10 border border-red-500/20">
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                <p className="text-xs font-bold text-red-400">
                  Pedido mínimo para delivery: <span className="font-black text-red-500">R$ {minimumOrderValue.toFixed(2)}</span>.
                  Seu subtotal é R$ {cart.total.toFixed(2)}.
                </p>
              </div>
            )}

            <button
              onClick={nextStep}
              disabled={belowMinimum}
              className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-30 text-black h-16 rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-xl flex items-center justify-center gap-3 cursor-pointer"
            >
              Escolher Pagamento
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* STEP 3: PAGAMENTO */}
        {step === 3 && (
          <div className="space-y-8 animate-slide-up">
            <div className="space-y-2">
              <h3 className="text-2xl font-black uppercase italic" style={{ color: 'var(--text-primary)' }}>Como quer <span className="text-amber-500">Pagar?</span></h3>
              <p className="text-xs text-gray-500 font-medium">Aceitamos todas as formas modernas.</p>
            </div>

            <div className="space-y-4">
               {['pix', 'card', 'cash'].map((method) => (
                 <button 
                  key={method}
                  onClick={() => setFormData({...formData, paymentMethod: method})}
                  className={`w-full p-6 rounded-3xl border-2 flex items-center justify-between transition-all ${
                    formData.paymentMethod === method ? 'bg-amber-500/10 border-amber-500 text-white' : 'bg-white/5 border-transparent text-gray-600 hover:border-white/10'
                  }`}
                 >
                   <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                        {method === 'pix' && <span className="font-black text-xs">PIX</span>}
                        {method === 'card' && <CreditCard className="w-5 h-5" />}
                        {method === 'cash' && <span className="font-black text-xs">$</span>}
                      </div>
                      <span className="text-xs font-black uppercase tracking-widest">
                        {method === 'pix' ? 'Pix Automático' : method === 'card' ? 'Cartão (Entregador)' : 'Dinheiro'}
                      </span>
                   </div>
                   {formData.paymentMethod === method && <CheckCircle2 className="w-5 h-5 text-amber-500" />}
                 </button>
               ))}
               
               {formData.paymentMethod === 'cash' && (
                 <div className="animate-fade-in pt-4">
                    <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest ml-1">Precisa de troco para quanto?</label>
                    <input 
                      type="text" 
                      placeholder="Ex: R$ 50,00"
                      value={formData.change}
                      onChange={(e) => setFormData({...formData, change: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-white font-bold focus:outline-none focus:border-amber-500/50 mt-2"
                    />
                 </div>
               )}
            </div>

            {/* Campo de Cupom */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest ml-1">Cupom de Desconto</label>
              {appliedCoupon ? (
                <div className="flex items-center justify-between p-4 rounded-2xl bg-green-500/10 border border-green-500/20">
                  <div className="flex items-center gap-3">
                    <Tag className="w-4 h-4 text-green-500" />
                    <div>
                      <p className="text-sm font-black text-green-500 tracking-widest">{appliedCoupon.code}</p>
                      <p className="text-[10px] text-gray-400 font-bold">
                        {appliedCoupon.type === 'percent' && `-${appliedCoupon.value}%`}
                        {appliedCoupon.type === 'fixed' && `-R$ ${appliedCoupon.value.toFixed(2)}`}
                        {appliedCoupon.type === 'shipping' && 'Frete grátis'}
                      </p>
                    </div>
                  </div>
                  <button onClick={removeCoupon} className="p-1.5 rounded-lg bg-white/5 hover:bg-red-500/10 text-gray-500 hover:text-red-500 transition-all cursor-pointer">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Digite o código do cupom"
                    value={couponInput}
                    onChange={e => { setCouponInput(e.target.value.toUpperCase()); setCouponError('') }}
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white font-black tracking-widest focus:outline-none focus:border-amber-500/30"
                  />
                  <button
                    onClick={applyCoupon}
                    disabled={!couponInput}
                    className="px-5 bg-amber-500 hover:bg-amber-400 disabled:opacity-30 text-black rounded-xl font-black text-xs uppercase tracking-widest transition-all cursor-pointer"
                  >
                    Aplicar
                  </button>
                </div>
              )}
              {couponError && <p className="text-[10px] text-red-500 font-bold ml-1">{couponError}</p>}
            </div>

            {/* Resumo de Valores */}
            <div className="glass-card p-8 space-y-4 border-white/5">
              <div className="flex justify-between items-center text-gray-500">
                <span className="text-[10px] font-black uppercase tracking-widest">Subtotal</span>
                <span className="text-sm font-bold">R$ {cart.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>

              {formData.deliveryMethod === 'delivery' && (
                <div className="flex justify-between items-center text-amber-500/80">
                  <span className="text-[10px] font-black uppercase tracking-widest">
                    Taxa de Entrega {appliedCoupon?.type === 'shipping' ? '(Cupom Aplicado)' : settings.useNeighborhoodFees ? `(${formData.address.neighborhood || 'Padrão'})` : '(Padrão)'}
                  </span>
                  {appliedCoupon?.type === 'shipping' ? (
                    <span className="text-sm font-bold text-green-500">Grátis</span>
                  ) : (
                    <span className="text-sm font-bold">+ R$ {getDeliveryFee().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  )}
                </div>
              )}

              {appliedCoupon && appliedCoupon.type !== 'shipping' && (
                <div className="flex justify-between items-center text-green-500">
                  <span className="text-[10px] font-black uppercase tracking-widest">Desconto ({appliedCoupon.code})</span>
                  <span className="text-sm font-bold">- R$ {getDiscount().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
              )}

              <div className="h-px bg-white/5 w-full"></div>

              <div className="flex justify-between items-baseline pt-2">
                <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--text-primary)' }}>Total Geral</span>
                <span className="text-4xl font-black italic" style={{ color: 'var(--text-primary)' }}>
                  <span className="text-xs text-amber-500 mr-1 not-italic">R$</span>
                  {getFinalTotal().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            <button 
              onClick={handleFinalize}
              className="w-full bg-green-500 hover:bg-green-400 text-black h-20 rounded-2xl font-black uppercase tracking-[0.2em] text-xs transition-all shadow-[0_20px_40px_rgba(34,197,94,0.2)] flex items-center justify-center gap-3 cursor-pointer"
            >
              Confirmar Pedido
              <MessageCircle className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* STEP 4: SUCESSO */}
        {step === 4 && (
          <div className="h-[60vh] flex flex-col items-center justify-center text-center space-y-8 animate-fade-in">
             <div className="w-32 h-32 bg-green-500/10 rounded-full flex items-center justify-center relative">
                <div className="absolute inset-0 bg-green-500/20 blur-3xl rounded-full animate-pulse"></div>
                <CheckCircle2 className="w-16 h-16 text-green-500 relative z-10" />
             </div>
             
             <div className="space-y-4">
               <h2 className="text-4xl font-black italic uppercase tracking-tight" style={{ color: 'var(--text-primary)' }}>Pedido <span className="text-amber-500">Confirmado!</span></h2>
               <p className="text-gray-400 max-w-sm mx-auto font-medium leading-relaxed">
                 Obrigado <b>{formData.name}</b>! Seu pedido já está sendo preparado com todo carinho pela nossa cozinha.
               </p>
             </div>

             <div className="flex items-center gap-3 px-6 py-4 rounded-2xl bg-amber-500/10 border border-amber-500/20">
               <Clock className="w-5 h-5 text-amber-500 shrink-0" />
               <div className="text-left">
                 <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Tempo estimado</p>
                 <p className="text-sm font-black text-white">
                   {formData.deliveryMethod === 'delivery' ? 'Entrega em' : 'Pronto para retirada em'}{' '}
                   <span className="text-amber-500">~{estimatedTime} minutos</span>
                 </p>
               </div>
             </div>

             <div className="w-full max-w-xs space-y-4 pt-4">
               <button
                onClick={() => navigate('/orders')}
                className="w-full bg-amber-500 hover:bg-amber-400 text-black h-16 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all"
               >
                 Acompanhar Pedido
               </button>
               <button
                onClick={() => navigate('/')}
                className="w-full bg-white/5 hover:bg-white/10 text-white h-16 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all"
               >
                 Voltar ao Início
               </button>
             </div>
          </div>
        )}
      </main>
    </div>
  )
}
