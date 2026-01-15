import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, User, Eye, EyeOff, Sun, Moon, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { api } from '../data/api';
import { useTheme } from '../context/ThemeContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  // Load remembered email
  useEffect(() => {
    const savedEmail = localStorage.getItem('rememberedEmail');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const data = await api.post('/login', { email, password });

      // Handle Remember Me
      if (rememberMe) {
        localStorage.setItem('rememberedEmail', email);
      } else {
        localStorage.removeItem('rememberedEmail');
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      setSuccess(true);
      // Brief delay to show success feedback
      setTimeout(() => {
        navigate('/');
      }, 1500);
    } catch (err) {
      console.error(err);
      setError('Credenciais inválidas. Verifique seu e-mail e senha.');
    } finally {
      if (!success) setLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      position: 'relative'
    }}>
      {/* Theme Toggle Button at the top right */}
      <button 
          onClick={toggleTheme}
          style={{ 
              position: 'absolute',
              top: '2rem',
              right: '2rem',
              background: 'var(--bg-card)', 
              border: 'var(--glass-border)', 
              color: 'var(--text-primary)',
              padding: '0.6rem',
              borderRadius: '50%',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backdropFilter: 'blur(10px)',
              zIndex: 10
          }}
      >
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
      </button>

      <motion.div 
        className="glass-panel"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{ padding: '3rem', width: '100%', maxWidth: '400px' }}
      >
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{ 
              background: 'rgba(255,255,255,0.1)', 
              padding: '1rem', 
              borderRadius: '16px', 
              display: 'inline-block',
              marginBottom: '1.5rem',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.1)'
          }}>
             <img src="/logo_mss.png" alt="MSS Logo" style={{ height: '50px', objectFit: 'contain' }} />
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.5rem' }}>Bem-vindo de volta</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Faça login para gerir suas finanças</p>
        </div>

        <AnimatePresence mode="wait">
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              style={{ 
                background: 'rgba(239, 68, 68, 0.1)', 
                color: '#ef4444', 
                padding: '0.75rem', 
                borderRadius: '8px', 
                marginBottom: '1rem',
                textAlign: 'center',
                fontSize: '0.9rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
            >
              <AlertCircle size={16} />
              {error}
            </motion.div>
          )}

          {success && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ 
                background: 'rgba(16, 185, 129, 0.1)', 
                color: '#10b981', 
                padding: '0.75rem', 
                borderRadius: '8px', 
                marginBottom: '1rem',
                textAlign: 'center',
                fontSize: '0.9rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
            >
              <CheckCircle2 size={16} />
              Login realizado com sucesso!
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Email</label>
            <div style={{ position: 'relative' }}>
              <User size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-secondary)' }} />
              <input 
                type="email" 
                name="email"
                autoComplete="email"
                className="input-field"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{ paddingLeft: '2.5rem' }}
                placeholder="ex: admin@msservices.co.mz"
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Senha</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-secondary)', zIndex: 1 }} />
              <input 
                type={showPassword ? "text" : "password"}
                name="password"
                autoComplete="current-password"
                className="input-field"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{ paddingLeft: '2.5rem', paddingRight: '2.5rem' }}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '12px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  padding: 0
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input 
              type="checkbox" 
              id="rememberMe" 
              checked={rememberMe} 
              onChange={(e) => setRememberMe(e.target.checked)}
              style={{ cursor: 'pointer' }}
            />
            <label htmlFor="rememberMe" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
              Lembrar-me
            </label>
          </div>

          <button 
            type="submit" 
            className="btn-primary" 
            disabled={loading || success}
            style={{ 
              marginTop: '1rem', 
              padding: '0.75rem', 
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              background: success ? '#10b981' : undefined
            }}
          >
            {loading && !success ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Entrando...
              </>
            ) : success ? (
              <>
                <CheckCircle2 size={18} />
                Bem-vindo!
              </>
            ) : (
              'Entrar'
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default Login;
