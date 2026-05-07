import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FileText, Printer, CheckCircle, X } from 'lucide-react';

export default function Billing() {
  const [invoices, setInvoices] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = sessionStorage.getItem('access_token');
      const headers = { Authorization: `Bearer ${token}` };

      const [invRes, quoteRes] = await Promise.all([
        axios.get('http://localhost:8000/api/v1/workshop/invoices/', { headers }),
        axios.get('http://localhost:8000/api/v1/workshop/quotes/', { headers })
      ]);
      
      setInvoices(invRes.data);
      setQuotes(quoteRes.data.filter(q => q.status === 'approved')); 
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const generateInvoice = async (quote) => {
    if(!window.confirm(`¿Generar factura legal para Cotización #${quote.id}?`)) return;
    try {
      const token = sessionStorage.getItem('access_token');
      const payload = {
        code: `FACT-${Math.floor(Math.random() * 100000)}`,
        quote: quote.id,
        client: quote.client,
        subtotal: quote.total,
        tax_rate: 16.00,
      };
      await axios.post('http://localhost:8000/api/v1/workshop/invoices/', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchData();
    } catch (err) {
      alert("Error al generar la factura. Puede que ya exista una factura para esta cotización.");
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '2rem' }}>
      <header className="page-header no-print">
        <div>
          <h1 style={{ fontSize: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileText /> Módulo de Facturación
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>Convierte cotizaciones aprobadas en facturas legales imprimibles</p>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(350px, 1fr) 2fr', gap: '2rem' }}>
        
        {/* Left Column: Generador de Facturas */}
        <div className="dashboard-card no-print" style={{ background: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: '0 4px 6px rgba(0,0,0,0.2)' }}>
          <h3 style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem', marginBottom: '1rem' }}>Generar Nueva Factura</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>Selecciona una cotización previamente aprobada por el cliente.</p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '300px', overflowY: 'auto' }}>
             {quotes.length === 0 && <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>No hay cotizaciones aprobadas pendientes.</span>}
             {quotes.map(q => (
               <div key={q.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-main)', padding: '1rem', borderRadius: '8px' }}>
                  <div>
                    <div style={{ fontWeight: 'bold' }}>Cotización #{q.id}</div>
                    <div style={{ fontSize: '0.85rem', color: '#10b981' }}>Total: Bs. {q.total}</div>
                  </div>
                  <button onClick={() => generateInvoice(q)} className="btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>Facturar</button>
               </div>
             ))}
          </div>

          <h3 style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem', marginBottom: '1rem', marginTop: '3rem' }}>Historial de Facturas</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
             {invoices.length === 0 && <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>El historial está vacío.</span>}
             {invoices.map(inv => (
               <div key={inv.id} onClick={() => setSelectedInvoice(inv)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-main)', padding: '1rem', borderRadius: '8px', cursor: 'pointer', borderLeft: selectedInvoice?.id === inv.id ? '4px solid #a855f7' : '4px solid transparent', transition: 'all 0.2s' }}>
                  <div>
                    <div style={{ fontWeight: 'bold', color: 'var(--text-main)' }}>{inv.code}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{inv.issue_date}</div>
                  </div>
                  <div style={{ fontWeight: 'bold' }}>Bs. {inv.total}</div>
               </div>
             ))}
          </div>
        </div>

        {/* Right Column: Previsualización de Factura (Aesthetic Glassmorphism) */}
        <div style={{ position: 'relative' }}>
          {selectedInvoice ? (
            <div className="invoice-container" style={{ background: 'linear-gradient(145deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0) 100%)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '3rem', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
               
               {/* Controls */}
               <div className="no-print" style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', display: 'flex', gap: '1rem' }}>
                 <button onClick={handlePrint} className="btn-primary" style={{ background: 'linear-gradient(45deg, #a855f7, #6366f1)', display: 'flex', alignItems: 'center', gap: '0.5rem', border: 'none', padding: '0.5rem 1rem' }}>
                   <Printer size={18} /> Imprimir Doc.
                 </button>
               </div>

               {/* Factura Render */}
               <div id="printable-invoice" style={{ color: 'white' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid rgba(255,255,255,0.2)', paddingBottom: '2rem', marginBottom: '2rem' }}>
                     <div>
                       <h1 style={{ fontSize: '2.5rem', margin: 0, textShadow: '0 0 10px rgba(168, 85, 247, 0.5)', fontFamily: 'serif' }}>FACTURA COMERCIAL</h1>
                       <p style={{ margin: '0.5rem 0', color: 'var(--text-muted)' }}>CHICKEN MOTO ERP C.A.</p>
                       <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>NIT: 1029384756012</p>
                     </div>
                     <div style={{ textAlign: 'right' }}>
                       <h2 style={{ fontSize: '1.5rem', margin: 0, color: '#a855f7' }}>#{selectedInvoice.code}</h2>
                       <p style={{ margin: '0.5rem 0', color: 'var(--text-muted)' }}>Fecha: {selectedInvoice.issue_date}</p>
                       {selectedInvoice.is_paid && <span style={{ display: 'inline-block', background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', padding: '0.2rem 0.5rem', borderRadius: '4px', marginTop: '0.5rem', fontWeight: 'bold' }}>PAGADO</span>}
                     </div>
                  </div>

                  <div style={{ marginBottom: '3rem' }}>
                     <h4 style={{ color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.5rem' }}>Facturar a:</h4>
                     <p style={{ margin: 0, fontSize: '1.1rem', fontWeight: 'bold' }}>{selectedInvoice.client_name} {selectedInvoice.client_last_name}</p>
                     {selectedInvoice.repair_order_code && (
                       <p style={{ margin: '0.5rem 0 0 0', color: 'var(--text-muted)' }}>Ref. Reparación: {selectedInvoice.repair_order_code}</p>
                     )}
                  </div>

                  <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '2rem' }}>
                     <thead>
                       <tr style={{ background: 'rgba(255,255,255,0.05)' }}>
                         <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Descripción de la Cotización asociada</th>
                         <th style={{ padding: '1rem', textAlign: 'right', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Total (Monto)</th>
                       </tr>
                     </thead>
                     <tbody>
                       <tr>
                         <td style={{ padding: '1.5rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>Servicios y repuestos facturados amparados bajo la cotización {selectedInvoice.quote}</td>
                         <td style={{ padding: '1.5rem 1rem', textAlign: 'right', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>Bs. {selectedInvoice.subtotal}</td>
                       </tr>
                     </tbody>
                  </table>

                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <div style={{ width: '300px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>
                        <span>Subtotal:</span>
                        <span>Bs. {selectedInvoice.subtotal}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', color: 'var(--text-muted)' }}>
                        <span>IVA ({selectedInvoice.tax_rate}%):</span>
                        <span>Bs. {selectedInvoice.tax_amount}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px solid rgba(255,255,255,0.2)', paddingTop: '1rem', fontWeight: 'bold', fontSize: '1.5rem', color: 'white' }}>
                        <span>TOTAL:</span>
                        <span>Bs. {selectedInvoice.total}</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ marginTop: '4rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                     <p>Gracias por confiar en Chicken Moto.</p>
                     <p>Este documento es una representación impresa de un CFDI válido y auditable.</p>
                  </div>
               </div>
            </div>
          ) : (
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', border: '2px dashed rgba(255,255,255,0.1)', borderRadius: '16px', padding: '3rem' }}>
               <FileText size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
               <p>Selecciona o Genera una factura para previsualizarla aquí.</p>
            </div>
          )}
        </div>

      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          /* General resets classes to be hidden on print */
          .sidebar, aside, .chatbot-container, .no-print {
             display: none !important;
          }
          
          /* Un-restrict layout grids that might force the print view to be slim */
          .dashboard-layout {
             display: block !important;
             grid-template-columns: 1fr !important;
          }
          .dashboard-content {
             margin: 0 !important;
             padding: 0 !important;
             width: 100% !important;
          }
          div[style*="grid-template-columns"] {
             display: block !important;
          }

          /* Force white background, black text */
          body, html, #root {
             background: white !important;
             color: black !important;
          }
          
          * {
             color: black !important;
             background: transparent !important;
             box-shadow: none !important;
             text-shadow: none !important;
             border-color: #000 !important;
          }

          /* Optimize the invoice itself */
          .invoice-container {
             width: 100% !important;
             max-width: 100% !important;
             margin: 0 !important;
             padding: 0 !important;
             border: none !important;
          }
          .invoice-container table th, 
          .invoice-container table td {
            border-bottom: 1px solid #000 !important;
          }
        }
      `}} />
    </div>
  );
}
