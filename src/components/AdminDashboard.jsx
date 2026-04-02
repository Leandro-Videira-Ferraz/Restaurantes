import { useState } from 'react'
import { Power, AlertTriangle, Clock, TrendingUp, ShoppingBag, Users } from 'lucide-react'
import { useStore, checkOpenStatus } from '../store/StoreContext'

export default function AdminDashboard() {
  const { state, dispatch } = useStore()
  const { settings } = state
  const [showWarning, setShowWarning] = useState(false)

  // Verifica se DEVERIA estar aberta pelo horário configurado
  const shouldBeOpen = checkOpenStatus(settings)
  const isCurrentlyOpen = settings.isOpen

  const handleToggleStore = () => {
    // Se estiver tentando abrir mas o horário diz que devia estar fechada
    if (!isCurrentlyOpen && !shouldBeOpen) {
      setShowWarning(true)
      return
    }
    
    // Se não, faz o toggle normal
    dispatch({ type: 'UPDATE_SETTINGS', payload: { isOpen: !isCurrentlyOpen } })
  }

  const confirmForceOpen = () => {
    dispatch({ type: 'UPDATE_SETTINGS', payload: { isOpen: true } })
    setShowWarning(false)
  }

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      <div className="space-y-2">
        <h2 className="text-3xl font-black text-white tracking-tight italic uppercase">Gestão <span className="text-amber-500">Operacional</span></h2>
        <p className="text-sm text-gray-400 font-medium">Controle o status da sua loja em tempo real</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Card de Controle Principal */}
        <div className="md:col-span-2 glass-card p-10 flex flex-col items-center justify-center text-center space-y-8 border-white/5 relative overflow-hidden">
          {/* Efeito Visual de Status */}
          <div className={`absolute inset-0 opacity-10 transition-colors duration-700 ${isCurrentlyOpen ? 'bg-green-500/10' : 'bg-red-500/10'}`}></div>
          
          <div className={`w-24 h-24 rounded-[2.5rem] flex items-center justify-center relative z-10 transition-all duration-700 ${
            isCurrentlyOpen ? 'bg-green-500 shadow-[0_0_50px_rgba(34,197,94,0.3)]' : 'bg-red-500 shadow-[0_0_50px_rgba(239,68,68,0.3)]'
          }`}>
             <Power className="w-10 h-10 text-black" />
          </div>

          <div className="space-y-2 relative z-10">
             <h3 className="text-4xl font-black text-white italic uppercase tracking-tight">Sua loja está <span className={isCurrentlyOpen ? 'text-green-500' : 'text-red-500'}>{isCurrentlyOpen ? 'ABERTA' : 'FECHADA'}</span></h3>
             <p className="text-gray-500 font-bold text-xs uppercase tracking-widest">Clique no botão abaixo para alterar o status</p>
          </div>

          <button 
            onClick={handleToggleStore}
            className={`px-12 py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-xs transition-all relative z-10 shadow-2xl active:scale-95 ${
              isCurrentlyOpen 
                ? 'bg-red-500 hover:bg-red-400 text-white shadow-red-500/20' 
                : 'bg-green-500 hover:bg-green-400 text-black shadow-green-500/20'
            }`}
          >
            {isCurrentlyOpen ? 'Encerrar Atividades' : 'Iniciar Atividades'}
          </button>
        </div>

        {/* Card de Informação Rápida */}
        <div className="space-y-8">
           <div className="glass-card p-6 border-white/5 flex flex-col gap-4">
              <div className="flex items-center gap-3 text-amber-500">
                 <Clock className="w-5 h-5" />
                 <h4 className="text-[10px] font-black uppercase tracking-widest">Horário Programado</h4>
              </div>
              <div className="space-y-1">
                 <p className="text-sm font-bold text-white uppercase italic">Hoje (Segunda)</p>
                 <p className="text-xs text-gray-400 uppercase font-bold tracking-widest">18:00 às 23:00</p>
              </div>
              <div className={`mt-2 px-3 py-2 rounded-lg text-[10px] font-black uppercase flex items-center gap-2 ${
                shouldBeOpen ? 'bg-green-500/10 text-green-500' : 'bg-gray-500/10 text-gray-500'
              }`}>
                 <div className={`w-1.5 h-1.5 rounded-full ${shouldBeOpen ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`}></div>
                 {shouldBeOpen ? 'Dentro do Horário' : 'Fora do Horário'}
              </div>
           </div>

           <div className="glass-card p-6 border-white/5 flex flex-col gap-4">
              <div className="flex items-center gap-3 text-amber-500">
                 <TrendingUp className="w-5 h-5" />
                 <h4 className="text-[10px] font-black uppercase tracking-widest">Status do Servidor</h4>
              </div>
              <div className="flex items-center justify-between">
                 <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Latência</span>
                 <span className="text-xs font-black text-green-500">12ms - EXCELENTE</span>
              </div>
           </div>
        </div>
      </div>

      {/* Modal de Aviso de Horário */}
      {showWarning && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 sm:p-0">
           <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowWarning(false)}></div>
           <div className="glass-card max-w-md w-full p-8 border-red-500/20 relative z-10 space-y-6 text-center animate-slide-up">
              <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto text-red-500 shadow-[0_0_30px_rgba(239,68,68,0.1)]">
                 <AlertTriangle className="w-10 h-10" />
              </div>
              <div className="space-y-2">
                 <h3 className="text-2xl font-black text-white italic uppercase tracking-tight">Atenção!</h3>
                 <p className="text-sm text-gray-400 font-medium leading-relaxed uppercase tracking-tighter">
                   Você está tentando abrir a loja <span className="text-red-500">FORA DO SEU HORÁRIO</span> de escala semanal.
                 </p>
              </div>
              <div className="pt-4 flex flex-col sm:flex-row gap-4">
                 <button 
                  onClick={() => setShowWarning(false)}
                  className="flex-1 px-6 py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all"
                 >
                   Cancelar
                 </button>
                 <button 
                  onClick={confirmForceOpen}
                  className="flex-1 px-6 py-4 bg-red-500 hover:bg-red-400 text-black rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl shadow-red-500/20"
                 >
                   Abrir Mesmo Assim
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  )
}
