import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import ChatBot from '../components/ChatBot';

export default function DashboardLayout() {
  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="dashboard-content">
        {/* Aquí se renderizarán todas las páginas del dashboard (Home, Inventario, etc.) */}
        <div className="dashboard-container">
          <Outlet />
        </div>
      </main>
      <ChatBot />
    </div>
  );
}
