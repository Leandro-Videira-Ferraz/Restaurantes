import { createContext, useContext, useReducer, useEffect } from 'react'

const UserContext = createContext()

const initialState = {
  profile: JSON.parse(localStorage.getItem('user_profile')) || {
    name: '',
    phone: '',
    address: {
      street: '',
      number: '',
      neighborhood: '',
      complement: ''
    }
  },
  orders: JSON.parse(localStorage.getItem('user_orders')) || []
}

function userReducer(state, action) {
  switch (action.type) {
    case 'UPDATE_PROFILE': {
      const newProfile = { ...state.profile, ...action.payload }
      localStorage.setItem('user_profile', JSON.stringify(newProfile))
      return { ...state, profile: newProfile }
    }
    case 'ADD_ORDER': {
      const newOrders = [action.payload, ...state.orders]
      localStorage.setItem('user_orders', JSON.stringify(newOrders))
      return { ...state, orders: newOrders }
    }
    case 'UPDATE_ORDER_STATUS': {
        const newOrders = state.orders.map(o =>
            o.id === action.payload.id ? { ...o, status: action.payload.status } : o
        )
        localStorage.setItem('user_orders', JSON.stringify(newOrders))
        return { ...state, orders: newOrders }
    }
    case 'CANCEL_ORDER': {
        const newOrders = state.orders.map(o =>
            o.id === action.payload ? { ...o, status: 'CANCELADO' } : o
        )
        localStorage.setItem('user_orders', JSON.stringify(newOrders))
        return { ...state, orders: newOrders }
    }
    default:
      return state
  }
}

export function UserProvider({ children }) {
  const [user, dispatch] = useReducer(userReducer, initialState)

  return (
    <UserContext.Provider value={{ user, dispatch }}>
      {children}
    </UserContext.Provider>
  )
}

export const useUser = () => useContext(UserContext)
