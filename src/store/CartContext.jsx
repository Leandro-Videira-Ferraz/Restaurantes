import { createContext, useContext, useReducer, useEffect } from 'react'

const CartContext = createContext()

const STORAGE_KEY = 'burger_cart_v1'

const initialState = {
  items: [], // [{ id, name, price, quantity, imageUrl }]
  total: 0
}

function cartReducer(state, action) {
  let newItems = []
  
  switch (action.type) {
    case 'ADD_TO_CART':
      const existingIndex = state.items.findIndex(item => item.id === action.payload.id)
      
      if (existingIndex !== -1) {
        newItems = [...state.items]
        newItems[existingIndex].quantity += 1
      } else {
        newItems = [...state.items, { ...action.payload, quantity: 1 }]
      }
      
      return {
        ...state,
        items: newItems,
        total: newItems.reduce((acc, item) => acc + (item.price * item.quantity), 0)
      }
      
    case 'REMOVE_ONE':
       const idx = state.items.findIndex(item => item.id === action.payload)
       if (idx === -1) return state
       
       newItems = [...state.items]
       if (newItems[idx].quantity > 1) {
         newItems[idx].quantity -= 1
       } else {
         newItems.splice(idx, 1)
       }
       
       return {
         ...state,
         items: newItems,
         total: newItems.reduce((acc, item) => acc + (item.price * item.quantity), 0)
       }

    case 'REMOVE_ITEM':
      newItems = state.items.filter(item => item.id !== action.payload)
      return {
        ...state,
        items: newItems,
        total: newItems.reduce((acc, item) => acc + (item.price * item.quantity), 0)
      }
      
    case 'CLEAR_CART':
      return initialState
      
    case 'LOAD_CART':
      return action.payload

    default:
      return state
  }
}

export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(cartReducer, initialState)

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      dispatch({ type: 'LOAD_CART', payload: JSON.parse(saved) })
    }
  }, [])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

  const addToCart = (product) => {
    dispatch({ type: 'ADD_TO_CART', payload: product })
  }

  const removeOne = (id) => {
    dispatch({ type: 'REMOVE_ONE', payload: id })
  }

  const removeItem = (id) => {
    dispatch({ type: 'REMOVE_ITEM', payload: id })
  }

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' })
  }

  return (
    <CartContext.Provider value={{ cart: state, addToCart, removeOne, removeItem, clearCart }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) throw new Error('useCart must be used within a CartProvider')
  return context
}
