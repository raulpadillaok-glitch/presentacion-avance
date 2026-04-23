import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FileText, Plus, Search, Trash2, Edit, X, Save, AlertCircle, PlayCircle } from 'lucide-react';

export default function Quotes() {
  const [quotes, setQuotes] = useState([]);
  const [clients, setClients] = useState([]);
  const [motorcycles, setMotorcycles] = useState([]);
  const [products, setProducts] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showFastMotoForm, setShowFastMotoForm] = useState(false);
  const [fastMotoData, setFastMotoData] = useState({ plate: '', brand: '', model_name: '' });
  const [fullMedia, setFullMedia] = useState(null);
  
  const [formData, setFormData] = useState({
    client: '',
    motorcycle: '',
    issue_date: new Date().toISOString().split('T')[0],
    valid_until: new Date(new Date().setDate(new Date().getDate() + 15)).toISOString().split('T')[0],
    status: 'draft',
    description: '',
    notes: '',
    total: 0
  });

  const [items, setItems] = useState([]);
  const [submitError, setSubmitError] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const headers = { Authorization: `Bearer ${token}` };

      const [quotesRes, clientsRes, motosRes, prodRes, servRes] = await Promise.all([
        axios.get('http://localhost:8000/api/v1/workshop/quotes/', { headers }),
        axios.get('http://localhost:8000/api/v1/accounts/clients/', { headers }),
        axios.get('http://localhost:8000/api/v1/workshop/motorcycles/', { headers }),
        axios.get('http://localhost:8000/api/v1/inventory/products/', { headers }),
        axios.get('http://localhost:8000/api/v1/workshop/services/', { headers })
      ]);

      setQuotes(quotesRes.data);
      setClients(clientsRes.data);
      setMotorcycles(motosRes.data);
      setProducts(prodRes.data.filter(p => p.stock > 0)); // only products with stock
      setServices(servRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Total Calculation
  useEffect(() => {
    const sum = items.reduce((acc, item) => acc + (parseFloat(item.subtotal) || 0), 0);
    setFormData(prev => ({ ...prev, total: sum.toFixed(2) }));
  }, [items]);

  const openCreateModal = () => {
    setEditingId(null);
    setFormData({
      client: '', motorcycle: '', status: 'draft', description: '', notes: '', total: 0,
      issue_date: new Date().toISOString().split('T')[0],
      valid_until: new Date(new Date().setDate(new Date().getDate() + 15)).toISOString().split('T')[0],
    });
    setItems([]);
    setSubmitError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (q) => {
    setEditingId(q.id);
    setFormData({
      client: q.client,
      motorcycle: q.motorcycle,
      status: q.status,
      description: q.description || '',
      notes: q.notes || '',
      total: q.total,
      issue_date: q.issue_date,
      valid_until: q.valid_until
    });
    setItems(q.items || []);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if(!window.confirm("¿Borrar esta cotización?")) return;
    try {
      const token = localStorage.getItem('access_token');
      await axios.delete(`http://localhost:8000/api/v1/workshop/quotes/${id}/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchData();
    } catch (err) { alert('Error al borrar'); }
  };

  const addItemRow = (isProduct) => {
    setItems(prev => [
      ...prev, 
      { is_product: isProduct, product_item: '', service_item: '', quantity: 1, unit_price: 0, subtotal: 0, _tempId: Date.now() }
    ]);
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    const item = newItems[index];

    if (field === 'product_item' && item.is_product) {
      const prod = products.find(p => p.id.toString() === value.toString());
      item.product_item = value;
      item.unit_price = prod ? prod.sale_price : 0;
    } else if (field === 'service_item' && !item.is_product) {
      const serv = services.find(s => s.id.toString() === value.toString());
      item.service_item = value;
      item.unit_price = serv ? serv.labor_cost : 0;
    } else {
      item[field] = value;
    }

    item.subtotal = (parseFloat(item.quantity) * parseFloat(item.unit_price)).toFixed(2);
    setItems(newItems);
  };

  const removeItemRow = (index) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleFastMotoSubmit = async () => {
    if(!formData.client) return alert("Primero selecciona un cliente arriba.");
    if(!fastMotoData.plate || !fastMotoData.brand || !fastMotoData.model_name) return alert("Rellene placa, marca y modelo.");
    
    try {
      const token = localStorage.getItem('access_token');
      const res = await axios.post('http://localhost:8000/api/v1/workshop/motorcycles/', {
        ...fastMotoData,
        client: formData.client
      }, { headers: { Authorization: `Bearer ${token}` } });
      
      setMotorcycles(prev => [...prev, res.data]);
      setFormData(prev => ({ ...prev, motorcycle: res.data.id }));
      setShowFastMotoForm(false);
      setFastMotoData({ plate: '', brand: '', model_name: '' });
      setSubmitError(null);
    } catch (err) {
      alert("Error registrando moto: " + JSON.stringify(err.response?.data || "Verifique datos"));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError(null);
    try {
      const sub = items.reduce((sum, item) => sum + parseFloat(item.subtotal || 0), 0);
      const tx = sub * (parseInt(localStorage.getItem('company_tax') || '13') / 100);
      const computedTotal = (sub + tx).toFixed(2);

      const payload = {
        ...formData,
        total: computedTotal,
        items: items.map(item => ({
          is_product: item.is_product,
          product_item: item.product_item ? (parseInt(item.product_item) || null) : null,
          service_item: item.service_item ? (parseInt(item.service_item) || null) : null,
          quantity: parseInt(item.quantity) || 1,
          unit_price: parseFloat(item.unit_price) || 0,
          subtotal: parseFloat(item.subtotal) || 0
        }))
      };

      const token = localStorage.getItem('access_token');
      const headers = { Authorization: `Bearer ${token}` };

      if (editingId) {
        await axios.put(`http://localhost:8000/api/v1/workshop/quotes/${editingId}/`, payload, { headers });
      } else {
        await axios.post('http://localhost:8000/api/v1/workshop/quotes/', payload, { headers });
      }

      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      console.error(err.response?.data || err);
      // Format the error into a readable string
      let errorMsg = 'Revisa los campos requeridos. Faltan datos.';
      if (err.response?.data) {
         if (typeof err.response.data === 'object') {
           errorMsg = Object.entries(err.response.data).map(([k, v]) => `${k.toUpperCase()}: ${v}`).join(' | ');
         } else {
           errorMsg = err.response.data;
         }
      }
      setSubmitError('Backend rechazó la cotización: ' + errorMsg);
    }
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'draft': return <span className="badge">Borrador</span>;
      case 'sent': return <span className="badge" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>Enviado</span>;
      case 'approved': return <span className="badge badge-success">Aprobado</span>;
      case 'rejected': return <span className="badge badge-danger">Rechazado</span>;
      default: return <span className="badge">{status}</span>;
    }
  };

  const filteredQuotes = quotes.filter(q => 
    (q.client_name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (q.description?.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (q.id.toString().includes(searchTerm))
  );

  // Calculate pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredQuotes.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredQuotes.length / itemsPerPage) || 1;

  // React to search term resets pagination
  useEffect(() => { setCurrentPage(1); }, [searchTerm]);

  return (
    <div className="animate-fade-in">
      <header className="page-header">
        <div>
          <h1 style={{ fontSize: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileText /> Cotizaciones
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>Creador de presupuestos y proformas de taller</p>
        </div>
        <button className="btn-primary" onClick={openCreateModal} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Plus size={20} /> Nueva Cotización
        </button>
      </header>

      <div className="table-container">
        {loading ? <div className="loading-state">Cargando cotizaciones...</div> : (
          <>
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Cliente</th>
                <th>Concepto Corto</th>
                <th>Emisión</th>
                <th>Expiración</th>
                <th>Total</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.map(q => (
                <tr key={q.id}>
                  <td style={{ fontFamily: 'monospace', color: 'var(--text-muted)', fontWeight: 600 }}>#{q.id}</td>
                  <td>{q.client_name ? `${q.client_name} ${q.client_last_name || ''}` : `Client ID: ${q.client}`}</td>
                  <td>{q.description || 'Sin describir'}</td>
                  <td>{q.issue_date}</td>
                  <td>{q.valid_until}</td>
                  <td style={{ fontWeight: 'bold' }}>Bs. {q.total}</td>
                  <td>{getStatusBadge(q.status)}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button onClick={() => openEditModal(q)} style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', cursor: 'pointer', padding: '0.25rem' }}>
                        <Edit size={18} />
                      </button>
                      <button onClick={() => handleDelete(q.id)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.25rem' }}>
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {currentItems.length === 0 && <tr><td colSpan="8" className="empty-state">No hay cotizaciones emitidas.</td></tr>}
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

      {isModalOpen && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(5px)', padding: '2rem 1rem', overflowY: 'auto' }}>
          <div className="modal-content" style={{ backgroundColor: 'var(--bg-secondary)', padding: '2rem', borderRadius: '16px', width: '100%', maxWidth: '900px', margin: 'auto', border: '1px solid var(--border-color)', boxShadow: '0 10px 40px rgba(0,0,0,0.5)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2>{editingId ? `Editar Cotización #${editingId}` : 'Crear Nueva Cotización'}</h2>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={24} /></button>
            </div>

            <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', padding: '1.5rem', backgroundColor: 'var(--bg-main)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label>Cliente</label>
                  <select required value={formData.client} onChange={e => setFormData({...formData, client: e.target.value})} style={inputStyle}>
                    <option value="">Seleccione Cliente...</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.person_details?.first_name} {c.person_details?.last_name}</option>)}
                  </select>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Motocicleta del Cliente</span>
                    {formData.client && (
                       <button type="button" onClick={() => setShowFastMotoForm(!showFastMotoForm)} style={{ background: 'none', border: 'none', color: 'var(--primary-color)', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}>
                          {showFastMotoForm ? 'Cancelar' : '+ Añadir Moto Rápido'}
                       </button>
                    )}
                  </label>
                  
                  {showFastMotoForm ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', background: 'rgba(255,255,255,0.02)', padding: '0.5rem', borderRadius: '8px', border: '1px dashed var(--border-color)' }}>
                      <input placeholder="Placa (Ej. 1234ABC)" value={fastMotoData.plate} onChange={e => setFastMotoData({...fastMotoData, plate: e.target.value})} style={inputStyle} />
                      <input placeholder="Marca (Ej. Honda)" value={fastMotoData.brand} onChange={e => setFastMotoData({...fastMotoData, brand: e.target.value})} style={inputStyle} />
                      <input placeholder="Modelo (Ej. CBR500R)" value={fastMotoData.model_name} onChange={e => setFastMotoData({...fastMotoData, model_name: e.target.value})} style={inputStyle} />
                      <button type="button" onClick={handleFastMotoSubmit} style={addBtnStyle}>Guardar Moto e Insertar</button>
                    </div>
                  ) : (
                    <select required value={formData.motorcycle} onChange={e => setFormData({...formData, motorcycle: e.target.value})} style={inputStyle}>
                      <option value="">Seleccione Moto...</option>
                      {motorcycles.filter(m => !formData.client || m.client.toString() === formData.client.toString()).map(m => (
                        <option key={m.id} value={m.id}>{m.plate} - {m.brand}</option>
                      ))}
                    </select>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label>Estado</label>
                  <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} style={inputStyle}>
                    <option value="draft">Borrador</option>
                    <option value="sent">Enviado al Cliente</option>
                    <option value="approved">Aprobado</option>
                    <option value="rejected">Rechazado</option>
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label>Fecha de Emisión</label>
                  <input type="date" required value={formData.issue_date} onChange={e => setFormData({...formData, issue_date: e.target.value})} style={inputStyle} />
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label>Válido Hasta</label>
                  <input type="date" required value={formData.valid_until} onChange={e => setFormData({...formData, valid_until: e.target.value})} style={inputStyle} />
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label>Asunto / Título</label>
                  <input value={formData.description} placeholder="Ej. Reparación de Motor" onChange={e => setFormData({...formData, description: e.target.value})} style={inputStyle} />
                </div>
              </div>

              {/* Items Section */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3>Detalle de Cotización</h3>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button type="button" onClick={() => addItemRow(true)} style={addBtnStyle}><Plus size={16}/> Agregar Repuesto</button>
                    <button type="button" onClick={() => addItemRow(false)} style={{...addBtnStyle, background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', border: '1px solid rgba(59, 130, 246, 0.3)'}}><Plus size={16}/> Agregar Mano de Obra</button>
                  </div>
                </div>

                <table className="data-table" style={{ background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '12px', overflow: 'hidden' }}>
                  <thead>
                    <tr><th>Tipo</th><th>Item</th><th>Cantidad</th><th>Pr. Unitario (Bs)</th><th>Subtotal</th><th></th></tr>
                  </thead>
                  <tbody>
                    {items.map((item, index) => (
                      <tr key={item._tempId || item.id || index}>
                        <td>{item.is_product ? <span className="badge">Repuesto</span> : <span className="badge" style={{background:'rgba(59, 130, 246, 0.1)', color:'#3b82f6'}}>Servicio</span>}</td>
                        <td>
                          {item.is_product ? (
                            <select value={item.product_item} onChange={e => handleItemChange(index, 'product_item', e.target.value)} style={gridInputStyle} required>
                               <option value="">Seleccione repuesto...</option>
                               {products.map(p => <option key={p.id} value={p.id}>{p.name} (Stock: {p.stock})</option>)}
                            </select>
                          ) : (
                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                              <select value={item.service_item} onChange={e => handleItemChange(index, 'service_item', e.target.value)} style={{...gridInputStyle, flex: 1}} required>
                                 <option value="">Seleccione servicio...</option>
                                 {services.map(s => <option key={s.id} value={s.id}>{s.name} (Aprox {s.estimated_time_minutes} min)</option>)}
                              </select>
                            </div>
                          )}
                        </td>
                        <td><input type="number" step="0.01" min="1" value={item.quantity} onChange={e => handleItemChange(index, 'quantity', e.target.value)} style={{...gridInputStyle, width: '80px'}} required /></td>
                        <td><input type="number" step="0.01" value={item.unit_price} onChange={e => handleItemChange(index, 'unit_price', e.target.value)} style={{...gridInputStyle, width: '100px'}} required /></td>
                        <td style={{ fontWeight: 'bold' }}>{item.subtotal}</td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', justifyContent: 'center' }}>
                            {item.service_item && services.find(s => s.id == item.service_item)?.demonstration_video && (
                                <button type="button" onClick={() => setFullMedia(services.find(s => s.id == item.service_item).demonstration_video)} style={{ background: 'rgba(34, 197, 94, 0.15)', color: '#22c55e', border: '1px solid rgba(34, 197, 94, 0.3)', borderRadius: '50%', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0 }} title="Ver Muestra de Estándar de Reparación">
                                  <PlayCircle size={16} />
                                </button>
                            )}
                            <button type="button" onClick={() => removeItemRow(index)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.2rem' }}><Trash2 size={18} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {items.length === 0 && <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Agregue repuestos o servicios a la cotización</td></tr>}
                  </tbody>
                </table>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: '1.5rem' }}>
                  <div style={{ width: '60%' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Notas y Condiciones</label>
                    <textarea value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} style={{...inputStyle, width: '100%', minHeight: '80px'}} placeholder="P. Ej. Cotización válida por 15 días tras su emisión. No incluye lavado..."></textarea>
                  </div>
                  <div style={{ background: 'var(--bg-main)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)', minWidth: '250px' }}>
                     <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: 'var(--text-muted)' }}><span>Subtotal:</span> <span>Bs. {formData.total}</span></div>
                     <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', color: 'var(--text-muted)' }}><span>Impuestos:</span> <span>(Incluido)</span></div>
                     <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)', paddingTop: '1rem', fontSize: '1.5rem', fontWeight: 700 }}>
                        <span>TOTAL</span>
                        <span style={{ color: 'var(--primary-color)' }}>Bs. {formData.total}</span>
                     </div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
                {submitError && (
                  <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '1rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 500 }}>
                    <AlertCircle size={20} />
                    {submitError}
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                  <button type="button" onClick={() => setIsModalOpen(false)} style={{ padding: '0.75rem 1.5rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-main)', cursor: 'pointer' }}>Cerrar</button>
                  <button type="submit" className="btn-primary" style={{ padding: '0.75rem 2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Save size={18}/> Guardar Cotización</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Lightbox Modal */}
      {fullMedia && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, backdropFilter: 'blur(10px)' }} onClick={() => setFullMedia(null)}>
          <div style={{ position: 'relative', width: '90%', maxWidth: '800px', margin: 'auto' }} onClick={e => e.stopPropagation()}>
            <button onClick={() => setFullMedia(null)} style={{ position: 'absolute', top: '-50px', right: '0', background: 'none', border: 'none', color: 'white', cursor: 'pointer', zIndex: 10 }}>
              <X size={36} />
            </button>
            <video src={fullMedia.startsWith('http') ? fullMedia : `http://localhost:8000${fullMedia}`} controls autoPlay style={{ width: '100%', borderRadius: '12px', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }} />
          </div>
        </div>
      )}
    </div>
  );
}

// Inline styles
const inputStyle = { padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-main)', width: '100%' };
const gridInputStyle = { padding: '0.4rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-main)', width: '100%' };
const addBtnStyle = { padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid var(--primary-color)', background: 'rgba(255, 107, 53, 0.1)', color: 'var(--primary-color)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: 600, fontSize: '0.9rem' };
