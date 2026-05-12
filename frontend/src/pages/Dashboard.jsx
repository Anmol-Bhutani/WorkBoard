import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { BarChart3, CheckCircle2, Clock, AlertTriangle, ArrowRight, Star, Zap, TrendingUp, Users, Search, Bell, ChevronRight, LayoutGrid, ListTodo, Plus } from 'lucide-react';

const priorityColors = { URGENT: 'urgent', HIGH: 'high', MEDIUM: 'medium', LOW: 'low' };

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [isSyncing, setIsSyncing] = useState(false);

  const fetchStats = async (showSync = false) => {
    if (showSync) setIsSyncing(true);
    try {
      const data = await api.get('/api/dashboard');
      setData(data);
      setLastUpdated(new Date());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      if (showSync) setTimeout(() => setIsSyncing(false), 600);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(() => fetchStats(true), 10000); // Super-fast sync: 10s
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div className="loader"><div className="spinner"></div></div>;
  if (!data || !data.stats) return <div className="loader"><div className="spinner"></div></div>;

  const { stats, myTasks, recentTasks, overdueTasks } = data;

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05 } }
  };

  const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 100, damping: 20 } }
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="dashboard-content">
      {/* --- PREMIUM TOP BAR --- */}
      <div className="dashboard-top-bar" style={{ 
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
        marginBottom: 40, paddingRight: 20, position: 'relative', zIndex: 100 
      }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <div className="badge-pill" style={{ margin: 0, background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.2)' }}>
            <TrendingUp size={12} fill="#a78bfa" />
            <span style={{ color: '#a78bfa', fontWeight: 700 }}>Productivity is up 12% this week</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: 'rgba(255,255,255,0.3)', fontWeight: 700 }}>
             <motion.div 
               animate={{ scale: isSyncing ? [1, 1.5, 1] : 1, opacity: isSyncing ? [1, 0.5, 1] : 0.5 }}
               transition={{ duration: 0.6, repeat: isSyncing ? Infinity : 0 }}
               style={{ width: 6, height: 6, borderRadius: '50%', background: isSyncing ? 'var(--accent)' : '#10b981' }} 
             />
             {isSyncing ? 'SYNCING...' : `LAST SYNC: ${lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 28, alignItems: 'center' }}>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', textAlign: 'right' }}>
            <div style={{ fontWeight: 700, color: 'white' }}>{user?.name}</div>
            <div>{user?.email}</div>
          </div>
          <motion.div 
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/members')}
            className="user-avatar" 
            style={{ 
              width: 48, height: 48, fontSize: 16, background: 'rgba(255,255,255,0.08)', 
              border: '1px solid rgba(255,255,255,0.1)', color: 'white', fontWeight: 800,
              display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', cursor: 'pointer'
            }}
          >
            {user?.name ? user.name.split(' ').map(n => n[0]).join('') : '?'}
          </motion.div>
        </div>
      </div>

      {/* --- HERO SECTION WITH 3D ILLUSTRATION --- */}
      <div className="dashboard-hero" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 60 }}>
        <div style={{ zIndex: 10 }}>
          <h1 className="hero-heading" style={{ fontSize: 52, marginBottom: 16 }}>
            Welcome back, <span style={{ color: 'var(--accent)' }}>{user?.name?.split(' ')[0]}.</span>
          </h1>
          <p className="hero-desc" style={{ fontSize: 17, maxWidth: 500, opacity: 0.6 }}>{user?.email}</p>
          <p className="hero-desc" style={{ fontSize: 17, maxWidth: 500, marginTop: 8 }}>Here's what's happening across your workspace today.</p>
        </div>
        
        {/* ENHANCED 3D ILLUSTRATION */}
        <div className="illustration-wrapper" style={{ position: 'relative', width: 450, height: 220 }}>
           <div className="glow-arc" style={{ 
             top: -100, right: -50, width: 400, height: 400, opacity: 0.3, 
             background: 'conic-gradient(from 180deg, var(--accent), transparent)',
             pointerEvents: 'none' 
           }}></div>
           
           {/* Floating Shapes */}
           <motion.div animate={{ y: [0, -15, 0] }} transition={{ duration: 4, repeat: Infinity }} style={{ position: 'absolute', top: 20, right: 300, zIndex: 5 }}>
              <div style={{ width: 24, height: 24, background: 'rgba(124,58,237,0.3)', border: '1px solid rgba(124,58,237,0.5)', borderRadius: 6, transform: 'rotate(25deg)' }}></div>
           </motion.div>

           <svg width="400" height="220" viewBox="0 0 400 220" fill="none" style={{ position: 'relative', zIndex: 2 }}>
              <rect x="80" y="40" width="240" height="150" rx="16" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5"/>
              <rect x="95" y="55" width="210" height="120" rx="8" fill="rgba(10, 10, 20, 0.6)" stroke="rgba(255,255,255,0.05)"/>
              <path d="M110 140L140 110L180 130L230 80L260 110L290 70" stroke="var(--accent)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" style={{ filter: 'drop-shadow(0 0 8px var(--accent))' }}/>
              <rect x="330" y="60" width="30" height="30" rx="8" fill="var(--accent)" fillOpacity="0.2" stroke="var(--accent)" strokeOpacity="0.3"/>
              <rect x="50" y="100" width="20" height="20" rx="6" fill="var(--blue)" fillOpacity="0.2" stroke="var(--blue)" strokeOpacity="0.3"/>
           </svg>
        </div>
      </div>

      <div className="bento-grid">
        {/* Focus Card */}
        <motion.div variants={item} className="bento-item bento-item-1" style={{ padding: 0, display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden', background: 'rgba(10, 10, 15, 0.4)', border: '1px solid rgba(255,255,255,0.06)' }}>
           {/* Dynamic Background Glow */}
           <div style={{ position: 'absolute', top: '-50%', left: '-50%', width: '200%', height: '200%', background: 'radial-gradient(circle, rgba(124,58,237,0.1) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
           
           {myTasks && myTasks.length > 0 ? (
             <div style={{ padding: 40, flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 1 }}>
                <div style={{ position: 'absolute', top: 24, right: 24, color: 'var(--accent)' }}><Zap size={20} fill="currentColor" /></div>
                <h3 className="card-header-label">Next Objective</h3>
                <div style={{ marginTop: 40, display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                   <div className="badge badge-urgent" style={{ background: 'rgba(124,58,237,0.1)', color: '#a78bfa', border: '1px solid rgba(124,58,237,0.2)' }}>
                      HIGH PRIORITY
                   </div>
                   <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', fontWeight: 700 }}>
                      DUE {new Date(myTasks[0].dueDate).toLocaleDateString()}
                   </span>
                </div>
                
                <h2 style={{ fontSize: 34, fontWeight: 900, color: 'white', lineHeight: 1.1, marginBottom: 16, letterSpacing: '-0.03em' }}>
                   {myTasks[0].title}
                </h2>
                
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 16, lineHeight: 1.6, marginBottom: 32, display: '-webkit-box', WebkitLineClamp: '2', WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                   {myTasks[0].description || 'No description provided for this priority task.'}
                </p>

                <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                   <button className="btn-submit" onClick={() => navigate('/tasks')} style={{ width: 'auto', padding: '16px 32px', borderRadius: 16, fontSize: 15, boxShadow: '0 10px 20px rgba(124,58,237,0.2)' }}>
                     Start Sprint <ArrowRight size={18} />
                   </button>
                   <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase' }}>Project</div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: 'white' }}>{myTasks[0].project?.name}</div>
                      </div>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                         <LayoutGrid size={18} color="var(--accent)" />
                      </div>
                   </div>
                </div>
             </div>
           ) : (
             <div style={{ padding: 40, flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3 className="card-header-label" style={{ marginBottom: 8 }}>Workspace Command</h3>
                    <h2 style={{ fontSize: 32, fontWeight: 900, color: 'white', letterSpacing: '-0.03em' }}>All systems clear.</h2>
                  </div>
                  <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                    <CheckCircle2 size={24} />
                  </div>
                </div>

                <div style={{ marginTop: 40, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                   <motion.div whileHover={{ scale: 1.02, background: 'rgba(255,255,255,0.04)' }} onClick={() => navigate('/projects')} style={{ padding: 20, background: 'rgba(255,255,255,0.02)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer' }}>
                      <div style={{ color: 'var(--accent)', marginBottom: 12 }}><Plus size={20} /></div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: 'white' }}>New Project</div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>Initialize a new workspace</div>
                   </motion.div>
                   <motion.div whileHover={{ scale: 1.02, background: 'rgba(255,255,255,0.04)' }} onClick={() => navigate('/tasks')} style={{ padding: 20, background: 'rgba(255,255,255,0.02)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer' }}>
                      <div style={{ color: '#10b981', marginBottom: 12 }}><TrendingUp size={20} /></div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: 'white' }}>Daily Standup</div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>Review team velocity</div>
                   </motion.div>
                </div>

                <div style={{ marginTop: 'auto', background: 'linear-gradient(90deg, rgba(124,58,237,0.1), transparent)', padding: '16px 20px', borderRadius: 12, borderLeft: '3px solid var(--accent)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                   <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.6)' }}>
                     "The best way to predict the future is to create it."
                   </div>
                   <Star size={14} color="var(--accent)" fill="var(--accent)" />
                </div>
             </div>
           )}
        </motion.div>

        {/* Total Tasks Card */}
        <motion.div variants={item} 
                    onClick={() => navigate('/tasks')}
                    className="bento-item bento-item-2" style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.2) 0%, transparent 100%)', padding: 40, cursor: 'pointer' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
             <div>
               <div style={{ fontSize: 13, fontWeight: 800, color: '#a78bfa', letterSpacing: 1, marginBottom: 12 }}>ORGANIZATION TOTAL</div>
               <div className="stat-value" style={{ fontSize: 72, letterSpacing: -2 }}>{stats.total}</div>
               <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, marginTop: 12 }}>Active tasks across all projects</div>
             </div>
             <div className="stat-icon-large" style={{ width: 90, height: 90, background: 'rgba(124,58,237,0.1)' }}><Users size={44} /></div>
          </div>
        </motion.div>

        {/* Small Stat: Todo */}
        <motion.div variants={item} 
                    onClick={() => navigate('/tasks')}
                    className="bento-item" style={{ padding: 32, cursor: 'pointer' }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div className="stat-circle" style={{ width: 52, height: 52, background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.6)' }}><ListTodo size={24} /></div>
              <div>
                <div className="stat-value" style={{ fontSize: 32 }}>{stats.todo}</div>
                <div className="stat-label">To Do</div>
              </div>
           </div>
           <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: 13, fontWeight: 700, marginTop: 16 }}>Backlog items</div>
        </motion.div>

        {/* Small Stat: Working */}
        <motion.div variants={item} 
                    onClick={() => navigate('/tasks')}
                    className="bento-item" style={{ padding: 32, cursor: 'pointer' }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div className="stat-circle blue" style={{ width: 52, height: 52 }}><Clock size={24} /></div>
              <div>
                <div className="stat-value" style={{ fontSize: 32 }}>{stats.inProgress}</div>
                <div className="stat-label">In Progress</div>
              </div>
           </div>
           <div style={{ color: 'var(--blue)', fontSize: 13, fontWeight: 700, marginTop: 16 }}>Active focus</div>
        </motion.div>

        {/* Small Stat: In Review */}
        <motion.div variants={item} 
                    onClick={() => navigate('/tasks')}
                    className="bento-item" style={{ padding: 32, cursor: 'pointer' }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div className="stat-circle purple" style={{ width: 52, height: 52, background: 'rgba(167,139,250,0.1)', color: '#a78bfa' }}><AlertTriangle size={24} /></div>
              <div>
                <div className="stat-value" style={{ fontSize: 32 }}>{stats.inReview}</div>
                <div className="stat-label">In Review</div>
              </div>
           </div>
           <div style={{ color: '#a78bfa', fontSize: 13, fontWeight: 700, marginTop: 16 }}>Needs approval</div>
        </motion.div>

        {/* Small Stat: Done */}
        <motion.div variants={item} 
                    onClick={() => navigate('/tasks')}
                    className="bento-item" style={{ padding: 32, cursor: 'pointer' }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div className="stat-circle green" style={{ width: 52, height: 52 }}><CheckCircle2 size={24} /></div>
              <div>
                <div className="stat-value" style={{ fontSize: 32 }}>{stats.done}</div>
                <div className="stat-label">Completed</div>
              </div>
           </div>
           <div style={{ color: 'var(--green)', fontSize: 13, fontWeight: 700, marginTop: 16 }}>Success metrics</div>
        </motion.div>

        {/* Small Stat: Overdue */}
        <motion.div variants={item} 
                    onClick={() => navigate('/tasks')}
                    className="bento-item" style={{ padding: 32, cursor: 'pointer', background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.1)' }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div className="stat-circle urgent" style={{ width: 52, height: 52, background: 'rgba(239,68,68,0.1)', color: '#f87171' }}><AlertTriangle size={24} /></div>
              <div>
                <div className="stat-value" style={{ fontSize: 32, color: '#f87171' }}>{stats.overdue}</div>
                <div className="stat-label">Overdue</div>
              </div>
           </div>
           <div style={{ color: '#f87171', fontSize: 13, fontWeight: 700, marginTop: 16 }}>Urgent attention</div>
        </motion.div>

        {/* Critical Items */}
        <motion.div variants={item} className="bento-item" style={{ padding: 32, display: 'flex', flexDirection: 'column' }}>
           <h3 style={{ fontSize: 18, fontWeight: 800, color: 'white', marginBottom: 24 }}>
              Critical Items
           </h3>
           <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {overdueTasks?.map(task => (
                <div key={task.id} 
                     onClick={() => navigate(`/tasks`)}
                     className="critical-task-item" style={{ padding: 18, background: 'rgba(239,68,68,0.03)', cursor: 'pointer' }}>
                   <div>
                     <div style={{ fontWeight: 700, color: 'white', fontSize: 14 }}>{task.title}</div>
                     <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>Due {new Date(task.dueDate).toLocaleDateString()}</div>
                   </div>
                   <div className="badge badge-urgent" style={{ fontSize: 9 }}>URGENT</div>
                </div>
              ))}
           </div>
           <button onClick={() => navigate('/tasks')} className="view-all-link" style={{ marginTop: 'auto', paddingTop: 24, background: 'none', border: 'none', cursor: 'pointer' }}>View all <ChevronRight size={16} /></button>
        </motion.div>

        {/* Wide Activity Section */}
        <motion.div variants={item} className="bento-item" style={{ gridColumn: 'span 4', padding: 40 }}>
           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
              <h3 style={{ fontSize: 20, fontWeight: 800, color: 'white', margin: 0 }}>Team Activity</h3>
              <button onClick={() => navigate('/tasks')} className="view-all-link" style={{ margin: 0, color: 'rgba(255,255,255,0.4)', background: 'none', border: 'none', cursor: 'pointer' }}>View History <ChevronRight size={16} /></button>
           </div>
           
           <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24 }}>
              {recentTasks?.slice(0, 4).map(task => (
                <div key={task.id} 
                     onClick={() => navigate(`/projects/${task.projectId}`)}
                     className="activity-card-detailed" style={{ padding: 28, cursor: 'pointer' }}>
                   <div className="activity-card-header">
                      <div>
                        <div className="proj-tag" style={{ color: 'var(--accent)', fontWeight: 800 }}>{task.project?.name || 'MOBILE APP'}</div>
                        <div className="task-name-large" style={{ fontSize: 17, marginTop: 4 }}>{task.title}</div>
                      </div>
                      <div className={`badge badge-${priorityColors[task.priority]}`} style={{ fontSize: 9 }}>{task.priority}</div>
                   </div>
                   
                   <div className="progress-container" style={{ margin: '24px 0' }}>
                      <div className="progress-bar" style={{ height: 8 }}>
                         <motion.div 
                           initial={{ width: 0 }}
                           animate={{ width: `${task.project?.progress || 0}%` }}
                           style={{ height: '100%', background: task.project?.color || 'var(--accent)', borderRadius: 10, boxShadow: `0 0 12px ${task.project?.color || 'var(--accent)'}` }} 
                         />
                      </div>
                      <span className="progress-val" style={{ fontSize: 12, fontWeight: 800 }}>{task.project?.progress || 0}%</span>
                   </div>

                   <div className="activity-card-footer">
                      <span className="update-time" style={{ fontSize: 12 }}>Updated 2h ago</span>
                   </div>
                </div>
              ))}
           </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
