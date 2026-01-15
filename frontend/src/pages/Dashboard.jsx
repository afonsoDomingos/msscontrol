
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, DollarSign, Wallet } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area } from 'recharts';
import { api } from '../data/api';

const StatCard = ({ title, value, icon: Icon, trend, color, subValue, helpText }) => (
  <motion.div 
    className="glass-panel"
    whileHover={{ y: -5, boxShadow: '0 8px 30px rgba(0,0,0,0.12)' }}
    style={{ 
        padding: '1.5rem', 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '0.5rem',
        position: 'relative',
        overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.05)'
    }}
  >
    <div style={{ position: 'absolute', top: 0, right: 0, padding: '1.5rem', opacity: 0.1 }}>
        <Icon size={48} color={color} />
    </div>

    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', zIndex: 1 }}>
      <div style={{ padding: '0.75rem', borderRadius: '12px', background: `rgba(255,255,255,0.05)`, color: color, backdropFilter: 'blur(4px)' }}>
        <Icon size={24} />
      </div>
      {trend && (
        <span style={{ fontSize: '0.875rem', fontWeight: 600, color: trend > 0 ? '#10b981' : '#ef4444', display: 'flex', alignItems: 'center', gap: '0.25rem', background: trend > 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', padding: '0.25rem 0.5rem', borderRadius: '20px' }}>
          {trend > 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
          {Math.abs(trend)}%
        </span>
      )}
    </div>
    
    <div style={{ zIndex: 1, marginTop: '1rem' }}>
      <h3 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{title}</h3>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
          <p style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.25rem', letterSpacing: '-0.02em' }}>
            {new Intl.NumberFormat('pt-MZ', { minimumFractionDigits: 2 }).format(value)}
          </p>
          <span style={{ fontSize: '1rem', color: 'var(--text-secondary)', fontWeight: 500 }}>MT</span>
      </div>
      {subValue && (
          <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.05)', fontSize: '0.8rem', color: subValue.includes('Dívida') ? '#ef4444' : '#10b981' }}>
              {subValue}
          </div>
      )}
    </div>
  </motion.div>
);

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalCaixa: 0, 
    totalBancos: 0, 
    totalDividas: 0, // General Client Net Balance
    totalEntradas: 0,
    totalSaidas: 0,
    monthlyStats: []
  });

  useEffect(() => {
    const fetchStats = async () => {
        try {
            const data = await api.get('/stats');
            setStats(data);
        } catch(err) {
            console.error(err);
        }
    };
    fetchStats();
  }, []);

  const totalAssets = stats.totalCaixa + stats.totalBancos;
  // Interpretation: "totalDividas" is positive if Admin owes clients? Or Clients owe Admin?
  // Let's assume standard: Positive = Credit (Admin has money). Negative = Debt.
  
  const chartData = stats.monthlyStats.map(item => ({
      name: new Date(0, item._id - 1).toLocaleString('pt-PT', { month: 'short' }),
      Entradas: item.entrada,
      Saídas: item.saida
  }));

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>Dashboard Geral</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Visão consolidada de {new Date().getFullYear()}</p>
      </div>

      <div className="grid-cards" style={{ marginBottom: '2rem' }}>
        <StatCard title="Saldo em Caixa" value={stats.totalCaixa} icon={DollarSign} color="#10b981" />
        <StatCard title="Saldo em Bancos" value={stats.totalBancos} icon={Wallet} color="#3b82f6" />
        <StatCard title="Saldo Clientes (Líquido)" value={stats.totalDividas} icon={TrendingDown} color={stats.totalDividas >= 0 ? "#8b5cf6" : "#ef4444"} subValue={stats.totalDividas >= 0 ? "Em haver (Credito)" : "Dívida"} />
        <StatCard title="Patrimônio Total" value={totalAssets} icon={TrendingUp} color="#f59e0b" />
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
          <motion.div className="glass-panel" style={{ padding: '1.5rem', minHeight: '400px' }}>
              <h3 style={{ marginBottom: '1.5rem', fontWeight: 600 }}>Crescimento Financeiro (Entradas vs Saídas)</h3>
              <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={chartData}>
                      <defs>
                          <linearGradient id="colorEntrada" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorSaida" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                          </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" strike="rgba(255,255,255,0.1)" vertical={false} />
                      <XAxis dataKey="name" stroke="var(--text-secondary)" tickLine={false} axisLine={false} />
                      <YAxis stroke="var(--text-secondary)" tickLine={false} axisLine={false} tickFormatter={(value) => `${value/1000}k`} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: 'none', borderRadius: '8px' }}
                        itemStyle={{ color: '#fff' }}
                      />
                      <Area type="monotone" dataKey="Entradas" stroke="#10b981" fillOpacity={1} fill="url(#colorEntrada)" />
                      <Area type="monotone" dataKey="Saídas" stroke="#ef4444" fillOpacity={1} fill="url(#colorSaida)" />
                  </AreaChart>
              </ResponsiveContainer>
          </motion.div>

          <motion.div className="glass-panel" style={{ padding: '1.5rem' }}>
               <h3 style={{ marginBottom: '1.5rem', fontWeight: 600 }}>Totais do Ano</h3>
               <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                   <div>
                       <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Total Recebido (Entradas)</p>
                       <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#10b981' }}>{new Intl.NumberFormat('pt-MZ').format(stats.totalEntradas)} MT</p>
                   </div>
                    <div>
                       <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Total Gasto (Saídas)</p>
                       <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#ef4444' }}>{new Intl.NumberFormat('pt-MZ').format(stats.totalSaidas)} MT</p>
                   </div>
                   <div style={{ paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)' }}>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Resultado Operacional</p>
                        <p style={{ fontSize: '1.5rem', fontWeight: 700, color: (stats.totalEntradas - stats.totalSaidas) >= 0 ? '#f59e0b' : '#ef4444' }}>
                            {new Intl.NumberFormat('pt-MZ').format(stats.totalEntradas - stats.totalSaidas)} MT
                        </p>
                   </div>
               </div>
          </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
