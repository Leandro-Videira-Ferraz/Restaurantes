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
  settings: {
    isOpen: true,
    storeName: 'BURGER ADMIN',
    storeDescription: 'GESTÃO DE HAMBURGUERIA',
    accentColor: '#f59e0b',
    themeMode: 'dark',
    logoUrl: '',
    deliveryFee: 5.00,
    useNeighborhoodFees: false,
    neighborhoodFees: [],
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
    default:
      return state
  }
}

export function StoreProvider({ children }) {
  const storedData = loadFromStorage() || {}
  const initialState = {
    ...defaultState,
    ...storedData,
    settings: { ...defaultState.settings, ...(storedData.settings || {}) }
  }
  
  const [state, dispatch] = useReducer(reducer, initialState)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

  return <StoreContext.Provider value={{ state, dispatch }}>{children}</StoreContext.Provider>
}

export function checkOpenStatus(settings) {
  if (!settings || !settings.isOpen) return false

  const now = new Date()
  const days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']
  const todayName = days[now.getDay()]
  const todayHours = settings.operatingHours.find((h) => h.day === todayName)

  if (!todayHours || todayHours.closed) return false

  const currentTime = now.getHours() * 60 + now.getMinutes()
  const [startH, startM] = todayHours.start.split(':').map(Number)
  const [endH, endM] = todayHours.end.split(':').map(Number)
  
  const startTime = startH * 60 + startM
  let endTime = endH * 60 + endM

  // Tratar horários que passam da meia-noite (ex: 00:00 como 24:00)
  if (endTime <= startTime) endTime += 24 * 60

  return currentTime >= startTime && currentTime < endTime
}

export function useStore() {
  const context = useContext(StoreContext)
  if (!context) throw new Error('useStore must be used within StoreProvider')
  return context
}
