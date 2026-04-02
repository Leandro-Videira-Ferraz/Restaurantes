import { useState } from 'react'
import { Utensils, Info, Eye, Plus, Clock } from 'lucide-react'
import { useStore, checkOpenStatus } from '../store/StoreContext'
import { useCart } from '../store/CartContext'

export default function Menu() {
  const { state } = useStore()
  const { addToCart } = useCart()
  const { settings } = state
  const [showToast, setShowToast] = useState(false)

  const handleAddToCart = (product) => {
    addToCart(product)
    setShowToast(true)
    setTimeout(() => setShowToast(false), 2000)
  }

  // Lógica para verificar se a loja está aberta AGORA
  const isStoreOpen = checkOpenStatus(settings)


  // Agrupar produtos por categoria
  const groupedMenu = state.categories.map((category) => {
    return {
      ...category,
      products: state.products.filter(
        (product) => product.categoryId === category.id && product.active
      ),
    }
  }).filter(group => group.products.length > 0)

  if (state.products.length === 0) {
    return (
      <div className="glass-card p-20 text-center flex flex-col items-center border-dashed border-amber-500/20 animate-fade-in">
        <div className="w-20 h-20 bg-amber-500/5 rounded-full flex items-center justify-center mb-6">
          <Utensils className="w-10 h-10 text-gray-700" />
        </div>
        <p className="text-xl font-bold text-gray-400">Cardápio Vazio</p>
        <p className="text-gray-500 mt-2 max-w-xs">Aguarde o cadastro de produtos premium pelo administrador.</p>
      </div>
    )
  }

  return (
    <div className="space-y-16 animate-fade-in pb-32">
      {/* Toast Feedback */}
      <div className={`fixed top-8 left-1/2 -translate-x-1/2 z-[200] transition-all duration-500 ${showToast ? 'translate-y-0 opacity-100' : '-translate-y-20 opacity-0'}`}>
        <div className="bg-amber-500 text-black px-6 py-3 rounded-2xl font-black uppercase text-xs tracking-widest shadow-2xl flex items-center gap-3">
          <div className="w-5 h-5 bg-black/10 rounded-full flex items-center justify-center">
            <Plus className="w-3 h-3" />
          </div>
          Item adicionado ao carrinho!
        </div>
      </div>

      <div className="text-center space-y-4">
        <h2 className="text-4xl font-black text-white tracking-tight italic uppercase">Cardápio<span className="text-amber-500">Digital</span></h2>
        
        {isStoreOpen ? (
          <p className="text-xs text-gray-500 font-bold tracking-[0.3em] uppercase">Sabor Artesanal • Qualidade Premium</p>
        ) : (
          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 max-w-md mx-auto animate-pulse-subtle">
             <div className="flex items-center justify-center gap-3 text-red-500 mb-1">
                <Clock className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-widest">Loja Fechada no momento</span>
             </div>
             <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest leading-relaxed">
               Você pode navegar pelo cardápio, mas não estamos aceitando pedidos agora.
             </p>
          </div>
        )}
      </div>

      {groupedMenu.map((group) => (
        <section key={group.id} className="space-y-8">
          <div className="flex items-center gap-4">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-white/10"></div>
            <h3 className="text-xl font-black text-amber-500 italic uppercase tracking-widest px-4">{group.name}</h3>
            <div className="h-px flex-1 bg-gradient-to-l from-transparent via-white/10 to-white/10"></div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
            {group.products.map((product) => (
              <div key={product.id} className="glass-card group flex flex-col h-full hover:shadow-[0_0_30px_rgba(245,158,11,0.05)] transition-all overflow-hidden border-white/5 hover:border-amber-500/20">
                <div className="relative aspect-video overflow-hidden">
                  {product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                  ) : (
                    <div className="w-full h-full bg-white/5 flex items-center justify-center">
                      <Utensils className="w-12 h-12 text-gray-800" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent opacity-80"></div>
                  
                  <div className="absolute top-4 right-4">
                     <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 shadow-xl">
                        <span className="text-sm font-black text-white italic">
                          <span className="text-[10px] text-amber-500 mr-0.5 not-italic">R$</span>
                          {product.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                     </div>
                  </div>
                </div>

                <div className="p-5 flex flex-col flex-1 space-y-3">
                  <div>
                    <h4 className="text-base font-bold text-white uppercase tracking-tight group-hover:text-amber-500 transition-colors">{product.name}</h4>
                    {product.description && (
                      <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed italic mt-1">{product.description}</p>
                    )}
                  </div>

                  <div className="pt-3 mt-auto flex items-center justify-between border-t border-white/5">
                    <div className="flex flex-wrap gap-1 max-w-[70%] text-white">
                      {product.ingredients?.slice(0, 3).map((ing, idx) => (
                        <span key={idx} className="text-[8px] font-bold text-gray-600 bg-white/5 px-1.5 py-0.5 rounded uppercase tracking-tighter">
                          {ing.name}
                        </span>
                      ))}
                      {product.ingredients?.length > 3 && <span className="text-[8px] font-bold text-gray-700">...</span>}
                    </div>
                    
                    <button 
                      disabled={!isStoreOpen}
                      onClick={() => handleAddToCart(product)}
                      className={`p-2 rounded-xl transition-all shadow-[0_5px_15px_rgba(245,158,11,0.2)] active:scale-95 ${
                        isStoreOpen 
                          ? 'bg-amber-500 hover:bg-amber-400 text-black cursor-pointer' 
                          : 'bg-white/5 text-gray-700 cursor-not-allowed opacity-50 shadow-none'
                      }`}
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
