import { Settings as SettingsIcon, Clock, ChevronRight, Palette, Image, Sun, Moon, MapPin } from 'lucide-react'
import { useStore } from '../store/StoreContext'

const colorPresets = [
  { name: 'Âmbar', hex: '#f59e0b' },
  { name: 'Vermelho', hex: '#ef4444' },
  { name: 'Esmeralda', hex: '#10b981' },
  { name: 'Azul', hex: '#3b82f6' },
  { name: 'Roxo', hex: '#8b5cf6' },
  { name: 'Rosa', hex: '#ec4899' },
  { name: 'Laranja', hex: '#f97316' },
  { name: 'Ciano', hex: '#06b6d4' },
]

export default function Settings() {
  const { state, dispatch } = useStore()
  const { settings } = state

  function updateOperatingHours(index, field, value) {
    const updatedHours = [...settings.operatingHours]
    updatedHours[index] = { ...updatedHours[index], [field]: value }
    dispatch({ type: 'UPDATE_SETTINGS', payload: { operatingHours: updatedHours } })
  }

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      <div>
        <h2 className="text-3xl font-black text-white tracking-tight italic uppercase">Configurações</h2>
        <p className="text-sm text-gray-400 font-medium mt-1">Gerencie a identidade e horários da sua loja</p>
      </div>

      {/* Identidade da Loja */}
      <div className="glass-card p-8 space-y-8 border-amber-500/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center">
            <SettingsIcon className="w-5 h-5 text-amber-500" />
          </div>
          <h3 className="text-xl font-bold text-white uppercase italic tracking-tight">Identidade da Hamburgueria</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Nome da Hamburgueria</label>
            <input 
              type="text" 
              value={settings.storeName || ''}
              onChange={(e) => dispatch({ type: 'UPDATE_SETTINGS', payload: { storeName: e.target.value.toUpperCase() } })}
              className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-sm text-white font-black italic focus:outline-none focus:border-amber-500/50 transition-all uppercase tracking-tight"
              placeholder="EX: BURGER KING"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Slogan ou Descrição Curta</label>
            <input 
              type="text" 
              value={settings.storeDescription || ''}
              onChange={(e) => dispatch({ type: 'UPDATE_SETTINGS', payload: { storeDescription: e.target.value.toUpperCase() } })}
              className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-sm text-white font-bold focus:outline-none focus:border-amber-500/50 transition-all uppercase tracking-widest"
              placeholder="EX: O MELHOR DA CIDADE"
            />
          </div>
        </div>
      </div>

      {/* Tema Visual */}
      <div className="glass-card p-8 space-y-8 border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${settings.accentColor}20` }}>
            <Palette className="w-5 h-5" style={{ color: settings.accentColor }} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white uppercase italic tracking-tight">Tema Visual</h3>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Personalize as cores do sistema</p>
          </div>
        </div>
        
        <div className="space-y-6">
          {/* Modo Claro/Escuro */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest ml-1" style={{ color: 'var(--text-muted)' }}>Aparência</label>
            <div className="flex gap-3">
              <button
                onClick={() => dispatch({ type: 'UPDATE_SETTINGS', payload: { themeMode: 'dark' } })}
                className={`flex-1 flex items-center justify-center gap-3 px-6 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all border ${
                  settings.themeMode === 'dark' 
                    ? 'border-amber-500/30 bg-amber-500/10 text-amber-500' 
                    : 'border-white/5 text-gray-500 hover:bg-white/5'
                }`}
              >
                <Moon className="w-4 h-4" />
                Escuro
              </button>
              <button
                onClick={() => dispatch({ type: 'UPDATE_SETTINGS', payload: { themeMode: 'light' } })}
                className={`flex-1 flex items-center justify-center gap-3 px-6 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all border ${
                  settings.themeMode === 'light' 
                    ? 'border-amber-500/30 bg-amber-500/10 text-amber-500' 
                    : 'border-white/5 text-gray-500 hover:bg-white/5'
                }`}
              >
                <Sun className="w-4 h-4" />
                Claro
              </button>
            </div>
          </div>

          {/* Cor Principal */}
          <label className="text-[10px] font-black uppercase tracking-widest ml-1" style={{ color: 'var(--text-muted)' }}>Cor Principal</label>
          <div className="flex flex-wrap gap-3">
            {colorPresets.map((color) => (
              <button
                key={color.hex}
                onClick={() => dispatch({ type: 'UPDATE_SETTINGS', payload: { accentColor: color.hex } })}
                className={`w-12 h-12 rounded-2xl transition-all active:scale-90 border-2 relative group ${
                  settings.accentColor === color.hex ? 'border-white scale-110 shadow-lg' : 'border-transparent hover:scale-105'
                }`}
                style={{ background: color.hex }}
                title={color.name}
              >
                {settings.accentColor === color.hex && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-3 h-3 bg-white rounded-full shadow-md"></div>
                  </div>
                )}
              </button>
            ))}
          </div>
          
          <div className="flex items-center gap-4 pt-2">
            <div className="w-12 h-12 rounded-2xl border-2 border-white/10 overflow-hidden">
              <input 
                type="color" 
                value={settings.accentColor || '#f59e0b'}
                onChange={(e) => dispatch({ type: 'UPDATE_SETTINGS', payload: { accentColor: e.target.value } })}
                className="w-16 h-16 -mt-2 -ml-2 cursor-pointer"
              />
            </div>
            <div className="flex-1">
              <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Cor Personalizada (HEX)</label>
              <input 
                type="text" 
                value={settings.accentColor || '#f59e0b'}
                onChange={(e) => {
                  if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
                    dispatch({ type: 'UPDATE_SETTINGS', payload: { accentColor: e.target.value } })
                  }
                }}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-sm text-white font-mono font-bold focus:outline-none focus:border-white/30 mt-1"
                placeholder="#f59e0b"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Logo */}
      <div className="glass-card p-8 space-y-8 border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${settings.accentColor}20` }}>
            <Image className="w-5 h-5" style={{ color: settings.accentColor }} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white uppercase italic tracking-tight">Logo da Marca</h3>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Será exibida no topo do sistema</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="w-24 h-24 bg-white/5 rounded-3xl border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
            {settings.logoUrl ? (
              <img src={settings.logoUrl} alt="Logo" className="w-full h-full object-contain p-2" />
            ) : (
              <Image className="w-8 h-8 text-gray-700" />
            )}
          </div>
          <div className="flex-1 space-y-2">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">URL da Logo</label>
            <input 
              type="url" 
              value={settings.logoUrl || ''}
              onChange={(e) => dispatch({ type: 'UPDATE_SETTINGS', payload: { logoUrl: e.target.value } })}
              className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-sm text-white font-bold focus:outline-none focus:border-white/30 transition-all"
              placeholder="https://exemplo.com/logo.png"
            />
            <p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest ml-1">Cole a URL de uma imagem PNG ou SVG</p>
          </div>
        </div>
      </div>

      {/* Endereço da Loja */}
      <div className="glass-card p-8 space-y-8 border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center">
            <MapPin className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white uppercase italic tracking-tight">Endereço da Loja</h3>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Usado como ponto de partida na otimização de rotas</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Endereço (Rua e Número)</label>
            <input
              type="text"
              value={settings.storeAddress || ''}
              onChange={(e) => dispatch({ type: 'UPDATE_SETTINGS', payload: { storeAddress: e.target.value } })}
              className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-sm text-white font-bold focus:outline-none focus:border-amber-500/50 transition-all"
              placeholder="Ex: Rua das Flores, 123"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Cidade e Estado</label>
            <input
              type="text"
              value={settings.storeCity || ''}
              onChange={(e) => dispatch({ type: 'UPDATE_SETTINGS', payload: { storeCity: e.target.value } })}
              className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-sm text-white font-bold focus:outline-none focus:border-amber-500/50 transition-all"
              placeholder="Ex: São Paulo, SP"
            />
            <p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest ml-1">
              A cidade é usada para geocodificar os endereços dos clientes
            </p>
          </div>
        </div>
      </div>

      {/* Horários de Funcionamento */}
      <div className="glass-card overflow-hidden">
        <div className="p-8 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Clock className="w-6 h-6 text-amber-500" />
            <h3 className="text-xl font-bold text-white uppercase italic tracking-tight">Horários de Funcionamento</h3>
          </div>
          <span className="text-[10px] bg-white/5 text-gray-500 font-bold px-3 py-1 rounded-full uppercase tracking-widest">Escala Semanal</span>
        </div>
        
        <div className="divide-y divide-white/5 bg-white/[0.01]">
          {settings.operatingHours.map((hour, idx) => (
            <div key={idx} className="p-6 flex flex-wrap items-center justify-between gap-6 hover:bg-white/[0.02] transition-colors">
              <div className="flex items-center gap-6 min-w-[150px]">
                <span className="text-sm font-black text-gray-400 uppercase tracking-widest w-20">{hour.day}</span>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input 
                    type="checkbox" 
                    checked={!hour.closed} 
                    onChange={(e) => updateOperatingHours(idx, 'closed', !e.target.checked)}
                    className="w-10 h-5 bg-white/10 rounded-full appearance-none checked:bg-amber-500/20 transition-all cursor-pointer border border-white/10"
                  />
                  <span className={`text-[10px] font-bold uppercase tracking-widest transition-colors ${!hour.closed ? 'text-amber-500' : 'text-gray-600'}`}>
                    {hour.closed ? 'Fechado' : 'Aberto'}
                  </span>
                </label>
              </div>

              {!hour.closed && (
                <div className="flex items-center gap-4">
                  <div className="space-y-1">
                    <span className="text-[8px] font-black text-gray-600 uppercase tracking-widest ml-1">Início</span>
                    <input 
                      type="time" 
                      value={hour.start}
                      onChange={(e) => updateOperatingHours(idx, 'start', e.target.value)}
                      className="bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-amber-500/50"
                    />
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-700 mt-4" />
                  <div className="space-y-1">
                    <span className="text-[8px] font-black text-gray-600 uppercase tracking-widest ml-1">Fim</span>
                    <input 
                      type="time" 
                      value={hour.end}
                      onChange={(e) => updateOperatingHours(idx, 'end', e.target.value)}
                      className="bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-amber-500/50"
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
