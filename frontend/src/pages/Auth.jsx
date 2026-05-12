import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { ShieldCheck, Zap, BarChart3, ChevronRight, Mail, Lock, Star, Github, Eye, EyeOff } from 'lucide-react';

export default function AuthPage() {
  const { user, login, register } = useAuth();
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'MEMBER' });

  if (user) return <Navigate to="/" />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        await login(form.email, form.password);
        toast.success('Welcome back!');
      } else {
        await register(form.name, form.email, form.password, form.role);
        toast.success('Workspace created!');
      }
      navigate('/');
    } catch (err) {
      // Handle express-validator style errors
      if (err.message === 'Something went wrong' || !err.message) {
         toast.error('Registration failed. Please check your details.');
      } else {
         toast.error(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const update = (key, val) => setForm(f => ({ ...f, [key]: val }));

  return (
    <div className="auth-wrapper">
      <div className="auth-main-card">
        {/* LEFT PANEL */}
        <div className="auth-left">
          <div className="glow-arc"></div>
          <div className="auth-left-content">
            <div className="auth-brand">
              <div className="brand-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="4" y="4" width="7" height="7" rx="1.5" fill="white"/>
                  <rect x="4" y="13" width="7" height="7" rx="1.5" fill="white" fillOpacity="0.5"/>
                  <rect x="13" y="4" width="7" height="7" rx="1.5" fill="white" fillOpacity="0.5"/>
                  <rect x="13" y="13" width="7" height="7" rx="1.5" fill="white"/>
                </svg>
              </div>
              <span className="brand-name">WorkBoard</span>
            </div>

            <h1 className="hero-heading">Manage projects with clarity.</h1>
            <p className="hero-desc">Experience the next generation of team collaboration with a beautiful, high-performance workspace.</p>

            <div className="feature-cards">
              <div className="feature-box">
                <div className="feature-icon-wrapper" style={{ background: 'rgba(124, 58, 237, 0.1)' }}>
                  <Zap size={20} color="#7c3aed" />
                </div>
                <div className="feature-text">
                  <h4>Real-time synchronization</h4>
                  <p>Stay aligned, instantly.</p>
                </div>
              </div>

              <div className="feature-box">
                <div className="feature-icon-wrapper" style={{ background: 'rgba(59, 130, 246, 0.1)' }}>
                  <BarChart3 size={20} color="#3b82f6" />
                </div>
                <div className="feature-text">
                  <h4>Advanced productivity analytics</h4>
                  <p>Track progress. Drive results.</p>
                </div>
              </div>

              <div className="feature-box">
                <div className="feature-icon-wrapper" style={{ background: 'rgba(16, 185, 129, 0.1)' }}>
                  <ShieldCheck size={20} color="#10b981" />
                </div>
                <div className="feature-text">
                  <h4>Secure role-based access</h4>
                  <p>Your data. Your control.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="auth-right">
          <div className="badge-pill">
            <Star size={12} fill="#a78bfa" />
            <span>Built for focused, high-performing teams</span>
          </div>

          <div className="auth-header">
            <h2>Welcome back</h2>
            <p>Sign in to your workspace</p>
          </div>

          <div className="tab-switcher">
            <button className={`tab-btn ${isLogin ? 'active' : ''}`} onClick={() => setIsLogin(true)}>Sign In</button>
            <button className={`tab-btn ${!isLogin ? 'active' : ''}`} onClick={() => setIsLogin(false)}>Sign Up</button>
          </div>

          <form onSubmit={handleSubmit}>
            {!isLogin && (
              <>
                <div className="input-container">
                  <Mail className="input-icon" size={18} />
                  <input className="auth-input" type="text" placeholder="Full Name" value={form.name} onChange={e => update('name', e.target.value)} required />
                </div>
                
                <div style={{ marginBottom: 24 }}>
                  <label className="form-label" style={{ display: 'block', marginBottom: 12, fontSize: 13, fontWeight: 600 }}>Select Your Role</label>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <button 
                      type="button"
                      onClick={() => update('role', 'ADMIN')}
                      style={{ 
                        flex: 1, padding: '12px', borderRadius: 10, border: '1px solid', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
                        background: form.role === 'ADMIN' ? 'rgba(124, 58, 237, 0.1)' : 'transparent',
                        borderColor: form.role === 'ADMIN' ? '#7c3aed' : 'rgba(255,255,255,0.1)',
                        color: form.role === 'ADMIN' ? '#7c3aed' : 'rgba(255,255,255,0.4)'
                      }}
                    >
                      Workspace Admin
                    </button>
                    <button 
                      type="button"
                      onClick={() => update('role', 'MEMBER')}
                      style={{ 
                        flex: 1, padding: '12px', borderRadius: 10, border: '1px solid', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
                        background: form.role === 'MEMBER' ? 'rgba(124, 58, 237, 0.1)' : 'transparent',
                        borderColor: form.role === 'MEMBER' ? '#7c3aed' : 'rgba(255,255,255,0.1)',
                        color: form.role === 'MEMBER' ? '#7c3aed' : 'rgba(255,255,255,0.4)'
                      }}
                    >
                      Team Member
                    </button>
                  </div>
                </div>
              </>
            )}
            
            <div className="input-container">
              <label className="form-label" style={{ display: 'block', marginBottom: 8, fontSize: 13, fontWeight: 600 }}>Email</label>
              <Mail className="input-icon" size={18} style={{ top: '70%' }} />
              <input className="auth-input" type="email" placeholder="you@workboard.com" value={form.email} onChange={e => update('email', e.target.value)} required />
            </div>
            
            <div className="input-container">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <label className="form-label" style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>Password</label>
                <a href="#" className="forgot-link" style={{ position: 'static', fontSize: 12 }}>Forgot password?</a>
              </div>
              <Lock className="input-icon" size={18} style={{ top: '70%' }} />
              <input className="auth-input" type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={form.password} onChange={e => update('password', e.target.value)} style={{ paddingRight: 48 }} required />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)} 
                style={{ position: 'absolute', right: 16, top: '70%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <div className="remember-me">
              <input type="checkbox" id="remember" style={{ accentColor: '#7c3aed' }} />
              <label htmlFor="remember">Remember me</label>
            </div>

            <button className="btn-submit" type="submit" disabled={loading}>
              {loading ? 'Processing...' : 'Enter Workspace'} <ChevronRight size={18} />
            </button>
          </form>

          <div className="trust-section" style={{ marginTop: 40, borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 24 }}>
            <p style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.3)', marginBottom: 16, fontWeight: 700 }}>Built for industry standards</p>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: 0.4, filter: 'grayscale(1) brightness(2)' }}>
              <Zap size={20} />
              <ShieldCheck size={20} />
              <BarChart3 size={20} />
              <Star size={20} />
              <div style={{ fontSize: 14, fontWeight: 900, letterSpacing: -0.5 }}>ETHARA.AI</div>
            </div>
          </div>

          <div className="auth-footer" style={{ marginTop: 40 }}>
            Professional workspace for Ethara.AI
          </div>
        </div>
      </div>
    </div>
  );
}
