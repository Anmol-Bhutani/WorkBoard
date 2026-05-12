import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Search, Filter, Plus, ChevronRight, Layers, Target, CheckCircle2, Calendar, X } from 'lucide-react';

export default function Projects() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState({ projects: [], summary: { activeInitiatives: 0, averageProgress: 0, tasksInProgress: 0, dueThisWeek: 0 } });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('All Projects');
  const [sortBy, setSortBy] = useState('recent');
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', description: '' });

  const fetchProjects = () => {
    api.get('/api/projects').then(setData).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  if (loading) return <div className="loader"><div className="spinner"></div></div>;
  
  const { projects, summary } = data;
  let displayProjects = Array.isArray(projects) ? [...projects] : [];
  
  // -- 100% ACCURATE SEARCH & FILTER LOGIC --
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    displayProjects = displayProjects.filter(p => 
      p.name.toLowerCase().includes(q) || 
      (p.description && p.description.toLowerCase().includes(q))
    );
  }

  if (activeTab !== 'All Projects') {
    const statusMap = {
      'Active': 'ACTIVE',
      'On Hold': 'ON_HOLD',
      'Completed': 'COMPLETED',
      'Archived': 'ARCHIVED'
    };
    displayProjects = displayProjects.filter(p => {
      if (activeTab === 'Completed') return p.status === 'COMPLETED' || p.progress === 100;
      if (activeTab === 'Active') return p.status === 'ACTIVE' && p.progress < 100;
      return p.status === statusMap[activeTab];
    });
  }

  // Sorting
  if (sortBy === 'name') displayProjects.sort((a, b) => a.name.localeCompare(b.name));
  else displayProjects.sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!newProject.name) return toast.error('Please enter a project name');
    try {
      await api.post('/api/projects', newProject);
      fetchProjects();
      setShowModal(false);
      setNewProject({ name: '', description: '' });
      toast.success('Project created successfully!');
    } catch (err) {
      toast.error('Failed to create project');
    }
  };

  const handleToggleFilter = () => {
    const newSort = sortBy === 'recent' ? 'name' : 'recent';
    setSortBy(newSort);
    toast.success(`Sorted by ${newSort === 'name' ? 'Project Name' : 'Recent Updates'}`);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="dashboard-content" style={{ paddingBottom: 60 }}>
      {/* --- HEADER --- */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 40 }}>
        <div>
          <h1 className="hero-heading" style={{ fontSize: 42, marginBottom: 8 }}>Workspace Projects</h1>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 16 }}>Track and manage all your workspace initiatives in one place.</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <div className="search-box-premium" style={{ position: 'relative' }}>
             <Search size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', opacity: 0.3 }} />
             <input 
               type="text" 
               placeholder="Search projects..." 
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               style={{ padding: '12px 16px 12px 48px', width: 280 }} 
             />
          </div>
          <button onClick={handleToggleFilter} className="btn-secondary" style={{ padding: '12px 20px', display: 'flex', gap: 10, alignItems: 'center' }}>
            <Filter size={18} /> {sortBy === 'name' ? 'Sorted: Name' : 'Filter'}
          </button>
          <button onClick={() => setShowModal(true)} className="btn-submit" style={{ width: 'auto', padding: '12px 24px', borderRadius: 12, display: 'flex', gap: 10, alignItems: 'center' }}>
            <Plus size={20} /> New Project
          </button>
        </div>
      </div>

      {/* --- STATS BAR --- */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, marginBottom: 48 }}>
        {[
          { label: 'Active Initiatives', val: summary.activeInitiatives, icon: Layers, color: 'var(--accent)' },
          { label: 'Average Progress', val: `${summary.averageProgress}%`, icon: Target, color: 'var(--blue)' },
          { label: 'Tasks in Progress', val: summary.tasksInProgress, icon: CheckCircle2, color: 'var(--green)' },
          { label: 'Due This Week', val: summary.dueThisWeek, icon: Calendar, color: 'var(--orange)' }
        ].map((stat, i) => (
          <div key={i} className="bento-item" style={{ padding: '24px 32px', display: 'flex', alignItems: 'center', gap: 20 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: `${stat.color}15`, border: `1px solid ${stat.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: stat.color }}><stat.icon size={22} /></div>
            <div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span style={{ fontSize: 32, fontWeight: 900, color: 'white' }}>{stat.val}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'white', opacity: 0.8 }}>{stat.label}</span>
              </div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>Across all projects</div>
            </div>
          </div>
        ))}
      </div>

      {/* --- TABS --- */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 32 }}>
        {['All Projects', 'Active', 'On Hold', 'Completed', 'Archived'].map(tab => (
          <button 
            key={tab} 
            onClick={() => setActiveTab(tab)} 
            style={{ 
              padding: '10px 24px', borderRadius: 10, fontSize: 13, fontWeight: 700,
              background: activeTab === tab ? 'var(--accent)' : 'rgba(255,255,255,0.03)',
              color: activeTab === tab ? 'white' : 'rgba(255,255,255,0.4)',
              border: 'none', cursor: 'pointer', transition: 'all 0.2s'
            }}
          >{tab}</button>
        ))}
      </div>

      {/* --- PROJECT LIST --- */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <AnimatePresence>
          {displayProjects.map(project => (
            <motion.div 
              key={project.id} 
              layout 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.2 } }}
              transition={{ type: 'spring', stiffness: 500, damping: 35, mass: 1 }}
              whileHover={{ scale: 1.005, background: 'rgba(255,255,255,0.03)' }} 
              onClick={() => navigate(`/projects/${project.id}`)} 
              className="bento-item" 
              style={{ padding: '24px 32px', display: 'flex', alignItems: 'center', gap: 32, cursor: 'pointer', borderLeft: `4px solid ${project.color || 'var(--accent)'}` }}
            >
              <div style={{ width: 80, height: 80, borderRadius: 16, background: `${project.color || 'var(--accent)'}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, fontWeight: 900, color: 'white', border: `1px solid ${project.color || 'var(--accent)'}30` }}>{project.name[0]}</div>
              <div style={{ flex: 1 }}>
                 <div style={{ fontSize: 11, fontWeight: 800, color: project.color || 'var(--accent)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>{project.name}</div>
                 <h3 style={{ fontSize: 22, fontWeight: 800, color: 'white', margin: 0 }}>{project.name}</h3>
                 <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', marginTop: 8, maxWidth: 500 }}>{project.description || 'No description provided for this project.'}</p>
              </div>
              <div style={{ width: 300 }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}><span style={{ fontSize: 13, fontWeight: 800, color: 'white' }}>Progress</span><span style={{ fontSize: 13, fontWeight: 800, color: 'white' }}>{project.progress}%</span></div>
                 <div className="progress-bar" style={{ height: 8, background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                    {project.progress > 0 && (
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${project.progress}%` }}
                        style={{ height: '100%', background: project.color || 'var(--accent)', borderRadius: 10, boxShadow: `0 0 15px ${project.color || 'var(--accent)'}` }}
                      />
                    )}
                 </div>
                 <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16, fontSize: 12, fontWeight: 600 }}><span style={{ color: 'rgba(255,255,255,0.4)' }}>{project._count?.tasks || 0} tasks • {project.progress}% complete</span><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><div style={{ width: 6, height: 6, borderRadius: '50%', background: project.status === 'ACTIVE' ? 'var(--green)' : '#94a3b8' }}></div><span style={{ color: 'rgba(255,255,255,0.4)' }}>{project.status}</span></div></div>
              </div>
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.3)' }}><ChevronRight size={20} /></div>
            </motion.div>
          ))}
        </AnimatePresence>
        {displayProjects.length === 0 && (
          <div style={{ textAlign: 'center', padding: '100px 0', color: 'rgba(255,255,255,0.2)' }}>
             <Layers size={48} style={{ marginBottom: 16, opacity: 0.5 }} />
             <p style={{ fontSize: 18, fontWeight: 600 }}>No projects matching "{searchQuery}" found.</p>
          </div>
        )}
      </div>

      {/* --- NEW PROJECT MODAL --- */}
      <AnimatePresence>
        {showModal && (
          <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bento-item" style={{ width: '100%', maxWidth: 500, padding: 40, position: 'relative', background: '#0a0a14' }}>
              <button onClick={() => setShowModal(false)} style={{ position: 'absolute', top: 24, right: 24, background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer' }}><X size={24} /></button>
              <h2 style={{ fontSize: 28, fontWeight: 800, color: 'white', marginBottom: 8 }}>Create Project</h2>
              <p style={{ color: 'rgba(255,255,255,0.4)', marginBottom: 32 }}>Enter the details for your new workspace project.</p>
              
              <form onSubmit={handleCreateProject}>
                <div style={{ marginBottom: 24 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'white', marginBottom: 10 }}>Project Name</label>
                  <input type="text" value={newProject.name} onChange={e => setNewProject({...newProject, name: e.target.value})} placeholder="e.g. Mobile App Redesign" className="auth-input" style={{ width: '100%', background: 'rgba(255,255,255,0.03)', padding: '14px 18px' }} required />
                </div>
                <div style={{ marginBottom: 32 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'white', marginBottom: 10 }}>Description</label>
                  <textarea value={newProject.description} onChange={e => setNewProject({...newProject, description: e.target.value})} placeholder="Briefly describe the project goals..." className="auth-input" style={{ width: '100%', background: 'rgba(255,255,255,0.03)', height: 120, padding: '16px 18px', resize: 'none' }} />
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                  <button type="button" onClick={() => setShowModal(false)} className="btn-secondary" style={{ flex: 1, padding: 14 }}>Cancel</button>
                  <button type="submit" className="btn-submit" style={{ flex: 1, padding: 14, width: 'auto' }}>Create Project</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
