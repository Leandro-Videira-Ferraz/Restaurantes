import { useState, useMemo } from 'react'
import { useOrders } from '../store/OrdersContext'
import {
  TrendingUp, TrendingDown, DollarSign, ShoppingBag,
  XCircle, Receipt, Download, Calendar
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend
} from 'recharts'
import { format, subDays, startOfDay, endOfDay, isWithinInterval, startOfMonth, parseISO } from 'date-fns'

function useDashboardMetrics(period) {
  const { orders } = useOrders()

  return useMemo(() => {
    const now = new Date()
    let startDate, endDate

    switch (period) {
      case 'today':
        startDate = startOfDay(now)
        endDate = endOfDay(now)
        break
      case 'yesterday':
        startDate = startOfDay(subDays(now, 1))
        endDate = endOfDay(subDays(now, 1))
        break
      case '7days':
        startDate = startOfDay(subDays(now, 7))
        endDate = endOfDay(now)
        break
      case '30days':
        startDate = startOfDay(subDays(now, 30))
        endDate = endOfDay(now)
        break
      case 'month':
        startDate = startOfMonth(now)
        endDate = endOfDay(now)
        break
      default:
        startDate = startOfDay(now)
        endDate = endOfDay(now)
    }

    // Previous period for comparison
    const duration = endDate.getTime() - startDate.getTime()
    const prevStartDate = new Date(startDate.getTime() - duration)
    const prevEndDate = new Date(endDate.getTime() - duration)

    const filteredOrders = orders.filter(o => {
      if (!(o.createdAt || o.date)) return false
      try {
        const d = parseISO(o.createdAt || o.date)
        return isWithinInterval(d, { start: startDate, end: endDate })
      } catch (e) {
        return false
      }
    })

    const prevOrders = orders.filter(o => {
      if (!(o.createdAt || o.date)) return false
      try {
        const d = parseISO(o.createdAt || o.date)
        return isWithinInterval(d, { start: prevStartDate, end: prevEndDate })
      } catch(e) {
        return false
      }
    })

    // KPIs
    const getOrderTotal = (o) => o.finalPrice || o.total || 0;
    const calculateRevenue = (ords) => ords.filter(o => o.status !== 'CANCELADO').reduce((sum, o) => sum + getOrderTotal(o), 0)
    
    const revenue = calculateRevenue(filteredOrders)
    const prevRevenue = calculateRevenue(prevOrders)
    const revenueChange = prevRevenue ? ((revenue - prevRevenue) / prevRevenue) * 100 : 0

    const totalOrders = filteredOrders.length
    const prevTotalOrders = prevOrders.length
    const ordersChange = prevTotalOrders ? ((totalOrders - prevTotalOrders) / prevTotalOrders) * 100 : 0

    const validOrders = filteredOrders.filter(o => o.status !== 'CANCELADO')
    const validPrevOrders = prevOrders.filter(o => o.status !== 'CANCELADO')

    const avgTicket = validOrders.length ? revenue / validOrders.length : 0
    const prevAvgTicket = validPrevOrders.length ? prevRevenue / validPrevOrders.length : 0
    const ticketChange = prevAvgTicket ? ((avgTicket - prevAvgTicket) / prevAvgTicket) * 100 : 0

    const canceled = filteredOrders.filter(o => o.status === 'CANCELADO').length
    const prevCanceled = prevOrders.filter(o => o.status === 'CANCELADO').length
    const cancelRate = totalOrders ? (canceled / totalOrders) * 100 : 0
    const prevCancelRate = prevTotalOrders ? (prevCanceled / prevTotalOrders) * 100 : 0
    const cancelRateChange = prevCancelRate ? ((cancelRate - prevCancelRate) / prevCancelRate) * 100 : 0

    const canceledLoss = filteredOrders.filter(o => o.status === 'CANCELADO').reduce((sum, o) => sum + getOrderTotal(o), 0)

    // Chart Data (Revenue over time)
    const chartMap = {}
    validOrders.forEach(o => {
      const d = parseISO(o.createdAt || o.date)
      const key = period === 'today' || period === 'yesterday' 
        ? format(d, 'HH:00')
        : format(d, 'dd/MM')
      
      if (!chartMap[key]) {
        chartMap[key] = { name: key, revenue: 0, deliveryFee: 0, items: 0 }
      }
      chartMap[key].revenue += getOrderTotal(o) - (o.deliveryFee || 0)
      chartMap[key].deliveryFee += (o.deliveryFee || 0)
      chartMap[key].items += o.items.length
    })
    const chartData = Object.values(chartMap).sort((a, b) => a.name.localeCompare(b.name))

    // Top Products
    const prodMap = {}
    validOrders.forEach(o => {
      o.items.forEach(item => {
        if (!prodMap[item.id]) {
          prodMap[item.id] = { name: item.name, img: item.imageUrl, qty: 0, revenue: 0 }
        }
        prodMap[item.id].qty += item.quantity
        prodMap[item.id].revenue += item.price * item.quantity
      })
    })
    const topProducts = Object.values(prodMap).sort((a, b) => b.qty - a.qty).slice(0, 10)

    // Top Addons
    const addonMap = {}
    validOrders.forEach(o => {
      o.items.forEach(item => {
        if (item.customization && item.customization.addons) {
          item.customization.addons.forEach(addon => {
            if (!addonMap[addon.id]) {
              addonMap[addon.id] = { name: addon.name, qty: 0, revenue: 0 }
            }
            addonMap[addon.id].qty += addon.quantity * item.quantity
            addonMap[addon.id].revenue += addon.price * addon.quantity * item.quantity
          })
        }
      })
    })
    const topAddons = Object.values(addonMap).sort((a, b) => b.qty - a.qty).slice(0, 10)

    // Payment Methods
    const paymentMap = {}
    let totalPaymentVal = 0
    validOrders.forEach(o => {
      const method = o.paymentMethod || 'Desconhecido'
      if (!paymentMap[method]) paymentMap[method] = { name: method, value: 0, count: 0 }
      paymentMap[method].value += getOrderTotal(o)
      paymentMap[method].count += 1
      totalPaymentVal += getOrderTotal(o)
    })
    const paymentData = Object.values(paymentMap)

    // Delivery vs Pickup
    let deliveryCount = 0
    let pickupCount = 0
    let deliveryRev = 0
    let pickupRev = 0
    validOrders.forEach(o => {
      if (o.deliveryMethod === 'delivery') {
        deliveryCount++
        deliveryRev += getOrderTotal(o)
      } else {
        pickupCount++
        pickupRev += getOrderTotal(o)
      }
    })
    const deliveryData = [
      { name: 'Entrega', value: deliveryCount, revenue: deliveryRev },
      { name: 'Retirada', value: pickupCount, revenue: pickupRev }
    ].filter(d => d.value > 0)

    // Peak Hours
    const hourMap = {}
    validOrders.forEach(o => {
      const hour = format(parseISO(o.createdAt || o.date), 'HH:00')
      hourMap[hour] = (hourMap[hour] || 0) + 1
    })
    const peakHoursData = Object.entries(hourMap).map(([hour, count]) => ({ hour, count })).sort((a, b) => a.hour.localeCompare(b.hour))

    // Neighborhoods
    const neighborhoodMap = {}
    validOrders.filter(o => o.deliveryMethod === 'delivery' && o.address).forEach(o => {
      const n = o.address.neighborhood || 'Não Informado'
      if (!neighborhoodMap[n]) neighborhoodMap[n] = { name: n, count: 0, revenue: 0 }
      neighborhoodMap[n].count += 1
      neighborhoodMap[n].revenue += getOrderTotal(o)
    })
    const topNeighborhoods = Object.values(neighborhoodMap).sort((a, b) => b.count - a.count).slice(0, 10)

    // Coupons
    const couponMap = {}
    validOrders.filter(o => o.coupon).forEach(o => {
      const code = o.coupon.code
      if (!couponMap[code]) couponMap[code] = { code, count: 0, discountGiven: 0, revenue: 0 }
      couponMap[code].count += 1
      // Calculate discount approximately
      let discount = 0
      if (o.coupon.type === 'PERCENTAGE') {
        discount = ((getOrderTotal(o) + (o.discountAmount||0)) * o.coupon.value / 100)
      } else if (o.coupon.type === 'FIXED') {
        discount = o.coupon.value
      } else if (o.coupon.type === 'FREE_DELIVERY') {
        discount = o.deliveryFee || 0
      }
      couponMap[code].discountGiven += discount
      couponMap[code].revenue += getOrderTotal(o)
    })
    const couponsData = Object.values(couponMap).sort((a, b) => b.count - a.count)

    // Canceled List
    const canceledList = filteredOrders.filter(o => o.status === 'CANCELADO').slice(0, 5)

    return {
      revenue, revenueChange,
      totalOrders, ordersChange,
      avgTicket, ticketChange,
      cancelRate, cancelRateChange,
      canceledLoss,
      chartData,
      topProducts,
      topAddons,
      paymentData,
      totalPaymentVal,
      deliveryData,
      peakHoursData,
      topNeighborhoods,
      couponsData,
      canceledList,
      filteredOrders
    }
  }, [orders, period])
}

const COLORS = ['#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#f43f5e']

export default function DashboardPage() {
  const [period, setPeriod] = useState('today')
  const metrics = useDashboardMetrics(period)

  const handleExportCSV = () => {
    const orders = metrics.filteredOrders
    if (!orders.length) return

    const header = "ID,Data,Status,Total,MetodoPagamento,TipoEntrega\n"
    const csv = orders.map(o => `${o.id},${o.createdAt || o.date},${o.status},${o.finalPrice || o.total || 0},${o.paymentMethod || ''},${o.deliveryMethod || ''}`).join('\n')
    const blob = new Blob([header + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `pedidos_${period}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const renderKPI = (title, value, change, icon, prefix = '', suffix = '', inverseColor = false) => {
    const isPositive = change > 0
    const isNegative = change < 0
    let colorClass = 'text-gray-500'
    if (isPositive) colorClass = inverseColor ? 'text-red-500' : 'text-green-500'
    if (isNegative) colorClass = inverseColor ? 'text-green-500' : 'text-red-500'

    return (
      <div className="glass-card p-6 flex flex-col gap-2">
        <div className="flex justify-between items-center text-gray-400">
          <span className="text-xs font-black uppercase tracking-widest">{title}</span>
          {icon}
        </div>
        <div className="text-2xl font-black text-white">
          {prefix}{value}{suffix}
        </div>
        <div className={`text-xs font-bold flex items-center gap-1 ${colorClass}`}>
          {isPositive ? <TrendingUp className="w-3 h-3" /> : isNegative ? <TrendingDown className="w-3 h-3" /> : null}
          {Math.abs(change).toFixed(1)}% <span className="text-gray-600 font-normal ml-1">vs. anterior</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 sticky top-0 z-40 bg-black/50 backdrop-blur-md p-4 rounded-2xl border border-white/5">
        <div>
          <h2 className="text-2xl font-black text-white uppercase italic tracking-tight">Dashboard</h2>
          <p className="text-xs text-gray-500 uppercase tracking-widest">Visão Geral de Desempenho</p>
        </div>
        
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <select 
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="premium-input py-2 text-xs font-bold !w-auto"
          >
            <option value="today">Hoje</option>
            <option value="yesterday">Ontem</option>
            <option value="7days">Últimos 7 dias</option>
            <option value="30days">Últimos 30 dias</option>
            <option value="month">Este Mês</option>
          </select>

          <button onClick={handleExportCSV} className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-black text-white uppercase tracking-widest flex items-center gap-2 border border-white/10 transition-all cursor-pointer">
            <Download className="w-4 h-4" />
            CSV
          </button>
        </div>
      </div>

      {!metrics.filteredOrders.length ? (
        <div className="glass-card p-20 text-center flex flex-col items-center border-dashed border-white/10">
          <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
            <Calendar className="w-10 h-10 text-gray-600" />
          </div>
          <p className="text-xl font-bold text-gray-400">Nenhum pedido no período</p>
          <p className="text-gray-500 mt-2 text-sm">Selecione outro período para visualizar os dados.</p>
        </div>
      ) : (
        <>
          {/* Seção 1 - KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {renderKPI('Faturamento', metrics.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 }), metrics.revenueChange, <DollarSign className="w-5 h-5 text-amber-500" />, 'R$ ')}
            {renderKPI('Pedidos', metrics.totalOrders, metrics.ordersChange, <ShoppingBag className="w-5 h-5 text-blue-500" />)}
            {renderKPI('Ticket Médio', metrics.avgTicket.toLocaleString('pt-BR', { minimumFractionDigits: 2 }), metrics.ticketChange, <Receipt className="w-5 h-5 text-green-500" />, 'R$ ')}
            {renderKPI('Cancelamentos', metrics.cancelRate.toFixed(1), metrics.cancelRateChange, <XCircle className="w-5 h-5 text-red-500" />, '', '%', true)}
          </div>

          {/* Seção 2 - Gráfico de Faturamento */}
          <div className="glass-card p-6">
            <h3 className="text-sm font-black text-white uppercase tracking-widest mb-6">Faturamento no Período</h3>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={metrics.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="name" stroke="#888" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `R$${v}`} />
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: 'rgba(10,10,10,0.9)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}
                    itemStyle={{ color: '#fff', fontSize: '12px' }}
                    labelStyle={{ color: '#888', fontSize: '10px', marginBottom: '4px' }}
                    formatter={(val) => `R$ ${val.toFixed(2)}`}
                  />
                  <Legend wrapperStyle={{ fontSize: '10px' }} />
                  <Bar dataKey="revenue" name="Receita" stackId="a" fill="#f59e0b" radius={[0, 0, 4, 4]} />
                  <Bar dataKey="deliveryFee" name="Taxa de Entrega" stackId="a" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Seção 3 - Top Produtos */}
            <div className="glass-card p-6">
              <h3 className="text-sm font-black text-white uppercase tracking-widest mb-6">Produtos Mais Vendidos</h3>
              <div className="space-y-4">
                {metrics.topProducts.map((p, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <div className="w-6 text-center text-xs font-black text-gray-500">{i + 1}º</div>
                    {p.img ? (
                      <img src={p.img} alt={p.name} className="w-10 h-10 rounded-xl object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                        <ShoppingBag className="w-4 h-4 text-gray-600" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white truncate">{p.name}</p>
                      <p className="text-[10px] text-gray-500">{p.qty} unidades</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-amber-500">R$ {p.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Seção 4 - Top Addons e Pagamentos */}
            <div className="space-y-8 flex flex-col">
              <div className="glass-card p-6 flex-1">
                <h3 className="text-sm font-black text-white uppercase tracking-widest mb-6">Add-ons Mais Pedidos</h3>
                <div className="space-y-3">
                  {metrics.topAddons.map((a, i) => (
                    <div key={i} className="flex items-center justify-between border-b border-white/5 pb-2 last:border-0 last:pb-0">
                      <div>
                        <p className="text-xs font-bold text-gray-300">{a.name}</p>
                        <p className="text-[10px] text-gray-500">{a.qty} usos</p>
                      </div>
                      <p className="text-xs font-black text-amber-500">R$ {a.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </div>
                  ))}
                  {metrics.topAddons.length === 0 && <p className="text-xs text-gray-600">Nenhum adicional vendido.</p>}
                </div>
              </div>

              {/* Seção 5 - Pagamentos */}
              <div className="glass-card p-6 min-h-[350px]">
                <h3 className="text-sm font-black text-white uppercase tracking-widest mb-6">Formas de Pagamento</h3>
                <div className="h-64 w-full">
                  {metrics.paymentData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                          <Pie 
                            data={metrics.paymentData} 
                            cx="50%" 
                            cy="50%" 
                            innerRadius={60} 
                            outerRadius={80} 
                            paddingAngle={5} 
                            dataKey="value" 
                            stroke="none"
                          >
                            {metrics.paymentData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <RechartsTooltip 
                            contentStyle={{ backgroundColor: 'rgba(10,10,10,0.9)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}
                            itemStyle={{ color: '#fff', fontSize: '12px' }}
                            formatter={(val) => `R$ ${val.toFixed(2)}`} 
                          />
                          <Legend verticalAlign="bottom" align="center" iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '20px' }} />
                        </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-xs text-gray-600">Sem dados</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Seção 6 - Horários de Pico */}
            <div className="glass-card p-6">
              <h3 className="text-sm font-black text-white uppercase tracking-widest mb-6">Horários de Pico (Volume)</h3>
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={metrics.peakHoursData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="hour" stroke="#888" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="#888" fontSize={10} tickLine={false} axisLine={false} />
                    <RechartsTooltip 
                      contentStyle={{ backgroundColor: 'rgba(10,10,10,0.9)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}
                      itemStyle={{ color: '#fff', fontSize: '12px' }}
                      labelStyle={{ color: '#888', fontSize: '10px' }}
                      formatter={(val) => [`${val} pedidos`, 'Volume']}
                    />
                    <Line type="monotone" dataKey="count" stroke="#f59e0b" strokeWidth={3} dot={{ fill: '#f59e0b', strokeWidth: 0, r: 4 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Modalidade */}
            <div className="glass-card p-6 min-h-[350px]">
              <h3 className="text-sm font-black text-white uppercase tracking-widest mb-6">Entrega vs. Retirada</h3>
              <div className="h-64 w-full">
                {metrics.deliveryData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                      <Pie 
                        data={metrics.deliveryData} 
                        cx="50%" 
                        cy="50%" 
                        innerRadius={60} 
                        outerRadius={80} 
                        paddingAngle={5} 
                        dataKey="value" 
                        stroke="none"
                      >
                        {metrics.deliveryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={index === 0 ? '#3b82f6' : '#8b5cf6'} />
                        ))}
                      </Pie>
                      <RechartsTooltip 
                        contentStyle={{ backgroundColor: 'rgba(10,10,10,0.9)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}
                        itemStyle={{ color: '#fff', fontSize: '12px' }}
                        formatter={(val, name, props) => [`${val} pedidos (R$ ${props.payload.revenue.toFixed(2)})`, name]} 
                      />
                      <Legend verticalAlign="bottom" align="center" iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '20px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-xs text-gray-600">Sem dados</p>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Seção 7 - Bairros */}
            {metrics.topNeighborhoods.length > 0 && (
              <div className="glass-card p-6">
                <h3 className="text-sm font-black text-white uppercase tracking-widest mb-6">Top Bairros</h3>
                <div className="space-y-3">
                  {metrics.topNeighborhoods.map((n, i) => (
                    <div key={i} className="flex items-center justify-between border-b border-white/5 pb-2 last:border-0 last:pb-0">
                      <div>
                        <p className="text-xs font-bold text-gray-300">{n.name}</p>
                        <p className="text-[10px] text-gray-500">{n.count} pedidos • Ticket Médio R$ {(n.revenue / n.count).toFixed(2)}</p>
                      </div>
                      <p className="text-xs font-black text-amber-500">R$ {n.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Seção 8 - Cupons */}
            {metrics.couponsData.length > 0 && (
              <div className="glass-card p-6">
                <h3 className="text-sm font-black text-white uppercase tracking-widest mb-6">Uso de Cupons</h3>
                <div className="space-y-3">
                  {metrics.couponsData.map((c, i) => (
                    <div key={i} className="flex items-center justify-between border-b border-white/5 pb-2 last:border-0 last:pb-0">
                      <div>
                        <p className="text-xs font-bold text-gray-300">{c.code}</p>
                        <p className="text-[10px] text-red-500">Desconto dado: R$ {c.discountGiven.toFixed(2)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-gray-500">{c.count} usos</p>
                        <p className="text-xs font-black text-green-500">R$ {c.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Seção 9 - Cancelados */}
          {metrics.canceledList.length > 0 && (
            <div className="glass-card p-6 border-red-500/20">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-sm font-black text-red-500 uppercase tracking-widest">Pedidos Cancelados Recentes</h3>
                <span className="text-xs font-bold text-red-400 bg-red-500/10 px-2 py-1 rounded-md">
                  Perda Estimada: R$ {metrics.canceledLoss.toFixed(2)}
                </span>
              </div>
              <div className="space-y-3">
                {metrics.canceledList.map((o) => (
                  <div key={o.id} className="flex items-center justify-between border-b border-red-500/10 pb-2 last:border-0 last:pb-0">
                    <div>
                      <p className="text-xs font-bold text-gray-300">Pedido #{o.id.substring(0,6)}</p>
                      <p className="text-[10px] text-gray-500">{format(parseISO(o.createdAt || o.date), 'dd/MM/yyyy HH:mm')}</p>
                    </div>
                    <p className="text-xs font-black text-red-500">R$ {(o.finalPrice || o.total || 0).toFixed(2)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
