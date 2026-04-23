import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Wrench, Package, TrendingUp, Users, AlertCircle, Clock, CheckCircle, BarChart as BarChartIcon } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

export default function DashboardHome() {
  const role = localStorage.getItem('user_role') || 'usuario';
  const companyName = localStorage.getItem('company_name') || 'Moto ERP';
  const currency = localStorage.getItem('company_currency') || 'Bs.';
  
  const [stats, setStats] = useState({
    monthly_revenue: 0,
    active_orders: 0,
    low_stock_count: 0,
    low_stock_count: 0,
    total_clients: 0,
    recent_orders: [],
    critical_stock: [],
    revenue_chart: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const res = await axios.get('http://localhost:8000/api/v1/dashboard-stats/', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setStats(res.data);
      } catch (err) {
        console.error("Error fetching stats:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const getOrderStatusBadge = (status) => {
    switch(status) {
      case 'pending': return <span className="badge" style={{ background: 'rgba(234, 179, 8, 0.1)', color: '#eab308' }}>Pendiente</span>;
      case 'diagnosing': return <span className="badge" style={{ background: 'rgba(168, 85, 247, 0.1)', color: '#a855f7' }}>Diagnosticando</span>;
      case 'waiting_parts': return <span className="badge" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>Esperando Repuestos</span>;
      case 'in_process': return <span className="badge" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>En Proceso</span>;
      case 'finished': return <span className="badge badge-success">Finalizado</span>;
      case 'delivered': return <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#059669', opacity: 0.8 }}>Entregado</span>;
      default: return <span className="badge">{status}</span>;
    }
  };

  if (loading) {
    return <div className="loading-state" style={{ marginTop: '4rem' }}>Cargando Centro de Mando...</div>;
  }

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '2rem' }}>
      <header style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 800, marginBottom: '0.25rem' }}>{companyName}</h1>
          <p style={{ color: 'var(--text-muted)' }}>Resumen gerencial de operaciones. Nivel de acceso: <strong style={{color: 'var(--primary-color)'}}>{role.toUpperCase()}</strong></p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Fecha de hoy</div>
          <div style={{ fontWeight: 600 }}>{new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
        </div>
      </header>

      {/* KPI Cards */}
      <div className="dashboard-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '2.5rem' }}>
        
        <div className="dashboard-card" style={cardStyle}>
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Caja Menual (Cotizado)</h3>
            <div style={{ padding: '0.5rem', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', borderRadius: '8px' }}><TrendingUp size={20} /></div>
          </div>
          <p className="card-number" style={{ fontSize: '2rem', fontWeight: 700, margin: 0 }}>{currency} {stats.monthly_revenue}</p>
          <span style={{ fontSize: '0.85rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.5rem' }}><CheckCircle size={14}/> Crecimiento estable</span>
        </div>

        <div className="dashboard-card" style={cardStyle}>
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Reparaciones Activas</h3>
            <div style={{ padding: '0.5rem', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', borderRadius: '8px' }}><Wrench size={20} /></div>
          </div>
          <p className="card-number" style={{ fontSize: '2rem', fontWeight: 700, margin: 0 }}>{stats.active_orders}</p>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.5rem' }}>Motos físicas en taller</span>
        </div>

        <div className="dashboard-card" style={cardStyle}>
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Cartera de Clientes</h3>
            <div style={{ padding: '0.5rem', background: 'rgba(168, 85, 247, 0.1)', color: '#a855f7', borderRadius: '8px' }}><Users size={20} /></div>
          </div>
          <p className="card-number" style={{ fontSize: '2rem', fontWeight: 700, margin: 0 }}>{stats.total_clients}</p>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.5rem' }}>Registros totales</span>
        </div>

        <div className="dashboard-card" style={{ ...cardStyle, border: stats.low_stock_count > 0 ? '1px solid rgba(239, 68, 68, 0.3)' : cardStyle.border }}>
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: stats.low_stock_count > 0 ? '#ef4444' : 'var(--text-muted)' }}>Alertas de Stock</h3>
            <div style={{ padding: '0.5rem', background: stats.low_stock_count > 0 ? 'rgba(239, 68, 68, 0.1)' : 'var(--bg-tertiary)', color: stats.low_stock_count > 0 ? '#ef4444' : 'var(--text-muted)', borderRadius: '8px' }}><AlertCircle size={20} /></div>
          </div>
          <p className="card-number" style={{ fontSize: '2rem', fontWeight: 700, margin: 0, color: stats.low_stock_count > 0 ? '#ef4444' : 'var(--text-main)' }}>{stats.low_stock_count}</p>
          <span style={{ fontSize: '0.85rem', color: stats.low_stock_count > 0 ? '#ef4444' : 'var(--text-muted)', display: 'block', marginTop: '0.5rem' }}>Items por debajo del mínimo</span>
        </div>
      </div>

      {/* Two Column Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        
        {/* Left Column: Recent Orders and Chart */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div style={{ background: 'var(--bg-secondary)', borderRadius: '16px', padding: '1.5rem', border: '1px solid var(--border-color)', boxShadow: '0 4px 6px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><BarChartIcon size={20}/> Evolución de Ingresos (7 Días)</h3>
            </div>
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.revenue_chart} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" stroke="var(--text-muted)" />
                  <YAxis stroke="var(--text-muted)" />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)' }} />
                  <Area type="monotone" dataKey="Ingresos" stroke="#10b981" fillOpacity={1} fill="url(#colorRevenue)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div style={{ background: 'var(--bg-secondary)', borderRadius: '16px', padding: '1.5rem', border: '1px solid var(--border-color)', boxShadow: '0 4px 6px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Clock size={20}/> Últimos Ingresos a Taller</h3>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                  <th style={{ paddingBottom: '0.5rem' }}>Código</th>
                  <th style={{ paddingBottom: '0.5rem' }}>Placa</th>
                  <th style={{ paddingBottom: '0.5rem' }}>Ingreso</th>
                  <th style={{ paddingBottom: '0.5rem' }}>Estado</th>
                </tr>
              </thead>
              <tbody>
                {stats.recent_orders.map(o => (
                  <tr key={o.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '0.75rem 0', fontFamily: 'monospace' }}>#{o.code}</td>
                    <td style={{ fontWeight: 500 }}>{o.motorcycle}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{o.date}</td>
                    <td>{getOrderStatusBadge(o.status)}</td>
                  </tr>
                ))}
                {stats.recent_orders.length === 0 && <tr><td colSpan="4" style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)' }}>Sin órdenes recientes</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Missing Parts Alert */}
        <div style={{ background: 'var(--bg-secondary)', borderRadius: '16px', padding: '1.5rem', border: '1px solid var(--border-color)', boxShadow: '0 4px 6px rgba(0,0,0,0.2)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.2rem', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><AlertCircle size={20}/> Stock Deficiente</h3>
          </div>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {stats.critical_stock.map(p => (
              <li key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.8rem', background: 'var(--bg-main)', borderRadius: '8px', borderLeft: '4px solid #ef4444' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{p.name}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Mínimo aceptable: {p.min_stock}</div>
                </div>
                <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '0.25rem 0.75rem', borderRadius: '12px', fontWeight: 'bold' }}>
                  {p.stock} uni
                </div>
              </li>
            ))}
            {stats.critical_stock.length === 0 && (
              <div style={{ textAlign: 'center', color: '#10b981', padding: '2rem 0' }}>
               <CheckCircle size={40} style={{ margin: '0 auto', marginBottom: '1rem', opacity: 0.5 }} />
               <p>Tu inventario está en perfectas condiciones.</p>
              </div>
            )}
          </ul>
        </div>

      </div>
    </div>
  );
}

const cardStyle = {
  background: 'var(--bg-secondary)',
  borderRadius: '16px',
  padding: '1.5rem',
  border: '1px solid var(--border-color)',
  boxShadow: '0 4px 6px rgba(0,0,0,0.2)'
};
