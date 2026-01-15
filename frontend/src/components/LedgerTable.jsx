import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, Edit, Printer } from 'lucide-react';
import Modal from './Modal';
import { api } from '../data/api';

const LedgerTable = ({ title, endpoint, entityLabel = 'Entidade' }) => {
  const [data, setData] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  
  // Standard Ledger Fields
  const [formData, setFormData] = useState({
    n_ordem: '',
    data: new Date().toISOString().split('T')[0],
    descricao: '',
    documento: '',
    entidade: '',
    entrada: 0,
    saida: 0,
    observacao: ''
  });

  const fetchData = React.useCallback(async () => {
    try {
      const items = await api.get(endpoint);
      setData(items);
    } catch (err) {
      console.error(`Failed to fetch ${endpoint}`, err);
    }
  }, [endpoint]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOpenModal = (item = null) => {
    if (item) {
      setEditingItem(item);
      setFormData(item);
    } else {
      setEditingItem(null);
      const nextNo = data.length + 1;
      setFormData({
        n_ordem: nextNo.toString(),
        data: new Date().toISOString().split('T')[0],
        descricao: '',
        documento: '',
        entidade: '',
        entrada: 0,
        saida: 0,
        observacao: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Tem certeza que deseja apagar este registro?')) {
      await api.delete(`${endpoint}/${id}`);
      fetchData();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let saldoToSave = 0;
      const entrada = Number(formData.entrada) || 0;
      const saida = Number(formData.saida) || 0;
      
      if (!editingItem && data.length > 0) {
          saldoToSave = (data[0].saldo || 0) + entrada - saida;
      } else if (!editingItem && data.length === 0) {
          saldoToSave = entrada - saida;
      } else {
          saldoToSave = (editingItem ? editingItem.saldo : (entrada - saida)); 
           if (data.length > 0 && !editingItem) saldoToSave = (data[0].saldo || 0) + entrada - saida;
      }
      
      // Derive Month/Year if needed
      const dateDate = new Date(formData.data);
      const mes = dateDate.getMonth() + 1;
      const ano = dateDate.getFullYear();

      const payload = { ...formData, entrada, saida, saldo: saldoToSave, mes, ano };

      if (editingItem) {
        await api.put(`${endpoint}/${editingItem._id}`, payload);
      } else {
        await api.post(endpoint, payload);
      }
      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      console.error(error);
      alert('Erro ao salvar');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const formatCurrency = (val) => {
     if (val === undefined || val === null) return '-';
     return new Intl.NumberFormat('pt-MZ', { minimumFractionDigits: 2 }).format(val);
  };

  return (
    <div>
      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>{title}</h2>
        <div style={{ display: 'flex', gap: '1rem' }}>
            <button 
              className="btn-ghost" 
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)', borderColor: 'var(--border-subtle)' }}
              onClick={handlePrint}
            >
              <Printer size={18} />
              Imprimir
            </button>
            <button 
              className="btn-primary" 
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              onClick={() => handleOpenModal()}
            >
              <Plus size={18} />
              Adicionar
            </button>
        </div>
      </div>
      
      {/* Print Header - Visible only on Print */}
      <div className="print-header" style={{ display: 'none', marginBottom: '2rem', borderBottom: '2px solid #000', paddingBottom: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                  <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>MSS Control</h1>
                  <p style={{ margin: '5px 0', fontSize: '14px', color: '#555' }}>Relatório Financeiro / Extrato</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                  <p style={{ margin: 0, fontSize: '12px' }}>Data de Emissão: {new Date().toLocaleDateString()}</p>
                  <h3 style={{ margin: '10px 0 0', fontSize: '18px' }}>{title}</h3>
              </div>
          </div>
      </div>

      <motion.div 
        className="glass-panel"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>N/O</th>
                <th>Data</th>
                <th>Descrição</th>
                <th>Nº Documento</th>
                <th>{entityLabel}</th>
                <th style={{ textAlign: 'right' }}>Débito</th>
                <th style={{ textAlign: 'right' }}>Crédito</th>
                <th style={{ textAlign: 'right' }}>Saldo</th>
                <th>Observação</th>
                <th style={{ textAlign: 'center' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, index) => (
                <motion.tr 
                  key={row._id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <td>{row.n_ordem}</td>
                  <td style={{ whiteSpace: 'nowrap', color: 'var(--text-secondary)' }}>{row.data}</td>
                  <td style={{ fontWeight: 500 }}>{row.descricao}</td>
                  <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{row.documento}</td>
                  <td>{row.entidade}</td>
                  <td style={{ textAlign: 'right', color: row.entrada > 0 ? '#10b981' : 'inherit', fontWeight: row.entrada > 0 ? 600 : 400 }}>
                    {row.entrada > 0 ? formatCurrency(row.entrada) : '-'}
                  </td>
                  <td style={{ textAlign: 'right', color: row.saida > 0 ? '#ef4444' : 'inherit', fontWeight: row.saida > 0 ? 600 : 400 }}>
                    {row.saida > 0 ? formatCurrency(row.saida) : '-'}
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {formatCurrency(row.saldo)}
                  </td>
                   <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '150px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {row.observacao}
                  </td>
                  <td style={{ textAlign: 'center', display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                    <button onClick={() => handleOpenModal(row)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}><Edit size={16} /></button>
                    <button onClick={() => handleDelete(row._id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}><Trash2 size={16} /></button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingItem ? `EditarRegistro` : `Novo Registro`}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem' }}>
                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>N/O</label>
                    <input type="text" value={formData.n_ordem || ''} onChange={e => setFormData({...formData, n_ordem: e.target.value})} 
                           className="input-field" placeholder="Ex: 001" />
                </div>
                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Data</label>
                    <input type="date" required value={formData.data || ''} onChange={e => setFormData({...formData, data: e.target.value})} 
                           className="input-field" />
                </div>
            </div>
            
            <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Descrição</label>
                <input type="text" required value={formData.descricao || ''} onChange={e => setFormData({...formData, descricao: e.target.value})}
                       className="input-field" placeholder="Ex: Pagamento de serviços..." />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                   <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Nº Documento</label>
                   <input type="text" value={formData.documento || ''} onChange={e => setFormData({...formData, documento: e.target.value})}
                          className="input-field" placeholder="Ex: FAT-001/24" />
                </div>
                <div>
                   <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>{entityLabel}</label>
                   <input type="text" value={formData.entidade || ''} onChange={e => setFormData({...formData, entidade: e.target.value})}
                          className="input-field" placeholder="Nome da entidade ou referência" />
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                   <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Débito</label>
                   <input type="number" step="0.01" value={formData.entrada || ''} onChange={e => setFormData({...formData, entrada: e.target.value})}
                          className="input-field" placeholder="0.00" />
                </div>
                <div>
                   <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Crédito</label>
                   <input type="number" step="0.01" value={formData.saida || ''} onChange={e => setFormData({...formData, saida: e.target.value})}
                          className="input-field" placeholder="0.00" />
                </div>
            </div>

             <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Observação</label>
                <textarea value={formData.observacao || ''} onChange={e => setFormData({...formData, observacao: e.target.value})}
                       className="input-field" style={{ minHeight: '80px', fontFamily: 'inherit' }} placeholder="Detalhes adicionais sobre a transação..." />
            </div>

            <button type="submit" className="btn-primary" style={{ padding: '0.75rem', marginTop: '1rem' }}>{editingItem ? "Atualizar" : "Salvar"}</button>
        </form>
      </Modal>
    </div>
  );
};

export default LedgerTable;
