import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import DashboardLayout from './layouts/DashboardLayout';
import DashboardHome from './pages/DashboardHome';
import Billing from './pages/Billing';
import Reports from './pages/Reports';
import MotoView3D from './pages/MotoView3D';
import Inventory from './pages/Inventory';
import Workshop from './pages/Workshop';
import Clients from './pages/Clients';
import Settings from './pages/Settings';
import Quotes from './pages/Quotes';
import './index.css';

function App() {
  // Verificación básica de autenticación
  const isAuthenticated = !!localStorage.getItem('access_token');

  return (
    <BrowserRouter>
      <Routes>
        {/* Ruta principal redirige a login u dashboard */}
        <Route path="/" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />} />
        
        <Route path="/login" element={<Login />} />
        
        {/* Rutas Privadas del Dashboard */}
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<DashboardHome />} />
          <Route path="inventory" element={<Inventory />} />
          <Route path="workshop" element={<Workshop />} />
          <Route path="quotes" element={<Quotes />} />
          <Route path="clients" element={<Clients />} />
          <Route path="billing" element={<Billing />} />
          <Route path="reports" element={<Reports />} />
          <Route path="viewer3d" element={<MotoView3D />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
