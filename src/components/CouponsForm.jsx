import { useState } from 'react'
import { Tag, Plus, Trash2, Percent, DollarSign, Bike } from 'lucide-react'
import { useStore } from '../store/StoreContext'

const TYPE_LABEL = { percent: 'Percentual (%)', fixed: 'Valor Fixo (R$)', shipping: 'Frete Grátis' }
const TYPE_ICON = { percent: Percent, fixed: DollarSign, shipping: Bike }

export default function CouponsForm() {
  const { state, dispatch } = useStore()
  const coupons = state.settings.coupons || []

  const [form, setForm] = useState({ code: '', type: 'percent', value: '', minOrder: '', maxUses: '' })

  const addCoupon = () => {
    if (!form.code || (form.type !== 'shipping' && !form.value)) return
    const updated = [...coupons, {
      id: crypto.randomUUID(),
      code: form.code.toUpperCase().trim(),
      type: form.type,
      value: parseFloat(form.value) || 0,
      minOrder: parseFloat(form.minOrder) || 0,
      maxUses: parseInt(form.maxUses) || 0,
      usedCount: 0,
      active: true,
    }]
    dispatch({ type: 'UPDATE_SETTINGS', payload: { coupons: updated } })
    setForm({ code: '', type: 'percent', value: '', minOrder: '', maxUses: '' })
  }

  const toggleCoupon = (id) => {
    const updated = coupons.map(c => c.id === id ? { ...c, active: !c.active } : c)
    dispatch({ type: 'UPDATE_SETTINGS', payload: { coupons: updated } })
  }

  const removeCoupon = (id) => {
    const updated = coupons.filter(c => c.id !== id)
    dispatch({ type: 'UPDATE_SETTINGS', payload: { coupons: updated } })
  }

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      <div>
        <h2 className="text-3xl font-black text-white tracking-tight italic uppercase">Cupons de <span className="text-amber-500">Desconto</span></h2>
        <p className="text-sm text-gray-400 font-medium mt-1">Crie promoções para seus clientes</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Formulário */}
        <div className="lg:col-span-1">
          <div className="glass-card p-8 space-y-6">
            <h3 className="text-lg font-black text-white uppercase italic tracking-tight">Novo Cupom</h3>

            <div className="space-y-4">
              <div>
                <label className="text-[9px] font-black text-gray-600 uppercase tracking-widest ml-1">Código do Cupom</label>
                <input
                  type="text"
                  placeholder="EX: PROMO10"
                  value={form.code}
                  onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-sm text-white font-black tracking-widest focus:outline-none focus:border-amber-500/30 mt-1"
                />
              </div>

              <div>
                <label className="text-[9px] font-black text-gray-600 uppercase tracking-widest ml-1">Tipo de Desconto</label>
                <select
                  value={form.type}
                  onChange={e => setForm({ ...form, type: e.target.value, value: '' })}
                  className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500/30 mt-1"
                >
                  <option value="percent" className="bg-black">Percentual (%)</option>
                  <option value="fixed" className="bg-black">Valor Fixo (R$)</option>
                  <option value="shipping" className="bg-black">Frete Grátis</option>
                </select>
              </div>

              {form.type !== 'shipping' && (
                <div>
                  <label className="text-[9px] font-black text-gray-600 uppercase tracking-widest ml-1">
                    {form.type === 'percent' ? 'Percentual (%)' : 'Valor (R$)'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder={form.type === 'percent' ? '10' : '5.00'}
                    value={form.value}
                    onChange={e => setForm({ ...form, value: e.target.value })}
                    className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500/30 mt-1 font-bold"
                  />
                </div>
              )}

              <div>
                <label className="text-[9px] font-black text-gray-600 uppercase tracking-widest ml-1">Pedido Mínimo (R$)</label>
                <input
                  type="number"
                  min="0"
                  placeholder="0,00 (sem mínimo)"
                  value={form.minOrder}
                  onChange={e => setForm({ ...form, minOrder: e.target.value })}
                  className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500/30 mt-1 font-bold"
                />
              </div>

              <div>
                <label className="text-[9px] font-black text-gray-600 uppercase tracking-widest ml-1">
                  Limite de Usos <span className="text-gray-700">(opcional)</span>
                </label>
                <input
                  type="number"
                  min="1"
                  placeholder="Ilimitado"
                  value={form.maxUses}
                  onChange={e => setForm({ ...form, maxUses: e.target.value })}
                  className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500/30 mt-1 font-bold"
                />
              </div>
            </div>

            <button
              onClick={addCoupon}
              disabled={!form.code || (form.type !== 'shipping' && !form.value)}
              className="w-full h-12 bg-amber-500 hover:bg-amber-400 disabled:opacity-30 text-black rounded-xl font-black uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Criar Cupom
            </button>
          </div>
        </div>

        {/* Lista */}
        <div className="lg:col-span-2">
          <div className="glass-card overflow-hidden shadow-xl">
            <div className="p-8 border-b border-white/5 flex items-center gap-3">
              <Tag className="w-6 h-6 text-amber-500" />
              <h3 className="text-xl font-bold text-white uppercase italic tracking-tight">Cupons Cadastrados</h3>
            </div>

            <div className="divide-y divide-white/5">
              {coupons.length === 0 ? (
                <p className="text-xs text-gray-600 italic text-center py-12">Nenhum cupom cadastrado ainda.</p>
              ) : coupons.map(coupon => {
                const Icon = TYPE_ICON[coupon.type] || Tag
                return (
                  <div key={coupon.id} className={`flex items-center justify-between p-6 group transition-all ${!coupon.active ? 'opacity-40' : ''}`}>
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${coupon.active ? 'bg-amber-500/10' : 'bg-white/5'}`}>
                        <Icon className={`w-5 h-5 ${coupon.active ? 'text-amber-500' : 'text-gray-600'}`} />
                      </div>
                      <div>
                        <p className="text-sm font-black text-white tracking-widest">{coupon.code}</p>
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                          {coupon.type === 'percent' && `${coupon.value}% de desconto`}
                          {coupon.type === 'fixed' && `R$ ${coupon.value.toFixed(2)} de desconto`}
                          {coupon.type === 'shipping' && 'Frete grátis'}
                          {coupon.minOrder > 0 ? ` · Mín. R$ ${coupon.minOrder.toFixed(2)}` : ''}
                        </p>
                        <p className="text-[10px] font-bold mt-0.5">
                          {coupon.maxUses > 0 ? (
                            <span className={coupon.usedCount >= coupon.maxUses ? 'text-red-500' : 'text-gray-600'}>
                              {coupon.usedCount || 0}/{coupon.maxUses} usos
                            </span>
                          ) : (
                            <span className="text-gray-700">{coupon.usedCount || 0} usos · ilimitado</span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => toggleCoupon(coupon.id)}
                        className={`text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                          coupon.active
                            ? 'bg-green-500/10 text-green-500 hover:bg-red-500/10 hover:text-red-500'
                            : 'bg-white/5 text-gray-500 hover:bg-green-500/10 hover:text-green-500'
                        }`}
                      >
                        {coupon.active ? 'Ativo' : 'Inativo'}
                      </button>
                      <button
                        onClick={() => removeCoupon(coupon.id)}
                        className="p-2 text-gray-700 hover:text-red-500 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
