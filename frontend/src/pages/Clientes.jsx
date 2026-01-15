
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, Edit, AlertCircle, TrendingUp, TrendingDown, Wallet, ArrowLeft } from 'lucide-react';
import { api } from '../data/api';
import Modal from '../components/Modal';
import LedgerTable from '../components/LedgerTable';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line } from 'recharts';

// --- SUB-COMPONENTS (Defined outside to avoid re-creation on render) ---

const ClientFormModal = ({ isOpen, onClose, formData, setFormData, onSubmit, isEditing }) => (
  <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? "Editar Cliente" : "Novo Cliente"}>
      <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <input placeholder="Nome do Cliente" required value={formData.nome} onChange={e=>setFormData({...formData, nome:e.target.value})} className="input-field"/>
          <input placeholder="NUIT" required value={formData.nuit} onChange={e=>setFormData({...formData, nuit:e.target.value})} className="input-field"/>
          <input placeholder="Endereço" required value={formData.endereco} onChange={e=>setFormData({...formData, endereco:e.target.value})} className="input-field"/>
          <input placeholder="Contacto" required value={formData.contacto} onChange={e=>setFormData({...formData, contacto:e.target.value})} className="input-field"/>
          <input placeholder="E-mail" type="email" required value={formData.email} onChange={e=>setFormData({...formData, email:e.target.value})} className="input-field"/>
          <button type="submit" className="btn-primary">{isEditing ? "Atualizar" : "Salvar"}</button>
      </form>
  </Modal>
);

const ClientList = ({ clients, onSelect, onDelete, onOpenModal }) => (
  <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2>Clientes Cadastrados</h2>
          <button className="btn-primary" onClick={onOpenModal}><Plus size={18}/> Novo Cliente</button>
      </div>
      <div className="grid-cards">
          {clients.map((client) => (
              <motion.div 
                  key={client._id} 
                  className="glass-panel"
                  whileHover={{ scale: 1.02 }}
                  onClick={() => onSelect(client)}
                  style={{ padding: '1.5rem', cursor: 'pointer', position: 'relative' }}
              >
                  <button onClick={(e) => onDelete(client._id, e)} style={{ position: 'absolute', top: 10, right: 10, border: 'none', background: 'transparent', color: '#ef4444', cursor: 'pointer' }}><Trash2 size={16}/></button>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 600 }}>{client.nome}</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.5rem' }}>{client.email}</p>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{client.contacto}</p>
                  <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary-color)' }}>
                      <Wallet size={16}/> <span>Ver Financeiro</span>
                  </div>
              </motion.div>
          ))}
      </div>
  </div>
);

const ClientDetails = ({ client, onBack, onEdit }) => (
    <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <button onClick={onBack} className="btn-ghost" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ArrowLeft size={18}/> Voltar para Lista
            </button>
            <button onClick={() => onEdit(client)} className="btn-ghost" style={{ color: 'var(--primary-color)', borderColor: 'var(--primary-color)' }}>
                <Edit size={18} style={{ marginRight: '0.5rem' }}/> Editar Informações
            </button>
        </div>
        
        <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <div>
                    <p className="label">Cliente</p>
                    <h3>{client.nome}</h3>
                </div>
                <div>
                    <p className="label">NUIT</p>
                    <p>{client.nuit}</p>
                </div>
                <div>
                    <p className="label">Endereço</p>
                    <p>{client.endereco}</p>
                </div>
                <div>
                    <p className="label">Contacto</p>
                    <p>{client.contacto}</p>
                </div>
                 <div>
                    <p className="label">Email</p>
                    <p>{client.email}</p>
                </div>
            </div>
        </div>

        <LedgerTable 
          title={`Conta Corrente: ${client.nome}`}
          endpoint={`/clientes/${client._id}/transactions`}
          entityLabel="Referência / Entidade"
        />
    </div>
);

const Clientes = () => {
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'details'
  const [selectedClient, setSelectedClient] = useState(null);
  const [clients, setClients] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState(null); // State to track client being edited
  const [formData, setFormData] = useState({
    nome: '',
    nuit: '',
    endereco: '',
    contacto: '',
    email: ''
  });

  const fetchClients = async () => {
    try {
      const data = await api.get('/clientes');
      setClients(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleOpenModal = (client = null) => {
    if (client) {
        setEditingClient(client);
        setFormData({
            nome: client.nome,
            nuit: client.nuit,
            endereco: client.endereco,
            contacto: client.contacto,
            email: client.email
        });
    } else {
        setEditingClient(null);
        setFormData({ nome: '', nuit: '', endereco: '', contacto: '', email: '' });
    }
    setIsModalOpen(true);
  };

  const handleSaveClient = async (e) => {
    e.preventDefault();
    try {
      if (editingClient) {
          // Update existing client
          await api.put(`/clientes/${editingClient._id}`, formData);
          // If we are in details view, update the selected client as well
          if (selectedClient && selectedClient._id === editingClient._id) {
              setSelectedClient({ ...editingClient, ...formData });
          }
      } else {
          // Create new client
          await api.post('/clientes', formData);
      }
      
      setIsModalOpen(false);
      setEditingClient(null);
      setFormData({ nome: '', nuit: '', endereco: '', contacto: '', email: '' });
      fetchClients();
    } catch (err) {
      alert('Erro ao salvar cliente');
    }
  };

  const handleSelectClient = (client) => {
    setSelectedClient(client);
    setViewMode('details');
  };

  const deleteClient = async (id, e) => {
      e.stopPropagation();
      if(window.confirm("Apagar cliente? (Isso não apaga o histórico financeiro por segurança)")) {
          await api.delete(`/clientes/${id}`);
          fetchClients();
      }
  }

  return (
    <div>
        {viewMode === 'list' ? (
             <ClientList 
                 clients={clients} 
                 onSelect={handleSelectClient} 
                 onDelete={deleteClient} 
                 onOpenModal={() => handleOpenModal(null)} 
             />
        ) : (
            <ClientDetails 
                client={selectedClient} 
                onBack={() => setViewMode('list')} 
                onEdit={handleOpenModal}
            />
        )}

        <ClientFormModal 
            isOpen={isModalOpen} 
            onClose={() => setIsModalOpen(false)} 
            formData={formData} 
            setFormData={setFormData}
            onSubmit={handleSaveClient}
            isEditing={!!editingClient}
        />
    </div>
  );
};

export default Clientes;
