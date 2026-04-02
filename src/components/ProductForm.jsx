import { useState } from 'react'
import { Plus, Pencil, Trash2, X, Check, ShoppingBag, ChevronDown, ChevronUp, CircleMinus } from 'lucide-react'
import { useStore } from '../store/StoreContext'

const emptyForm = {
  name: '',
  description: '',
  categoryId: '',
  price: '',
  imageUrl: '',
  ingredients: [],
  active: true,
}

export default function ProductForm() {
  const { state, dispatch } = useStore()
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [newIngredient, setNewIngredient] = useState('')
  const [expandedProduct, setExpandedProduct] = useState(null)

  function resetForm() {
    setForm(emptyForm)
    setEditingId(null)
    setShowForm(false)
    setNewIngredient('')
  }

  function handleAddIngredient() {
    if (!newIngredient.trim()) return
    setForm({ ...form, ingredients: [...form.ingredients, { name: newIngredient.trim(), removable: true }] })
    setNewIngredient('')
  }

  function handleIngredientKeyDown(e) {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddIngredient()
    }
  }

  function handleRemoveIngredient(index) {
    setForm({ ...form, ingredients: form.ingredients.filter((_, i) => i !== index) })
  }

  function toggleRemovable(index) {
    const updated = form.ingredients.map((ing, i) => (i === index ? { ...ing, removable: !ing.removable } : ing))
    setForm({ ...form, ingredients: updated })
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim() || !form.categoryId || !form.price) return

    const payload = {
      ...form,
      price: parseFloat(form.price),
    }

    if (editingId) {
      dispatch({ type: 'UPDATE_PRODUCT', payload: { id: editingId, ...payload } })
    } else {
      dispatch({ type: 'ADD_PRODUCT', payload })
    }
    resetForm()
  }

  function handleEdit(product) {
    setForm({
      name: product.name,
      description: product.description,
      categoryId: product.categoryId,
      price: String(product.price),
      imageUrl: product.imageUrl || '',
      ingredients: product.ingredients || [],
      active: product.active,
    })
    setEditingId(product.id)
    setShowForm(true)
  }

  function handleDelete(id) {
    dispatch({ type: 'DELETE_PRODUCT', payload: id })
  }

  function toggleActive(product) {
    dispatch({ type: 'UPDATE_PRODUCT', payload: { id: product.id, active: !product.active } })
  }

  function getCategoryName(id) {
    return state.categories.find((c) => c.id === id)?.name || 'Sem categoria'
  }

  function formatPrice(value) {
    return Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  }

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight">Produtos</h2>
          <p className="text-sm text-gray-400 font-medium mt-1">Gestão de itens do cardápio</p>
        </div>
        {!showForm && (
          <button
            onClick={() => {
              if (state.categories.length === 0) {
                alert('Cadastre ao menos uma categoria antes de adicionar produtos.')
                return
              }
              setShowForm(true)
            }}
            className="premium-button cursor-pointer"
          >
            <Plus className="w-5 h-5" />
            Novo Produto
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="glass-card p-8 space-y-8">
          <div className="flex items-center gap-3 text-amber-500">
            <ShoppingBag className="w-5 h-5" />
            <h3 className="text-lg font-bold uppercase tracking-wider">
              {editingId ? 'Editar Produto' : 'Novo Produto'}
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Nome do Produto</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ex: Smash Burger Duplo"
                className="premium-input"
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Categoria</label>
              <div className="relative">
                <select
                  value={form.categoryId}
                  onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                  className="premium-input appearance-none cursor-pointer pr-10"
                >
                  <option value="">Selecione uma categoria</option>
                  {state.categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Preço (R$)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                placeholder="0,00"
                className="premium-input"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">URL da Imagem</label>
              <input
                type="text"
                value={form.imageUrl}
                onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                placeholder="https://exemplo.com/hamburguer.jpg"
                className="premium-input"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Descrição</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Descreva o produto, pontos da carne, acompanhamentos..."
              rows={3}
              className="premium-input resize-none"
            />
          </div>

          <div className="space-y-4">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1 flex items-center justify-between">
              Personalização / Ingredientes
              <span className="text-[10px] text-gray-600 font-normal">Opcionais que o cliente pode remover</span>
            </label>

            <div className="flex gap-3">
              <input
                type="text"
                value={newIngredient}
                onChange={(e) => setNewIngredient(e.target.value)}
                onKeyDown={handleIngredientKeyDown}
                placeholder="Digite o ingrediente..."
                className="premium-input flex-1"
              />
              <button
                type="button"
                onClick={handleAddIngredient}
                className="bg-white/5 hover:bg-white/10 text-white min-w-[54px] flex items-center justify-center rounded-xl transition-all cursor-pointer"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>

            {form.ingredients.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {form.ingredients.map((ing, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between bg-white/[0.02] border border-white/[0.05] rounded-xl px-4 py-3 group"
                  >
                    <span className="text-sm font-medium text-gray-300">{ing.name}</span>
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 cursor-pointer group/check">
                        <div className="relative flex items-center">
                          <input
                            type="checkbox"
                            checked={ing.removable}
                            onChange={() => toggleRemovable(idx)}
                            className="w-4 h-4 rounded border-white/20 bg-transparent text-amber-500 focus:ring-amber-500/20 cursor-pointer"
                          />
                        </div>
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider group-hover/check:text-amber-500 transition-colors">Removível</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => handleRemoveIngredient(idx)}
                        className="text-gray-600 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 py-2">
            <label className="flex items-center gap-3 cursor-pointer group">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(e) => setForm({ ...form, active: e.target.checked })}
                  className="w-10 h-5 bg-white/10 rounded-full appearance-none checked:bg-green-500/20 transition-all cursor-pointer border border-white/10"
                />
                <div className={`absolute top-1 left-1 w-3 h-3 rounded-full transition-all ${form.active ? 'translate-x-5 bg-green-500' : 'bg-gray-500'}`}></div>
              </div>
              <span className="text-sm font-bold text-gray-400 group-hover:text-white transition-colors">Disponível no Cardápio</span>
            </label>
          </div>

          <div className="flex gap-4 pt-4">
            <button type="submit" className="premium-button flex-1">
              <Check className="w-5 h-5" />
              {editingId ? 'Salvar Alterações' : 'Confirmar Cadastro'}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 font-bold transition-all cursor-pointer"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {state.products.length === 0 ? (
        <div className="glass-card p-20 text-center flex flex-col items-center border-dashed border-amber-500/20">
          <div className="w-20 h-20 bg-amber-500/5 rounded-full flex items-center justify-center mb-6">
            <ShoppingBag className="w-10 h-10 text-gray-700" />
          </div>
          <p className="text-xl font-bold text-gray-400">Nenhum produto cadastrado</p>
          <p className="text-gray-500 mt-2 max-w-xs">Adicione seu primeiro hamburguer ou bebida para começar a vender.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {state.products.map((product) => {
            const isExpanded = expandedProduct === product.id
            return (
              <div
                key={product.id}
                className="glass-card group overflow-hidden border-white/5 hover:border-amber-500/20 transition-all"
              >
                <div className="p-4 flex items-center gap-4">
                  {/* Imagem do Produto */}
                  <div className="w-16 h-16 md:w-20 md:h-20 shrink-0 rounded-xl overflow-hidden bg-white/5 relative border border-white/10 group-hover:border-amber-500/30 transition-colors">
                    {product.imageUrl ? (
                      <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-700">
                        <ShoppingBag className="w-8 h-8" />
                      </div>
                    )}
                    <div className={`absolute top-1 right-1 w-2.5 h-2.5 rounded-full border-2 border-black ${product.active ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  </div>

                  {/* Informações */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-black text-white uppercase tracking-tight truncate italic">{product.name}</h4>
                      <span className="hidden sm:inline-block text-[8px] bg-white/5 text-gray-500 px-1.5 py-0.5 rounded uppercase font-bold border border-white/10 tracking-widest leading-none">
                        {getCategoryName(product.categoryId)}
                      </span>
                    </div>
                    
                    <div className="mt-1 flex flex-col">
                      <div className="flex items-baseline gap-1">
                        <span className="text-[10px] text-amber-500/50 font-bold">R$</span>
                        <span className="text-xl font-black text-white italic tracking-tight">
                          {product.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <span className={`text-[7px] font-black uppercase tracking-[0.2em] -mt-0.5 ${product.active ? 'text-green-500/40' : 'text-red-500/40'}`}>
                        {product.active ? 'Operação Ativa' : 'Pausado Temporariamente'}
                      </span>
                    </div>
                  </div>

                  {/* Ações */}
                  <div className="flex items-center gap-1 md:gap-2">
                    <button
                      onClick={() => toggleActive(product)}
                      className={`p-2.5 rounded-xl transition-all border ${product.active ? 'bg-green-500/10 border-green-500/20 text-green-500' : 'bg-red-500/10 border-red-500/20 text-red-500'} cursor-pointer`}
                      title={product.active ? 'Desativar' : 'Ativar'}
                    >
                      <CircleMinus className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleEdit(product)}
                      className="p-2.5 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-xl border border-white/10 transition-all cursor-pointer"
                      title="Editar"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(product.id)}
                      className="p-2.5 bg-red-500/5 hover:bg-red-500/20 text-red-500/50 hover:text-red-500 rounded-xl border border-red-500/10 transition-all cursor-pointer"
                      title="Excluir"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setExpandedProduct(isExpanded ? null : product.id)}
                      className={`p-2.5 bg-amber-500/5 text-amber-500 rounded-xl border border-amber-500/10 transition-all cursor-pointer ${isExpanded ? 'rotate-180' : ''}`}
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-4 pb-6 pt-2 border-t border-white/5 bg-white/[0.01] animate-fade-in space-y-4">
                    <div className="md:grid md:grid-cols-2 md:gap-8 space-y-4 md:space-y-0 p-2">
                      {product.description && (
                        <div className="space-y-1.5">
                          <p className="text-[8px] font-black text-gray-600 uppercase tracking-[0.3em]">Descrição Estilo Noir</p>
                          <p className="text-xs text-gray-400 italic leading-relaxed">{product.description}</p>
                        </div>
                      )}
                      
                      {product.ingredients?.length > 0 && (
                        <div className="space-y-3">
                          <p className="text-[8px] font-black text-gray-600 uppercase tracking-[0.3em]">Composição do Burger</p>
                          <div className="flex flex-wrap gap-1.5">
                            {product.ingredients.map((ing, idx) => (
                              <div key={idx} className={`px-3 py-1.5 rounded-lg text-[9px] font-bold border transition-all ${
                                ing.removable 
                                  ? 'bg-amber-500/10 border-amber-500/20 text-amber-500 shadow-[0_5px_10px_rgba(245,158,11,0.05)]' 
                                  : 'bg-white/5 border-white/10 text-gray-500'
                              }`}>
                                {ing.name}
                                {ing.removable && <span className="ml-1 opacity-50 uppercase text-[7px]">±</span>}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
