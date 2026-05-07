import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Wrench, Search, Plus, AlertCircle, Clock, X, Video, Edit, Trash2, CheckCircle2, ImagePlus } from 'lucide-react';

export default function Workshop() {
  const [orders, setOrders] = useState([]);
  const [motorcycles, setMotorcycles] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const role = sessionStorage.getItem('user_role') || 'usuario';
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [orderHistory, setOrderHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    code: '', motorcycle: '', technician: '', status: 'pending', problem_description: '', entry_at: ''
  });
  const [evidenceFile, setEvidenceFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [diagnosing, setDiagnosing] = useState(false);
  const [mlSuggestion, setMlSuggestion] = useState(null);
  const [fullMedia, setFullMedia] = useState(null);
  const [viewMode, setViewMode] = useState('board'); // 'table' or 'board'
  const [activeTab, setActiveTab] = useState('details');
  const [serviceMethods, setServiceMethods] = useState([]);
  const [orderGallery, setOrderGallery] = useState([]);
  const [orderServices, setOrderServices] = useState([]);
  const [selectedServiceToAdd, setSelectedServiceToAdd] = useState('');

  const KANBAN_COLUMNS = [
    { id: 'pending', label: 'Pendiente', color: '#eab308' },
    { id: 'diagnosing', label: 'Diagnosticando', color: '#a855f7' },
    { id: 'waiting_parts', label: 'Repuestos', color: '#ef4444' },
    { id: 'in_process', label: 'En Proceso', color: '#3b82f6' },
    { id: 'finished', label: 'Finalizado', color: '#22c55e' },
    { id: 'delivered', label: 'Entregado', color: '#059669' }
  ];

  const fetchOrders = async () => {
    try {
      const token = sessionStorage.getItem('access_token');
      const response = await axios.get('http://localhost:8000/api/v1/workshop/orders/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrders(response.data);
    } catch (err) {
      setError('Error al cargar órdenes de reparación.');
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        await fetchOrders();
        
        const token = sessionStorage.getItem('access_token');
        const motoRes = await axios.get('http://localhost:8000/api/v1/workshop/motorcycles/', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const techRes = await axios.get('http://localhost:8000/api/v1/accounts/technicians/', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const srvRes = await axios.get('http://localhost:8000/api/v1/workshop/services/', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setMotorcycles(motoRes.data);
        setTechnicians(techRes.data);
        setServiceMethods(srvRes.data);
      } catch (err) {
        console.warn('Error fetching motorcycles:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    setEvidenceFile(e.target.files[0] || null);
  };

  const openCreateModal = () => {
    setEditingId(null);
    setFormData({ code: '', motorcycle: '', technician: '', status: 'pending', problem_description: '', entry_at: '' });
    setEvidenceFile(null);
    setMlSuggestion(null);
    setOrderGallery([]);
    setOrderServices([]);
    setActiveTab('details');
    setIsModalOpen(true);
  };

  const openEditModal = (order) => {
    setEditingId(order.id);
    let entryDate = '';
    if (order.entry_at) {
        entryDate = new Date(order.entry_at).toISOString().slice(0, 16);
    }
    setFormData({
      code: order.code,
      motorcycle: order.motorcycle,
      technician: order.technician || '',
      status: order.status,
      problem_description: order.problem_description,
      entry_at: entryDate
    });
    setEvidenceFile(null);
    setMlSuggestion(null);
    setOrderGallery(order.gallery || []);
    setOrderServices(order.services || []);
    setActiveTab('details');
    setIsModalOpen(true);
  };

  const handleAutoDiagnose = async () => {
    if(!formData.problem_description || formData.problem_description.length < 5) {
       alert("Por favor, describe más a detalle el problema para que la IA funcione correctamente.");
       return;
    }
    setDiagnosing(true);
    setMlSuggestion(null);
    try {
      const token = sessionStorage.getItem('access_token');
      const res = await axios.post('http://localhost:8000/api/v1/workshop/predict-diagnosis/', {
        description: formData.problem_description
      }, { headers: { Authorization: `Bearer ${token}` } });
      setMlSuggestion(res.data);
    } catch (err) {
      console.error(err);
      alert("No se pudo obtener el diagnóstico del motor ML.");
    } finally {
       setDiagnosing(false);
    }
  };

  const openHistoryModal = async (order) => {
    setIsHistoryModalOpen(true);
    setHistoryLoading(true);
    setOrderHistory([]);
    try {
      const token = sessionStorage.getItem('access_token');
      const res = await axios.get(`http://localhost:8000/api/v1/workshop/orders/${order.id}/history/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrderHistory(res.data);
    } catch (err) {
      alert("Error cargando el historial");
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if(!window.confirm("¿Seguro que deseas eliminar esta orden de trabajo?")) return;
    try {
      const token = sessionStorage.getItem('access_token');
      await axios.delete(`http://localhost:8000/api/v1/workshop/orders/${id}/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchOrders();
    } catch(err) {
      alert("Error al eliminar la orden");
    }
  };

  const handleAddService = async () => {
    if (!selectedServiceToAdd || !editingId) return;
    try {
      const token = sessionStorage.getItem('access_token');
      const res = await axios.post(`http://localhost:8000/api/v1/workshop/orders/${editingId}/services/`, { service_id: selectedServiceToAdd }, { headers: { Authorization: `Bearer ${token}` } });
      setOrderServices([...orderServices, res.data]);
      setSelectedServiceToAdd('');
      fetchOrders();
    } catch (e) { alert("Error asignando servicio"); }
  };

  const handleToggleService = async (serviceObj) => {
    try {
      const token = sessionStorage.getItem('access_token');
      const res = await axios.patch(`http://localhost:8000/api/v1/workshop/orders/${editingId}/services/${serviceObj.id}/`, { is_completed: !serviceObj.is_completed }, { headers: { Authorization: `Bearer ${token}` } });
      setOrderServices(orderServices.map(s => s.id === serviceObj.id ? res.data : s));
      fetchOrders();
    } catch (e) { alert("Error actualizando servicio"); }
  };

  const handleDeleteService = async (serviceId) => {
    try {
      const token = sessionStorage.getItem('access_token');
      await axios.delete(`http://localhost:8000/api/v1/workshop/orders/${editingId}/services/${serviceId}/`, { headers: { Authorization: `Bearer ${token}` } });
      setOrderServices(orderServices.filter(s => s.id !== serviceId));
      fetchOrders();
    } catch (e) { alert("Error eliminando servicio"); }
  };

  const handleUploadGallery = async (e, stage) => {
    const file = e.target.files[0];
    if (!file || !editingId) return;
    try {
      const token = sessionStorage.getItem('access_token');
      const payload = new FormData();
      payload.append('media', file);
      payload.append('stage', stage);
      const res = await axios.post(`http://localhost:8000/api/v1/workshop/orders/${editingId}/upload-gallery/`, payload, { headers: { Authorization: `Bearer ${token}` } });
      setOrderGallery([...orderGallery, res.data]);
      fetchOrders();
    } catch (e) { alert("Error subiendo foto"); }
  };

  const handleDeleteGalleryPhoto = async (photoId) => {
    if(!window.confirm("¿Eliminar esta foto?")) return;
    try {
      const token = sessionStorage.getItem('access_token');
      await axios.delete(`http://localhost:8000/api/v1/workshop/orders/${editingId}/delete-gallery/${photoId}/`, { headers: { Authorization: `Bearer ${token}` } });
      setOrderGallery(orderGallery.filter(p => p.id !== photoId));
      fetchOrders();
    } catch (e) { alert("Error eliminando foto"); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const payload = new FormData();
    for (const key in formData) {
      if (formData[key]) {
        payload.append(key, formData[key]);
      }
    }
    if (evidenceFile) {
      payload.append('evidence_video', evidenceFile);
    }

    try {
      const token = sessionStorage.getItem('access_token');
      const headers = { 
        Authorization: `Bearer ${token}`
      };

      if (editingId) {
        await axios.patch(`http://localhost:8000/api/v1/workshop/orders/${editingId}/`, payload, { headers });
      } else {
        await axios.post('http://localhost:8000/api/v1/workshop/orders/', payload, { headers });
      }

      setIsModalOpen(false);
      await fetchOrders(); 
    } catch (err) {
      console.error(err.response?.data || err);
      alert('Error al guardar la orden: ' + JSON.stringify(err.response?.data || 'Verifique los datos.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
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

  const filteredOrders = orders.filter(o => 
    o.code?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (o.motorcycle_plate && o.motorcycle_plate.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Calculate pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredOrders.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage) || 1;

  // React to search term resets pagination
  useEffect(() => { setCurrentPage(1); }, [searchTerm]);

  return (
    <div className="animate-fade-in">
      <header className="page-header">
        <div>
          <h1 style={{ fontSize: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Wrench /> Taller Mecánico
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>Órdenes de Trabajo y Reparaciones Activas</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ background: 'var(--bg-secondary)', padding: '0.25rem', borderRadius: '12px', display: 'flex', gap: '0.25rem', border: '1px solid var(--border-color)' }}>
            <button onClick={() => setViewMode('table')} style={{ padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', background: viewMode === 'table' ? 'var(--bg-main)' : 'transparent', border: 'none', color: viewMode === 'table' ? 'var(--primary-color)' : 'var(--text-muted)', fontWeight: viewMode === 'table' ? 'bold' : 'normal', transition: 'all 0.2s' }}>Tabla</button>
            <button onClick={() => setViewMode('board')} style={{ padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', background: viewMode === 'board' ? 'var(--bg-main)' : 'transparent', border: 'none', color: viewMode === 'board' ? 'var(--primary-color)' : 'var(--text-muted)', fontWeight: viewMode === 'board' ? 'bold' : 'normal', transition: 'all 0.2s' }}>Kanban</button>
          </div>
          <button className="btn-primary" onClick={openCreateModal} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Plus size={20} /> Nueva Orden
          </button>
        </div>
      </header>

      <div className="table-container">
        <div className="table-toolbar">
          <div className="search-bar">
            <Search size={18} />
            <input 
              type="text" 
              placeholder="Buscar por placa o código..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="loading-state">Cargando taller...</div>
        ) : error ? (
          <div className="error-state"><AlertCircle /> {error}</div>
        ) : viewMode === 'board' ? (
          <div style={{ display: 'flex', gap: '1.5rem', overflowX: 'auto', paddingBottom: '1.5rem', marginTop: '1rem' }}>
            {KANBAN_COLUMNS.map(col => (
               <div key={col.id} style={{ minWidth: '320px', background: 'var(--bg-secondary)', borderRadius: '16px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column' }}>
                 <div style={{ padding: '1rem 1.25rem', borderBottom: `3px solid ${col.color}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)' }}>
                    <h3 style={{ margin: 0, fontSize: '1rem', color: col.color, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                       {col.label} 
                    </h3>
                    <span style={{ background: 'var(--bg-main)', border: '1px solid var(--border-color)', padding: '0.2rem 0.6rem', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 'bold' }}>{filteredOrders.filter(o => o.status === col.id).length}</span>
                 </div>
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1rem', flex: 1, minHeight: '150px' }}>
                   {filteredOrders.filter(o => o.status === col.id).map(order => (
                      <div key={order.id} onClick={() => openEditModal(order)} style={{ background: 'var(--bg-main)', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', cursor: 'pointer', transition: 'all 0.2s ease', position: 'relative' }} onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.borderColor = col.color; }} onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.borderColor = 'var(--border-color)'; }}>
                         <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', alignItems: 'center' }}>
                           <span style={{ fontWeight: 'bold', fontSize: '1.1rem', color: 'var(--text-main)' }}>{order.motorcycle_plate || order.motorcycle}</span>
                           <span style={{ fontFamily: 'monospace', color: 'var(--text-muted)', background: 'var(--bg-secondary)', padding: '0.2rem 0.5rem', borderRadius: '6px', fontSize: '0.8rem' }}>#{order.code}</span>
                         </div>
                         <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: '0 0 1rem 0', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{order.problem_description}</p>
                         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--text-muted)' }}><Clock size={14}/> {new Date(order.entry_at).toLocaleDateString()}</span>
                            <span style={{ background: `${col.color}20`, color: col.color, padding: '0.2rem 0.6rem', borderRadius: '12px', fontWeight: '600' }}>Téc. {order.technician_name}</span>
                         </div>
                      </div>
                   ))}
                   {filteredOrders.filter(o => o.status === col.id).length === 0 && (
                     <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'var(--text-muted)', fontSize: '0.9rem', opacity: 0.5, borderStyle: 'dashed', borderWidth: '2px', borderColor: 'var(--border-color)', borderRadius: '12px' }}>Vacio</div>
                   )}
                 </div>
               </div>
            ))}
          </div>
        ) : (
          <>
          <table className="data-table">
            <thead>
              <tr>
                <th>Evidencia</th>
                <th>Código</th>
                <th>Placa Moto</th>
                <th>Técnico Asig.</th>
                <th>Descripción / Problema</th>
                <th>Ingreso</th>
                <th>Estado actual</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.map(order => (
                <tr key={order.id}>
                  <td>
                    {order.evidence_video ? (
                        <a 
                          href="#"
                          onClick={(e) => { e.preventDefault(); setFullMedia(order.evidence_video.startsWith('http') ? order.evidence_video : `http://localhost:8000${order.evidence_video}`); }}
                          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', backgroundColor: 'var(--primary-color)', borderRadius: '8px', color: 'white' }}>
                          <Video size={18} />
                        </a>
                    ) : (
                        <div style={{ width: '40px', height: '40px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                           <Video size={18} />
                        </div>
                    )}
                  </td>
                  <td style={{ fontFamily: 'monospace', color: 'var(--text-muted)', fontWeight: '600' }}>#{order.code}</td>
                  <td style={{ fontWeight: '500', color: 'var(--text-main)' }}>{order.motorcycle_plate || order.motorcycle}</td>
                  <td>{order.technician_name || order.technician}</td>
                  <td style={{ maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {order.problem_description}
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--text-muted)' }}>
                      <Clock size={14} /> {new Date(order.entry_at).toLocaleDateString()}
                    </div>
                  </td>
                  <td>{getStatusBadge(order.status)}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button onClick={() => openHistoryModal(order)} title="Ver Historial" style={{ background: 'transparent', border: 'none', color: '#a855f7', cursor: 'pointer', padding: '0.25rem' }}>
                        <Clock size={18} />
                      </button>
                      <button onClick={() => openEditModal(order)} style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', cursor: 'pointer', padding: '0.25rem' }}>
                        <Edit size={18} />
                      </button>
                      {role === 'admin' && (
                        <button onClick={() => handleDelete(order.id)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.25rem' }}>
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {currentItems.length === 0 && (
                <tr>
                  <td colSpan="8" className="empty-state">No hay órdenes de reparación activas.</td>
                </tr>
              )}
            </tbody>
          </table>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', padding: '1rem', borderTop: '1px solid var(--border-color)', background: 'var(--bg-secondary)', borderBottomLeftRadius: '12px', borderBottomRightRadius: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Mostrar:</span>
              <select 
                value={itemsPerPage} 
                onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                style={{ padding: '0.25rem', borderRadius: '6px', background: 'var(--bg-main)', color: 'var(--text-main)', border: '1px solid var(--border-color)', cursor: 'pointer' }}
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={30}>30</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <button 
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => prev - 1)}
                style={{ padding: '0.5rem 1rem', borderRadius: '6px', background: 'var(--bg-main)', border: '1px solid var(--border-color)', color: currentPage === 1 ? 'var(--text-muted)' : 'var(--text-main)', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', fontWeight: 600 }}
              >Anterior</button>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Página <b style={{color: 'var(--text-main)'}}>{currentPage}</b> de {totalPages}</span>
              <button 
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => prev + 1)}
                style={{ padding: '0.5rem 1rem', borderRadius: '6px', background: 'var(--bg-main)', border: '1px solid var(--border-color)', color: currentPage === totalPages ? 'var(--text-muted)' : 'var(--text-main)', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', fontWeight: 600 }}
              >Siguiente</button>
            </div>
          </div>
          </>
        )}
      </div>

       {/* Modal Nueva/Editar Orden */}
       {isModalOpen && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(5px)', padding: '2rem 1rem', overflowY: 'auto' }}>
          <div className="modal-content" style={{ backgroundColor: 'var(--bg-secondary)', padding: '2rem', borderRadius: '16px', width: '100%', maxWidth: '600px', margin: 'auto', border: '1px solid var(--border-color)', boxShadow: '0 10px 40px rgba(0,0,0,0.5)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Plus size={24} /> {editingId ? 'Orden de Trabajo' : 'Crear Orden de Trabajo'}</h2>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={24} /></button>
            </div>

            {editingId && (
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                <button onClick={() => setActiveTab('details')} style={{ background: 'transparent', border: 'none', color: activeTab === 'details' ? 'var(--primary-color)' : 'var(--text-muted)', fontWeight: activeTab === 'details' ? 'bold' : 'normal', cursor: 'pointer', padding: '0.5rem 1rem' }}>Detalles</button>
                <button onClick={() => setActiveTab('services')} style={{ background: 'transparent', border: 'none', color: activeTab === 'services' ? 'var(--primary-color)' : 'var(--text-muted)', fontWeight: activeTab === 'services' ? 'bold' : 'normal', cursor: 'pointer', padding: '0.5rem 1rem' }}>Servicios ({orderServices.length})</button>
                <button onClick={() => setActiveTab('gallery')} style={{ background: 'transparent', border: 'none', color: activeTab === 'gallery' ? 'var(--primary-color)' : 'var(--text-muted)', fontWeight: activeTab === 'gallery' ? 'bold' : 'normal', cursor: 'pointer', padding: '0.5rem 1rem' }}>Galería ({orderGallery.length})</button>
              </div>
            )}

            {(activeTab === 'details' || !editingId) ? (
            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1rem', gridTemplateColumns: '1fr 1fr' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label>Código de Orden</label>
                <input required name="code" value={formData.code} onChange={handleInputChange} placeholder="Ej. ORD-001" style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-main)', color: 'var(--text-main)' }} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', gridColumn: '1 / -1' }}>
                <label>Línea de Vida Satelital de Reparación</label>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', background: 'var(--bg-main)', padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--border-color)', margin: '0.5rem 0' }}>
                  {KANBAN_COLUMNS.map((col, idx) => {
                     const currentIndex = KANBAN_COLUMNS.findIndex(c => c.id === formData.status);
                     const isActive = idx === currentIndex;
                     const isCompleted = idx <= currentIndex;
                     return (
                       <div key={col.id} onClick={() => setFormData({...formData, status: col.id})} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, cursor: 'pointer', position: 'relative' }}>
                          {idx < KANBAN_COLUMNS.length - 1 && (
                            <div style={{ width: '100%', height: '4px', background: isCompleted ? col.color : 'var(--border-color)', position: 'absolute', top: '15px', zIndex: 0, left: '50%', transition: 'background 0.3s' }}></div>
                          )}
                          <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: isCompleted ? col.color : 'var(--bg-main)', border: `3px solid ${isCompleted ? col.color : 'var(--border-color)'}`, zIndex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', color: isCompleted ? '#fff' : 'var(--text-muted)', fontWeight: 'bold', transition: 'all 0.3s', boxShadow: isActive ? `0 0 15px ${col.color}60` : 'none', transform: isActive ? 'scale(1.2)' : 'none' }}>
                             {idx + 1}
                          </div>
                          <span style={{ marginTop: '0.75rem', fontSize: '0.8rem', fontWeight: isActive ? 'bold' : '600', color: isCompleted ? 'var(--text-main)' : 'var(--text-muted)', textAlign: 'center', lineHeight: '1.2' }}>{col.label}</span>
                       </div>
                     )
                  })}
                </div>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label>Motocicleta (ID)</label>
                <select required name="motorcycle" value={formData.motorcycle} onChange={handleInputChange} style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-main)', color: 'var(--text-main)' }}>
                  <option value="">Seleccione moto...</option>
                  {motorcycles.map(m => <option key={m.id} value={m.id}>{m.plate} - {m.brand}</option>)}
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label>Técnico Asignado</label>
                <select required name="technician" value={formData.technician} onChange={handleInputChange} style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-main)', color: 'var(--text-main)' }}>
                  <option value="">Seleccione técnico...</option>
                  {technicians.map(t => <option key={t.id} value={t.id}>{t.person_details?.first_name} {t.person_details?.last_name}</option>)}
                </select>
              </div>

              <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label>Descripción del Problema</label>
                    <button type="button" onClick={handleAutoDiagnose} disabled={diagnosing} style={{ background: 'linear-gradient(45deg, #a855f7, #6366f1)', color: 'white', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem', boxShadow: '0 4px 10px rgba(168, 85, 247, 0.3)' }}>
                      {diagnosing ? 'Consultando IA...' : '🪄 Autodiagnóstico IA'}
                    </button>
                </div>
                <textarea required name="problem_description" value={formData.problem_description} onChange={handleInputChange} style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-main)', color: 'var(--text-main)', minHeight: '80px' }} />
                
                {mlSuggestion && (
                   <div className="animate-fade-in" style={{ marginTop: '0.5rem', padding: '1rem', background: 'rgba(168, 85, 247, 0.1)', border: '1px solid rgba(168, 85, 247, 0.3)', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.85rem', color: '#a855f7', fontWeight: 600 }}>💡 Predicción de Machine Learning:</span>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                         <span style={{ color: 'var(--text-main)', fontSize: '1.1rem', fontWeight: 700 }}>{mlSuggestion.suggested_service_name}</span>
                         <span style={{ background: '#a855f7', color: 'white', padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold' }}>Confianza: {mlSuggestion.confidence}%</span>
                      </div>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Sugiere este servicio al cliente para generar la cotización pertinente.</span>
                   </div>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label>Fecha de Ingreso</label>
                <input type="datetime-local" required name="entry_at" value={formData.entry_at} onChange={handleInputChange} style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-main)', color: 'var(--text-main)' }} />
              </div>

              <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label>Video/Foto de Evidencia (vacío para mantener la actual)</label>
                <input type="file" accept="video/*,image/*" onChange={handleFileChange} style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.05)', color: 'var(--text-main)' }} />
              </div>

              <div style={{ gridColumn: '1 / -1', marginTop: '1rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{ padding: '0.75rem 1.5rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-main)', cursor: 'pointer' }}>Cancelar</button>
                 <button type="submit" disabled={isSubmitting} className="btn-primary" style={{ padding: '0.75rem 1.5rem' }}>
                  {isSubmitting ? 'Guardando...' : editingId ? 'Actualizar Orden' : 'Guardar Orden'}
                </button>
              </div>
            </form>
            ) : activeTab === 'services' ? (
              <div className="services-tab" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                 <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <select value={selectedServiceToAdd} onChange={e => setSelectedServiceToAdd(e.target.value)} style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-main)', color: 'var(--text-main)' }}>
                       <option value="">Selecciona un servicio para asignar...</option>
                       {serviceMethods.map(s => <option key={s.id} value={s.id}>{s.name} - Bs.{s.labor_cost}</option>)}
                    </select>
                    <button type="button" onClick={handleAddService} disabled={!selectedServiceToAdd} className="btn-primary" style={{ padding: '0.75rem 1.5rem', whiteSpace: 'nowrap' }}>Agregar Tarea</button>
                 </div>
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {orderServices.map(svc => (
                       <div key={svc.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: 'var(--bg-main)', border: `1px solid ${svc.is_completed ? '#22c55e' : 'var(--border-color)'}`, borderRadius: '8px', transition: 'all 0.3s' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer' }} onClick={() => handleToggleService(svc)}>
                             {svc.is_completed ? <CheckCircle2 color="#22c55e" /> : <div style={{ width: '24px', height: '24px', borderRadius: '50%', border: '2px solid var(--border-color)' }}></div>}
                             <span style={{ textDecoration: svc.is_completed ? 'line-through' : 'none', color: svc.is_completed ? 'var(--text-muted)' : 'var(--text-main)', fontSize: '1.1rem', fontWeight: 500 }}>{svc.service_name}</span>
                          </div>
                          <button onClick={() => handleDeleteService(svc.id)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}><Trash2 size={20} /></button>
                       </div>
                    ))}
                    {orderServices.length === 0 && <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>No hay servicios asignados a esta orden.</div>}
                 </div>
              </div>
            ) : (
              <div className="gallery-tab" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                 <div style={{ display: 'flex', gap: '1rem' }}>
                    <div style={{ flex: 1, background: 'var(--bg-main)', padding: '1rem', borderRadius: '12px', border: '1px dashed var(--border-color)', textAlign: 'center' }}>
                       <h4 style={{ marginBottom: '1rem', color: '#eab308' }}>Fotos de Ingreso</h4>
                       <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: 'var(--text-muted)' }}>
                          <ImagePlus size={32} />
                          <span>Subir foto</span>
                          <input type="file" accept="image/*,video/*" style={{ display: 'none' }} onChange={(e) => handleUploadGallery(e, 'entry')} />
                       </label>
                       <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '1rem', justifyContent: 'center' }}>
                          {orderGallery.filter(g => g.stage === 'entry').map(img => (
                             <div key={img.id} style={{ position: 'relative', width: '80px', height: '80px' }}>
                                <img src={img.media.startsWith('http') ? img.media : `http://localhost:8000${img.media}`} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px', cursor: 'pointer' }} onClick={() => setFullMedia(img.media.startsWith('http') ? img.media : `http://localhost:8000${img.media}`)} />
                                <button onClick={() => handleDeleteGalleryPhoto(img.id)} style={{ position: 'absolute', top: '-5px', right: '-5px', background: 'red', color: 'white', border: 'none', borderRadius: '50%', width: '20px', height: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px' }}>X</button>
                             </div>
                          ))}
                       </div>
                    </div>
                    <div style={{ flex: 1, background: 'var(--bg-main)', padding: '1rem', borderRadius: '12px', border: '1px dashed var(--border-color)', textAlign: 'center' }}>
                       <h4 style={{ marginBottom: '1rem', color: '#22c55e' }}>Fotos de Entrega</h4>
                       <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: 'var(--text-muted)' }}>
                          <ImagePlus size={32} />
                          <span>Subir foto</span>
                          <input type="file" accept="image/*,video/*" style={{ display: 'none' }} onChange={(e) => handleUploadGallery(e, 'exit')} />
                       </label>
                       <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '1rem', justifyContent: 'center' }}>
                          {orderGallery.filter(g => g.stage === 'exit').map(img => (
                             <div key={img.id} style={{ position: 'relative', width: '80px', height: '80px' }}>
                                <img src={img.media.startsWith('http') ? img.media : `http://localhost:8000${img.media}`} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px', cursor: 'pointer' }} onClick={() => setFullMedia(img.media.startsWith('http') ? img.media : `http://localhost:8000${img.media}`)} />
                                <button onClick={() => handleDeleteGalleryPhoto(img.id)} style={{ position: 'absolute', top: '-5px', right: '-5px', background: 'red', color: 'white', border: 'none', borderRadius: '50%', width: '20px', height: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px' }}>X</button>
                             </div>
                          ))}
                       </div>
                    </div>
                 </div>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Modal de Historial */}
      {isHistoryModalOpen && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(5px)' }}>
          <div className="modal-content" style={{ backgroundColor: 'var(--bg-secondary)', padding: '2rem', borderRadius: '16px', width: '100%', maxWidth: '500px', border: '1px solid var(--border-color)', boxShadow: '0 10px 40px rgba(0,0,0,0.5)', maxHeight: '80vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Clock size={24} color="#a855f7" /> Auditoría de Cambios</h2>
              <button onClick={() => setIsHistoryModalOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={24} /></button>
            </div>
            
            {historyLoading ? (
               <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>Cargando registros...</div>
            ) : (
               <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                 {orderHistory.map((record, index) => (
                    <div key={index} style={{ borderLeft: '2px solid #a855f7', paddingLeft: '1rem', position: 'relative' }}>
                       <div style={{ position: 'absolute', left: '-6px', top: '0', width: '10px', height: '10px', borderRadius: '50%', background: '#a855f7' }}></div>
                       <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>{new Date(record.date).toLocaleString()}</div>
                       <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{record.user} realizó un cambio ({record.action})</div>
                       <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '0.3rem', background: 'var(--bg-main)', padding: '0.5rem', borderRadius: '6px' }}>
                          Estado pasó a: <b>{record.status}</b><br/>
                          Descripción: {record.problem}
                       </div>
                    </div>
                 ))}
                 {orderHistory.length === 0 && <div style={{ color: 'var(--text-muted)' }}>No hay historial disponible para esta orden.</div>}
               </div>
            )}
          </div>
        </div>
      )}

      {fullMedia && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 2000, background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setFullMedia(null)}>
           {(fullMedia.endsWith('.mp4') || fullMedia.endsWith('.webm') || fullMedia.endsWith('.MOV') || fullMedia.toLowerCase().includes('video')) ? (
              <video src={fullMedia} controls autoPlay onClick={e => e.stopPropagation()} style={{ maxWidth: '90%', maxHeight: '90%', borderRadius: '8px', boxShadow: '0 0 30px rgba(0,0,0,0.8)' }} />
           ) : (
              <img src={fullMedia} onClick={e => e.stopPropagation()} style={{ maxWidth: '90%', maxHeight: '90%', objectFit: 'contain', borderRadius: '8px', boxShadow: '0 0 30px rgba(0,0,0,0.8)' }} />
           )}
           <button onClick={() => setFullMedia(null)} style={{ position: 'absolute', top: 20, right: 20, cursor: 'pointer', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.3)', color: 'white', padding: '0.5rem', borderRadius: '50%', display: 'flex', alignItems:'center', justifyContent: 'center' }}>
              <X size={24} />
           </button>
        </div>
      )}

    </div>
  );
}
