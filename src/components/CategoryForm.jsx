import { useState } from 'react'
import { Plus, Pencil, Trash2, X, Check, Tag } from 'lucide-react'
import { useStore } from '../store/StoreContext'

export default function CategoryForm() {
  const { state, dispatch } = useStore()
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState({ name: '', description: '' })

  function resetForm() {
    setForm({ name: '', description: '' })
    setEditingId(null)
    setShowForm(false)
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim()) return

    if (editingId) {
      dispatch({ type: 'UPDATE_CATEGORY', payload: { id: editingId, ...form } })
    } else {
      dispatch({ type: 'ADD_CATEGORY', payload: form })
    }
    resetForm()
  }

  function handleEdit(category) {
    setForm({ name: category.name, description: category.description })
    setEditingId(category.id)
    setShowForm(true)
  }

  function handleDelete(id) {
    const hasProducts = state.products.some((p) => p.categoryId === id)
    if (hasProducts) {
      alert('Nao e possivel excluir uma categoria que possui produtos vinculados.')
      return
    }
    dispatch({ type: 'DELETE_CATEGORY', payload: id })
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight">Categorias</h2>
          <p className="text-sm text-gray-400 font-medium mt-1">Gestão centralizada do cardápio</p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="premium-button cursor-pointer"
          >
            <Plus className="w-5 h-5" />
            Nova Categoria
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="glass-card p-8 space-y-6">
          <div className="flex items-center gap-3 text-amber-500">
            <Tag className="w-5 h-5" />
            <h3 className="text-lg font-bold uppercase tracking-wider">
              {editingId ? 'Editar Categoria' : 'Nova Categoria'}
            </h3>
          </div>

          <div className="grid gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Nome da Categoria</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ex: Hambúrgueres Artesanais"
                className="premium-input"
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Descrição</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Uma breve descrição sobre os produtos desta categoria..."
                rows={3}
                className="premium-input resize-none"
              />
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button type="submit" className="premium-button flex-1 shadow-lg shadow-amber-500/10">
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

      {state.categories.length === 0 ? (
        <div className="glass-card p-20 text-center flex flex-col items-center border-dashed border-amber-500/20">
          <div className="w-20 h-20 bg-amber-500/5 rounded-full flex items-center justify-center mb-6">
            <Tag className="w-10 h-10 text-gray-700" />
          </div>
          <p className="text-xl font-bold text-gray-400">Nenhuma categoria encontrada</p>
          <p className="text-gray-500 mt-2 max-w-xs">Comece adicionando uma categoria para organizar seus produtos.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {state.categories.map((category) => {
            const productCount = state.products.filter((p) => p.categoryId === category.id).length
            return (
              <div
                key={category.id}
                className="glass-card p-6 flex items-center justify-between"
              >
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 bg-gradient-to-br from-amber-500/20 to-amber-500/5 rounded-2xl flex items-center justify-center border border-amber-500/20">
                    <Tag className="w-6 h-6 text-amber-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">{category.name}</h3>
                    {category.description && <p className="text-sm text-gray-500 mt-1 line-clamp-1">{category.description}</p>}
                    <div className="flex items-center gap-2 mt-2">
                       <span className="text-[10px] bg-amber-500/10 text-amber-500 font-black px-2 py-0.5 rounded-md uppercase tracking-wider italic">
                         {productCount} {productCount === 1 ? 'item' : 'itens'}
                       </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleEdit(category)}
                    className="action-btn text-gray-500 hover:text-amber-500 hover:bg-amber-500/5"
                    title="Editar"
                  >
                    <Pencil className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(category.id)}
                    className="action-btn text-gray-500 hover:text-red-500 hover:bg-red-500/5"
                    title="Excluir"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
