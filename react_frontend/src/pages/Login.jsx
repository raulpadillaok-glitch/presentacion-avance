import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Search, X, Activity, Clock } from 'lucide-react';

const KANBAN_COLUMNS = [
  { id: 'pending', label: 'Pendiente', color: '#eab308' },
  { id: 'diagnosing', label: 'Diagnosticando', color: '#a855f7' },
  { id: 'waiting_parts', label: 'Repuestos', color: '#ef4444' },
  { id: 'in_process', label: 'En Proceso', color: '#3b82f6' },
  { id: 'finished', label: 'Finalizado', color: '#22c55e' },
  { id: 'delivered', label: 'Entregado', color: '#059669' }
];

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorStatus, setErrorStatus] = useState('');
  const navigate = useNavigate();

  // Tracking Portal State
  const [isTrackingOpen, setIsTrackingOpen] = useState(false);
  const [trackingCode, setTrackingCode] = useState('');
  const [trackingResult, setTrackingResult] = useState(null);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackingError, setTrackingError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorStatus('');
    try {
      const response = await axios.post('http://localhost:8000/api/v1/auth/login/', {
        username: username,
        password: password
      });
      const token = response.data.access;
      localStorage.setItem('access_token', token);
      localStorage.setItem('user_role', response.data.role);
      navigate('/dashboard'); // Redirect a Dashboard
    } catch (error) {
      setErrorStatus('Credenciales inválidas. Verifica tu usuario y contraseña.');
    }
  };

  const handleTrackOrder = async () => {
    if (!trackingCode.trim()) { setTrackingError('Ingresa un código válido'); return; }
    setTrackingLoading(true); setTrackingError('');
    try {
      const resp = await axios.get(`http://localhost:8000/api/v1/public/track-order/?code=${encodeURIComponent(trackingCode.trim())}`);
      setTrackingResult(resp.data);
    } catch(err) {
      setTrackingError(err.response?.data?.error || 'No se pudo conectar con el satélite de rastreo.');
    } finally {
      setTrackingLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="glass-card" style={{ width: '400px', maxWidth: '90%' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ color: 'var(--primary-color)', fontSize: '2.5rem', marginBottom: '0.5rem' }}>
            🏍️
          </h1>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Moto ERP</h2>
          <p style={{ color: 'var(--text-muted)' }}>Panel de Control Total</p>
        </div>

        <form onSubmit={handleLogin}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: 'var(--text-muted)' }}>
              Usuario
            </label>
            <input 
              type="text" 
              placeholder="tu@correo.com" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required 
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: 'var(--text-muted)' }}>
              Contraseña
            </label>
            <input 
              type="password" 
              placeholder="••••••••" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
            />
          </div>

          <button type="submit" style={{ width: '100%', marginTop: '1rem', padding: '1rem' }}>
            Ingresar al Sistema
          </button>
          
          {errorStatus && (
            <div style={{ marginTop: '1rem', color: '#ef4444', textAlign: 'center', fontWeight: '600', background: 'rgba(239, 68, 68, 0.1)', padding: '0.5rem', borderRadius: '8px' }}>
              {errorStatus}
            </div>
          )}
        </form>
        
        <div style={{ marginTop: '2.5rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.1)', textAlign: 'center' }}>
           <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>¿Eres cliente del taller?</p>
           <button 
             onClick={() => { setIsTrackingOpen(true); setTrackingResult(null); setTrackingError(''); setTrackingCode(''); }}
             style={{ background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.3)', width: '100%', padding: '0.8rem', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.3s' }}
           >
              <Activity size={20} /> Rastrear mi Motocicleta
           </button>
        </div>
      </div>

      {/* Public Tracking Modal */}
      {isTrackingOpen && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 9999, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(15px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
           <style>
             {`
               @keyframes satPulse {
                 0% { transform: scale(1.3); box-shadow: 0 0 15px var(--pulse-color); }
                 50% { transform: scale(1.45); box-shadow: 0 0 35px var(--pulse-color), 0 0 10px var(--pulse-color) inset; }
                 100% { transform: scale(1.3); box-shadow: 0 0 15px var(--pulse-color); }
               }
             `}
           </style>
           <div className="modal-content animate-fade-in" style={{ width: '100%', maxWidth: '700px', maxHeight: '90vh', overflowY: 'auto', background: 'rgba(30, 41, 59, 0.85)', backdropFilter: 'blur(25px)', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 25px 80px rgba(0,0,0,0.8)' }}>
              
              <div style={{ padding: '1.5rem 2rem', background: 'rgba(15, 23, 42, 0.6)', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                 <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.3rem', color: '#fff' }}>
                    <Search color="var(--primary-color)" /> Rastreo Satelital de Órdenes
                 </h2>
                 <button onClick={() => setIsTrackingOpen(false)} style={{ cursor: 'pointer', background: 'rgba(255,255,255,0.1)', borderRadius: '50%', border: 'none', color: '#fff', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                   <X size={20} />
                 </button>
              </div>

              <div style={{ padding: '2rem' }}>
                 {!trackingResult ? (
                   <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                      <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Escribe el código de orden que se te entregó en caja para rastrear el progreso en vivo.</p>
                      <div style={{ display: 'flex', gap: '1rem', maxWidth: '400px', margin: '0 auto' }}>
                         <input 
                           type="text" 
                           placeholder="Ej. ORD-003" 
                           value={trackingCode}
                           onChange={(e) => setTrackingCode(e.target.value)}
                           style={{ flex: 1, padding: '1rem', borderRadius: '12px', border: '1px solid var(--primary-color)', background: 'var(--bg-main)', color: 'var(--text-main)', fontSize: '1.1rem', textAlign: 'center', textTransform: 'uppercase' }}
                           onKeyDown={(e) => { if (e.key === 'Enter') handleTrackOrder(); }}
                         />
                         <button onClick={handleTrackOrder} disabled={trackingLoading} className="btn-primary" style={{ padding: '1rem 2rem', borderRadius: '12px', fontSize: '1rem' }}>
                            {trackingLoading ? '...' : 'Buscar'}
                         </button>
                      </div>
                      {trackingError && <p style={{ color: '#ef4444', marginTop: '1.5rem', background: 'rgba(239, 68, 68, 0.1)', padding: '0.5rem', borderRadius: '8px', display: 'inline-block' }}>{trackingError}</p>}
                   </div>
                 ) : (
                   <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                      <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                           <h3 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--primary-color)' }}>Orden #{trackingResult.code}</h3>
                           <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}><Clock size={16}/> Ingreso: {new Date(trackingResult.entry_at).toLocaleDateString()}</span>
                         </div>
                         <p style={{ color: 'var(--text-main)', fontSize: '1.1rem', margin: '0 0 0.5rem 0' }}><strong>Vehículo:</strong> {trackingResult.motorcycle_brand} ({trackingResult.motorcycle_plate})</p>
                         <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}><strong>Detalle Original:</strong> {trackingResult.problem_description}</p>
                      </div>
                      
                      {trackingResult.evidence_video && (
                         <div className="animate-fade-in" style={{ borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', background: '#000', marginTop: '-1rem' }}>
                           <h4 style={{ margin: 0, padding: '0.75rem', background: 'rgba(255,255,255,0.05)', color: '#fff', textAlign: 'center', fontSize: '0.9rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
                             Evidencia de Taller
                           </h4>
                           {trackingResult.evidence_video.match(/\.(mp4|webm|ogg)$/i) ? (
                              <video controls src={trackingResult.evidence_video} style={{ width: '100%', maxHeight: '400px', display: 'block', margin: '0 auto' }} />
                           ) : (
                              <img src={trackingResult.evidence_video} alt="Evidencia" style={{ width: '100%', maxHeight: '400px', objectFit: 'contain', display: 'block', margin: '0 auto' }} />
                           )}
                         </div>
                      )}

                      <div style={{ padding: '0.5rem 0' }}>
                        <h4 style={{ color: '#fff', marginBottom: '1.5rem', textAlign: 'center' }}>Línea de Vida Satelital</h4>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', position: 'relative' }}>
                          {KANBAN_COLUMNS.map((col, idx) => {
                             const currentIndex = KANBAN_COLUMNS.findIndex(c => c.id === trackingResult.status);
                             const isActive = idx === currentIndex;
                             const isCompleted = idx <= currentIndex;
                             return (
                               <div key={col.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, position: 'relative' }}>
                                  {idx < KANBAN_COLUMNS.length - 1 && (
                                    <div style={{ width: '100%', height: '4px', background: isCompleted ? col.color : 'var(--border-color)', position: 'absolute', top: '15px', zIndex: 0, left: '50%', transition: 'background 0.5s' }}></div>
                                  )}
                                  <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: isCompleted ? col.color : 'var(--bg-main)', border: `3px solid ${isCompleted ? col.color : 'var(--border-color)'}`, zIndex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', color: isCompleted ? '#fff' : 'var(--text-muted)', fontWeight: 'bold', animation: isActive ? 'satPulse 2s infinite' : 'none', transform: isActive ? 'scale(1.3)' : 'none', transition: 'all 0.5s', '--pulse-color': col.color }}>
                                     {idx + 1}
                                  </div>
                                  <span style={{ marginTop: isActive ? '1rem' : '0.75rem', fontSize: '0.8rem', fontWeight: isActive ? 'bold' : '600', color: isCompleted ? 'var(--text-main)' : 'var(--text-muted)', textAlign: 'center', lineHeight: '1.2' }}>{col.label}</span>
                               </div>
                             )
                          })}
                        </div>
                      </div>

                      <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                        <button onClick={() => setTrackingResult(null)} style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-muted)', padding: '0.75rem 2rem', borderRadius: '12px', cursor: 'pointer' }}>Realizar otra consulta</button>
                      </div>
                   </div>
                 )}
              </div>

           </div>
        </div>
      )}
    </div>
  );
}
