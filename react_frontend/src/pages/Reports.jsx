import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { PieChart, Pie, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, AreaChart, Area } from 'recharts';
import { BarChart as BarChartIcon, Users, Package, DollarSign } from 'lucide-react';

const COLORS = ['#a855f7', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

export default function Reports() {
  const [data, setData] = useState({
    monthly_revenue: [],
    top_techs: [],
    inventory_valuation: 0,
    order_distribution: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const token = sessionStorage.getItem('access_token');
        const res = await axios.get('http://localhost:8000/api/v1/reports/advanced/', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setData(res.data);
      } catch (err) {
        console.error("Error cargando reportes", err);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  if (loading) return <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Analizando big data...</div>;

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '2rem' }}>
      <header style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
          <BarChartIcon size={32} color="#a855f7" /> Centro Analítico Avanzado
        </h1>
        <p style={{ color: 'var(--text-muted)' }}>Métricas e inteligencia de negocios a nivel empresarial.</p>
      </header>

      {/* KPI Highlights */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '2.5rem' }}>
         <div style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.1), rgba(168,85,247,0.1))', padding: '1.5rem', borderRadius: '16px', border: '1px solid rgba(168,85,247,0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#a855f7', marginBottom: '0.5rem' }}><Package size={20}/> Valor del Inventario Total</div>
            <h2 style={{ fontSize: '2.5rem', margin: 0 }}>Bs. {data.inventory_valuation.toLocaleString()}</h2>
         </div>
         <div style={{ background: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}><DollarSign size={20}/> Mejor Mes Comercial</div>
            <h2 style={{ fontSize: '2rem', margin: 0, color: '#10b981' }}>
              {data.monthly_revenue.length > 0 ? (
                `Bs. ${Math.max(...data.monthly_revenue.map(m => m.ingresos)).toLocaleString()}`
              ) : 'N/A'}
            </h2>
         </div>
         <div style={{ background: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}><Users size={20}/> Empleado del Mes (St. Teórico)</div>
            <h2 style={{ fontSize: '1.8rem', margin: 0, color: '#3b82f6' }}>
              {data.top_techs.length > 0 ? data.top_techs[0].name : 'Pendiente'}
            </h2>
         </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        
        {/* Main Chart */}
        <div style={{ background: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
           <h3 style={{ marginBottom: '1.5rem', color: 'var(--text-main)', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>Crecimiento Mensualizado (Últimos 6 meses)</h3>
           <div style={{ height: 350 }}>
             <ResponsiveContainer width="100%" height="100%">
               <AreaChart data={data.monthly_revenue} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                 <defs>
                   <linearGradient id="colorIngresos" x1="0" y1="0" x2="0" y2="1">
                     <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                     <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                   </linearGradient>
                 </defs>
                 <XAxis dataKey="name" stroke="var(--text-muted)" />
                 <YAxis stroke="var(--text-muted)" />
                 <Tooltip contentStyle={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)' }} />
                 <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                 <Area type="monotone" dataKey="ingresos" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorIngresos)" />
               </AreaChart>
             </ResponsiveContainer>
           </div>
        </div>

        {/* Side Charts */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div style={{ background: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--border-color)', height: '100%' }}>
             <h3 style={{ marginBottom: '1rem', color: 'var(--text-main)', fontSize: '1rem', textAlign: 'center' }}>Distribución Operativa</h3>
             <div style={{ height: 200 }}>
               <ResponsiveContainer width="100%" height="100%">
                 <PieChart>
                   <Pie
                     data={data.order_distribution}
                     cx="50%"
                     cy="50%"
                     innerRadius={60}
                     outerRadius={80}
                     paddingAngle={5}
                     dataKey="value"
                   >
                     {data.order_distribution.map((entry, index) => (
                       <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                     ))}
                   </Pie>
                   <Tooltip contentStyle={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '8px' }} />
                 </PieChart>
               </ResponsiveContainer>
             </div>
             <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'center', marginTop: '1rem' }}>
               {data.order_distribution.map((entry, index) => (
                 <span key={index} style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                   <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: COLORS[index % COLORS.length] }}></div>
                   {entry.name}
                 </span>
               ))}
             </div>
          </div>

          <div style={{ background: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
             <h3 style={{ marginBottom: '1.5rem', color: 'var(--text-main)', fontSize: '1rem' }}>Desempeño Técnico (Reparaciones)</h3>
             <div style={{ height: 200 }}>
               <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={data.top_techs} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                   <XAxis type="number" hide />
                   <YAxis dataKey="name" type="category" stroke="var(--text-muted)" fontSize={12} width={80} />
                   <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{ backgroundColor: 'var(--bg-primary)', border: 'none' }} />
                   <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
                 </BarChart>
               </ResponsiveContainer>
             </div>
          </div>

        </div>

      </div>
    </div>
  );
}
