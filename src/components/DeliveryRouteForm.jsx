import { useState, useMemo } from 'react'
import { Route, User, MapPin, Package, CheckSquare, Square, Loader2, Navigation, Send, RotateCcw, AlertTriangle, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react'
import { useOrders } from '../store/OrdersContext'
import { useStore } from '../store/StoreContext'

// --- Utilitários de Geocodificação e Roteamento ---

async function geocodeAddress(query) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1&addressdetails=1`
  const res = await fetch(url, {
    headers: { 'User-Agent': 'RestaurantDeliveryRouteOptimizer/1.0' },
  })
  if (!res.ok) throw new Error('Falha na requisição de geocodificação')
  const data = await res.json()
  if (!data || data.length === 0) return null
  return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function nearestNeighborTSP(origin, stops) {
  const remaining = stops.map((s, i) => ({ ...s, originalIndex: i }))
  const route = []
  let current = origin

  while (remaining.length > 0) {
    let minDist = Infinity
    let nearestIdx = 0
    remaining.forEach((stop, idx) => {
      const dist = haversineKm(current.lat, current.lon, stop.lat, stop.lon)
      if (dist < minDist) {
        minDist = dist
        nearestIdx = idx
      }
    })
    const nearest = remaining[nearestIdx]
    route.push({ ...nearest, distFromPrev: minDist })
    current = nearest
    remaining.splice(nearestIdx, 1)
  }

  return route
}

function buildGoogleMapsUrl(originAddress, orderedStops) {
  const parts = [originAddress, ...orderedStops.map((s) => s.fullAddress)]
  return `https://www.google.com/maps/dir/${parts.map(encodeURIComponent).join('/')}`
}

function formatAddress(address) {
  const parts = [address.street, address.number, address.neighborhood, address.complement]
    .filter(Boolean)
    .join(', ')
  return parts
}

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

// --- Componente Principal ---

export default function DeliveryRouteForm() {
  const { activeOrders, dispatch } = useOrders()
  const { state } = useStore()
  const { settings } = state

  const storeCity = settings.storeCity || ''
  const storeAddress = settings.storeAddress || ''

  const readyDeliveryOrders = useMemo(
    () => activeOrders.filter((o) => o.status === 'PRONTO' && o.deliveryMethod === 'delivery'),
    [activeOrders]
  )

  const [selectedIds, setSelectedIds] = useState([])
  const [delivererName, setDelivererName] = useState('')
  const [cityOverride, setCityOverride] = useState('')
  const [optimizing, setOptimizing] = useState(false)
  const [result, setResult] = useState(null)
  const [errors, setErrors] = useState([])
  const [dispatched, setDispatched] = useState(false)
  const [expandedOrder, setExpandedOrder] = useState(null)

  const city = cityOverride || storeCity

  function toggleOrder(id) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
    setResult(null)
    setDispatched(false)
  }

  function toggleAll() {
    if (selectedIds.length === readyDeliveryOrders.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(readyDeliveryOrders.map((o) => o.id))
    }
    setResult(null)
    setDispatched(false)
  }

  async function handleOptimize() {
    const selected = readyDeliveryOrders.filter((o) => selectedIds.includes(o.id))
    if (selected.length === 0) return
    if (!city.trim()) {
      setErrors(['Informe a cidade para geocodificação (em Configurações ou no campo abaixo).'])
      return
    }

    setOptimizing(true)
    setErrors([])
    setResult(null)
    setDispatched(false)

    const geocodeErrors = []

    // Geocodificar ponto de partida (restaurante)
    let originCoords = null
    const originQuery = storeAddress
      ? `${storeAddress}, ${city}`
      : city

    try {
      originCoords = await geocodeAddress(originQuery)
      await sleep(1100)
    } catch {
      geocodeErrors.push(`Falha ao geocodificar endereço do restaurante: "${originQuery}"`)
    }

    if (!originCoords) {
      geocodeErrors.push(
        `Endereço do restaurante não encontrado: "${originQuery}". Verifique em Configurações.`
      )
    }

    // Geocodificar endereços dos clientes
    const stops = []
    for (const order of selected) {
      const addr = order.address
      const fullAddress = `${formatAddress(addr)}, ${city}`
      let coords = null
      try {
        coords = await geocodeAddress(fullAddress)
        await sleep(1100)
      } catch {
        geocodeErrors.push(`Erro de rede ao geocodificar pedido ${order.id}`)
      }

      if (coords) {
        stops.push({ order, fullAddress, ...coords })
      } else {
        geocodeErrors.push(
          `Endereço não encontrado para pedido ${order.id} (${order.customerName}): "${fullAddress}"`
        )
      }
    }

    setErrors(geocodeErrors)

    if (!originCoords || stops.length === 0) {
      setOptimizing(false)
      return
    }

    const optimizedRoute = nearestNeighborTSP(originCoords, stops)
    const totalDistance = optimizedRoute.reduce((sum, s) => sum + (s.distFromPrev || 0), 0)
    const mapsUrl = buildGoogleMapsUrl(originQuery, optimizedRoute)

    setResult({
      origin: originQuery,
      originCoords,
      route: optimizedRoute,
      totalDistance,
      mapsUrl,
    })
    setOptimizing(false)
  }

  function handleDispatch() {
    if (!result) return
    result.route.forEach(({ order }) => {
      dispatch({ type: 'UPDATE_STATUS', payload: { id: order.id, status: 'EM ROTA' } })
    })
    setDispatched(true)
    setSelectedIds([])
  }

  function handleReset() {
    setResult(null)
    setErrors([])
    setSelectedIds([])
    setDelivererName('')
    setDispatched(false)
  }

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      <div>
        <h2 className="text-3xl font-black text-white tracking-tight italic uppercase">Rotas de Entrega</h2>
        <p className="text-sm text-gray-400 font-medium mt-1">
          Selecione os pedidos prontos, informe o entregador e otimize a rota automaticamente
        </p>
      </div>

      {/* Configuração da rota */}
      <div className="glass-card p-8 space-y-6 border-amber-500/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center">
            <User className="w-5 h-5 text-amber-500" />
          </div>
          <h3 className="text-lg font-bold text-white uppercase italic tracking-tight">Dados da Entrega</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">
              Nome do Entregador
            </label>
            <input
              type="text"
              value={delivererName}
              onChange={(e) => setDelivererName(e.target.value)}
              placeholder="Ex: João"
              className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-sm text-white font-bold focus:outline-none focus:border-amber-500/50 transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">
              Cidade {storeCity ? `(padrão: ${storeCity})` : '— configure em Configurações'}
            </label>
            <input
              type="text"
              value={cityOverride}
              onChange={(e) => setCityOverride(e.target.value)}
              placeholder={storeCity || 'Ex: São Paulo, SP'}
              className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-sm text-white font-bold focus:outline-none focus:border-amber-500/50 transition-all"
            />
            <p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest ml-1">
              Usada para geocodificar endereços. Deixe em branco para usar o padrão.
            </p>
          </div>
        </div>
      </div>

      {/* Seleção de pedidos */}
      <div className="glass-card overflow-hidden border-white/5">
        <div className="p-6 border-b border-white/5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center">
              <Package className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white uppercase italic tracking-tight">
                Pedidos Prontos
              </h3>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                Somente pedidos com status PRONTO e modalidade delivery
              </p>
            </div>
          </div>

          {readyDeliveryOrders.length > 0 && (
            <button
              onClick={toggleAll}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 text-xs font-black uppercase tracking-widest text-gray-400 hover:text-white hover:bg-white/5 transition-all"
            >
              {selectedIds.length === readyDeliveryOrders.length ? (
                <CheckSquare className="w-4 h-4 text-amber-500" />
              ) : (
                <Square className="w-4 h-4" />
              )}
              {selectedIds.length === readyDeliveryOrders.length ? 'Desmarcar todos' : 'Selecionar todos'}
            </button>
          )}
        </div>

        {readyDeliveryOrders.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Package className="w-12 h-12 text-gray-700 mx-auto" />
            <p className="text-gray-500 font-bold uppercase text-xs tracking-widest">
              Nenhum pedido pronto para delivery no momento
            </p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {readyDeliveryOrders.map((order) => {
              const isSelected = selectedIds.includes(order.id)
              const isExpanded = expandedOrder === order.id
              return (
                <div
                  key={order.id}
                  className={`transition-all ${isSelected ? 'bg-amber-500/5' : 'hover:bg-white/[0.02]'}`}
                >
                  <div
                    className="p-5 flex items-start gap-4 cursor-pointer"
                    onClick={() => toggleOrder(order.id)}
                  >
                    <div className="mt-1 shrink-0">
                      {isSelected ? (
                        <CheckSquare className="w-5 h-5 text-amber-500" />
                      ) : (
                        <Square className="w-5 h-5 text-gray-600" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="text-amber-500 font-black text-sm">{order.id}</span>
                        <span className="text-[10px] bg-green-500/10 text-green-400 font-black px-2 py-0.5 rounded-full uppercase tracking-widest">
                          PRONTO
                        </span>
                        <span className="text-[10px] bg-white/5 text-gray-400 font-bold px-2 py-0.5 rounded-full">
                          {formatCurrency(order.total)}
                        </span>
                      </div>

                      <p className="text-sm font-bold text-white">{order.customerName}</p>
                      {order.customerPhone && (
                        <p className="text-xs text-gray-500 font-medium">{order.customerPhone}</p>
                      )}

                      <div className="flex items-center gap-1.5 mt-1.5">
                        <MapPin className="w-3.5 h-3.5 text-gray-600 shrink-0" />
                        <p className="text-xs text-gray-400 font-medium truncate">
                          {formatAddress(order.address)}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setExpandedOrder(isExpanded ? null : order.id)
                      }}
                      className="shrink-0 text-gray-600 hover:text-gray-300 transition-colors p-1"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="px-5 pb-5 ml-9 space-y-1.5 border-t border-white/5 pt-3">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-xs text-gray-400">
                          <span className="font-bold">
                            {item.quantity}× {item.name}
                          </span>
                          <span className="font-medium">{formatCurrency(item.finalPrice * item.quantity)}</span>
                        </div>
                      ))}
                      {order.address.complement && (
                        <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest pt-1">
                          Complemento: {order.address.complement}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Erros */}
      {errors.length > 0 && (
        <div className="glass-card p-6 border-red-500/20 space-y-3">
          <div className="flex items-center gap-2 text-red-400">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <span className="text-sm font-black uppercase tracking-widest">Atenção</span>
          </div>
          <ul className="space-y-1">
            {errors.map((err, i) => (
              <li key={i} className="text-xs text-red-300 font-medium ml-7">
                • {err}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Botão Otimizar */}
      {!result && !dispatched && (
        <button
          onClick={handleOptimize}
          disabled={selectedIds.length === 0 || optimizing || !city.trim()}
          className="w-full flex items-center justify-center gap-3 py-5 rounded-2xl font-black text-sm uppercase tracking-widest transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-amber-500 hover:bg-amber-400 text-black shadow-xl shadow-amber-500/20 active:scale-95"
        >
          {optimizing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Geocodificando endereços... (aguarde)
            </>
          ) : (
            <>
              <Route className="w-5 h-5" />
              Otimizar Rota ({selectedIds.length} pedido{selectedIds.length !== 1 ? 's' : ''})
            </>
          )}
        </button>
      )}

      {!city.trim() && !result && (
        <p className="text-center text-xs text-red-400 font-bold uppercase tracking-widest -mt-4">
          Informe a cidade acima ou configure em Configurações → Endereço da Loja
        </p>
      )}

      {/* Resultado da Otimização */}
      {result && !dispatched && (
        <div className="space-y-6 animate-fade-in">
          <div className="glass-card overflow-hidden border-green-500/10">
            <div className="p-6 border-b border-white/5 flex flex-wrap items-center justify-between gap-4 bg-green-500/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-500/10 rounded-xl flex items-center justify-center">
                  <Navigation className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white uppercase italic tracking-tight">
                    Rota Otimizada
                  </h3>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                    {result.route.length} parada{result.route.length !== 1 ? 's' : ''} •{' '}
                    ~{result.totalDistance.toFixed(1)} km total (distância em linha reta)
                  </p>
                </div>
              </div>
              {delivererName && (
                <span className="text-xs bg-amber-500/10 text-amber-400 font-black px-4 py-2 rounded-full uppercase tracking-widest">
                  Entregador: {delivererName}
                </span>
              )}
            </div>

            {/* Ponto de partida */}
            <div className="p-5 border-b border-white/5 flex items-center gap-4">
              <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center shrink-0">
                <span className="text-black font-black text-xs">🏠</span>
              </div>
              <div>
                <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Ponto de Partida</p>
                <p className="text-sm font-bold text-white">{result.origin}</p>
              </div>
            </div>

            {/* Paradas */}
            {result.route.map((stop, idx) => (
              <div key={stop.order.id} className="p-5 border-b border-white/5 last:border-0 flex items-start gap-4 hover:bg-white/[0.02] transition-colors">
                <div className="w-8 h-8 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-amber-500 font-black text-sm">{idx + 1}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="text-amber-500 font-black text-sm">{stop.order.id}</span>
                    <span className="text-xs text-gray-300 font-bold">{stop.order.customerName}</span>
                    {stop.order.customerPhone && (
                      <span className="text-[10px] text-gray-500 font-medium">{stop.order.customerPhone}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                    <p className="text-xs text-gray-400 font-medium">{stop.fullAddress}</p>
                  </div>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {stop.order.items.map((item, i) => (
                      <span key={i} className="text-[10px] bg-white/5 text-gray-400 px-2 py-0.5 rounded-full font-bold">
                        {item.quantity}× {item.name}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-amber-500 font-black text-sm">{formatCurrency(stop.order.total)}</p>
                  <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">
                    +{stop.distFromPrev.toFixed(1)} km
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Ações */}
          <div className="flex flex-col sm:flex-row gap-4">
            <a
              href={result.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-3 py-4 rounded-2xl font-black text-sm uppercase tracking-widest border border-blue-500/30 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-all"
            >
              <ExternalLink className="w-5 h-5" />
              Abrir no Google Maps
            </a>

            <button
              onClick={handleReset}
              className="flex items-center justify-center gap-3 px-6 py-4 rounded-2xl font-black text-sm uppercase tracking-widest border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 transition-all"
            >
              <RotateCcw className="w-4 h-4" />
              Nova Rota
            </button>

            <button
              onClick={handleDispatch}
              className="flex-1 flex items-center justify-center gap-3 py-4 rounded-2xl font-black text-sm uppercase tracking-widest bg-green-500 hover:bg-green-400 text-black shadow-xl shadow-green-500/20 active:scale-95 transition-all"
            >
              <Send className="w-5 h-5" />
              Confirmar e Enviar para Rota
            </button>
          </div>
        </div>
      )}

      {/* Confirmação de despacho */}
      {dispatched && (
        <div className="glass-card p-8 text-center space-y-4 border-green-500/20 animate-fade-in">
          <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto">
            <Send className="w-8 h-8 text-green-400" />
          </div>
          <div>
            <h3 className="text-xl font-black text-white italic uppercase">Pedidos Despachados!</h3>
            <p className="text-sm text-gray-400 font-medium mt-1">
              {result?.route.length} pedido{result?.route.length !== 1 ? 's' : ''} marcado
              {result?.route.length !== 1 ? 's' : ''} como{' '}
              <span className="text-amber-500 font-black">EM ROTA</span>
              {delivererName && (
                <> para <span className="text-white font-black">{delivererName}</span></>
              )}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <a
              href={result?.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-black text-xs uppercase tracking-widest border border-blue-500/30 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-all"
            >
              <ExternalLink className="w-4 h-4" />
              Ver Rota no Maps
            </a>
            <button
              onClick={handleReset}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-black text-xs uppercase tracking-widest bg-amber-500 hover:bg-amber-400 text-black transition-all"
            >
              <RotateCcw className="w-4 h-4" />
              Nova Rota
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
