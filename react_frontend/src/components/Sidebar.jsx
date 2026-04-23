import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Home, Package, Wrench, Users, Settings, LogOut, FileText, Printer, BarChart2, Box } from 'lucide-react';

export default function Sidebar() {
  const navigate = useNavigate();
  const [logo, setLogo] = useState(localStorage.getItem('company_logo') || 'https://media3.giphy.com/media/l41lN3OziHn3gWfkk/giphy.gif');

  useEffect(() => {
    const handleLogoChange = () => setLogo(localStorage.getItem('company_logo') || 'https://media3.giphy.com/media/l41lN3OziHn3gWfkk/giphy.gif');
    window.addEventListener('logoChanged', handleLogoChange);
    return () => window.removeEventListener('logoChanged', handleLogoChange);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_role');
    navigate('/login');
  };

  const role = localStorage.getItem('user_role') || 'client';

  const navItems = [
    { to: '/dashboard', icon: <Home size={20} />, label: 'Inicio', roles: ['admin', 'technician', 'client'] },
    { to: '/dashboard/inventory', icon: <Package size={20} />, label: 'Inventario', roles: ['admin', 'technician'] },
    { to: '/dashboard/workshop', icon: <Wrench size={20} />, label: 'Taller', roles: ['admin', 'technician'] },
    { to: '/dashboard/viewer3d', icon: <Box size={20} />, label: 'Visor 3D', roles: ['admin', 'technician'] },
    { to: '/dashboard/quotes', icon: <FileText size={20} />, label: 'Cotizaciones', roles: ['admin'] },
    { to: '/dashboard/billing', icon: <Printer size={20} />, label: 'Facturación', roles: ['admin'] },
    { to: '/dashboard/reports', icon: <BarChart2 size={20} />, label: 'Reportes M.', roles: ['admin'] },
    { to: '/dashboard/clients', icon: <Users size={20} />, label: 'Clientes', roles: ['admin'] },
    { to: '/dashboard/settings', icon: <Settings size={20} />, label: 'Configuración', roles: ['admin'] },
  ];

  const visibleItems = navItems.filter(item => item.roles.includes(role));

  return (
    <aside className="sidebar">
      <div className="sidebar-header" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        {(logo.startsWith('data:video') || logo.endsWith('.mp4') || logo.endsWith('.webm')) ? (
           <video src={logo} autoPlay loop muted style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', marginBottom: '0.5rem', border: '2px solid var(--primary-color)', boxShadow: '0 0 15px var(--primary-color)' }} />
        ) : (
           <img src={logo} alt="Motorcycle Logo" style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', marginBottom: '0.5rem', border: '2px solid var(--primary-color)', boxShadow: '0 0 15px var(--primary-color)' }} />
        )}
        <h2 style={{ fontSize: '1.25rem', margin: 0, textShadow: '0 0 5px rgba(234, 179, 8, 0.5)' }}>Moto ERP</h2>
      </div>
      
      <nav className="sidebar-nav">
        {visibleItems.map((item) => (
          <NavLink 
            key={item.to} 
            to={item.to} 
            end={item.to === '/dashboard'}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            {item.icon}
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button className="logout-btn" onClick={handleLogout}>
          <LogOut size={20} />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  );
}
