import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Package, Search, Plus, AlertCircle, X, Image as ImageIcon, Edit, Trash2, Download, ZoomIn, ZoomOut, Maximize } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function Inventory() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
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
    sku: '', name: '', description: '', category: '', supplier: '', 
    purchase_price: '', sale_price: '', stock: 0, min_stock: 0
  });
  const [imageFile, setImageFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fullMedia, setFullMedia] = useState(null);

  const fetchProducts = async () => {
    try {
      const token = sessionStorage.getItem('access_token');
      const response = await axios.get('http://localhost:8000/api/v1/inventory/products/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProducts(response.data);
    } catch (err) {
      setError('Error al cargar inventario.');
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const token = sessionStorage.getItem('access_token');
        const headers = { Authorization: `Bearer ${token}` };
        
        await fetchProducts();
        
        const [catRes, supRes] = await Promise.all([
          axios.get('http://localhost:8000/api/v1/inventory/categories/', { headers }),
          axios.get('http://localhost:8000/api/v1/inventory/suppliers/', { headers })
        ]);
        
        setCategories(catRes.data);
        setSuppliers(supRes.data);
      } catch (err) {
         console.error(err);
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
    setImageFile(e.target.files[0] || null);
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      sku: '', name: '', description: '', category: '', supplier: '', 
      purchase_price: '', sale_price: '', stock: 0, min_stock: 0
    });
    setImageFile(null);
  };

  const openCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (product) => {
    setEditingId(product.id);
    setFormData({
      sku: product.sku,
      name: product.name,
      description: product.description || '',
      category: product.category,
      supplier: product.supplier,
      purchase_price: product.purchase_price,
      sale_price: product.sale_price,
      stock: product.stock,
      min_stock: product.min_stock
    });
    setImageFile(null); // Leave empty if not updating photo
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if(!window.confirm("¿Estás seguro de eliminar este producto?")) return;
    try {
      const token = sessionStorage.getItem('access_token');
      await axios.delete(`http://localhost:8000/api/v1/inventory/products/${id}/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchProducts();
    } catch (err) {
      alert("Error al eliminar el producto.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Create form data payload to support file upload
    const payload = new FormData();
    for (const key in formData) {
      payload.append(key, formData[key]);
    }
    
    // Only append if the user explicitly chose a new file
    if (imageFile) {
      payload.append('product_image', imageFile);
    }

    try {
      const token = sessionStorage.getItem('access_token');
      const headers = { 
        Authorization: `Bearer ${token}`
      };

      if (editingId) {
        // use PATCH to avoid needing ALL fields in multipart for a full overwrite
        await axios.patch(`http://localhost:8000/api/v1/inventory/products/${editingId}/`, payload, { headers });
      } else {
        await axios.post('http://localhost:8000/api/v1/inventory/products/', payload, { headers });
      }

      setIsModalOpen(false);
      await fetchProducts(); // Refresh list
    } catch (err) {
      console.error(err);
      alert('Error al guardar el producto. Verifique los datos.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const exportToExcel = () => {
    const wsData = products.map(p => ({
      'ID': p.id,
      'SKU': p.sku,
      'Nombre de Repuesto': p.name,
      'Categoría': p.category_name,
      'Proveedor': p.supplier_name,
      'Precio Venta': p.sale_price,
      'Stock Actual': p.stock,
      'Stock Mínimo': p.min_stock,
      'Estado': p.stock <= p.min_stock ? 'Crítico' : 'Normal'
    }));
    const ws = XLSX.utils.json_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Inventario");
    XLSX.writeFile(wb, "Reporte_Inventario_ChickenMoto.xlsx");
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredProducts.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage) || 1;

  // React to search term resets pagination
  useEffect(() => { setCurrentPage(1); }, [searchTerm]);

  return (
    <div className="animate-fade-in">
      <header className="page-header">
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.5rem' }}>Almacén y Repuestos</h1>
          <p style={{ color: 'var(--text-muted)' }}>Gestiona tu inventario con precisión. Productos con bajo stock se resaltan en rojo.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
             <button onClick={exportToExcel} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid #10b981', padding: '0.6rem 1rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>
               <Download size={20} />
               Exportar Excel
             </button>
             <button onClick={openCreateModal} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
               <Plus size={20} /> Nuevo Producto
             </button>
        </div>
      </header>

      <div className="table-container">
        <div className="table-toolbar">
          <div className="search-bar">
            <Search size={18} />
            <input 
              type="text" 
              placeholder="Buscar por nombre o SKU..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="loading-state">Cargando productos...</div>
        ) : error ? (
          <div className="error-state"><AlertCircle /> {error}</div>
        ) : (
          <>
          <table className="data-table">
            <thead>
              <tr>
                <th>Imágen</th>
                <th>SKU</th>
                <th>Producto</th>
                <th>Categoría</th>
                <th>Proveedor</th>
                <th>Stock</th>
                <th>Precio Venta</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.map(product => (
                <tr key={product.id}>
                  <td>
                    {product.product_image ? (
                        <img 
                          onClick={() => setFullMedia(product.product_image.startsWith('http') ? product.product_image : `http://localhost:8000${product.product_image}`)}
                          src={product.product_image.startsWith('http') ? product.product_image : `http://localhost:8000${product.product_image}`} 
                          alt={product.name} 
                          style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '8px', cursor: 'pointer', border: '1px solid var(--border-color)' }} 
                        />
                    ) : (
                        <div style={{ width: '40px', height: '40px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                           <ImageIcon size={20} />
                        </div>
                    )}
                  </td>
                  <td style={{ fontFamily: 'monospace', color: 'var(--text-muted)' }}>{product.sku}</td>
                  <td style={{ fontWeight: '500' }}>{product.name}</td>
                  <td>{product.category_name}</td>
                  <td>{product.supplier_name}</td>
                  <td>{product.stock}</td>
                  <td>Bs. {product.sale_price}</td>
                  <td>
                    {product.stock <= product.min_stock ? (
                      <span className="badge badge-danger">Bajo</span>
                    ) : (
                      <span className="badge badge-success">Óptimo</span>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button onClick={() => openEditModal(product)} style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', cursor: 'pointer', padding: '0.25rem' }}>
                        <Edit size={18} />
                      </button>
                      <button onClick={() => handleDelete(product.id)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.25rem' }}>
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {currentItems.length === 0 && (
                <tr>
                  <td colSpan="9" className="empty-state">No se encontraron productos.</td>
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

      {isModalOpen && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(5px)', padding: '2rem 1rem', overflowY: 'auto' }}>
          <div className="modal-content" style={{ backgroundColor: 'var(--bg-secondary)', padding: '2rem', borderRadius: '16px', width: '100%', maxWidth: '600px', margin: 'auto', border: '1px solid var(--border-color)', boxShadow: '0 10px 40px rgba(0,0,0,0.5)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Plus size={24} /> {editingId ? 'Editar Producto' : 'Crear Producto'}</h2>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={24} /></button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1rem', gridTemplateColumns: '1fr 1fr' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label>SKU</label>
                <input required name="sku" value={formData.sku} onChange={handleInputChange} style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-main)', color: 'var(--text-main)' }} />
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label>Nombre del Producto</label>
                <input required name="name" value={formData.name} onChange={handleInputChange} style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-main)', color: 'var(--text-main)' }} />
              </div>

              <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label>Descripción</label>
                <textarea name="description" value={formData.description} onChange={handleInputChange} style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-main)', color: 'var(--text-main)', minHeight: '60px' }} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label>Categoría</label>
                <select required name="category" value={formData.category} onChange={handleInputChange} style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-main)', color: 'var(--text-main)' }}>
                  <option value="">Seleccione...</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label>Proveedor</label>
                <select required name="supplier" value={formData.supplier} onChange={handleInputChange} style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-main)', color: 'var(--text-main)' }}>
                  <option value="">Seleccione...</option>
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.business_name}</option>)}
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label>Precio Compra</label>
                <input required type="number" step="0.01" name="purchase_price" value={formData.purchase_price} onChange={handleInputChange} style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-main)', color: 'var(--text-main)' }} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label>Precio Venta</label>
                <input required type="number" step="0.01" name="sale_price" value={formData.sale_price} onChange={handleInputChange} style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-main)', color: 'var(--text-main)' }} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label>Stock</label>
                <input required type="number" name="stock" value={formData.stock} onChange={handleInputChange} style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-main)', color: 'var(--text-main)' }} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label>Stock Mínimo</label>
                <input required type="number" name="min_stock" value={formData.min_stock} onChange={handleInputChange} style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-main)', color: 'var(--text-main)' }} />
              </div>

              <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label>Fotografía del Producto (Dejar en blanco para mantener la actual)</label>
                <input type="file" accept="image/*" onChange={handleFileChange} style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.05)', color: 'var(--text-main)' }} />
              </div>

              <div style={{ gridColumn: '1 / -1', marginTop: '1rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{ padding: '0.75rem 1.5rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-main)', cursor: 'pointer' }}>Cancelar</button>
                <button type="submit" disabled={isSubmitting} className="btn-primary" style={{ padding: '0.75rem 1.5rem' }}>
                  {isSubmitting ? 'Guardando...' : editingId ? 'Actualizar Producto' : 'Guardar Producto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {fullMedia && (
        <ZoomPanImage src={fullMedia} onClose={() => setFullMedia(null)} />
      )}

    </div>
  );
}

const ZoomPanImage = ({ src, onClose }) => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handleWheel = (e) => {
    e.stopPropagation();
    const zoomFactor = 0.1;
    if (e.deltaY < 0) {
      setScale(prev => Math.min(prev + zoomFactor, 4));
    } else {
      setScale(prev => Math.max(prev - zoomFactor, 0.5));
    }
  };

  const handleMouseDown = (e) => {
    e.preventDefault(); 
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const zoomIn = (e) => { e.stopPropagation(); setScale(prev => Math.min(prev + 0.5, 4)); };
  const zoomOut = (e) => { e.stopPropagation(); setScale(prev => Math.max(prev - 0.5, 0.5)); };
  const resetZoom = (e) => { e.stopPropagation(); setScale(1); setPosition({x:0, y:0}); };

  return (
    <div 
      style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 2000, background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }} 
      onWheel={handleWheel}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onClick={onClose}
    >
       <div 
         style={{ transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`, transition: isDragging ? 'none' : 'transform 0.2s', cursor: isDragging ? 'grabbing' : 'grab', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
         onMouseDown={handleMouseDown}
         onClick={e => e.stopPropagation()}
       >
         <img src={src} draggable="false" style={{ maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain', borderRadius: '8px', boxShadow: '0 0 30px rgba(0,0,0,0.8)', userSelect: 'none', pointerEvents: 'none' }} />
       </div>
       
       <div style={{ position: 'absolute', bottom: 30, display: 'flex', gap: '1rem', background: 'rgba(0,0,0,0.7)', padding: '0.8rem 1.5rem', borderRadius: '30px', backdropFilter: 'blur(5px)', border: '1px solid rgba(255,255,255,0.1)' }} onClick={e => e.stopPropagation()}>
          <button onClick={zoomOut} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Alejar"><ZoomOut size={24} /></button>
          <button onClick={resetZoom} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Ajustar a pantalla"><Maximize size={24} /></button>
          <button onClick={zoomIn} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Acercar"><ZoomIn size={24} /></button>
       </div>

       <button onClick={onClose} style={{ position: 'absolute', top: 20, right: 20, cursor: 'pointer', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255, 255, 255, 0.3)', color: 'white', padding: '0.5rem', borderRadius: '50%', display: 'flex', alignItems:'center', justifyContent: 'center', transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.background='rgba(239, 68, 68, 0.5)'} onMouseLeave={e => e.currentTarget.style.background='rgba(255,255,255,0.1)'}>
          <X size={24} />
       </button>
    </div>
  );
};
