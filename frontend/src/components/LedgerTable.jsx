import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, Edit, Printer, FileText, Download, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import Modal from './Modal';
import { api } from '../data/api';
import logo from '../assets/logo.png';

const CATEGORIES = [
  'Vendas de Serviços', 'Vendas de Mercadorias', 'Prestação de Consultoria', // Entradas
  'Salários', 'Impostos (IVA/ISPC)', 'Renda/Aluguel', 'Energia/Água', 'Internet/Telefone',
  'Materiais de Escritório', 'Combustível', 'Marketing', 'Manutenção', 'Outros'
];

const LedgerTable = ({ title, endpoint, entityLabel = 'Entidade' }) => {
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, total: 0, pages: 1 });
  const [filters, setFilters] = useState({ startDate: '', endDate: '' });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  const [formData, setFormData] = useState({
    n_ordem: '',
    data: new Date().toISOString().split('T')[0],
    descricao: '',
    documento: '',
    entidade: '',
    entrada: 0,
    saida: 0,
    categoria: 'Outros',
    vencimento: '',
    anexo: '',
    observacao: ''
  });

  const fetchData = React.useCallback(async () => {
    try {
      const query = new URLSearchParams({
        page: pagination.page,
        limit: 50,
        ...filters
      }).toString();

      const response = await api.get(`${endpoint}?${query}`);

      // Basic support for both paginated and non-paginated endpoints
      if (response.transactions) {
        setData(response.transactions);
        setPagination(prev => ({ ...prev, total: response.total, pages: response.pages }));
      } else if (Array.isArray(response)) {
        setData(response);
      }
    } catch (err) {
      console.error(`Failed to fetch ${endpoint}`, err);
      setData([]);
    }
  }, [endpoint, pagination.page, filters]);

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
        categoria: 'Outros',
        vencimento: '',
        anexo: '',
        observacao: ''
      });
    }
    setIsModalOpen(true);
    setSelectedFile(null);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Tem certeza que deseja apagar este registro? (Vibe Audit Log: Esta ação será registrada)')) {
      await api.delete(`${endpoint}/${id}`);
      fetchData();
    }
  };

  const parseCurrency = (value) => {
    if (!value) return 0;
    if (typeof value === 'number') return value;
    let clean = value.toString().replace(/\s/g, '');
    if (clean.includes('.') && clean.includes(',')) {
      clean = clean.replace(/\./g, '').replace(',', '.');
    } else {
      clean = clean.replace(/,/g, '.');
    }
    const num = parseFloat(clean);
    return isNaN(num) ? 0 : num;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const entrada = parseCurrency(formData.entrada);
      const saida = parseCurrency(formData.saida);
      const dateParts = formData.data.split('-');
      const ano = parseInt(dateParts[0]);
      const mes = parseInt(dateParts[1]);
      let finalAnexo = formData.anexo;

      // Check if there is a file to upload
      if (selectedFile) {
        const filePayload = new FormData();
        filePayload.append('file', selectedFile);
        const uploadRes = await api.upload('/upload', filePayload);
        finalAnexo = uploadRes.url;
      }

      const payload = { ...formData, entrada, saida, mes, ano, anexo: finalAnexo };

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
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExportCSV = () => {
    const headers = ['N/O', 'Data', 'Descrição', 'Categoria', 'Doc', 'Entidade', 'Débito', 'Crédito', 'Saldo', 'Vencimento', 'Obs'];
    const rows = data.map(r => [
      r.n_ordem, r.data, r.descricao, r.categoria, r.documento, r.entidade,
      r.entrada, r.saida, r.saldo, r.vencimento, r.observacao
    ]);
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `Relatorio_${title}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatCurrency = (val) => {
    if (val === undefined || val === null) return '-';
    return new Intl.NumberFormat('pt-MZ', { minimumFractionDigits: 2 }).format(val);
  };

  return (
    <div>
      <div className="no-print" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>{title}</h2>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button className="btn-ghost" onClick={handleExportCSV} title="Exportar Excel (CSV)">
              <Download size={18} />
              Excel
            </button>
            <button className="btn-ghost" onClick={() => window.print()}>
              <Printer size={18} />
              Imprimir
            </button>
            <button className="btn-primary" onClick={() => handleOpenModal()}>
              <Plus size={18} />
              Novo
            </button>
          </div>
        </div>

        {/* Table Filters */}
        <div className="glass-panel" style={{ padding: '0.75rem 1.25rem', display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Calendar size={16} color="var(--text-secondary)" />
            <span style={{ fontSize: '0.85rem' }}>Período:</span>
            <input type="date" value={filters.startDate} onChange={e => setFilters({ ...filters, startDate: e.target.value })} className="input-field" style={{ padding: '0.3rem', width: 'auto' }} />
            <span>-</span>
            <input type="date" value={filters.endDate} onChange={e => setFilters({ ...filters, endDate: e.target.value })} className="input-field" style={{ padding: '0.3rem', width: 'auto' }} />
          </div>
          <button className="btn-ghost" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={() => setFilters({ startDate: '', endDate: '' })}>Limpar Filtros</button>
        </div>
      </div>

      {/* Print Header */}
      <div className="print-header" style={{ display: 'none', marginBottom: '2rem', borderBottom: '2px solid #000', paddingBottom: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <img src={logo} alt="MSS Logo" style={{ height: '50px', width: 'auto' }} />
            <div>
              <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>MSS Control</h1>
              <p style={{ margin: '5px 0', fontSize: '14px', color: '#555' }}>Relatório Financeiro / Extrato</p>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ margin: 0, fontSize: '12px' }}>Data de Emissão: {new Date().toLocaleDateString()}</p>
            <h3 style={{ margin: '10px 0 0', fontSize: '18px' }}>{title}</h3>
          </div>
        </div>
      </div>

      <motion.div className="glass-panel" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>N/O</th>
                <th>Data</th>
                <th>Descrição / Categoria</th>
                <th>Doc</th>
                <th>{entityLabel}</th>
                <th style={{ textAlign: 'right' }}>Débito</th>
                <th style={{ textAlign: 'right' }}>Crédito</th>
                <th style={{ textAlign: 'right' }}>Saldo</th>
                <th>Venc. / Anexo</th>
                <th style={{ textAlign: 'center' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, index) => (
                <motion.tr key={row._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: index * 0.02 }}>
                  <td>{row.n_ordem}</td>
                  <td style={{ fontSize: '0.85rem' }}>{row.data}</td>
                  <td>
                    <div style={{ fontWeight: 500 }}>{row.descricao}</div>
                    <div className="category-tag" style={{ color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.03)', display: 'inline-block', marginTop: '0.2rem' }}>{row.categoria}</div>
                  </td>
                  <td style={{ fontSize: '0.8rem' }}>{row.documento}</td>
                  <td>{row.entidade}</td>
                  <td style={{ textAlign: 'right', color: '#10b981', fontWeight: row.entrada > 0 ? 600 : 400 }}>{row.entrada > 0 ? formatCurrency(row.entrada) : '-'}</td>
                  <td style={{ textAlign: 'right', color: '#ef4444', fontWeight: row.saida > 0 ? 600 : 400 }}>{row.saida > 0 ? formatCurrency(row.saida) : '-'}</td>
                  <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatCurrency(row.saldo)}</td>
                  <td>
                    {row.vencimento && <div style={{ fontSize: '0.75rem', marginBottom: '0.2rem', color: new Date(row.vencimento) < new Date() ? '#ef4444' : 'inherit' }}>📅 {row.vencimento}</div>}
                    {row.anexo && <a href={row.anexo} target="_blank" rel="noreferrer" className="attachment-link">🔗 Ver Documento</a>}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center' }}>
                      <button onClick={() => handleOpenModal(row)} className="btn-ghost" style={{ padding: '0.3rem' }}><Edit size={14} /></button>
                      <button onClick={() => handleDelete(row._id)} className="btn-ghost" style={{ padding: '0.3rem', color: '#ef4444' }}><Trash2 size={14} /></button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination UI */}
        {pagination.pages > 1 && (
          <div style={{ padding: '1rem', display: 'flex', justifyContent: 'center', gap: '1rem', alignItems: 'center', borderTop: '1px solid var(--glass-border)' }}>
            <button className="btn-ghost" disabled={pagination.page === 1} onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}>
              <ChevronLeft size={16} />
            </button>
            <span style={{ fontSize: '0.9rem' }}>Página {pagination.page} de {pagination.pages}</span>
            <button className="btn-ghost" disabled={pagination.page === pagination.pages} onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}>
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </motion.div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingItem ? `Editar Registro` : `Novo Registro`}>
        <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label className="label">N/O</label>
            <input type="text" value={formData.n_ordem} onChange={e => setFormData({ ...formData, n_ordem: e.target.value })} className="input-field" />
          </div>
          <div>
            <label className="label">Data Lançamento</label>
            <input type="date" required value={formData.data} onChange={e => setFormData({ ...formData, data: e.target.value })} className="input-field" />
          </div>
          <div style={{ gridColumn: 'span 2' }}>
            <label className="label">Descrição Principal</label>
            <input type="text" required value={formData.descricao} onChange={e => setFormData({ ...formData, descricao: e.target.value })} className="input-field" />
          </div>
          <div>
            <label className="label">Categoria BI</label>
            <select value={formData.categoria} onChange={e => setFormData({ ...formData, categoria: e.target.value })} className="input-field">
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="label">{entityLabel}</label>
            <input type="text" value={formData.entidade} onChange={e => setFormData({ ...formData, entidade: e.target.value })} className="input-field" />
          </div>
          <div>
            <label className="label">Débito (Entrada)</label>
            <input type="text" value={formData.entrada} onChange={e => setFormData({ ...formData, entrada: e.target.value })} className="input-field" placeholder="0,00" />
          </div>
          <div>
            <label className="label">Crédito (Saída)</label>
            <input type="text" value={formData.saida} onChange={e => setFormData({ ...formData, saida: e.target.value })} className="input-field" placeholder="0,00" />
          </div>
          <div>
            <label className="label">Vencimento (Se houver)</label>
            <input type="date" value={formData.vencimento} onChange={e => setFormData({ ...formData, vencimento: e.target.value })} className="input-field" />
          </div>
          <div>
            <label className="label">Anexo (Upload Direto)</label>
            <input
              type="file"
              onChange={e => setSelectedFile(e.target.files[0])}
              className="input-field"
              style={{ padding: '0.4rem' }}
              accept=".jpg,.png,.pdf"
            />
            {formData.anexo && !selectedFile && <p style={{ fontSize: '0.7rem', color: '#10b981', marginTop: '0.2rem' }}>✓ Já possui anexo</p>}
          </div>
          <div style={{ gridColumn: 'span 2' }}>
            <label className="label">Observações</label>
            <textarea value={formData.observacao} onChange={e => setFormData({ ...formData, observacao: e.target.value })} className="input-field" style={{ minHeight: '60px' }} />
          </div>
          <button type="submit" disabled={isSubmitting} className="btn-primary" style={{ gridColumn: 'span 2', padding: '0.75rem', marginTop: '0.5rem' }}>
            {isSubmitting ? "Processando..." : (editingItem ? "Atualizar Registro" : "Confirmar Lançamento")}
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default LedgerTable;
