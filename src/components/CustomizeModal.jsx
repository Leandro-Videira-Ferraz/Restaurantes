import { useState, useEffect } from 'react'
import { X, Minus, Plus, Check, Utensils, CircleMinus, Layers } from 'lucide-react'
import { useStore } from '../store/StoreContext'

export default function CustomizeModal({ product, onClose, onConfirm }) {
  const { state } = useStore()
  const allAddons = (state.addons || []).filter(a => a.active)

  // Ingredientes removíveis deste produto
  const removableIngredients = (product.ingredients || []).filter(i => i.removable)

  // Adicionais disponíveis para este produto
  // Se o produto tem adicionais específicos, mostra só esses. Senão, mostra todos.
  const productAddonIds = product.addonIds || []
  const availableAddons = productAddonIds.length > 0
    ? allAddons.filter(a => productAddonIds.includes(a.id))
    : allAddons

  // Agrupar adicionais por categoria
  const groupedAddons = availableAddons.reduce((acc, addon) => {
    const cat = addon.category || 'Extras'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(addon)
    return acc
  }, {})

  // Estado: ingredientes removidos
  const [removedIngredients, setRemovedIngredients] = useState([])

  // Estado: adicionais selecionados { addonId: quantity }
  const [selectedAddons, setSelectedAddons] = useState({})

  // Observação do cliente
  const [observation, setObservation] = useState('')

  // Calcular preço total
  const addonsTotal = Object.entries(selectedAddons).reduce((total, [addonId, qty]) => {
    const addon = availableAddons.find(a => a.id === addonId)
    return total + (addon ? addon.price * qty : 0)
  }, 0)

  const finalPrice = product.price + addonsTotal

  function toggleIngredient(ingredientName) {
    setRemovedIngredients(prev =>
      prev.includes(ingredientName)
        ? prev.filter(n => n !== ingredientName)
        : [...prev, ingredientName]
    )
  }

  function incrementAddon(addonId) {
    const addon = availableAddons.find(a => a.id === addonId)
    const max = addon?.maxQuantity || 1
    setSelectedAddons(prev => {
      const current = prev[addonId] || 0
      if (current >= max) return prev
      return { ...prev, [addonId]: current + 1 }
    })
  }

  function decrementAddon(addonId) {
    setSelectedAddons(prev => {
      const current = prev[addonId] || 0
      if (current <= 0) return prev
      const newVal = current - 1
      if (newVal === 0) {
        const { [addonId]: _, ...rest } = prev
        return rest
      }
      return { ...prev, [addonId]: newVal }
    })
  }

  function handleConfirm() {
    const addonsDetail = Object.entries(selectedAddons).map(([addonId, qty]) => {
      const addon = availableAddons.find(a => a.id === addonId)
      return {
        id: addonId,
        name: addon.name,
        price: addon.price,
        quantity: qty,
      }
    })

    onConfirm({
      removedIngredients,
      addons: addonsDetail,
      observation,
      addonsTotal,
      finalPrice,
    })
  }

  const hasCustomizations = removableIngredients.length > 0 || availableAddons.length > 0

  // Se não tem nenhuma personalização, adiciona direto
  useEffect(() => {
    if (!hasCustomizations) {
      onConfirm({
        removedIngredients: [],
        addons: [],
        observation: '',
        addonsTotal: 0,
        finalPrice: product.price,
      })
    }
  }, [])

  if (!hasCustomizations) return null

  return (
    <div className="fixed inset-0 z-[300] flex items-end md:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-md animate-fade-in"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="relative z-10 w-full max-w-lg max-h-[90vh] flex flex-col bg-[#0a0a0a] border border-white/10 rounded-t-3xl md:rounded-3xl shadow-2xl animate-slide-up overflow-hidden">
        {/* Header */}
        <div className="p-6 pb-4 flex items-center gap-4 border-b border-white/5 shrink-0">
          {product.imageUrl ? (
            <div className="w-16 h-16 rounded-2xl overflow-hidden border border-white/10 shrink-0">
              <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center shrink-0 border border-white/10">
              <Utensils className="w-8 h-8 text-gray-700" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-black text-white uppercase italic tracking-tight truncate">{product.name}</h3>
            <p className="text-xs text-gray-500 italic line-clamp-1 mt-0.5">{product.description}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-gray-400 hover:text-white transition-all cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Conteúdo Scrollável */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-hide">
          {/* Seção: Remover Ingredientes */}
          {removableIngredients.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <CircleMinus className="w-4 h-4 text-red-500" />
                <div>
                  <h4 className="text-xs font-black text-white uppercase tracking-widest">Remover Ingredientes</h4>
                  <p className="text-[10px] text-gray-600 font-medium mt-0.5">Desmarque o que não deseja</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {removableIngredients.map((ing, idx) => {
                  const isRemoved = removedIngredients.includes(ing.name)
                  return (
                    <button
                      key={idx}
                      onClick={() => toggleIngredient(ing.name)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left cursor-pointer group ${
                        isRemoved
                          ? 'bg-red-500/10 border-red-500/20 text-red-400'
                          : 'bg-white/[0.02] border-white/[0.05] text-gray-300 hover:border-white/10'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all shrink-0 ${
                        isRemoved
                          ? 'border-red-500 bg-red-500'
                          : 'border-white/20 group-hover:border-white/30'
                      }`}>
                        {isRemoved && <X className="w-3 h-3 text-white" />}
                      </div>
                      <span className={`text-sm font-bold ${isRemoved ? 'line-through opacity-60' : ''}`}>
                        {ing.name}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Seção: Adicionais */}
          {Object.entries(groupedAddons).map(([category, addons]) => (
            <div key={category} className="space-y-4">
              <div className="flex items-center gap-3">
                <Layers className="w-4 h-4 text-amber-500" />
                <div>
                  <h4 className="text-xs font-black text-white uppercase tracking-widest">{category}</h4>
                  <p className="text-[10px] text-gray-600 font-medium mt-0.5">Escolha seus extras</p>
                </div>
              </div>

              <div className="space-y-2">
                {addons.map((addon) => {
                  const qty = selectedAddons[addon.id] || 0
                  return (
                    <div
                      key={addon.id}
                      className={`flex items-center gap-4 px-4 py-3 rounded-xl border transition-all ${
                        qty > 0
                          ? 'bg-amber-500/10 border-amber-500/20'
                          : 'bg-white/[0.02] border-white/[0.05]'
                      }`}
                    >
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-bold text-white block truncate">{addon.name}</span>
                        <span className="text-xs text-amber-500 font-bold">
                          + R$ {addon.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>

                      {/* Controle de Quantidade */}
                      <div className="flex items-center gap-1 shrink-0">
                        {qty > 0 ? (
                          <>
                            <button
                              onClick={() => decrementAddon(addon.id)}
                              className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-all cursor-pointer"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="w-8 text-center text-sm font-black text-white">{qty}</span>
                            <button
                              onClick={() => incrementAddon(addon.id)}
                              disabled={qty >= (addon.maxQuantity || 1)}
                              className="w-8 h-8 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-amber-500 transition-all cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => incrementAddon(addon.id)}
                            className="px-4 py-1.5 rounded-lg bg-white/5 hover:bg-amber-500/20 text-gray-500 hover:text-amber-500 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer border border-white/5 hover:border-amber-500/20"
                          >
                            Adicionar
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}

          {/* Observação */}
          <div className="space-y-3">
            <label className="text-xs font-black text-gray-500 uppercase tracking-widest ml-1">
              Observação <span className="text-gray-700 font-normal">(opcional)</span>
            </label>
            <textarea
              value={observation}
              onChange={(e) => setObservation(e.target.value)}
              placeholder="Ex: Carne bem passada, sem salada..."
              rows={2}
              className="premium-input resize-none text-sm"
            />
          </div>
        </div>

        {/* Footer com preço e botão */}
        <div className="p-6 pt-4 border-t border-white/5 bg-black/80 backdrop-blur-xl shrink-0">
          {addonsTotal > 0 && (
            <div className="flex justify-between items-center mb-3 text-xs">
              <span className="text-gray-500 font-bold uppercase tracking-widest">Adicionais</span>
              <span className="text-amber-500 font-bold">+ R$ {addonsTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </div>
          )}
          <button
            onClick={handleConfirm}
            className="w-full bg-amber-500 hover:bg-amber-400 text-black h-14 rounded-2xl font-black uppercase tracking-[0.15em] text-xs transition-all flex items-center justify-center gap-3 active:scale-[0.98] shadow-[0_20px_40px_rgba(245,158,11,0.2)] cursor-pointer"
          >
            <Check className="w-5 h-5" />
            Adicionar • R$ {finalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </button>
        </div>
      </div>
    </div>
  )
}
