import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, Edit, Wallet, ArrowLeft } from 'lucide-react';
import { api } from '../data/api';
import Modal from '../components/Modal';
import LedgerTable from '../components/LedgerTable';

// --- SUB-COMPONENTS (Defined outside to avoid re-creation on render) ---

const FornecedorFormModal = ({ isOpen, onClose, formData, setFormData, onSubmit, isEditing }) => (
  <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? "Editar Fornecedor" : "Novo Fornecedor"}>
      <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <input placeholder="Nome do Fornecedor (Obrigatório)" required value={formData.nome || ''} onChange={e=>setFormData({...formData, nome:e.target.value})} className="input-field"/>
          <input placeholder="NUIT (Opcional)" value={formData.nuit || ''} onChange={e=>setFormData({...formData, nuit:e.target.value})} className="input-field"/>
          <input placeholder="Endereço (Opcional)" value={formData.endereco || ''} onChange={e=>setFormData({...formData, endereco:e.target.value})} className="input-field"/>
          <input placeholder="Contacto (Opcional)" value={formData.contacto || ''} onChange={e=>setFormData({...formData, contacto:e.target.value})} className="input-field"/>
          <input placeholder="E-mail (Opcional)" type="email" value={formData.email || ''} onChange={e=>setFormData({...formData, email:e.target.value})} className="input-field"/>
          <button type="submit" className="btn-primary">{isEditing ? "Atualizar" : "Salvar"}</button>
      </form>
  </Modal>
);

const FornecedorList = ({ fornecedores, onSelect, onDelete, onOpenModal }) => (
  <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2>Fornecedores Cadastrados</h2>
          <button className="btn-primary" onClick={onOpenModal}><Plus size={18}/> Novo Fornecedor</button>
      </div>
      <div className="grid-cards">
          {fornecedores.map((fornecedor) => (
              <motion.div 
                  key={fornecedor._id} 
                  className="glass-panel"
                  whileHover={{ scale: 1.02 }}
                  onClick={() => onSelect(fornecedor)}
                  style={{ padding: '1.5rem', cursor: 'pointer', position: 'relative' }}
              >
                  <button onClick={(e) => onDelete(fornecedor._id, e)} style={{ position: 'absolute', top: 10, right: 10, border: 'none', background: 'transparent', color: '#ef4444', cursor: 'pointer' }}><Trash2 size={16}/></button>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 600 }}>{fornecedor.nome}</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.5rem' }}>{fornecedor.email}</p>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{fornecedor.contacto}</p>
                  <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary-color)' }}>
                      <Wallet size={16}/> <span>Ver Financeiro</span>
                  </div>
              </motion.div>
          ))}
      </div>
  </div>
);

const FornecedorDetails = ({ fornecedor, onBack, onEdit }) => (
    <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <button onClick={onBack} className="btn-ghost" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ArrowLeft size={18}/> Voltar para Lista
            </button>
            <button onClick={() => onEdit(fornecedor)} className="btn-ghost" style={{ color: 'var(--primary-color)', borderColor: 'var(--primary-color)' }}>
                <Edit size={18} style={{ marginRight: '0.5rem' }}/> Editar Informações
            </button>
        </div>
        
        <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <div>
                    <p className="label">Fornecedor</p>
                    <h3>{fornecedor.nome}</h3>
                </div>
                <div>
                    <p className="label">NUIT</p>
                    <p>{fornecedor.nuit}</p>
                </div>
                <div>
                    <p className="label">Endereço</p>
                    <p>{fornecedor.endereco}</p>
                </div>
                <div>
                    <p className="label">Contacto</p>
                    <p>{fornecedor.contacto}</p>
                </div>
                 <div>
                    <p className="label">Email</p>
                    <p>{fornecedor.email}</p>
                </div>
            </div>
        </div>

        <LedgerTable 
          title={`Conta Corrente: ${fornecedor.nome}`}
          endpoint={`/fornecedores/${fornecedor._id}/transactions`}
          entityLabel="Referência / Entidade"
        />
    </div>
);

const Fornecedores = () => {
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'details'
  const [selectedFornecedor, setSelectedFornecedor] = useState(null);
  const [fornecedores, setFornecedores] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFornecedor, setEditingFornecedor] = useState(null);
  const [formData, setFormData] = useState({
    nome: '',
    nuit: '',
    endereco: '',
    contacto: '',
    email: ''
  });

  const fetchFornecedores = useCallback(async () => {
    try {
      const data = await api.get('/fornecedores');
      setFornecedores(data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    fetchFornecedores();
  }, [fetchFornecedores]);

  const handleOpenModal = (fornecedor = null) => {
    if (fornecedor) {
        setEditingFornecedor(fornecedor);
        setFormData({
            nome: fornecedor.nome,
            nuit: fornecedor.nuit,
            endereco: fornecedor.endereco,
            contacto: fornecedor.contacto,
            email: fornecedor.email
        });
    } else {
        setEditingFornecedor(null);
        setFormData({ nome: '', nuit: '', endereco: '', contacto: '', email: '' });
    }
    setIsModalOpen(true);
  };

  const handleSaveFornecedor = async (e) => {
    e.preventDefault();
    try {
      if (editingFornecedor) {
          // Update existing
          await api.put(`/fornecedores/${editingFornecedor._id}`, formData);
          // If we are in details view, update the selected supplier as well
          if (selectedFornecedor && selectedFornecedor._id === editingFornecedor._id) {
              setSelectedFornecedor({ ...editingFornecedor, ...formData });
          }
      } else {
          // Create new
          await api.post('/fornecedores', formData);
      }
      
      setIsModalOpen(false);
      setEditingFornecedor(null);
      setFormData({ nome: '', nuit: '', endereco: '', contacto: '', email: '' });
      fetchFornecedores();
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar fornecedor');
    }
  };

  const handleSelectFornecedor = (fornecedor) => {
    setSelectedFornecedor(fornecedor);
    setViewMode('details');
  };

  const deleteFornecedor = async (id, e) => {
      e.stopPropagation();
      if(window.confirm("Apagar fornecedor? (Isso não apaga o histórico financeiro por segurança)")) {
          try {
            await api.delete(`/fornecedores/${id}`);
            fetchFornecedores();
          } catch(err) {
            console.error(err);
            alert("Erro ao apagar fornecedor");
          }
      }
  }

  return (
    <div>
        {viewMode === 'list' ? (
             <FornecedorList 
                 fornecedores={fornecedores} 
                 onSelect={handleSelectFornecedor} 
                 onDelete={deleteFornecedor} 
                 onOpenModal={() => handleOpenModal(null)} 
             />
        ) : (
            <FornecedorDetails 
                fornecedor={selectedFornecedor} 
                onBack={() => setViewMode('list')} 
                onEdit={handleOpenModal}
            />
        )}

        <FornecedorFormModal 
            isOpen={isModalOpen} 
            onClose={() => setIsModalOpen(false)} 
            formData={formData} 
            setFormData={setFormData}
            onSubmit={handleSaveFornecedor}
            isEditing={!!editingFornecedor}
        />
    </div>
  );
};

export default Fornecedores;
