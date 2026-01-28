import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, DollarSign, Wallet, Calendar, PieChart as PieIcon, AlertCircle } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from 'recharts';
import { api } from '../data/api';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

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
        <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.05)', fontSize: '0.8rem', color: color }}>
          {subValue}
        </div>
      )}
    </div>
  </motion.div>
);

const Dashboard = () => {
  const [filters, setFilters] = useState({ startDate: '', endDate: '' });
  const [stats, setStats] = useState({
    totalCaixa: 0,
    totalBancos: 0,
    totalDividas: 0,
    totalFornecedores: 0,
    totalEntradas: 0,
    totalSaidas: 0,
    monthlyStats: [],
    expensesByCategory: [],
    alerts: []
  });

  const fetchStats = async () => {
    try {
      const query = new URLSearchParams(filters).toString();
      const data = await api.get(`/stats?${query}`);
      setStats(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [filters]);

  const totalAssets = stats.totalCaixa + stats.totalBancos + stats.totalDividas - stats.totalFornecedores;

  const chartData = stats.monthlyStats.map(item => ({
    name: new Date(0, item._id - 1).toLocaleString('pt-PT', { month: 'short' }),
    Entradas: item.entrada,
    Saídas: item.saida
  }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header & Filters */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 700, letterSpacing: '-0.02em' }}>Dashboard Executivo</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Análise financeira inteligente e insights de BI</p>
        </div>
        <div className="glass-panel" style={{ padding: '0.75rem 1.25rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Calendar size={18} color="var(--brand-red)" />
            <input type="date" value={filters.startDate} onChange={e => setFilters({ ...filters, startDate: e.target.value })} className="input-field" style={{ padding: '0.4rem', width: 'auto' }} />
            <span>até</span>
            <input type="date" value={filters.endDate} onChange={e => setFilters({ ...filters, endDate: e.target.value })} className="input-field" style={{ padding: '0.4rem', width: 'auto' }} />
          </div>
          <button className="btn-primary" style={{ padding: '0.5rem 1rem' }} onClick={() => setFilters({ startDate: '', endDate: '' })}>Limpar</button>
        </div>
      </div>

      {/* Alerts Section */}
      {stats.alerts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass-panel"
          style={{ padding: '1rem 1.5rem', borderLeft: '4px solid #ef4444', display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(239, 68, 68, 0.05)' }}
        >
          <AlertCircle color="#ef4444" size={24} />
          <div style={{ flex: 1 }}>
            <p style={{ fontWeight: 600 }}>Atenção: {stats.alerts.length} Pagamentos Vencendo em Breve</p>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Existem fatura(s) de fornecedores com vencimento para os próximos 7 dias. Verifique a aba de Fornecedores.
            </p>
          </div>
        </motion.div>
      )}

      {/* Financial Overview */}
      <div className="grid-cards">
        <StatCard title="Liquidez em Caixa" value={stats.totalCaixa} icon={DollarSign} color="#10b981" />
        <StatCard title="Saldo Bancário" value={stats.totalBancos} icon={Wallet} color="#3b82f6" />
        <StatCard title="Contas a Receber" value={stats.totalDividas} icon={TrendingUp} color="#8b5cf6" subValue="Clientes" />
        <StatCard title="Contas a Pagar" value={stats.totalFornecedores} icon={TrendingDown} color="#ef4444" subValue="Fornecedores" />
      </div>

      <StatCard title="Patrimônio Líquido Real" value={totalAssets} icon={TrendingUp} color="#f59e0b" helpText="Consolidado de ativos e passivos" />

      {/* Charts & BI Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
        {/* Main Growth Chart */}
        <motion.div className="glass-panel" style={{ padding: '1.5rem', minHeight: '400px' }}>
          <h3 style={{ marginBottom: '1.5rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <TrendingUp size={20} color="#10b981" /> Fluxo Temporal de Caixa
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorEntrada" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorSaida" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="name" stroke="var(--text-secondary)" tickLine={false} axisLine={false} />
              <YAxis stroke="var(--text-secondary)" tickLine={false} axisLine={false} tickFormatter={(value) => `${value / 1000}k`} />
              <Tooltip
                contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                itemStyle={{ color: '#fff' }}
              />
              <Area type="monotone" dataKey="Entradas" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorEntrada)" />
              <Area type="monotone" dataKey="Saídas" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorSaida)" />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Expense Distribution (BI) */}
        <motion.div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 style={{ marginBottom: '1.5rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <PieIcon size={20} color="#8b5cf6" /> Distribuição de Gastos (BI)
          </h3>
          <div style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.expensesByCategory.length > 0 ? stats.expensesByCategory : [{ _id: 'Sem Dados', value: 1 }]}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  nameKey="_id"
                >
                  {stats.expensesByCategory.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                  ))}
                  {!stats.expensesByCategory.length && <Cell fill="rgba(255,255,255,0.05)" />}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', border: 'none', borderRadius: '8px' }}
                  itemStyle={{ color: '#fff' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginTop: '1rem' }}>
            {stats.expensesByCategory.map((item, index) => (
              <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem' }}>
                <div style={{ width: 10, height: 10, borderRadius: '2px', background: COLORS[index % COLORS.length] }}></div>
                <span style={{ color: 'var(--text-secondary)' }}>{item._id}:</span>
                <span style={{ fontWeight: 600 }}>{new Intl.NumberFormat('pt-MZ').format(item.value)}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Operating Performance Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        <motion.div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 style={{ marginBottom: '1.5rem', fontWeight: 600 }}>Performace Operacional</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Total Recebido</span>
                <span style={{ fontWeight: 600, color: '#10b981' }}>{new Intl.NumberFormat('pt-MZ').format(stats.totalEntradas)}</span>
              </div>
              <div style={{ height: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 3 }}>
                <motion.div initial={{ width: 0 }} animate={{ width: '100%' }} style={{ height: '100%', background: '#10b981', borderRadius: 3 }} />
              </div>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Total Gasto</span>
                <span style={{ fontWeight: 600, color: '#ef4444' }}>{new Intl.NumberFormat('pt-MZ').format(stats.totalSaidas)}</span>
              </div>
              <div style={{ height: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 3 }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(stats.totalSaidas / (stats.totalEntradas || 1)) * 100}%` }}
                  style={{ height: '100%', background: '#ef4444', borderRadius: 3, maxWidth: '100%' }}
                />
              </div>
            </div>
            <div style={{ marginTop: '0.5rem', padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', textAlign: 'center' }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Eficiência de Lucro (ROI Estimado)</p>
              <p style={{ fontSize: '1.8rem', fontWeight: 700, color: (stats.totalEntradas - stats.totalSaidas) >= 0 ? '#f59e0b' : '#ef4444' }}>
                {(((stats.totalEntradas - stats.totalSaidas) / (stats.totalEntradas || 1)) * 100).toFixed(1)}%
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
