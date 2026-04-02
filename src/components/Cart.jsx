import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShoppingCart, X, Plus, Minus, Trash2, ArrowRight, Utensils } from 'lucide-react'
import { useCart } from '../store/CartContext'

export default function Cart() {
  const navigate = useNavigate()
  const { cart, addToCart, removeOne, removeItem, clearCart } = useCart()
  const [isOpen, setIsOpen] = useState(false)

  const cartCount = cart.items.reduce((acc, item) => acc + item.quantity, 0)

  if (cartCount === 0 && !isOpen) return null

  return (
    <>
      {/* Botão Flutuante */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-6 md:bottom-8 md:right-8 z-50 bg-amber-500 text-black p-4 rounded-2xl shadow-[0_20px_50px_rgba(245,158,11,0.3)] hover:scale-110 active:scale-95 transition-all group flex items-center gap-3 border border-white/20"
      >
        <div className="relative">
          <ShoppingCart className="w-6 h-6" />
          <span className="absolute -top-2 -right-2 bg-black text-amber-500 text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-amber-500 group-hover:animate-bounce">
            {cartCount}
          </span>
        </div>
        <span className="hidden md:inline font-black uppercase text-xs tracking-widest bg-black/5 px-2 py-1 rounded-lg">Meu Pedido</span>
      </button>

      {/* Overlay Escuro */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-md z-[200] transition-opacity animate-fade-in"
          onClick={() => setIsOpen(false)}
        ></div>
      )}

      {/* Painel do Carrinho */}
      <div className={`fixed top-0 right-0 h-full w-full md:w-[450px] bg-[#050505] z-[201] shadow-[-20px_0_50px_rgba(0,0,0,1)] border-l border-white/5 transition-transform duration-500 ease-out fill-available ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex flex-col h-full h-screen">
          {/* Header do Carrinho */}
          <div className="p-6 md:p-8 flex items-center justify-between border-b border-white/5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center">
                <ShoppingCart className="w-6 h-6 text-amber-500" />
              </div>
              <div>
                <h3 className="text-xl font-black text-white uppercase italic tracking-tight">Meu Pedido</h3>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em]">{cartCount} itens selecionados</p>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="p-3 md:p-2 bg-white/5 md:bg-transparent hover:bg-white/10 rounded-2xl text-gray-400 hover:text-white transition-all active:scale-95 cursor-pointer"
            >
              <X className="w-8 h-8 md:w-6 md:h-6" />
            </button>
          </div>

          {/* Lista de Itens */}
          <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 md:space-y-8 scrollbar-hide">
            {cart.items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
                <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center opacity-20 relative">
                   <div className="absolute inset-0 bg-white/10 blur-2xl rounded-full"></div>
                   <ShoppingCart className="w-12 h-12 text-white relative z-10" />
                </div>
                <div className="space-y-2">
                  <p className="text-gray-400 text-lg font-black uppercase italic italic tracking-tight">Opa! Nada por aqui.</p>
                  <p className="text-gray-600 text-xs font-medium max-w-[220px] leading-relaxed">Adicione os burguers mais suculentos da cidade para começar seu pedido!</p>
                </div>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="px-6 py-3 border border-white/1 tracking-widest bg-white/5 hover:bg-white/10 text-white rounded-xl text-[10px] font-black uppercase transition-all"
                >
                  Explorar Cardápio
                </button>
              </div>
            ) : (
              cart.items.map((item) => (
                <div key={item.id} className="flex gap-5 group items-center bg-white/[0.01] p-2 rounded-2xl border border-transparent hover:border-white/5 transition-all">
                  <div className="w-20 h-20 shrink-0 rounded-2xl overflow-hidden bg-white/5 border border-white/10">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Utensils className="w-8 h-8 text-gray-800" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0 py-1">
                    <div className="flex justify-between items-start">
                      <h4 className="text-sm font-black text-white uppercase truncate pr-2 italic">{item.name}</h4>
                      <button 
                        onClick={() => removeItem(item.id)}
                        className="p-1 text-gray-700 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-xs text-amber-500 font-bold mt-1 tracking-tight">
                      R$ {item.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                    
                    <div className="flex items-center gap-4 mt-3">
                      <div className="flex items-center bg-black/40 rounded-xl border border-white/10 overflow-hidden shadow-inner">
                        <button 
                          onClick={() => removeOne(item.id)}
                          className="p-2 px-3 hover:text-amber-500 transition-colors bg-white/5"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-black text-white w-6 text-center">{item.quantity}</span>
                        <button 
                          onClick={() => addToCart(item)}
                          className="p-2 px-3 hover:text-amber-500 transition-colors bg-white/5"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <span className="text-[10px] text-gray-500 font-black uppercase italic tracking-widest whitespace-nowrap">
                        R$ {(item.price * item.quantity).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer do Carrinho */}
          <div className="p-6 md:p-8 bg-black/80 backdrop-blur-xl border-t border-white/5 space-y-6 pb-12 md:pb-8">
            <div className="flex justify-between items-center">
               <div className="space-y-1">
                 <span className="text-gray-600 text-[10px] font-black uppercase tracking-[0.2em] block">Total do Pedido</span>
                 <p className="text-[9px] text-amber-500/50 font-bold uppercase tracking-widest italic leading-none">Pagamento na entrega</p>
               </div>
               <span className="text-3xl font-black text-white italic tracking-tighter">
                <span className="text-xs text-amber-500 mr-1 not-italic">R$</span>
                {cart.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
            
            <div className="flex flex-col gap-3">
              <button
                disabled={cart.items.length === 0}
                onClick={() => {
                  setIsOpen(false)
                  navigate('/checkout')
                }}
                className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:grayscale text-black h-16 rounded-2xl font-black uppercase tracking-[0.2em] text-xs transition-all flex items-center justify-center gap-3 group active:scale-[0.98] shadow-[0_20px_40px_rgba(245,158,11,0.2)]"
              >
                Finalizar Pedido
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              
              <button 
                onClick={() => setIsOpen(false)}
                className="w-full h-12 flex items-center justify-center gap-2 text-gray-500 hover:text-white text-[10px] font-black uppercase tracking-widest transition-colors"
              >
                Continuar Comprando
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
