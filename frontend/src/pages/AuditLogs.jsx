import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { History, User, Activity, ShieldCheck } from 'lucide-react';
import { api } from '../data/api';

const AuditLogs = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({ page: 1, pages: 1 });

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const response = await api.get(`/audit-logs?page=${pagination.page}&limit=50`);
            setLogs(response.logs || []);
            setPagination(prev => ({ ...prev, pages: response.pages || 1 }));
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, [pagination.page]);

    const getActionColor = (action) => {
        switch (action) {
            case 'CREATE': return '#10b981';
            case 'UPDATE': return '#3b82f6';
            case 'DELETE': return '#ef4444';
            default: return 'var(--text-secondary)';
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div>
                <h1 style={{ fontSize: '2.2rem', fontWeight: 700, letterSpacing: '-0.02em' }}>Logs de Auditoria</h1>
                <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Rastreabilidade total das ações no sistema (Vibe Security)</p>
            </div>

            <motion.div
                className="glass-panel"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ padding: '0' }}
            >
                <div style={{ overflowX: 'auto' }}>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Data / Hora</th>
                                <th>Usuário</th>
                                <th>Ação</th>
                                <th>Recurso</th>
                                <th>Detalhes</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="5" style={{ textAlign: 'center', padding: '3rem' }}>Carregando trilha de auditoria...</td></tr>
                            ) : logs.length === 0 ? (
                                <tr><td colSpan="5" style={{ textAlign: 'center', padding: '3rem' }}>Nenhum log registrado ainda.</td></tr>
                            ) : logs.map((log, index) => (
                                <tr key={log._id}>
                                    <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                                        {new Date(log.timestamp).toLocaleString('pt-MZ')}
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--brand-red)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', color: 'white' }}>
                                                {log.userName?.charAt(0) || 'A'}
                                            </div>
                                            <span style={{ fontWeight: 500 }}>{log.userName}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <span style={{
                                            padding: '0.25rem 0.6rem',
                                            borderRadius: '20px',
                                            fontSize: '0.7rem',
                                            fontWeight: 700,
                                            background: `${getActionColor(log.action)}20`,
                                            color: getActionColor(log.action),
                                            border: `1px solid ${getActionColor(log.action)}40`
                                        }}>
                                            {log.action}
                                        </span>
                                    </td>
                                    <td style={{ fontWeight: 600, fontSize: '0.85rem' }}>{log.resource}</td>
                                    <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', maxWidth: '300px' }}>
                                        {log.action === 'DELETE'
                                            ? `ID: ${log.details?._id} - Desc: ${log.details?.descricao}`
                                            : `${log.details?.descricao || 'N/A'} (${new Intl.NumberFormat('pt-MZ').format(log.details?.entrada || log.details?.saida || 0)} MT)`}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {pagination.pages > 1 && (
                    <div style={{ padding: '1rem', display: 'flex', justifyContent: 'center', gap: '1rem', alignItems: 'center', borderTop: '1px solid var(--glass-border)' }}>
                        <button
                            className="btn-ghost"
                            disabled={pagination.page === 1}
                            onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                            style={{ padding: '0.4rem 1rem' }}
                        >
                            Anterior
                        </button>
                        <span style={{ fontSize: '0.9rem' }}>Página {pagination.page} de {pagination.pages}</span>
                        <button
                            className="btn-ghost"
                            disabled={pagination.page === pagination.pages}
                            onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                            style={{ padding: '0.4rem 1rem' }}
                        >
                            Próxima
                        </button>
                    </div>
                )}
            </motion.div>

            <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                <ShieldCheck color="#10b981" size={32} />
                <div>
                    <p style={{ fontWeight: 600, color: '#10b981' }}>Sistema de Integridade Ativo</p>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        Todas as alterações em registros financeiros, clientes e fornecedores são imutáveis e registradas para auditoria futura.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AuditLogs;
