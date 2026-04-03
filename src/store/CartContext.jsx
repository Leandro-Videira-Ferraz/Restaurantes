import { createContext, useContext, useReducer, useEffect } from 'react'

const CartContext = createContext()

const STORAGE_KEY = 'burger_cart_v1'

const initialState = {
  items: [], // [{ id, cartItemId, name, price, quantity, imageUrl, removedIngredients, addons, observation, addonsTotal, finalPrice }]
  total: 0
}

// Gerar um ID único para cada item personalizado no carrinho
function generateCartItemId(product, customization) {
  const removedKey = (customization?.removedIngredients || []).sort().join(',')
  const addonsKey = (customization?.addons || []).map(a => `${a.id}:${a.quantity}`).sort().join(',')
  return `${product.id}_${removedKey}_${addonsKey}`
}

function calculateTotal(items) {
  return items.reduce((acc, item) => acc + ((item.finalPrice || item.price) * item.quantity), 0)
}

function cartReducer(state, action) {
  let newItems = []
  
  switch (action.type) {
    case 'ADD_TO_CART': {
      const { product, customization } = action.payload
      const cartItemId = generateCartItemId(product, customization)
      const finalPrice = customization?.finalPrice || product.price
      
      const existingIndex = state.items.findIndex(item => item.cartItemId === cartItemId)
      
      if (existingIndex !== -1) {
        newItems = [...state.items]
        newItems[existingIndex].quantity += 1
      } else {
        newItems = [...state.items, {
          ...product,
          cartItemId,
          quantity: 1,
          removedIngredients: customization?.removedIngredients || [],
          addons: customization?.addons || [],
          observation: customization?.observation || '',
          addonsTotal: customization?.addonsTotal || 0,
          finalPrice,
        }]
      }
      
      return {
        ...state,
        items: newItems,
        total: calculateTotal(newItems)
      }
    }

    case 'ADD_TO_CART_LEGACY': {
      // Retrocompatibilidade para adicionar direto sem personalização
      const existingIndex = state.items.findIndex(item => item.id === action.payload.id && !item.cartItemId)
      
      if (existingIndex !== -1) {
        newItems = [...state.items]
        newItems[existingIndex].quantity += 1
      } else {
        newItems = [...state.items, { ...action.payload, quantity: 1, finalPrice: action.payload.price }]
      }
      
      return {
        ...state,
        items: newItems,
        total: calculateTotal(newItems)
      }
    }
      
    case 'REMOVE_ONE': {
       const identifier = action.payload
       const idx = state.items.findIndex(item => (item.cartItemId || item.id) === identifier)
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
         total: calculateTotal(newItems)
       }
    }

    case 'REMOVE_ITEM':
      newItems = state.items.filter(item => (item.cartItemId || item.id) !== action.payload)
      return {
        ...state,
        items: newItems,
        total: calculateTotal(newItems)
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

  const addToCart = (product, customization = null) => {
    if (customization) {
      dispatch({ type: 'ADD_TO_CART', payload: { product, customization } })
    } else {
      dispatch({ type: 'ADD_TO_CART_LEGACY', payload: product })
    }
  }

  const removeOne = (identifier) => {
    dispatch({ type: 'REMOVE_ONE', payload: identifier })
  }

  const removeItem = (identifier) => {
    dispatch({ type: 'REMOVE_ITEM', payload: identifier })
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
