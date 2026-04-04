import { createContext, useContext, useReducer, useEffect } from 'react'

const OrdersContext = createContext()

const STORAGE_KEY = 'burger-admin-orders'

function loadOrders() {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

const STATUS_FLOW = ['RECEBIDO', 'PREPARANDO', 'PRONTO', 'EM ROTA', 'ENTREGUE']
const STATUS_FLOW_PICKUP = ['RECEBIDO', 'PREPARANDO', 'PRONTO', 'RETIRADO']

function ordersReducer(state, action) {
  switch (action.type) {
    case 'ADD_ORDER': {
      // Sempre ler do localStorage fresco para não sobrescrever atualizações de outra aba (ex: admin avançou status)
      const freshOrders = loadOrders()
      if (freshOrders.find(o => o.id === action.payload.id)) return freshOrders
      return [action.payload, ...freshOrders]
    }

    case 'ADVANCE_STATUS': {
      return state.map(order => {
        if (order.id !== action.payload) return order
        const flow = order.deliveryMethod === 'pickup' ? STATUS_FLOW_PICKUP : STATUS_FLOW
        const currentIndex = flow.indexOf(order.status)
        if (currentIndex < flow.length - 1) {
          return { ...order, status: flow[currentIndex + 1], updatedAt: new Date().toISOString() }
        }
        return order
      })
    }

    case 'UPDATE_STATUS': {
      return state.map(order =>
        order.id === action.payload.id
          ? { ...order, status: action.payload.status, updatedAt: new Date().toISOString() }
          : order
      )
    }

    case 'CANCEL_ORDER': {
      return state.map(order =>
        order.id === action.payload
          ? { ...order, status: 'CANCELADO', updatedAt: new Date().toISOString() }
          : order
      )
    }

    case 'REVERT_STATUS': {
      return state.map(order => {
        if (order.id !== action.payload) return order
        const flow = order.deliveryMethod === 'pickup' ? STATUS_FLOW_PICKUP : STATUS_FLOW
        const currentIndex = flow.indexOf(order.status)
        if (currentIndex > 0) {
          return { ...order, status: flow[currentIndex - 1], updatedAt: new Date().toISOString() }
        }
        return order
      })
    }

    case 'CLEAR_COMPLETED': {
      return state.filter(order => !['ENTREGUE', 'RETIRADO', 'CANCELADO'].includes(order.status))
    }

    case 'SYNC_FROM_STORAGE': {
      return action.payload
    }

    default:
      return state
  }
}

export function OrdersProvider({ children }) {
  const [orders, dispatch] = useReducer(ordersReducer, loadOrders())

  // Sincronização entre abas (Real-Time Local)
  useEffect(() => {
    const handleStorageChange = (e) => {
      // Se a chave alterada for a de pedidos
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          const freshData = JSON.parse(e.newValue)
          // Só sincroniza se houver diferença real (evita loops)
          if (JSON.stringify(freshData) !== JSON.stringify(orders)) {
            dispatch({ type: 'SYNC_FROM_STORAGE', payload: freshData })
          }
        } catch (err) {
          console.error("Erro ao sincronizar pedidos:", err)
        }
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [orders])

  // Salva no storage quando o estado local muda
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(orders))
  }, [orders])

  // Filtros de estado
  const activeOrders = orders.filter(o => !['ENTREGUE', 'RETIRADO', 'CANCELADO'].includes(o.status))
  const completedOrders = orders.filter(o => ['ENTREGUE', 'RETIRADO', 'CANCELADO'].includes(o.status))

  return (
    <OrdersContext.Provider value={{ orders, activeOrders, completedOrders, dispatch }}>
      {children}
    </OrdersContext.Provider>
  )
}

export const useOrders = () => {
  const context = useContext(OrdersContext)
  if (!context) throw new Error('useOrders must be used within OrdersProvider')
  return context
}

export { STATUS_FLOW, STATUS_FLOW_PICKUP }
