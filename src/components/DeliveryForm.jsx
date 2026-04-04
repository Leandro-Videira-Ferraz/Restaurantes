import { Bike, ShieldCheck, MapPin, Plus, Trash2, Clock, ShoppingCart } from 'lucide-react'
import { useStore } from '../store/StoreContext'
import { useState } from 'react'

export default function DeliveryForm() {
  const { state, dispatch } = useStore()
  const { settings } = state
  const [newNeighborhood, setNewNeighborhood] = useState({ name: '', fee: '' })

  const updateDefaultFee = (val) => {
    dispatch({ 
        type: 'UPDATE_SETTINGS', 
        payload: { deliveryFee: parseFloat(val) || 0 } 
    })
  }

  const addNeighborhood = () => {
    if (!newNeighborhood.name || !newNeighborhood.fee) return
    const updated = [...(settings.neighborhoodFees || []), { 
        id: Date.now(), 
        name: newNeighborhood.name.toUpperCase(), 
        fee: parseFloat(newNeighborhood.fee) 
    }]
    dispatch({ type: 'UPDATE_SETTINGS', payload: { neighborhoodFees: updated } })
    setNewNeighborhood({ name: '', fee: '' })
  }

  const removeNeighborhood = (id) => {
    const updated = settings.neighborhoodFees.filter(n => n.id !== id)
    dispatch({ type: 'UPDATE_SETTINGS', payload: { neighborhoodFees: updated } })
  }

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight italic uppercase">Gestão de <span className="text-amber-500">Entrega</span></h2>
          <p className="text-sm text-gray-400 font-medium mt-1">Configure as taxas que seus clientes pagarão</p>
        </div>
      </div>

      {/* Configs Operacionais */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card p-6 space-y-3">
          <div className="flex items-center gap-3">
            <ShoppingCart className="w-5 h-5 text-amber-500" />
            <h3 className="text-sm font-black text-white uppercase italic">Pedido Mínimo</h3>
          </div>
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Valor mínimo para delivery</p>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-500 font-black text-xs">R$</span>
            <input
              type="number"
              step="0.50"
              min="0"
              placeholder="0,00"
              value={settings.minimumOrderValue ?? 0}
              onChange={e => dispatch({ type: 'UPDATE_SETTINGS', payload: { minimumOrderValue: parseFloat(e.target.value) || 0 } })}
              className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-lg font-black text-white italic focus:outline-none focus:border-amber-500/50"
            />
          </div>
        </div>

        <div className="glass-card p-6 space-y-3">
          <div className="flex items-center gap-3">
            <Bike className="w-5 h-5 text-purple-400" />
            <h3 className="text-sm font-black text-white uppercase italic">Tempo Delivery</h3>
          </div>
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Estimativa em minutos</p>
          <div className="relative">
            <input
              type="number"
              step="5"
              min="1"
              placeholder="40"
              value={settings.estimatedDeliveryTime ?? 40}
              onChange={e => dispatch({ type: 'UPDATE_SETTINGS', payload: { estimatedDeliveryTime: parseInt(e.target.value) || 40 } })}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-lg font-black text-white italic focus:outline-none focus:border-amber-500/50"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-black text-[10px] uppercase tracking-widest">min</span>
          </div>
        </div>

        <div className="glass-card p-6 space-y-3">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-black text-white uppercase italic">Tempo Retirada</h3>
          </div>
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Estimativa em minutos</p>
          <div className="relative">
            <input
              type="number"
              step="5"
              min="1"
              placeholder="20"
              value={settings.estimatedPickupTime ?? 20}
              onChange={e => dispatch({ type: 'UPDATE_SETTINGS', payload: { estimatedPickupTime: parseInt(e.target.value) || 20 } })}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-lg font-black text-white italic focus:outline-none focus:border-amber-500/50"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-black text-[10px] uppercase tracking-widest">min</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Taxa Padrão */}
        <div className="lg:col-span-1 space-y-6">
           <div className="glass-card p-8 flex flex-col items-center text-center space-y-6 border-amber-500/10">
              <div className="w-20 h-20 bg-amber-500/10 rounded-3xl flex items-center justify-center relative">
                 <div className="absolute inset-0 bg-amber-500/10 blur-xl rounded-full"></div>
                 <Bike className="w-10 h-10 text-amber-500" />
              </div>
              
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-white uppercase italic">Taxa de Entrega Padrão</h3>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Cobrada em bairros não cadastrados</p>
              </div>

              <div className="w-full relative">
                 <span className="absolute left-5 top-1/2 -translate-y-1/2 text-amber-500 font-black text-xs uppercase tracking-widest not-italic">R$</span>
                 <input 
                    type="number"
                    step="0.50"
                    placeholder="0,00"
                    value={settings.deliveryFee}
                    onChange={(e) => updateDefaultFee(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-2xl pl-12 pr-6 py-5 text-2xl font-black text-white italic focus:outline-none focus:border-amber-500/50"
                 />
              </div>

              <div className="flex items-center gap-2 p-3 bg-white/[0.02] rounded-xl text-[10px] text-gray-500 uppercase font-bold tracking-widest">
                 <ShieldCheck className="w-4 h-4 text-green-500" />
                 Atualização Automática
              </div>
           </div>
        </div>

        {/* Gerenciamento Bairros */}
        <div className="lg:col-span-2">
            <div className="glass-card shadow-xl overflow-hidden self-start">
               <div className="p-8 border-b border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                     <MapPin className="w-6 h-6 text-amber-500" />
                     <h3 className="text-xl font-bold text-white uppercase italic tracking-tight">Taxas por Bairro</h3>
                  </div>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <span className={`text-[10px] font-black uppercase tracking-widest transition-colors ${settings.useNeighborhoodFees ? 'text-amber-500' : 'text-gray-600'}`}>
                      {settings.useNeighborhoodFees ? 'Ativado' : 'Desativado'}
                    </span>
                    <input 
                      type="checkbox" 
                      checked={settings.useNeighborhoodFees} 
                      onChange={(e) => dispatch({ type: 'UPDATE_SETTINGS', payload: { useNeighborhoodFees: e.target.checked } })}
                      className="w-12 h-6 bg-white/5 rounded-full appearance-none checked:bg-amber-500/20 transition-all cursor-pointer border border-white/10 relative before:content-[''] before:absolute before:w-4 before:h-4 before:bg-gray-600 before:rounded-full before:top-1 before:left-1 checked:before:left-7 checked:before:bg-amber-500 before:transition-all"
                    />
                  </label>
               </div>
               
               <div className="p-8 bg-white/[0.01] space-y-6">
                  {/* Novo Bairro */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                     <div className="sm:col-span-7">
                        <label className="text-[9px] font-black text-gray-600 uppercase tracking-widest ml-1">Nome do Bairro</label>
                        <input 
                           type="text" 
                           placeholder="EX: CENTRO"
                           value={newNeighborhood.name}
                           onChange={(e) => setNewNeighborhood({ ...newNeighborhood, name: e.target.value })}
                           className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500/30"
                        />
                     </div>
                     <div className="sm:col-span-3">
                        <label className="text-[9px] font-black text-gray-600 uppercase tracking-widest ml-1">Valor Taxa (R$)</label>
                        <input 
                           type="number" 
                           placeholder="0,00"
                           value={newNeighborhood.fee}
                           onChange={(e) => setNewNeighborhood({ ...newNeighborhood, fee: e.target.value })}
                           className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500/30 font-bold"
                        />
                     </div>
                     <div className="sm:col-span-2 flex items-end">
                        <button 
                           onClick={addNeighborhood}
                           className="w-full h-[46px] bg-amber-500 hover:bg-amber-400 text-black rounded-xl flex items-center justify-center transition-all shadow-lg active:scale-95"
                        >
                           <Plus className="w-6 h-6" />
                        </button>
                     </div>
                  </div>

                  {/* Lista de Bairros */}
                  <div className="pt-4 divide-y divide-white/5 max-h-[300px] overflow-y-auto scrollbar-hide">
                     {(!settings.neighborhoodFees || settings.neighborhoodFees.length === 0) ? (
                        <p className="text-xs text-gray-600 italic text-center py-8">Nenhum bairro cadastrado com taxa personalizada.</p>
                     ) : (
                        settings.neighborhoodFees.map((n) => (
                           <div key={n.id} className="flex items-center justify-between py-4 group">
                              <div className="flex items-center gap-4">
                                 <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-gray-600 group-hover:text-amber-500 transition-colors">
                                    <MapPin className="w-4 h-4" />
                                 </div>
                                 <span className="text-sm font-bold text-white uppercase tracking-tight">{n.name}</span>
                              </div>
                              <div className="flex items-center gap-6">
                                 <span className="text-sm font-black text-amber-500 italic">R$ {parseFloat(n.fee).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                 <button 
                                    onClick={() => removeNeighborhood(n.id)}
                                    className="p-2 text-gray-800 hover:text-red-500 transition-colors cursor-pointer"
                                 >
                                    <Trash2 className="w-4 h-4" />
                                 </button>
                              </div>
                           </div>
                        ))
                     )}
                  </div>
               </div>
            </div>
        </div>
      </div>
    </div>
  )
}
