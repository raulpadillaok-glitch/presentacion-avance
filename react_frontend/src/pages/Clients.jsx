import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, Search, Plus, AlertCircle, Phone, MapPin, Edit, Trash2, X } from 'lucide-react';

export default function Clients() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    first_name: '', last_name: '', ci_nit: '', phone: '', address: '', loyalty_points: 0
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fullMapAddress, setFullMapAddress] = useState(null);

  const fetchClients = async () => {
    setLoading(true);
    try {
      const token = sessionStorage.getItem('access_token');
      const response = await axios.get('http://localhost:8000/api/v1/accounts/clients/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setClients(response.data);
      setError('');
    } catch (err) {
      setError('Error al cargar la lista de clientes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const openCreateModal = () => {
    setEditingId(null);
    setFormData({ first_name: '', last_name: '', ci_nit: '', phone: '', address: '', loyalty_points: 0 });
    setIsModalOpen(true);
  };

  const openEditModal = (client) => {
    setEditingId(client.id);
    setFormData({
      first_name: client.person_details.first_name,
      last_name: client.person_details.last_name,
      ci_nit: client.person_details.ci_nit || '',
      phone: client.person_details.phone || '',
      address: client.person_details.address || '',
      loyalty_points: client.loyalty_points
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Estás seguro de eliminar este cliente?")) return;
    try {
      const token = sessionStorage.getItem('access_token');
      await axios.delete(`http://localhost:8000/api/v1/accounts/clients/${id}/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchClients();
    } catch (err) {
      alert("Error al eliminar el cliente.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // We send payload that matches our adjusted nested serializer
    const payload = {
      person: {
        first_name: formData.first_name,
        last_name: formData.last_name,
        ci_nit: formData.ci_nit,
        phone: formData.phone,
        address: formData.address
      },
      loyalty_points: formData.loyalty_points
    };

    try {
      const token = sessionStorage.getItem('access_token');
      const headers = { Authorization: `Bearer ${token}` };

      if (editingId) {
        await axios.put(`http://localhost:8000/api/v1/accounts/clients/${editingId}/`, payload, { headers });
      } else {
        await axios.post('http://localhost:8000/api/v1/accounts/clients/', payload, { headers });
      }
      
      setIsModalOpen(false);
      await fetchClients();
    } catch (err) {
      console.error(err);
      alert('Error guardando el cliente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredClients = clients.filter(c => {
    if (!c.person_details) return false;
    const fullName = `${c.person_details.first_name} ${c.person_details.last_name}`;
    return fullName.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Calculate pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredClients.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredClients.length / itemsPerPage) || 1;

  // React to search term resets pagination
  useEffect(() => { setCurrentPage(1); }, [searchTerm]);

  return (
    <div className="animate-fade-in">
      <header className="page-header">
        <div>
          <h1 style={{ fontSize: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Users /> Clientes
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>Gestión de datos de clientes y fidelización</p>
        </div>
        <button className="btn-primary" onClick={openCreateModal} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Plus size={20} /> Nuevo Cliente
        </button>
      </header>

      <div className="table-container">
        <div className="table-toolbar">
          <div className="search-bar">
            <Search size={18} />
            <input 
              type="text" 
              placeholder="Buscar cliente por nombre..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="loading-state">Cargando base de datos de clientes...</div>
        ) : error ? (
          <div className="error-state"><AlertCircle /> {error}</div>
        ) : (
          <>
          <table className="data-table">
            <thead>
              <tr>
                <th>Nombre Completo</th>
                <th>CI / NIT</th>
                <th>Teléfono</th>
                <th>Dirección</th>
                <th>Puntos</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.map(client => (
                <tr key={client.id}>
                  <td style={{ fontWeight: '500', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'var(--primary-color)', color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 'bold' }}>
                      {client.person_details?.first_name?.charAt(0) || '?'}
                    </div>
                    {client.person_details?.first_name} {client.person_details?.last_name}
                  </td>
                  <td>{client.person_details?.ci_nit || '-'}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}>
                      <Phone size={14} /> {client.person_details?.phone || '-'}
                    </div>
                  </td>
                  <td>
                    {client.person_details?.address ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', alignItems: 'flex-start' }}>
                         <span style={{ fontSize: '0.85rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <MapPin size={14} color="var(--primary-color)" /> {client.person_details.address}
                         </span>
                         <button 
                           onClick={() => setFullMapAddress(client.person_details.address)}
                           style={{ background: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.3)', color: '#38bdf8', padding: '0.4rem 0.8rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', transition: 'all 0.3s ease' }}
                           title="Rastrear ubicación en el mapa"
                         >
                            <MapPin size={14} /> Abrir Rastreo GPS
                         </button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}>
                        <MapPin size={14} /> Sin registro GPS
                      </div>
                    )}
                  </td>
                  <td>
                    <span className="badge" style={{ background: 'rgba(255, 107, 53, 0.2)', color: 'var(--primary-color)' }}>
                      {client.loyalty_points} Ptos
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button onClick={() => openEditModal(client)} style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', cursor: 'pointer', padding: '0.25rem' }}>
                        <Edit size={18} />
                      </button>
                      <button onClick={() => handleDelete(client.id)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.25rem' }}>
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {currentItems.length === 0 && (
                <tr>
                  <td colSpan="6" className="empty-state">No hay clientes encontrados.</td>
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

      {/* Modal Crear/Editar Cliente */}
      {isModalOpen && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(5px)', padding: '2rem 1rem', overflowY: 'auto' }}>
          <div className="modal-content" style={{ backgroundColor: 'var(--bg-secondary)', padding: '2rem', borderRadius: '16px', width: '100%', maxWidth: '600px', margin: 'auto', border: '1px solid var(--border-color)', boxShadow: '0 10px 40px rgba(0,0,0,0.5)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Users size={24} /> {editingId ? 'Editar Cliente' : 'Nuevo Cliente'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={24} /></button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1rem', gridTemplateColumns: '1fr 1fr' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label>Nombres</label>
                <input required name="first_name" value={formData.first_name} onChange={handleInputChange} style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-main)', color: 'var(--text-main)' }} />
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label>Apellidos</label>
                <input required name="last_name" value={formData.last_name} onChange={handleInputChange} style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-main)', color: 'var(--text-main)' }} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label>CI / NIT</label>
                <input name="ci_nit" value={formData.ci_nit} onChange={handleInputChange} style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-main)', color: 'var(--text-main)' }} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label>Teléfono</label>
                <input name="phone" value={formData.phone} onChange={handleInputChange} style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-main)', color: 'var(--text-main)' }} />
              </div>

              <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Dirección / Ubicación</span>
                  {formData.address && (
                    <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(formData.address)}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.85rem', color: '#3b82f6', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: 600 }}>
                        <MapPin size={14} /> Probar en Mapa
                    </a>
                  )}
                </label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input name="address" placeholder="Ej. Calle Falsa 123 o Coordenadas" value={formData.address} onChange={handleInputChange} style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-main)', color: 'var(--text-main)', flex: 1 }} />
                  <button type="button" 
                    onClick={() => {
                       if ("geolocation" in navigator) {
                         navigator.geolocation.getCurrentPosition(
                           (position) => setFormData(prev => ({ ...prev, address: `${position.coords.latitude}, ${position.coords.longitude}` })),
                           () => alert("Por favor habilita los permisos de ubicación en tu navegador.")
                         );
                       } else {
                         alert("Geolocalización no soportada.");
                       }
                    }} 
                    style={{ padding: '0.5rem 1rem', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', border: '1px solid rgba(59, 130, 246, 0.3)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}
                    title="Obtener coordenadas GPS en vivo"
                  >
                     <MapPin size={18} /> GPS
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label>Puntos Fidelidad</label>
                <input type="number" required name="loyalty_points" value={formData.loyalty_points} onChange={handleInputChange} style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-main)', color: 'var(--text-main)' }} />
              </div>

              <div style={{ gridColumn: '1 / -1', marginTop: '1rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{ padding: '0.75rem 1.5rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-main)', cursor: 'pointer' }}>Cancerlar</button>
                <button type="submit" disabled={isSubmitting} className="btn-primary" style={{ padding: '0.75rem 1.5rem' }}>
                  {isSubmitting ? 'Guardando...' : editingId ? 'Actualizar Cliente' : 'Guardar Cliente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Enhanced Glassmorphic Map Modal */}
      {fullMapAddress && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 9999, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }} onClick={() => setFullMapAddress(null)}>
          <div className="modal-content animate-fade-in" style={{ width: '100%', maxWidth: '900px', height: '85%', background: 'rgba(30, 41, 59, 0.85)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(25px)', borderRadius: '24px', overflow: 'hidden', position: 'relative', boxShadow: '0 25px 80px rgba(0,0,0,0.8)', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
             <div style={{ padding: '1.2rem 2rem', background: 'rgba(15, 23, 42, 0.6)', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 }}>
                <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.3rem', color: '#fff', fontWeight: '600' }}>
                  <div style={{ background: 'var(--primary-color)', padding: '0.5rem', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <MapPin size={22} color="white" />
                  </div>
                  Rastreo Satelital: <span style={{ color: 'var(--text-muted)', fontWeight: '400', fontSize: '1.1rem' }}>{fullMapAddress}</span>
                </h3>
                <button onClick={() => setFullMapAddress(null)} style={{ cursor: 'pointer', background: 'rgba(255,255,255,0.1)', borderRadius: '50%', border: 'none', color: '#fff', width: '38px', height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }}>
                   <X size={20} />
                </button>
             </div>
             <div style={{ flex: 1, padding: '0.7rem', background: 'rgba(255,255,255,0.02)' }}>
                <iframe 
                    src={`https://maps.google.com/maps?q=${encodeURIComponent(fullMapAddress)}&t=&z=16&ie=UTF8&iwloc=&output=embed`}
                    style={{ width: '100%', height: '100%', border: 0, borderRadius: '16px' }}
                    title="mapa-grande"
                />
             </div>
          </div>
        </div>
      )}

    </div>
  );
}
