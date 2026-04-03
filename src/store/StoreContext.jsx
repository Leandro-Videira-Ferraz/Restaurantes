import { createContext, useContext, useReducer, useEffect } from 'react'

const StoreContext = createContext()

const STORAGE_KEY = 'burger-admin-data'

function loadFromStorage() {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    return data ? JSON.parse(data) : null
  } catch {
    return null
  }
}

const defaultState = {
  categories: [],
  products: [],
  addons: [],
  settings: {
    isOpen: true,
    storeName: 'BURGER ADMIN',
    storeDescription: 'GESTÃO DE HAMBURGUERIA',
    accentColor: '#f59e0b',
    themeMode: 'dark',
    logoUrl: '',
    deliveryFee: 5.00,
    minimumOrderValue: 0,
    estimatedDeliveryTime: 40,
    estimatedPickupTime: 20,
    useNeighborhoodFees: false,
    neighborhoodFees: [],
    coupons: [],
    operatingHours: [
      { day: 'Segunda', start: '18:00', end: '23:00', closed: false },
      { day: 'Terça', start: '18:00', end: '23:00', closed: false },
      { day: 'Quarta', start: '18:00', end: '23:00', closed: false },
      { day: 'Quinta', start: '18:00', end: '23:00', closed: false },
      { day: 'Sexta', start: '18:00', end: '00:00', closed: false },
      { day: 'Sábado', start: '18:00', end: '00:00', closed: false },
      { day: 'Domingo', start: '18:00', end: '23:00', closed: false },
    ],
  },
}

function reducer(state, action) {
  switch (action.type) {
    case 'UPDATE_SETTINGS':
      return {
        ...state,
        settings: { ...state.settings, ...action.payload },
      }
    case 'ADD_CATEGORY':
      return {
        ...state,
        categories: [...state.categories, { ...action.payload, id: crypto.randomUUID(), createdAt: new Date().toISOString() }],
      }
    case 'UPDATE_CATEGORY':
      return {
        ...state,
        categories: state.categories.map((c) => (c.id === action.payload.id ? { ...c, ...action.payload } : c)),
      }
    case 'DELETE_CATEGORY':
      return {
        ...state,
        categories: state.categories.filter((c) => c.id !== action.payload),
      }
    case 'ADD_PRODUCT':
      return {
        ...state,
        products: [...state.products, { ...action.payload, id: crypto.randomUUID(), createdAt: new Date().toISOString() }],
      }
    case 'UPDATE_PRODUCT':
      return {
        ...state,
        products: state.products.map((p) => (p.id === action.payload.id ? { ...p, ...action.payload } : p)),
      }
    case 'DELETE_PRODUCT':
      return {
        ...state,
        products: state.products.filter((p) => p.id !== action.payload),
      }
    case 'ADD_ADDON':
      return {
        ...state,
        addons: [...state.addons, { ...action.payload, id: action.payload.id || crypto.randomUUID(), createdAt: new Date().toISOString() }],
      }
    case 'UPDATE_ADDON':
      return {
        ...state,
        addons: state.addons.map((a) => (a.id === action.payload.id ? { ...a, ...action.payload } : a)),
      }
    case 'DELETE_ADDON':
      return {
        ...state,
        addons: state.addons.filter((a) => a.id !== action.payload),
      }
    case 'SYNC':
      return { ...state, ...action.payload }
    default:
      return state
  }
}

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, defaultState, (initial) => {
    const stored = loadFromStorage()
    return stored ? { ...initial, ...stored } : initial
  })

  // Sincronizar qualquer mudança de ESTADO para o LOCALSTORAGE
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

  // Escutar mudanças no LOCALSTORAGE vindas de OUTRAS ABAS (ex: Admin abrindo/fechando loja)
  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          const freshData = JSON.parse(e.newValue)
          dispatch({ type: 'SYNC', payload: freshData })
        } catch (err) {
          console.error("Erro ao sincronizar store:", err)
        }
      }
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  return <StoreContext.Provider value={{ state, dispatch }}>{children}</StoreContext.Provider>
}

export function checkOpenStatus(settings) {
  // Se o botão mestre estiver desligado, a loja está fechada.
  if (!settings || !settings.isOpen) return false

  // Se estivermos dentro do horário, abrimos. 
  // Mas vamos adicionar uma flag para "Forçar Aberto" ou simplesmente
  // assumir que se o usuário clicou em "Abrir" no Admin, ele quer a loja aberta 
  // independente do horário programado.
  
  // Para manter a funcionalidade de horário mas permitir o override manual:
  // Se o usuário clicou em ABRIR MANUALMENTE, ele espera que funcione.
  
  const now = new Date()
  const days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']
  const todayName = days[now.getDay()]
  const todayHours = settings.operatingHours?.find((h) => h.day === todayName)

  // Se não houver horários configurados ou for feriado/folga no cadastro, 
  // mas o botão manual estiver ON, mantemos ABERTO.
  if (!todayHours || todayHours.closed) return true 

  const currentTime = now.getHours() * 60 + now.getMinutes()
  const [startH, startM] = todayHours.start.split(':').map(Number)
  const [endH, endM] = todayHours.end.split(':').map(Number)
  
  const startTime = startH * 60 + startM
  let endTime = endH * 60 + endM

  if (endTime <= startTime) endTime += 24 * 60

  const isInHours = currentTime >= startTime && currentTime < endTime
  
  // Retornamos true se o botão estiver ON. 
  // O horário de funcionamento pode servir apenas para FECHAR automaticamente 
  // se o botão estivesse em um modo "Auto", mas como temos apenas um switch, 
  // o clique do usuário deve ser soberano.
  return true 
}

export function useStore() {
  const context = useContext(StoreContext)
  if (!context) throw new Error('useStore must be used within StoreProvider')
  return context
}
