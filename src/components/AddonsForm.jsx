import { useState } from 'react'
import { Plus, Pencil, Trash2, X, Check, Layers, ChevronDown, ChevronUp, GripVertical } from 'lucide-react'
import { useStore } from '../store/StoreContext'

const emptyForm = {
  name: '',
  price: '',
  category: '',
  maxQuantity: 1,
  active: true,
}

export default function AddonsForm() {
  const { state, dispatch } = useStore()
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [filterCategory, setFilterCategory] = useState('')

  const addons = state.addons || []

  // Categorias únicas dos adicionais
  const addonCategories = [...new Set(addons.map(a => a.category).filter(Boolean))]

  function resetForm() {
    setForm(emptyForm)
    setEditingId(null)
    setShowForm(false)
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim() || !form.price) return

    const payload = {
      ...form,
      price: parseFloat(form.price),
      maxQuantity: parseInt(form.maxQuantity) || 1,
    }

    if (editingId) {
      dispatch({ type: 'UPDATE_ADDON', payload: { id: editingId, ...payload } })
    } else {
      dispatch({ type: 'ADD_ADDON', payload })
    }
    resetForm()
  }

  function handleEdit(addon) {
    setForm({
      name: addon.name,
      price: String(addon.price),
      category: addon.category || '',
      maxQuantity: addon.maxQuantity || 1,
      active: addon.active,
    })
    setEditingId(addon.id)
    setShowForm(true)
  }

  function handleDelete(id) {
    dispatch({ type: 'DELETE_ADDON', payload: id })
  }

  function toggleActive(addon) {
    dispatch({ type: 'UPDATE_ADDON', payload: { id: addon.id, active: !addon.active } })
  }

  function formatPrice(value) {
    return Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  }

  const filteredAddons = filterCategory
    ? addons.filter(a => a.category === filterCategory)
    : addons

  // Agrupar adicionais por categoria
  const grouped = filteredAddons.reduce((acc, addon) => {
    const cat = addon.category || 'Sem categoria'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(addon)
    return acc
  }, {})

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight">Adicionais</h2>
          <p className="text-sm text-gray-400 font-medium mt-1">Extras que o cliente pode adicionar ao pedido</p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="premium-button cursor-pointer"
          >
            <Plus className="w-5 h-5" />
            Novo Adicional
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="glass-card p-8 space-y-8">
          <div className="flex items-center gap-3 text-amber-500">
            <Layers className="w-5 h-5" />
            <h3 className="text-lg font-bold uppercase tracking-wider">
              {editingId ? 'Editar Adicional' : 'Novo Adicional'}
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Nome do Adicional</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ex: Bacon Extra, Cheddar, Ovo"
                className="premium-input"
                autoFocus
              />
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
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">
                Grupo / Categoria
                <span className="text-[10px] text-gray-600 font-normal ml-2">(opcional, para organizar)</span>
              </label>
              <input
                type="text"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                placeholder="Ex: Proteínas, Molhos, Extras..."
                className="premium-input"
                list="addon-categories"
              />
              <datalist id="addon-categories">
                {addonCategories.map((cat, idx) => (
                  <option key={idx} value={cat} />
                ))}
              </datalist>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">
                Máx. por item
                <span className="text-[10px] text-gray-600 font-normal ml-2">(quantas vezes pode adicionar)</span>
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={form.maxQuantity}
                onChange={(e) => setForm({ ...form, maxQuantity: e.target.value })}
                className="premium-input"
              />
            </div>
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
              <span className="text-sm font-bold text-gray-400 group-hover:text-white transition-colors">Disponível para seleção</span>
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

      {/* Filtro por categoria */}
      {addonCategories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilterCategory('')}
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer border ${
              !filterCategory
                ? 'bg-amber-500 text-black border-amber-500'
                : 'bg-white/5 text-gray-500 border-white/10 hover:text-white hover:border-white/20'
            }`}
          >
            Todos ({addons.length})
          </button>
          {addonCategories.map((cat) => {
            const count = addons.filter(a => a.category === cat).length
            return (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer border ${
                  filterCategory === cat
                    ? 'bg-amber-500 text-black border-amber-500'
                    : 'bg-white/5 text-gray-500 border-white/10 hover:text-white hover:border-white/20'
                }`}
              >
                {cat} ({count})
              </button>
            )
          })}
        </div>
      )}

      {addons.length === 0 ? (
        <div className="glass-card p-20 text-center flex flex-col items-center border-dashed border-amber-500/20">
          <div className="w-20 h-20 bg-amber-500/5 rounded-full flex items-center justify-center mb-6">
            <Layers className="w-10 h-10 text-gray-700" />
          </div>
          <p className="text-xl font-bold text-gray-400">Nenhum adicional cadastrado</p>
          <p className="text-gray-500 mt-2 max-w-xs">Cadastre extras como bacon, cheddar, molhos e muito mais.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped).map(([category, items]) => (
            <div key={category} className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-white/10"></div>
                <span className="text-[10px] font-black text-amber-500 uppercase tracking-[0.3em] px-3">{category}</span>
                <div className="h-px flex-1 bg-gradient-to-l from-transparent via-white/10 to-white/10"></div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {items.map((addon) => (
                  <div
                    key={addon.id}
                    className={`glass-card group p-4 flex items-center gap-4 border-white/5 hover:border-amber-500/20 transition-all ${
                      !addon.active ? 'opacity-40' : ''
                    }`}
                  >
                    {/* Indicador */}
                    <div className={`w-2 h-2 rounded-full shrink-0 ${addon.active ? 'bg-green-500' : 'bg-red-500'}`}></div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-black text-white uppercase tracking-tight truncate">{addon.name}</h4>
                      <div className="flex items-baseline gap-1 mt-0.5">
                        <span className="text-[10px] text-amber-500/50 font-bold">+R$</span>
                        <span className="text-lg font-black text-white italic tracking-tight">
                          {addon.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      {addon.maxQuantity > 1 && (
                        <span className="text-[8px] text-gray-600 font-bold uppercase tracking-widest">
                          máx. {addon.maxQuantity}x por item
                        </span>
                      )}
                    </div>

                    {/* Ações */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => toggleActive(addon)}
                        className={`p-2 rounded-xl transition-all cursor-pointer ${
                          addon.active
                            ? 'text-green-500 hover:bg-green-500/10'
                            : 'text-red-500 hover:bg-red-500/10'
                        }`}
                        title={addon.active ? 'Desativar' : 'Ativar'}
                      >
                        <div className={`w-3 h-3 rounded-full border-2 ${addon.active ? 'border-green-500 bg-green-500' : 'border-red-500'}`}></div>
                      </button>
                      <button
                        onClick={() => handleEdit(addon)}
                        className="p-2 text-gray-400 hover:text-white rounded-xl transition-all cursor-pointer"
                        title="Editar"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(addon.id)}
                        className="p-2 text-red-500/50 hover:text-red-500 rounded-xl transition-all cursor-pointer"
                        title="Excluir"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
