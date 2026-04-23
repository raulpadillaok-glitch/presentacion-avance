import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Settings as SettingsIcon, Users, Building, Wrench, Plus, Edit, Trash2, X, AlertCircle } from 'lucide-react';

export default function Settings() {
  const [activeTab, setActiveTab] = useState('company');

  return (
    <div className="animate-fade-in">
      <header className="page-header">
        <div>
          <h1 style={{ fontSize: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <SettingsIcon /> Configuración del ERP
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>Administra variables de negocio, personal y catálogos globales</p>
        </div>
      </header>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
        <button 
          onClick={() => setActiveTab('company')}
          style={{ padding: '0.5rem 1rem', background: 'none', border: 'none', borderBottom: activeTab === 'company' ? '2px solid var(--primary-color)' : '2px solid transparent', color: activeTab === 'company' ? 'var(--text-main)' : 'var(--text-muted)', cursor: 'pointer', fontWeight: activeTab === 'company' ? 'bold' : 'normal', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Building size={18} /> Empresa
        </button>
        <button 
          onClick={() => setActiveTab('technicians')}
          style={{ padding: '0.5rem 1rem', background: 'none', border: 'none', borderBottom: activeTab === 'technicians' ? '2px solid var(--primary-color)' : '2px solid transparent', color: activeTab === 'technicians' ? 'var(--text-main)' : 'var(--text-muted)', cursor: 'pointer', fontWeight: activeTab === 'technicians' ? 'bold' : 'normal', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Users size={18} /> Técnicos
        </button>
        <button 
          onClick={() => setActiveTab('services')}
          style={{ padding: '0.5rem 1rem', background: 'none', border: 'none', borderBottom: activeTab === 'services' ? '2px solid var(--primary-color)' : '2px solid transparent', color: activeTab === 'services' ? 'var(--text-main)' : 'var(--text-muted)', cursor: 'pointer', fontWeight: activeTab === 'services' ? 'bold' : 'normal', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Wrench size={18} /> Catálogo de Servicios
        </button>
        <button 
          onClick={() => setActiveTab('deleted_clients')}
          style={{ padding: '0.5rem 1rem', background: 'none', border: 'none', borderBottom: activeTab === 'deleted_clients' ? '2px solid #ef4444' : '2px solid transparent', color: activeTab === 'deleted_clients' ? 'var(--text-main)' : 'var(--text-muted)', cursor: 'pointer', fontWeight: activeTab === 'deleted_clients' ? 'bold' : 'normal', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Trash2 size={18} color={activeTab === 'deleted_clients' ? '#ef4444' : 'inherit'} /> Papelera
        </button>
      </div>

      <div className="tab-content" style={{ backgroundColor: 'var(--bg-secondary)', padding: '2rem', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
        {activeTab === 'company' && <CompanySettings />}
        {activeTab === 'technicians' && <TechnicianSettings />}
        {activeTab === 'services' && <ServiceSettings />}
        {activeTab === 'deleted_clients' && <DeletedClientsSettings />}
      </div>
    </div>
  );
}

// ================= COMPANY SETTINGS =================

function CompanySettings() {
  const [data, setData] = useState({
    name: localStorage.getItem('company_name') || 'Chicken Moto ERP',
    currency: localStorage.getItem('company_currency') || 'Bs.',
    taxRate: localStorage.getItem('company_tax') || '13',
    logo: localStorage.getItem('company_logo') || 'https://media3.giphy.com/media/l41lN3OziHn3gWfkk/giphy.gif',
  });

  const handleChange = (e) => setData({ ...data, [e.target.name]: e.target.value });

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 8 * 1024 * 1024) {
         alert("El archivo es muy pesado. Usa un archivo más pequeño (máx 8MB).");
         return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
         setData({ ...data, logo: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    localStorage.setItem('company_name', data.name);
    localStorage.setItem('company_currency', data.currency);
    localStorage.setItem('company_tax', data.taxRate);
    localStorage.setItem('company_logo', data.logo);
    window.dispatchEvent(new Event('logoChanged'));
    alert('Preferencias de empresa guardadas con éxito. Surte efecto en la interfaz local.');
  };

  return (
    <form onSubmit={handleSave} style={{ maxWidth: '600px', display: 'grid', gap: '1.5rem' }}>
      <div>
        <h2>Preferencias Locales</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Estos datos se usan para personalizar la interfaz y documentos de cotización.</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <label>Nombre del Taller / Empresa</label>
        <input name="name" value={data.name} onChange={handleChange} style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-main)', color: 'var(--text-main)' }} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <label>Logo de la Empresa (JPG/PNG o animado)</label>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          {(data.logo.startsWith('data:video') || data.logo.endsWith('.mp4') || data.logo.endsWith('.webm')) ? (
             <video src={data.logo} autoPlay loop muted style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '50%' }} />
          ) : (
             <img src={data.logo} alt="Logo" style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '50%' }} />
          )}
          <input type="file" accept="image/*,video/mp4,video/webm" onChange={handleFileChange} style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-main)', color: 'var(--text-main)', flex: 1 }} />
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <label>Símbolo de Moneda</label>
        <input name="currency" value={data.currency} onChange={handleChange} style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-main)', color: 'var(--text-main)' }} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <label>Tasa de Impuesto / IVA (%)</label>
        <input type="number" name="taxRate" value={data.taxRate} onChange={handleChange} style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-main)', color: 'var(--text-main)' }} />
      </div>

      <div>
        <button type="submit" className="btn-primary" style={{ padding: '0.75rem 2rem' }}>Guardar Preferencias</button>
      </div>
    </form>
  );
}

// ================= TECHNICIAN SETTINGS =================

function TechnicianSettings() {
  const [techs, setTechs] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ first_name: '', last_name: '', phone: '', specialty: '', is_available: true });

  const fetchTechs = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const res = await axios.get('http://localhost:8000/api/v1/accounts/technicians/', { headers: { Authorization: `Bearer ${token}` } });
      setTechs(res.data);
    } catch(err) { console.error(err); } 
    finally { setLoading(false); }
  };

  useEffect(() => { fetchTechs(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        person: {
          first_name: formData.first_name,
          last_name: formData.last_name,
          phone: formData.phone
        },
        specialty: formData.specialty,
        is_available: formData.is_available
      };
      
      const token = localStorage.getItem('access_token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      if (editingId) await axios.put(`http://localhost:8000/api/v1/accounts/technicians/${editingId}/`, payload, config);
      else await axios.post('http://localhost:8000/api/v1/accounts/technicians/', payload, config);
      
      setIsModalOpen(false);
      fetchTechs();
    } catch (err) { 
      console.error(err.response?.data || err);
      alert('Error guardando el técnico: ' + JSON.stringify(err.response?.data || {})); 
    }
  };

  const openCreate = () => {
    setEditingId(null);
    setFormData({ first_name: '', last_name: '', phone: '', specialty: '', is_available: true });
    setIsModalOpen(true);
  };

  const openEdit = (t) => {
    setEditingId(t.id);
    setFormData({ first_name: t.person_details?.first_name, last_name: t.person_details?.last_name, phone: t.person_details?.phone || '', specialty: t.specialty, is_available: t.is_available });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if(!window.confirm('¿Borrar este técnico?')) return;
    try {
      const token = localStorage.getItem('access_token');
      await axios.delete(`http://localhost:8000/api/v1/accounts/technicians/${id}/`, { headers: { Authorization: `Bearer ${token}` } });
      fetchTechs();
    } catch (err) { alert('Error al borrar'); }
  };

  if(loading) return <div>Cargando técnicos...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <h2>Equípo Técnico</h2>
        <button className="btn-primary" onClick={openCreate} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}><Plus size={18}/> Agregar Técnico</button>
      </div>

      <table className="data-table">
        <thead><tr><th>Nombre</th><th>Teléfono</th><th>Especialidad</th><th>Estado</th><th>Acciones</th></tr></thead>
        <tbody>
          {techs.map(t => (
            <tr key={t.id}>
              <td>{t.person_details?.first_name} {t.person_details?.last_name}</td>
              <td>{t.person_details?.phone || 'N/A'}</td>
              <td>{t.specialty}</td>
              <td>{t.is_available ? <span className="badge badge-success">Disponible</span> : <span className="badge badge-danger">Ocupado/Inactivo</span>}</td>
              <td>
                <button onClick={() => openEdit(t)} style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', cursor: 'pointer', padding: '0.25rem' }}><Edit size={18} /></button>
                <button onClick={() => handleDelete(t.id)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.25rem' }}><Trash2 size={18} /></button>
              </td>
            </tr>
          ))}
          {techs.length === 0 && <tr><td colSpan="5">No hay técnicos</td></tr>}
        </tbody>
      </table>

      {isModalOpen && (
        <div className="modal-overlay" style={modalStyles.overlay}>
          <div className="modal-content" style={modalStyles.content}>
            <h2>{editingId ? 'Editar Técnico' : 'Nuevo Técnico'}</h2>
            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1rem', gridTemplateColumns: '1fr 1fr' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label>Nombres</label>
                <input required value={formData.first_name} onChange={e => setFormData({...formData, first_name: e.target.value})} style={modalStyles.input} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label>Apellidos</label>
                <input required value={formData.last_name} onChange={e => setFormData({...formData, last_name: e.target.value})} style={modalStyles.input} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label>Teléfono</label>
                <input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} style={modalStyles.input} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label>Especialidad</label>
                <input required value={formData.specialty} onChange={e => setFormData({...formData, specialty: e.target.value})} style={modalStyles.input} />
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', gridColumn: '1 / -1', alignItems: 'center' }}>
                <input type="checkbox" checked={formData.is_available} onChange={e => setFormData({...formData, is_available: e.target.checked})} />
                <label>Disponible para asignar</label>
              </div>
              <div style={modalStyles.actions}>
                <button type="button" onClick={() => setIsModalOpen(false)} style={modalStyles.cancelBtn}>Cancelar</button>
                <button type="submit" className="btn-primary" style={{ padding: '0.75rem 1.5rem' }}>Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ================= SERVICE SETTINGS =================

function ServiceSettings() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '', labor_cost: '', estimated_time_minutes: '', demonstration_video: null });

  const fetchServices = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const res = await axios.get('http://localhost:8000/api/v1/workshop/services/', { headers: { Authorization: `Bearer ${token}` } });
      setServices(res.data);
    } catch(err) { console.error(err); } 
    finally { setLoading(false); }
  };

  useEffect(() => { fetchServices(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = new FormData();
      data.append('name', formData.name);
      data.append('description', formData.description || '');
      data.append('labor_cost', formData.labor_cost);
      data.append('estimated_time_minutes', formData.estimated_time_minutes);
      // Solo anexamos video si adjuntó un archivo nuevo
      if (formData.demonstration_video instanceof File) {
        data.append('demonstration_video', formData.demonstration_video);
      }

      const token = localStorage.getItem('access_token');
      const config = { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } };
      
      if (editingId) await axios.put(`http://localhost:8000/api/v1/workshop/services/${editingId}/`, data, config);
      else await axios.post('http://localhost:8000/api/v1/workshop/services/', data, config);
      
      setIsModalOpen(false);
      fetchServices();
    } catch (err) { 
      console.error(err.response?.data || err);
      alert('Error guardando el servicio: ' + JSON.stringify(err.response?.data || {})); 
    }
  };

  const openCreate = () => {
    setEditingId(null);
    setFormData({ name: '', description: '', labor_cost: '', estimated_time_minutes: '', demonstration_video: null });
    setIsModalOpen(true);
  };

  const openEdit = (s) => {
    setEditingId(s.id);
    setFormData({ name: s.name, description: s.description || '', labor_cost: s.labor_cost, estimated_time_minutes: s.estimated_time_minutes, demonstration_video: null });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if(!window.confirm('¿Borrar este servicio de catálogo?')) return;
    try {
      const token = localStorage.getItem('access_token');
      await axios.delete(`http://localhost:8000/api/v1/workshop/services/${id}/`, { headers: { Authorization: `Bearer ${token}` } });
      fetchServices();
    } catch (err) { alert('Error al borrar'); }
  };

  if(loading) return <div>Cargando servicios de catálogo...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <h2>Catálogo de Mano de Obra</h2>
        <button className="btn-primary" onClick={openCreate} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}><Plus size={18}/> Nuevo Servicio</button>
      </div>

      <table className="data-table">
        <thead><tr><th>Nombre Frecuente</th><th>Descripción</th><th>Costo M. de Obra</th><th>Tiempo (Min)</th><th>Video</th><th>Acciones</th></tr></thead>
        <tbody>
          {services.map(s => (
            <tr key={s.id}>
              <td style={{ fontWeight: 500 }}>{s.name}</td>
              <td>{s.description}</td>
              <td>Bs. {s.labor_cost}</td>
              <td>{s.estimated_time_minutes} min</td>
              <td>
                {s.demonstration_video ? (
                  <span style={{color: 'var(--primary-color)', fontWeight: 'bold'}}>Sí 🎥</span>
                ) : (
                  <span style={{color: 'var(--text-muted)'}}>-</span>
                )}
              </td>
              <td>
                <button onClick={() => openEdit(s)} style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', cursor: 'pointer', padding: '0.25rem' }}><Edit size={18} /></button>
                <button onClick={() => handleDelete(s.id)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.25rem' }}><Trash2 size={18} /></button>
              </td>
            </tr>
          ))}
          {services.length === 0 && <tr><td colSpan="5">No hay servicios registrados en catálogo.</td></tr>}
        </tbody>
      </table>

      {isModalOpen && (
        <div className="modal-overlay" style={modalStyles.overlay}>
          <div className="modal-content" style={{...modalStyles.content, maxWidth: '500px'}}>
            <h2>{editingId ? 'Editar Servicio' : 'Nuevo Servicio'}</h2>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label>Nombre del Servicio</label>
                <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} style={modalStyles.input} placeholder="Ej. Cambio de Aceite" />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label>Descripción corta</label>
                <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} style={{...modalStyles.input, minHeight: '60px'}} />
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
                  <label>Costo Estándar (Mano Obra)</label>
                  <input type="number" step="0.01" required value={formData.labor_cost} onChange={e => setFormData({...formData, labor_cost: e.target.value})} style={modalStyles.input} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
                  <label>Tiempo Estimado (Minutos)</label>
                  <input type="number" required value={formData.estimated_time_minutes} onChange={e => setFormData({...formData, estimated_time_minutes: e.target.value})} style={modalStyles.input} />
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label>Video Demostrativo (Opcional MP4/WebM)</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <input type="file" accept="video/mp4,video/webm" onChange={e => setFormData({...formData, demonstration_video: e.target.files[0]})} style={modalStyles.input} />
                    {editingId && <small style={{color:'var(--text-muted)'}}>Omitir si deseas conservar el actual.</small>}
                </div>
              </div>
              <div style={{ ...modalStyles.actions, marginTop: '1rem' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} style={modalStyles.cancelBtn}>Cancelar</button>
                <button type="submit" className="btn-primary" style={{ padding: '0.75rem 1.5rem' }}>Guardar Catálogo</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Shared Modal Styles
const modalStyles = {
  overlay: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(5px)', padding: '2rem 1rem', overflowY: 'auto' },
  content: { backgroundColor: 'var(--bg-secondary)', padding: '2rem', borderRadius: '16px', width: '100%', maxWidth: '600px', margin: 'auto', border: '1px solid var(--border-color)', boxShadow: '0 10px 40px rgba(0,0,0,0.5)' },
  input: { padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-main)', color: 'var(--text-main)' },
  actions: { gridColumn: '1 / -1', marginTop: '1rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' },
  cancelBtn: { padding: '0.75rem 1.5rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-main)', cursor: 'pointer' }
};

// ================= DELETED CLIENTS SETTINGS =================

function DeletedClientsSettings() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDeleted = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.get('http://localhost:8000/api/v1/accounts/clients/deleted/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setClients(response.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeleted();
  }, []);

  const handleRestore = async (id) => {
    if (!window.confirm("¿Seguro que deseas restaurar este cliente? Aparecerá nuevamente en el módulo general.")) return;
    try {
      const token = localStorage.getItem('access_token');
      await axios.post(`http://localhost:8000/api/v1/accounts/clients/${id}/restore/`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchDeleted();
    } catch (err) {
      alert("Hubo un error al restaurar el cliente.");
      console.error(err);
    }
  };

  if (loading) return <div>Cargando listado de papelera...</div>;

  return (
    <div>
      <h3 style={{ marginBottom: '1rem', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Trash2 /> Papelera de Clientes</h3>
      <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Los siguientes clientes fueron borrados del sistema. Sus datos no se pierden permanentemente para preservar el historial de órdenes y stock. Puedes restaurarlos haciendo clic en el botón verde.</p>
      
      {clients.length === 0 ? (
         <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', border: '1px dashed var(--border-color)', borderRadius: '8px' }}>
            La papelera está vacía.
         </div>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Nombre del Cliente</th>
              <th>Documento (CI/NIT)</th>
              <th>Puntos Fidelity</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            {clients.map(c => (
              <tr key={c.id}>
                <td>{c.person_details?.first_name} {c.person_details?.last_name}</td>
                <td>{c.person_details?.ci_nit || '-'}</td>
                <td>{c.loyalty_points}</td>
                <td>
                  <button onClick={() => handleRestore(c.id)} style={{ padding: '0.5rem 1rem', borderRadius: '8px', background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', border: '1px solid rgba(34, 197, 94, 0.3)', cursor: 'pointer', fontWeight: 'bold' }}>
                    ♻️ Restaurar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
