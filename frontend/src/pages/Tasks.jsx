import { useState, useEffect } from 'react';
import api from '../utils/api';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Filter, Calendar, Trash2, CheckCircle2, ListFilter, Plus, 
  ChevronDown, X, Clock, Eye, AlertCircle, ClipboardList, Check, Settings, Inbox,
  FilterX, ChevronRight, MoreHorizontal, MoreVertical, LayoutGrid, Type, AlignLeft
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export default function Tasks() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, todo: 0, inProgress: 0, done: 0, overdue: 0 });
  
  // UI States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(true);
  
  // Filters
  const [members, setMembers] = useState([]);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    projectId: '',
    assigneeId: '',
    priority: 'MEDIUM',
    dueDate: ''
  });

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [projectFilter, setProjectFilter] = useState('');
  const [assigneeFilter, setAssigneeFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  // Initial load for projects and stats
  useEffect(() => {
    const init = async () => {
      try {
        const [dash, projs, mems] = await Promise.all([
          api.get('/api/dashboard'),
          api.get('/api/projects'),
          api.get('/api/members')
        ]);
        if (dash?.stats) setStats(dash.stats);
        if (projs?.projects) {
          setProjects(projs.projects);
          if (projs.projects.length > 0) {
            setNewTask(prev => ({ ...prev, projectId: projs.projects[0].id }));
          }
        }
        if (mems) setMembers(mems);
      } catch (err) { console.error('Init Error:', err); }
    };
    init();
  }, []);

  // Filter load
  const loadTasks = async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);
      if (priorityFilter) params.append('priority', priorityFilter);
      if (projectFilter) params.append('projectId', projectFilter);
      if (assigneeFilter) params.append('assigneeId', assigneeFilter);
      if (dateFilter) params.append('dueDate', dateFilter);
      params.append('sortBy', 'createdAt');
      params.append('order', 'desc');

      const data = await api.get(`/api/tasks?${params.toString()}`);
      setTasks(data.tasks || []);
    } catch (err) {
      console.error('Filter Error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const d = setTimeout(loadTasks, 300);
    return () => clearTimeout(d);
  }, [search, statusFilter, priorityFilter, projectFilter, dateFilter]);

  const handleAddTask = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/tasks', newTask);
      toast.success('Task created successfully!');
      setIsModalOpen(false);
      setNewTask({ title: '', description: '', projectId: projects[0]?.id || '', priority: 'MEDIUM', dueDate: '' });
      loadTasks();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create task');
    }
  };

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('');
    setPriorityFilter('');
    setProjectFilter('');
    setDateFilter('');
    toast.success('Filters cleared');
  };

  if (loading && tasks.length === 0) return <div className="loader"><div className="spinner"></div></div>;

  const statCards = [
    { label: 'Total Tasks', count: stats.total, icon: ClipboardList, color: '#a78bfa', desc: 'Across all teams' },
    { label: 'To Do', count: stats.todo, icon: Clock, color: '#fbbf24', desc: 'Not started' },
    { label: 'In Progress', count: stats.inProgress, icon: Eye, color: '#3b82f6', desc: 'Currently active' },
    { label: 'In Review', count: stats.inReview || 0, icon: Eye, color: '#c084fc', desc: 'Needs approval' },
    { label: 'Completed', count: stats.done, icon: CheckCircle2, color: '#10b981', desc: 'Finished tasks' },
    { label: 'Overdue', count: stats.overdue, icon: AlertCircle, color: '#ef4444', desc: 'Past due date' }
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="dashboard-content" style={{ paddingBottom: 60 }}>
      {/* --- TOP HEADER --- */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h1 className="hero-heading" style={{ fontSize: 32, margin: 0 }}>Global Backlog</h1>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className="btn-secondary" 
            style={{ padding: '10px 20px', display: 'flex', gap: 8, alignItems: 'center', borderRadius: 12, border: showFilters ? '1px solid var(--accent)' : '1px solid rgba(255,255,255,0.05)' }}
          >
            <Filter size={18} style={{ color: showFilters ? 'var(--accent)' : 'inherit' }} /> Filters
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="btn-submit" 
            style={{ padding: '10px 24px', display: 'flex', gap: 8, alignItems: 'center', width: 'auto', borderRadius: 12 }}
          >
            <Plus size={20} /> Add Task
          </button>
        </div>
      </div>
      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 16, marginBottom: 40 }}>Track and prioritize tasks across all your teams</p>

      {/* --- STATS BAR --- */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 16, marginBottom: 40 }}>
        {statCards.map((card, i) => (
          <motion.div 
            key={i}
            whileHover={{ y: -5 }}
            className="bento-item" 
            style={{ padding: '24px 20px', position: 'relative', overflow: 'hidden' }}
          >
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: `linear-gradient(135deg, ${card.color}08 0%, transparent 100%)`, pointerEvents: 'none' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: `${card.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: card.color }}>
                <card.icon size={22} />
              </div>
              <div>
                <div style={{ fontSize: 28, fontWeight: 900, color: 'white', lineHeight: 1 }}>{card.count}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'white', marginTop: 4 }}>{card.label}</div>
              </div>
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontWeight: 600, marginTop: 16 }}>{card.desc}</div>
          </motion.div>
        ))}
      </div>

      {/* --- FILTER CONTROL BAR --- */}
      <AnimatePresence>
        {showFilters && (
          <motion.div 
            initial={{ height: 0, opacity: 0, marginBottom: 0 }}
            animate={{ height: 'auto', opacity: 1, marginBottom: 20 }}
            exit={{ height: 0, opacity: 0, marginBottom: 0 }}
            style={{ overflow: 'hidden' }}
          >
            <div className="bento-item" style={{ padding: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: 12, flex: 1 }}>
                  <div style={{ position: 'relative', width: 220 }}>
                    <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', opacity: 0.3 }} />
                    <input 
                      className="search-input" 
                      placeholder="Search tasks..." 
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', paddingLeft: 40, borderRadius: 10, width: '100%', height: 44, fontSize: 13, color: 'white' }} 
                    />
                  </div>
                  
                  <select 
                    className="filter-select-premium" 
                    value={statusFilter} 
                    onChange={e => setStatusFilter(e.target.value)}
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', color: 'white', padding: '0 16px', borderRadius: 10, width: 140, height: 44, fontSize: 13, fontWeight: 600, appearance: 'none' }}
                  >
                    <option value="">All Status</option>
                    <option value="TODO">To Do</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="IN_REVIEW">In Review</option>
                    <option value="DONE">Completed</option>
                    <option value="OVERDUE">Overdue</option>
                  </select>

                  <select 
                    className="filter-select-premium" 
                    value={priorityFilter} 
                    onChange={e => setPriorityFilter(e.target.value)}
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', color: 'white', padding: '0 16px', borderRadius: 10, width: 140, height: 44, fontSize: 13, fontWeight: 600, appearance: 'none' }}
                  >
                    <option value="">All Priorities</option>
                    <option value="HIGH">High</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="LOW">Low</option>
                  </select>

                  <select 
                    className="filter-select-premium" 
                    value={projectFilter} 
                    onChange={e => setProjectFilter(e.target.value)}
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', color: 'white', padding: '0 16px', borderRadius: 10, width: 140, height: 44, fontSize: 13, fontWeight: 600, appearance: 'none' }}
                  >
                    <option value="">All Projects</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>

                  <select 
                    className="filter-select-premium" 
                    value={assigneeFilter} 
                    onChange={e => setAssigneeFilter(e.target.value)}
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', color: 'white', padding: '0 16px', borderRadius: 10, width: 220, height: 44, fontSize: 13, fontWeight: 600, appearance: 'none' }}
                  >
                    <option value="">All Team</option>
                    {Array.isArray(members) && members.map(m => <option key={m.id} value={m.id}>{m.name} ({m.email})</option>)}
                  </select>

                  <div style={{ position: 'relative' }}>
                    <Calendar size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', opacity: 0.3, pointerEvents: 'none' }} />
                    <input 
                      type="date"
                      value={dateFilter}
                      onChange={e => setDateFilter(e.target.value)}
                      className="search-input date-input-premium"
                      style={{ 
                        background: 'rgba(255,255,255,0.03)', 
                        border: '1px solid rgba(255,255,255,0.05)', 
                        paddingLeft: 40, 
                        borderRadius: 10, 
                        width: 160, 
                        height: 44, 
                        fontSize: 13,
                        color: 'white',
                        colorScheme: 'dark'
                      }} 
                    />
                  </div>
                </div>
                
                <button 
                  onClick={clearFilters}
                  style={{ color: 'var(--accent)', background: 'none', border: 'none', fontWeight: 700, fontSize: 14, cursor: 'pointer', padding: '0 10px' }}
                >
                  Clear
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- TABLE AREA --- */}
      <div className="bento-item" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '40px 2fr 1.5fr 1fr 1fr 1fr 1fr 40px', padding: '20px 24px', background: 'rgba(0,0,0,0.2)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
           <div style={{ display: 'flex', alignItems: 'center' }}><input type="checkbox" style={{ accentColor: 'var(--accent)' }} /></div>
           <div style={{ fontSize: 12, fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Task</div>
           <div style={{ fontSize: 12, fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Project</div>
           <div style={{ fontSize: 12, fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Assignee</div>
           <div style={{ fontSize: 12, fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Priority</div>
           <div style={{ fontSize: 12, fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Due Date</div>
           <div style={{ fontSize: 12, fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Created</div>
           <div style={{ textAlign: 'right' }}><Plus size={14} style={{ opacity: 0.3 }} /></div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <AnimatePresence mode="popLayout">
            {tasks.length > 0 ? (
              tasks.map((task, i) => (
                <motion.div 
                  key={task.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ delay: i * 0.03 }}
                  onClick={() => navigate(`/projects/${task.projectId}`)}
                  style={{ 
                    display: 'grid', gridTemplateColumns: '40px 2fr 1.5fr 1fr 1fr 1fr 1fr 40px', 
                    padding: '18px 24px', borderBottom: '1px solid rgba(255,255,255,0.03)', 
                    cursor: 'pointer', transition: 'all 0.2s' 
                  }}
                  className="task-table-row-hover"
                >
                  <div style={{ display: 'flex', alignItems: 'center' }}><input type="checkbox" onClick={e => e.stopPropagation()} style={{ accentColor: 'var(--accent)' }} /></div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                     <span style={{ fontSize: 14, fontWeight: 700, color: 'white' }}>{task.title}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                     <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>{task.project?.name}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                     <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: 'white', fontWeight: 800 }}>
                        {task.assignee?.name ? task.assignee.name.split(' ').map(n => n[0]).join('') : '?'}
                     </div>
                     <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>{task.assignee?.name || 'Unassigned'}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                     <span style={{ 
                       fontSize: 10, fontWeight: 900, 
                       color: task.priority === 'HIGH' || task.priority === 'URGENT' ? '#f87171' : (task.priority === 'LOW' ? '#34d399' : '#94a3b8'),
                       background: task.priority === 'HIGH' || task.priority === 'URGENT' ? 'rgba(248,113,113,0.1)' : 'rgba(255,255,255,0.03)',
                       padding: '4px 8px', borderRadius: 6, textTransform: 'uppercase'
                     }}>{task.priority}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                     <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '-'}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                     <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.2)', fontWeight: 600 }}>{new Date(task.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                     <button style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.2)', cursor: 'pointer' }}><ChevronRight size={16} /></button>
                  </div>
                </motion.div>
              ))
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '100px 0' }}>
                 <div style={{ width: 80, height: 80, borderRadius: 24, background: 'rgba(124,58,237,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
                    <Inbox size={40} style={{ color: 'var(--accent)', opacity: 0.8 }} />
                 </div>
                 <h3 style={{ fontSize: 24, fontWeight: 800, color: 'white', marginBottom: 8 }}>No tasks found</h3>
                 <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 15, marginBottom: 32 }}>Try adjusting your filters or create a new task.</p>
                 <button onClick={() => setIsModalOpen(true)} className="btn-submit" style={{ width: 'auto', padding: '12px 24px', borderRadius: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
                    <Plus size={20} /> Add Task
                 </button>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* --- ADD TASK MODAL --- */}
      <AnimatePresence>
        {isModalOpen && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)' }} 
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="auth-main-card" 
              style={{ width: '100%', maxWidth: 500, flexDirection: 'column', padding: 40, position: 'relative', zIndex: 1 }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                <div>
                  <h2 style={{ fontSize: 24, fontWeight: 800, color: 'white', margin: 0 }}>Create New Task</h2>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, marginTop: 4 }}>Add details to your team's backlog</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: 'white', width: 36, height: 36, borderRadius: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleAddTask}>
                <div className="input-container">
                  <Type size={18} className="input-icon" style={{ opacity: 0.3 }} />
                  <input 
                    className="auth-input" 
                    placeholder="Task Title" 
                    value={newTask.title}
                    onChange={e => setNewTask({...newTask, title: e.target.value})}
                    required
                  />
                </div>

                <div className="input-container">
                  <AlignLeft size={18} className="input-icon" style={{ opacity: 0.3, top: 24 }} />
                  <textarea 
                    className="auth-input" 
                    placeholder="Description (Optional)" 
                    value={newTask.description}
                    onChange={e => setNewTask({...newTask, description: e.target.value})}
                    style={{ minHeight: 100, paddingTop: 16, resize: 'none' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: 8, display: 'block' }}>Project</label>
                    <select 
                      className="auth-input" 
                      style={{ paddingLeft: 16 }}
                      value={newTask.projectId}
                      onChange={e => setNewTask({...newTask, projectId: e.target.value})}
                      required
                    >
                      {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: 8, display: 'block' }}>Assignee</label>
                    <select 
                      className="auth-input" 
                      style={{ paddingLeft: 16 }}
                      value={newTask.assigneeId}
                      onChange={e => setNewTask({...newTask, assigneeId: e.target.value})}
                    >
                      <option value="">Unassigned</option>
                      {Array.isArray(members) && members.map(m => <option key={m.id} value={m.id}>{m.name} ({m.email})</option>)}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: 8, display: 'block' }}>Priority</label>
                    <select 
                      className="auth-input" 
                      style={{ paddingLeft: 16 }}
                      value={newTask.priority}
                      onChange={e => setNewTask({...newTask, priority: e.target.value})}
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: 8, display: 'block' }}>Due Date</label>
                    <input 
                      type="date" 
                      className="auth-input" 
                      style={{ paddingLeft: 16, colorScheme: 'dark' }}
                      value={newTask.dueDate}
                      onChange={e => setNewTask({...newTask, dueDate: e.target.value})}
                    />
                  </div>
                </div>

                <button type="submit" className="btn-submit">
                  <Plus size={20} /> Create Task
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style>{`
        .filter-select-premium:hover { background: rgba(255,255,255,0.06) !important; border-color: rgba(255,255,255,0.1) !important; }
        .task-table-row-hover:hover { background: rgba(255,255,255,0.02) !important; }
        input[type="date"]::-webkit-calendar-picker-indicator {
          opacity: 0;
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
          height: 100%;
          cursor: pointer;
        }
      `}</style>
    </motion.div>
  );
}
