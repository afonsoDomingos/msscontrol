
import React from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { LayoutDashboard, Wallet, Building2, Users, PieChart, LogOut, Menu, Moon, Sun } from 'lucide-react';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';

const SidebarItem = ({ to, icon: Icon, label }) => {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        clsx(
          "nav-item",
          isActive && "active"
        )
      }
    >
      <Icon size={20} />
      <span>{label}</span>
      {/* Glow effect handled by CSS, but we could add motion here */}
    </NavLink>
  );
};

const Layout = () => {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();

  // Map route to title
  const getTitle = () => {
    switch(location.pathname) {
      case '/': return 'Dashboard Financeiro';
      case '/caixa': return 'Fluxo de Caixa';
      case '/bancos': return 'Contas Bancárias';
      case '/clientes': return 'Gestão de Clientes';
      default: return 'Mapa de Controle';
    }
  };

  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div style={{ paddingBottom: '2.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
           <div style={{ 
               width: 50, height: 50, 
               background: 'rgba(255,255,255,0.95)', 
               borderRadius: '12px', 
               display: 'flex', alignItems: 'center', justifyContent: 'center', 
               boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
               padding: '5px'
            }}>
             <img src="/src/assets/logo_mss.png" alt="MSS Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
           </div>
           <div>
             <h2 style={{ fontSize: '1.2rem', color: '#ffffff', fontWeight: 700, lineHeight: 1.2 }}>MSS Control</h2>
             <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.8)', letterSpacing: '0.05em' }}>BUSINESS SUPPORT</p>
           </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
          <p style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', fontWeight: 600, paddingLeft: '1rem', marginBottom: '0.5rem' }}>Menu Principal</p>
          <SidebarItem to="/" icon={LayoutDashboard} label="Visão Geral" />
          <SidebarItem to="/caixa" icon={Wallet} label="Fluxo de Caixa" />
          <SidebarItem to="/bancos" icon={Building2} label="Contas Bancárias" />
          <SidebarItem to="/clientes" icon={Users} label="Gestão de Clientes" />
        </div>

        <div style={{ marginTop: 'auto', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
             <p style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', fontWeight: 600, paddingLeft: '1rem', marginBottom: '0.5rem' }}>Conta</p>
             <div className="nav-item" style={{ cursor: 'pointer' }}>
                <LogOut size={20} />
                <span>Sair do Sistema</span>
             </div>
             
             <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '1.5rem', padding: '0.75rem', background: 'rgba(0,0,0,0.2)', borderRadius: '10px' }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 'bold', color: '#e63946' }}>AD</div>
                <div>
                   <p style={{ fontSize: '0.9rem', fontWeight: 500, color: '#ffffff' }}>Administrador</p>
                   <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)' }}>admin@mss.co.mz</p>
                </div>
             </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header style={{ marginBottom: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            key={location.pathname}
          >
            <h1 style={{ fontSize: '2rem', letterSpacing: '-0.03em', fontWeight: 700 }}>{getTitle()}</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', marginTop: '0.4rem' }}>
              Bem-vindo ao painel de controle executivo.
            </p>
          </motion.div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              {/* Theme Toggle */}
              <button 
                  onClick={toggleTheme}
                  style={{ 
                      background: 'var(--bg-card)', 
                      border: 'var(--glass-border)', 
                      color: 'var(--text-primary)',
                      padding: '0.6rem',
                      borderRadius: '50%',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                  }}
              >
                  {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
              </button>

              <div className="glass-panel" style={{ padding: '0.6rem 1.2rem', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                 <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 12px rgba(16,185,129,0.5)' }}></div>
                 <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>Sistema Online</span>
              </div>
          </div>
        </header>

        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
             <Outlet />
        </motion.div>
      </main>
    </div>
  );
};

export default Layout;
