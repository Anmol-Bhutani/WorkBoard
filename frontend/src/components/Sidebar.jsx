import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { motion } from 'framer-motion';
import { LayoutDashboard, FolderKanban, ListTodo, Users, LogOut, ChevronRight, Sparkles, ChevronDown } from 'lucide-react';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/projects', label: 'Projects', icon: FolderKanban },
  { path: '/tasks', label: 'Tasks', icon: ListTodo },
  { path: '/members', label: 'Team', icon: Users },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [workspaceName, setWorkspaceName] = useState('WorkBoard');

  useEffect(() => {
    const fetchWorkspace = async () => {
      try {
        const data = await api.get('/api/workspace');
        if (data.name) setWorkspaceName(data.name);
      } catch (err) {
        console.error('Failed to fetch workspace name', err);
      }
    };
    fetchWorkspace();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  const initials = user?.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '??';

  return (
    <motion.aside 
      className="sidebar"
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 100, damping: 20 }}
    >
      <div className="sidebar-header" style={{ padding: '40px 24px 32px' }}>
        <div className="auth-brand" onClick={() => navigate('/')} style={{ marginBottom: 0, gap: 14, cursor: 'pointer' }}>
          <div className="brand-icon" style={{ width: 36, height: 36, background: 'var(--accent)', borderRadius: 10 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="4" y="4" width="7" height="7" rx="1.5" fill="white"/>
              <rect x="4" y="13" width="7" height="7" rx="1.5" fill="white" fillOpacity="0.5"/>
              <rect x="13" y="4" width="7" height="7" rx="1.5" fill="white" fillOpacity="0.5"/>
              <rect x="13" y="13" width="7" height="7" rx="1.5" fill="white"/>
            </svg>
          </div>
          <span className="brand-name" style={{ fontSize: 20, fontWeight: 800 }}>{workspaceName}</span>
        </div>
      </div>
      
      <nav className="sidebar-nav" style={{ flex: 1, padding: '0 12px' }}>
        {navItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <motion.button 
              key={item.path} 
              className={`nav-item ${isActive ? 'active' : ''}`} 
              onClick={() => navigate(item.path)}
              style={{ 
                margin: '4px 0', 
                padding: '14px 20px', 
                background: isActive ? 'var(--accent)' : 'transparent',
                color: isActive ? 'white' : 'rgba(255,255,255,0.4)',
                boxShadow: isActive ? '0 10px 20px rgba(124, 58, 237, 0.3)' : 'none'
              }}
              whileHover={{ background: isActive ? 'var(--accent)' : 'rgba(255,255,255,0.03)' }}
            >
              <Icon size={20} color={isActive ? 'white' : 'currentColor'} />
              <span style={{ flex: 1, fontWeight: isActive ? 700 : 600 }}>{item.label}</span>
              {isActive && <ChevronRight size={16} />}
            </motion.button>
          );
        })}
      </nav>

      <div className="sidebar-footer" style={{ padding: '0 20px 24px' }}>
        {/* User Card */}
        <div className="user-profile-card" style={{ 
          padding: '20px 0', borderTop: '1px solid rgba(255,255,255,0.05)', 
          marginBottom: 28, display: 'flex', alignItems: 'center', gap: 14 
        }}>
          <div className="user-avatar" style={{ 
            width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: 'white' 
          }}>{initials}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: 'white' }}>{user?.name}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontWeight: 700, textTransform: 'uppercase', marginTop: 2 }}>{user?.role}</div>
          </div>
          <button onClick={handleLogout} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
            <LogOut size={16} color="rgba(255,255,255,0.3)" />
          </button>
        </div>

        {/* Workspace Tip Card */}
        <div className="workspace-tip-card" style={{ padding: 24, borderRadius: 20 }}>
          <h4 style={{ fontSize: 15, fontWeight: 800, marginBottom: 10 }}>Workspace tip</h4>
          <p style={{ fontSize: 12, lineHeight: 1.6, opacity: 0.6 }}>Use projects and tasks to track progress and achieve your goals faster.</p>
        </div>
      </div>
    </motion.aside>
  );
}
