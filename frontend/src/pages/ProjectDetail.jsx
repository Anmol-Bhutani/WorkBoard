import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { 
  ArrowLeft, Plus, UserPlus, Calendar as CalendarIcon, MoreVertical, 
  Search, Filter, ChevronDown, ClipboardList, Clock, 
  Eye, CheckCircle2, X, Trash2, Mail, User, Settings, Edit2, 
  ChevronLeft, ChevronRight, AlertCircle, Palette, ArrowUp, ArrowDown,
  AlignLeft, Calendar, Save, Check, Users, UserMinus, Minus
} from 'lucide-react';

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddTask, setShowAddTask] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [editTaskForm, setEditTaskForm] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [selectedPriority, setSelectedPriority] = useState(null);
  const [sortBy, setSortBy] = useState('newest');
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [taskForm, setTaskForm] = useState({ title: '', description: '', priority: 'MEDIUM', status: 'TODO', assigneeId: '', dueDate: '' });
  const [projectForm, setProjectForm] = useState({ name: '', description: '', color: '#fbbf24' });
  const [searchQuery, setSearchQuery] = useState('');
  const [currentDate, setCurrentDate] = useState(new Date());
  const menuRef = useRef(null);
  const filterRef = useRef(null);
  const sortRef = useRef(null);

  const load = () => {
    api.get(`/api/projects/${id}`).then(d => {
      setProject(d.project);
      setProjectForm({ name: d.project.name, description: d.project.description || '', color: d.project.color || '#fbbf24' });
    }).catch(err => { toast.error('Project not found'); navigate('/projects'); }).finally(() => setLoading(false));
  };

  useEffect(() => { 
    load(); 
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setShowMenu(false);
      if (filterRef.current && !filterRef.current.contains(e.target)) setShowFilterMenu(false);
      if (sortRef.current && !sortRef.current.contains(e.target)) setShowSortMenu(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [id]);

  const loadUsers = () => { api.get('/api/auth/users').then(d => setAllUsers(d.users)).catch(console.error); };

  const handleUpdateProject = async (e) => {
    e.preventDefault();
    try { await api.put(`/api/projects/${id}`, projectForm); toast.success('Project updated!'); setShowSettings(false); load(); } catch (err) { toast.error(err.message); }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!taskForm.title.trim()) return toast.error('Task title is required');
    try {
      const payload = {
        ...taskForm,
        projectId: id,
        assigneeId: taskForm.assigneeId || null
      };
      console.log('--- CREATING TASK ---', payload);
      await api.post('/api/tasks', payload);
      toast.success('Task created successfully!');
      setShowAddTask(false);
      setTaskForm({ title: '', description: '', priority: 'MEDIUM', status: 'TODO', assigneeId: '', dueDate: '' });
      load();
    } catch (err) { 
      console.error('Task Creation Error:', err);
      toast.error(err.response?.data?.error || 'Failed to create task'); 
    }
  };

  const handleSaveTaskEdits = async () => {
    if (!editTaskForm) return;
    try {
      await api.put(`/api/tasks/${editTaskForm.id}`, { ...editTaskForm, assigneeId: editTaskForm.assigneeId || null });
      toast.success('Changes saved!');
      setSelectedTask(null);
      load();
    } catch (err) { toast.error(err.message); }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Delete this task?')) return;
    try { await api.delete(`/api/tasks/${taskId}`); toast.success('Task deleted'); setSelectedTask(null); load(); } catch (err) { toast.error(err.message); }
  };

  const handleAddMember = async (userId) => {
    try { 
      await api.post(`/api/projects/${id}/members`, { userId }); 
      toast.success('Member added!'); 
      load(); // Refresh project data to update the "Added" state in modal
    } catch (err) { 
      toast.error(err.response?.data?.error || err.message); 
    }
  };

  const handleRemoveMember = async (memberUserId) => {
    if (!window.confirm('Remove this member from the project?')) return;
    try { 
      await api.delete(`/api/projects/${id}/members/${memberUserId}`); 
      toast.success('Member removed'); 
      load(); 
    } catch (err) { 
      toast.error(err.response?.data?.error || 'Failed to remove member'); 
    }
  };

  const handleDeleteProject = async () => {
    if (!window.confirm('Are you sure you want to delete this project? This cannot be undone.')) return;
    try { await api.delete(`/api/projects/${id}`); toast.success('Project deleted successfully'); navigate('/projects'); } catch (err) { toast.error(err.message); }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      await api.put(`/api/projects/${id}`, { status: newStatus });
      toast.success(`Project moved to ${newStatus.replace('_', ' ')}`);
      load();
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (loading) return <div className="loader"><div className="spinner"></div></div>;
  if (!project) return null;

  const stats = [
    { label: 'To Do', key: 'TODO', icon: ClipboardList, color: '#a78bfa' },
    { label: 'In Progress', key: 'IN_PROGRESS', icon: Clock, color: '#fbbf24' },
    { label: 'In Review', key: 'IN_REVIEW', icon: Eye, color: '#c084fc' },
    { label: 'Done', key: 'DONE', icon: CheckCircle2, color: '#34d399' }
  ];

  const getTaskCount = (status) => project.tasks?.filter(t => t.status === status).length || 0;
  
  const totalTasks = project.tasks?.length || 0;
  const inProgressCount = getTaskCount('IN_PROGRESS');
  const inReviewCount = getTaskCount('IN_REVIEW');
  const doneCount = getTaskCount('DONE');

  const inProgressPercent = totalTasks > 0 ? (inProgressCount / totalTasks) * 100 : 0;
  const inReviewPercent = totalTasks > 0 ? (inReviewCount / totalTasks) * 100 : 0;
  const donePercent = totalTasks > 0 ? (doneCount / totalTasks) * 100 : 0;
  let totalProgress = totalTasks > 0 ? Math.round(((doneCount + inReviewCount * 0.7 + inProgressCount * 0.3) / totalTasks) * 100) : 0;
  
  // Manual Override: Completed projects are always 100%
  if (project.status === 'COMPLETED') totalProgress = 100;

  let filteredTasks = project.tasks || [];
  if (selectedStatus) filteredTasks = filteredTasks.filter(t => t.status === selectedStatus);
  if (selectedPriority) filteredTasks = filteredTasks.filter(t => t.priority === selectedPriority);
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    filteredTasks = filteredTasks.filter(t => t.title.toLowerCase().includes(q) || (t.description && t.description.toLowerCase().includes(q)));
  }

  filteredTasks.sort((a, b) => {
    if (sortBy === 'newest') return new Date(b.createdAt) - new Date(a.createdAt);
    if (sortBy === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt);
    if (sortBy === 'priority') {
      const p = { HIGH: 3, MEDIUM: 2, LOW: 1 };
      return p[b.priority] - p[a.priority];
    }
    return 0;
  });

  // --- CALENDAR LOGIC ---
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const calendarDays = [];
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
  const firstDayOfMonth = (y, m) => new Date(y, m, 1).getDay();
  const totalDays = daysInMonth(year, month);
  const startDay = firstDayOfMonth(year, month);
  for (let i = 0; i < startDay; i++) calendarDays.push(null);
  for (let i = 1; i <= totalDays; i++) calendarDays.push(i);

  const getTasksForDay = (day) => {
    if (!day) return [];
    return project.tasks?.filter(t => {
      if (!t.dueDate) return false;
      const d = new Date(t.dueDate);
      return d.getDate() === day && d.getMonth() === month && d.getFullYear() === year;
    }) || [];
  };

  const today = new Date();

  const isUserMember = (userId) => project.members?.some(m => m.userId === userId);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="dashboard-content" style={{ paddingBottom: 60 }}>
      {/* --- TOP HEADER --- */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
        <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
          <button onClick={() => navigate('/projects')} className="btn-secondary" style={{ padding: 10, borderRadius: 10 }}><ArrowLeft size={18} /></button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: project.color || '#fbbf24', boxShadow: `0 0 15px ${project.color || '#fbbf24'}` }}></div>
              <h1 className="hero-heading" style={{ fontSize: 48, margin: 0 }}>{project.name}</h1>
              <div style={{ 
                padding: '8px 16px', borderRadius: 100, fontSize: 11, fontWeight: 900, 
                background: project.status === 'ACTIVE' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255,255,255,0.05)', 
                color: project.status === 'ACTIVE' ? '#10b981' : 'rgba(255,255,255,0.5)', 
                border: project.status === 'ACTIVE' ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid rgba(255,255,255,0.1)',
                textTransform: 'uppercase', letterSpacing: '0.05em', marginLeft: 8
              }}>
                {project.status.replace('_', ' ')}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginTop: 16 }}>
               <div style={{ width: 300, height: 10, background: 'rgba(255,255,255,0.03)', borderRadius: 100, overflow: 'hidden', display: 'flex' }}>
                  <motion.div initial={{ width: 0 }} animate={{ width: `${totalProgress}%` }} style={{ height: '100%', background: project.color || '#fbbf24', boxShadow: `0 0 10px ${project.color || '#fbbf24'}` }} />
                  {project.status !== 'COMPLETED' && (
                    <>
                      <motion.div initial={{ width: 0 }} animate={{ width: `${inReviewPercent}%` }} style={{ height: '100%', background: '#c084fc', opacity: 0.6 }} />
                      <motion.div initial={{ width: 0 }} animate={{ width: `${inProgressPercent}%` }} style={{ height: '100%', background: '#fbbf24', opacity: 0.3 }} />
                    </>
                  )}
               </div>
               <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: 14, fontWeight: 900, color: 'white', lineHeight: 1 }}>{totalProgress}%</span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginTop: 4 }}>Work Velocity</span>
               </div>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12, position: 'relative', alignItems: 'center' }}>
          <select 
            value={project.status} 
            onChange={(e) => handleStatusChange(e.target.value)}
            style={{ 
              padding: '12px 20px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', 
              color: 'white', border: '1px solid rgba(255,255,255,0.05)', fontSize: 13, 
              fontWeight: 700, cursor: 'pointer', appearance: 'none', textAlign: 'center',
              minWidth: 140
            }}
          >
            <option value="ACTIVE" style={{ background: '#11111a' }}>ACTIVE</option>
            <option value="ON_HOLD" style={{ background: '#11111a' }}>ON HOLD</option>
            <option value="COMPLETED" style={{ background: '#11111a' }}>COMPLETED</option>
            <option value="ARCHIVED" style={{ background: '#11111a' }}>ARCHIVE</option>
          </select>
          <button onClick={() => { loadUsers(); setShowAddMember(true); }} className="btn-secondary" style={{ padding: '12px 20px', display: 'flex', gap: 10, alignItems: 'center' }}><UserPlus size={18} /> Add Member</button>
          <button onClick={() => setShowAddTask(true)} className="btn-submit" style={{ width: 'auto', padding: '12px 24px', borderRadius: 12, display: 'flex', gap: 10, alignItems: 'center' }}><Plus size={20} /> Add Task</button>
          <button onClick={() => setShowCalendar(!showCalendar)} className="btn-secondary" style={{ padding: 12, borderRadius: 12, background: showCalendar ? 'var(--accent)' : 'rgba(255,255,255,0.03)', color: showCalendar ? 'white' : 'rgba(255,255,255,0.4)' }}><CalendarIcon size={18} /></button>
          <div ref={menuRef} style={{ position: 'relative' }}>
            <button onClick={() => setShowMenu(!showMenu)} className="btn-secondary" style={{ padding: 12, borderRadius: 12 }}><MoreVertical size={18} /></button>
            <AnimatePresence>
              {showMenu && (
                <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }} style={{ position: 'absolute', top: '100%', right: 0, marginTop: 12, width: 200, background: '#11111a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 8, zIndex: 100, boxShadow: '0 20px 40px rgba(0,0,0,0.4)', backdropFilter: 'blur(20px)' }}>
                  <button onClick={() => { setShowSettings(true); setShowMenu(false); }} style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '12px 16px', background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', borderRadius: 10, fontSize: 13, fontWeight: 600 }} className="menu-item-hover"><Edit2 size={16} /> Edit Project</button>
                  <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', margin: '4px 8px' }}></div>
                  <button onClick={handleDeleteProject} style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '12px 16px', background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', borderRadius: 10, fontSize: 13, fontWeight: 600 }} className="menu-item-hover"><Trash2 size={16} /> Delete Project</button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* --- TEAM ROW --- */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 40 }}>
        <span style={{ fontSize: 15, fontWeight: 700, color: 'white' }}>Team:</span>
        <div style={{ display: 'flex', gap: 16 }}>
          {project.members?.map(m => {
            const isOwner = project.ownerId === m.userId;
            return (
              <motion.div 
                key={m.id} 
                initial={{ opacity: 0, scale: 0.8 }} 
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.05, background: 'rgba(255,255,255,0.06)' }} 
                style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,0.03)', padding: '8px 16px 8px 8px', borderRadius: 100, border: '1px solid rgba(255,255,255,0.05)', cursor: 'default', position: 'relative' }}
                className="member-chip"
              >
                 <div style={{ width: 28, height: 28, borderRadius: '50%', background: isOwner ? project.color : 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: 'white', boxShadow: isOwner ? `0 0 10px ${project.color}40` : 'none' }}>{m.user?.name[0] || '?'}</div>
                 <span style={{ fontSize: 13, fontWeight: 600, color: isOwner ? 'white' : 'rgba(255,255,255,0.6)' }}>{m.user?.name} {isOwner && '(Owner)'}</span>
                 
                 {!isOwner && (
                   <motion.button 
                     onClick={(e) => { e.stopPropagation(); handleRemoveMember(m.user?.id || m.userId); }}
                     whileHover={{ scale: 1.25, background: '#ef4444', boxShadow: '0 0 15px rgba(239, 68, 68, 0.5)' }}
                     className="remove-member-badge"
                     style={{ 
                       position: 'absolute', top: -8, right: -8, width: 20, height: 20, borderRadius: '50%', 
                       background: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', 
                       color: 'white', border: '2px solid #000', cursor: 'pointer', zIndex: 10,
                       boxShadow: '0 2px 5px rgba(0,0,0,0.3)'
                     }}
                   >
                     <Minus size={12} strokeWidth={4} />
                   </motion.button>
                 )}
              </motion.div>
            );
          })}
          {project.members?.length === 0 && <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.2)' }}>No members added</span>}
        </div>
      </div>

      {/* --- STATUS CARDS ROW --- */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, marginBottom: 48 }}>
        {stats.map((col, i) => (
          <motion.div key={i} whileHover={{ scale: 1.02 }} onClick={() => setSelectedStatus(selectedStatus === col.key ? null : col.key)} className="bento-item" style={{ padding: 24, borderLeft: `2px solid ${col.color}`, cursor: 'pointer', background: selectedStatus === col.key ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.015)', borderColor: selectedStatus === col.key ? col.color : 'rgba(255,255,255,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}><div style={{ width: 36, height: 36, borderRadius: 10, background: `${col.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: col.color }}><col.icon size={18} /></div><span style={{ fontSize: 15, fontWeight: 700, color: 'white' }}>{col.label}</span></div>
            <div style={{ fontSize: 42, fontWeight: 900, color: 'white', lineHeight: 1, marginBottom: 8 }}>{getTaskCount(col.key)}</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>{getTaskCount(col.key)} {getTaskCount(col.key) === 1 ? 'task' : 'tasks'} listed</div>
          </motion.div>
        ))}
      </div>

      {/* --- CONTENT SECTION --- */}
      <div className="bento-item" style={{ padding: 40, minHeight: 600, position: 'relative' }}>
         {showCalendar ? (
           <div>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 }}>
                <h2 style={{ fontSize: 24, fontWeight: 800, color: 'white' }}>Project Timeline</h2>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                   <span style={{ fontSize: 18, fontWeight: 700, color: 'white', marginRight: 12 }}>{monthNames[month]} {year}</span>
                   <button onClick={() => setCurrentDate(new Date(year, month - 1))} className="btn-secondary" style={{ padding: 8 }}><ChevronLeft size={20} /></button>
                   <button onClick={() => setCurrentDate(new Date(year, month + 1))} className="btn-secondary" style={{ padding: 8 }}><ChevronRight size={20} /></button>
                   <button onClick={() => setShowCalendar(false)} className="btn-secondary" style={{ padding: '8px 16px', marginLeft: 12, fontSize: 13 }}>List View</button>
                </div>
             </div>
             <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 12 }}>
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (<div key={d} style={{ textAlign: 'center', fontSize: 13, fontWeight: 800, color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', marginBottom: 12 }}>{d}</div>))}
                {calendarDays.map((day, i) => {
                  const tasks = getTasksForDay(day);
                  const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
                  return (
                    <div key={i} onClick={() => day && setSelectedDate(day)} style={{ aspectRatio: '1/1', padding: 12, background: day ? 'rgba(255,255,255,0.02)' : 'transparent', borderRadius: 12, border: isToday ? '2px solid var(--accent)' : (day ? '1px solid rgba(255,255,255,0.05)' : 'none'), position: 'relative', cursor: day ? 'pointer' : 'default', transition: 'all 0.2s', boxShadow: isToday ? '0 0 15px rgba(124,58,237,0.2)' : 'none' }} className={day ? "calendar-day-hover" : ""}>
                       {day && <span style={{ fontSize: 14, fontWeight: 700, color: isToday ? 'white' : 'rgba(255,255,255,0.4)' }}>{day}</span>}
                       <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>{tasks.map(t => (<div key={t.id} style={{ width: '100%', height: 4, borderRadius: 2, background: stats.find(s => s.key === t.status)?.color || 'var(--accent)' }}></div>))}</div>
                       <AnimatePresence>{selectedDate === day && day && (<motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ position: 'absolute', bottom: '110%', left: '50%', transform: 'translateX(-50%)', width: 220, background: '#11111a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: 16, zIndex: 50, boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}><div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}><span style={{ fontSize: 13, fontWeight: 800, color: 'white' }}>{day} {monthNames[month]}</span><button onClick={(e) => { e.stopPropagation(); setSelectedDate(null); }} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer' }}><X size={14} /></button></div>{tasks.length > 0 ? (<div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{tasks.map(t => (<div key={t.id} style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', gap: 8 }}><div style={{ width: 6, height: 6, borderRadius: '50%', background: stats.find(s => s.key === t.status)?.color }}></div>{t.title}</div>))}</div>) : <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>No tasks scheduled</div>}</motion.div>)}</AnimatePresence>
                    </div>
                  );
                })}
             </div>
           </div>
         ) : (
           <div>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 }}>
                <h2 style={{ fontSize: 24, fontWeight: 800, color: 'white' }}>{selectedStatus ? `${selectedStatus.replace('_', ' ')} Tasks` : 'All Tasks'}</h2>
                <div style={{ display: 'flex', gap: 12 }}>
                   <div className="search-box-premium" style={{ position: 'relative' }}><Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', opacity: 0.3 }} /><input type="text" placeholder="Search tasks..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ padding: '10px 16px 10px 40px', width: 240, fontSize: 13 }} /></div>
                   <div style={{ position: 'relative' }} ref={filterRef}><button onClick={() => setShowFilterMenu(!showFilterMenu)} className="btn-secondary" style={{ padding: '10px 18px', display: 'flex', gap: 8, alignItems: 'center', fontSize: 13, background: selectedPriority ? 'var(--accent)' : 'rgba(255,255,255,0.03)' }}><Filter size={16} /> {selectedPriority || 'Filter'}</button>
                      <AnimatePresence>{showFilterMenu && (<motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ position: 'absolute', top: '100%', right: 0, marginTop: 8, width: 160, background: '#11111a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: 8, zIndex: 50, boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>{['HIGH', 'MEDIUM', 'LOW'].map(p => (<button key={p} onClick={() => { setSelectedPriority(selectedPriority === p ? null : p); setShowFilterMenu(false); }} style={{ width: '100%', padding: '10px 12px', textAlign: 'left', background: selectedPriority === p ? 'rgba(255,255,255,0.05)' : 'none', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', borderRadius: 8, fontSize: 12, fontWeight: 700 }} className="menu-item-hover">{p}</button>))}{selectedPriority && <button onClick={() => { setSelectedPriority(null); setShowFilterMenu(false); }} style={{ width: '100%', padding: '10px 12px', textAlign: 'left', background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', borderRadius: 8, fontSize: 12, fontWeight: 700, marginTop: 4 }}>Clear Filter</button>}</motion.div>)}</AnimatePresence>
                   </div>
                   <div style={{ position: 'relative' }} ref={sortRef}><button onClick={() => setShowSortMenu(!showSortMenu)} className="btn-secondary" style={{ padding: '10px 18px', display: 'flex', gap: 8, alignItems: 'center', fontSize: 13 }}><ChevronDown size={16} /> {sortBy.charAt(0).toUpperCase() + sortBy.slice(1)}</button>
                      <AnimatePresence>{showSortMenu && (<motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ position: 'absolute', top: '100%', right: 0, marginTop: 8, width: 160, background: '#11111a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: 8, zIndex: 50, boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>{['newest', 'oldest', 'priority'].map(s => (<button key={s} onClick={() => { setSortBy(s); setShowSortMenu(false); }} style={{ width: '100%', padding: '10px 12px', textAlign: 'left', background: sortBy === s ? 'rgba(255,255,255,0.05)' : 'none', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', borderRadius: 8, fontSize: 12, fontWeight: 700 }} className="menu-item-hover">{s.charAt(0).toUpperCase() + s.slice(1)}</button>))}</motion.div>)}</AnimatePresence>
                   </div>
                </div>
             </div>
             <AnimatePresence mode="popLayout">
               {filteredTasks.length > 0 ? (
                 <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 20 }}>
                   {filteredTasks.map(task => {
                     const statusColor = stats.find(s => s.key === task.status)?.color || 'var(--accent)';
                     return (
                       <motion.div 
                         key={task.id} 
                         layout 
                         onClick={() => { setSelectedTask(task); setEditTaskForm({ ...task }); }} 
                         initial={{ opacity: 0, y: 20 }} 
                         animate={{ opacity: 1, y: 0 }} 
                         whileHover={{ scale: 1.01, translateY: -4, background: 'rgba(255,255,255,0.04)', boxShadow: `0 10px 30px rgba(0,0,0,0.2), 0 0 20px ${statusColor}10` }} 
                         style={{ 
                           display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 32px', 
                           background: 'rgba(255,255,255,0.02)', borderRadius: 24, border: '1px solid rgba(255,255,255,0.05)', 
                           borderLeft: `4px solid ${statusColor}`, cursor: 'pointer', position: 'relative', overflow: 'hidden'
                         }}
                       >
                         <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: `linear-gradient(90deg, ${statusColor}05 0%, transparent 40%)`, pointerEvents: 'none' }} />
                         
                         <div style={{ display: 'flex', alignItems: 'center', gap: 24, position: 'relative', zIndex: 1 }}>
                           <div style={{ width: 52, height: 52, borderRadius: 16, background: `${statusColor}10`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: statusColor, boxShadow: `inset 0 0 10px ${statusColor}20` }}>
                             <ClipboardList size={26} />
                           </div>
                           <div>
                             <h4 style={{ fontSize: 19, fontWeight: 800, color: 'white', marginBottom: 6, letterSpacing: '-0.02em' }}>{task.title}</h4>
                             <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                               <span style={{ fontSize: 11, fontWeight: 900, color: task.priority === 'HIGH' ? '#f87171' : (task.priority === 'LOW' ? '#34d399' : '#94a3b8'), background: task.priority === 'HIGH' ? 'rgba(248,113,113,0.1)' : 'rgba(255,255,255,0.03)', padding: '4px 10px', borderRadius: 8, letterSpacing: '0.05em' }}>{task.priority}</span>
                               <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                  <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 900, color: 'white' }}>{task.assignee?.name[0] || '?'}</div>
                                  <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>{task.assignee?.name || 'Unassigned'}</span>
                               </div>
                               {task.dueDate && (
                                 <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
                                   <Calendar size={12} /> {new Date(task.dueDate).toLocaleDateString()}
                                 </span>
                               )}
                             </div>
                           </div>
                         </div>
                         
                         <div style={{ display: 'flex', alignItems: 'center', gap: 24, position: 'relative', zIndex: 1 }}>
                           <div style={{ padding: '8px 18px', borderRadius: 100, fontSize: 11, fontWeight: 900, background: `${statusColor}15`, color: statusColor, border: `1px solid ${statusColor}20`, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                             {task.status.replace('_', ' ')}
                           </div>
                         </div>
                       </motion.div>
                     );
                   })}
                 </div>
               ) : (
                 <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingTop: 40 }}><div style={{ width: 120, height: 120, borderRadius: 40, background: 'rgba(124,58,237,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24, border: '1px solid rgba(124,58,237,0.1)', position: 'relative' }}><ClipboardList size={48} style={{ color: 'var(--accent)', opacity: 0.8 }} /><div style={{ position: 'absolute', top: -10, right: -10, color: 'var(--accent)', opacity: 0.4 }}><Plus size={24} /></div></div><h3 style={{ fontSize: 28, fontWeight: 800, color: 'white', marginBottom: 12 }}>No tasks matched</h3><p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 16, textAlign: 'center', maxWidth: 400, marginBottom: 32 }}>Try adjusting your search or filters to find what you're looking for.</p></div>
               )}
             </AnimatePresence>
           </div>
         )}
      </div>

      {/* --- MODALS --- */}
      <AnimatePresence>
        {/* TASK DETAIL / EDITOR MODAL */}
        {selectedTask && editTaskForm && (
          <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bento-item" style={{ width: '100%', maxWidth: 600, padding: 40, position: 'relative', background: '#0a0a14' }}>
              <button onClick={() => setSelectedTask(null)} style={{ position: 'absolute', top: 24, right: 24, background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer' }}><X size={24} /></button>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                <select value={editTaskForm.status} onChange={e => setEditTaskForm({...editTaskForm, status: e.target.value})} style={{ padding: '8px 16px', borderRadius: 8, fontSize: 11, fontWeight: 800, background: stats.find(s => s.key === editTaskForm.status)?.color + '20', color: stats.find(s => s.key === editTaskForm.status)?.color, border: `1px solid ${stats.find(s => s.key === editTaskForm.status)?.color}30`, cursor: 'pointer', appearance: 'none' }}>{stats.map(s => <option key={s.key} value={s.key} style={{ background: '#11111a', color: 'white' }}>{s.label}</option>)}</select>
                <select value={editTaskForm.priority} onChange={e => setEditTaskForm({...editTaskForm, priority: e.target.value})} style={{ fontSize: 12, fontWeight: 800, color: editTaskForm.priority === 'HIGH' ? '#f87171' : (editTaskForm.priority === 'LOW' ? '#34d399' : '#94a3b8'), background: 'rgba(255,255,255,0.03)', padding: '6px 12px', borderRadius: 8, border: 'none', cursor: 'pointer', appearance: 'none' }}>{['LOW', 'MEDIUM', 'HIGH'].map(p => <option key={p} value={p} style={{ background: '#11111a', color: 'white' }}>{p}</option>)}</select>
              </div>
              <input type="text" value={editTaskForm.title} onChange={e => setEditTaskForm({...editTaskForm, title: e.target.value})} style={{ fontSize: 32, fontWeight: 800, color: 'white', marginBottom: 16, background: 'none', border: 'none', width: '100%', outline: 'none' }} placeholder="Task Title" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24, marginTop: 32 }}>
                <div><div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'rgba(255,255,255,0.4)', marginBottom: 12, fontSize: 13, fontWeight: 700 }}><AlignLeft size={16} /> Description</div><textarea value={editTaskForm.description} onChange={e => setEditTaskForm({...editTaskForm, description: e.target.value})} style={{ width: '100%', color: 'rgba(255,255,255,0.6)', fontSize: 15, lineHeight: 1.6, background: 'rgba(255,255,255,0.02)', padding: 16, borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)', minHeight: 120, resize: 'none', outline: 'none' }} placeholder="Add a description..." /></div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                   <div className="bento-item" style={{ padding: 16, background: 'rgba(255,255,255,0.02)' }}>
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginBottom: 8, fontWeight: 700 }}>REASSIGN TO</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                         <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: 'white' }}>{editTaskForm.assignee?.name[0] || '?'}</div>
                         <select value={editTaskForm.assigneeId || ''} onChange={e => setEditTaskForm({...editTaskForm, assigneeId: e.target.value})} style={{ background: 'none', border: 'none', color: 'white', outline: 'none', fontSize: 14, fontWeight: 600, width: '100%', cursor: 'pointer' }}><option value="" style={{ background: '#11111a' }}>Unassigned</option>{project.members?.map(m => <option key={m.userId} value={m.userId} style={{ background: '#11111a' }}>{m.user.name}</option>)}</select>
                      </div>
                   </div>
                   <div className="bento-item" style={{ padding: 16, background: 'rgba(255,255,255,0.02)' }}>
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginBottom: 8, fontWeight: 700 }}>DUE DATE</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'white', fontSize: 14, fontWeight: 600 }}><Calendar size={16} style={{ color: 'var(--accent)' }} /><input type="date" value={editTaskForm.dueDate ? editTaskForm.dueDate.split('T')[0] : ''} onChange={e => setEditTaskForm({...editTaskForm, dueDate: e.target.value})} style={{ background: 'none', border: 'none', color: 'white', outline: 'none', fontSize: 14, fontWeight: 600 }} /></div>
                   </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 48 }}>
                <button onClick={() => handleDeleteTask(selectedTask.id)} className="btn-secondary" style={{ padding: '14px 24px', color: '#f87171' }}><Trash2 size={18} /></button>
                <button onClick={handleSaveTaskEdits} className="btn-submit" style={{ flex: 1, padding: 14, width: 'auto', display: 'flex', gap: 10, alignItems: 'center', justifyContent: 'center' }}><Save size={18} /> Save Changes</button>
              </div>
            </motion.div>
          </div>
        )}

        {/* ADD TASK MODAL */}
        {showAddTask && (<div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}><motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bento-item" style={{ width: '100%', maxWidth: 500, padding: 40, position: 'relative', background: '#0a0a14' }}><button onClick={() => setShowAddTask(false)} style={{ position: 'absolute', top: 24, right: 24, background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer' }}><X size={24} /></button><h2 style={{ fontSize: 28, fontWeight: 800, color: 'white', marginBottom: 8 }}>Add New Task</h2><p style={{ color: 'rgba(255,255,255,0.4)', marginBottom: 32 }}>Create a new task for this project.</p><form onSubmit={handleCreateTask}><div style={{ marginBottom: 20 }}><label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'white', marginBottom: 10 }}>Task Title</label><input type="text" value={taskForm.title} onChange={e => setTaskForm({...taskForm, title: e.target.value})} placeholder="e.g. Design System" className="auth-input" style={{ width: '100%', background: 'rgba(255,255,255,0.03)', padding: '14px 18px' }} required /></div><div style={{ marginBottom: 20 }}><label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'white', marginBottom: 10 }}>Assignee</label><select value={taskForm.assigneeId} onChange={e => setTaskForm({...taskForm, assigneeId: e.target.value})} className="auth-input" style={{ width: '100%', background: 'rgba(255,255,255,0.03)', padding: '14px 18px', appearance: 'none' }}><option value="">Unassigned</option>
    <option value={user?.id}>Assign to Me ({user?.email})</option>
    <optgroup label="Team Members" style={{ background: '#11111a' }}>
      {Array.isArray(project.members) && project.members.filter(m => m.userId !== user?.id).map(m => (
        <option key={m.userId} value={m.userId}>{m.user?.name} ({m.user?.email})</option>
      ))}
    </optgroup>
</select></div><div style={{ marginBottom: 20 }}><label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'white', marginBottom: 10 }}>Priority</label><div style={{ display: 'flex', gap: 10 }}>{['LOW', 'MEDIUM', 'HIGH'].map(p => (<button key={p} type="button" onClick={() => setTaskForm({...taskForm, priority: p})} style={{ flex: 1, padding: '10px', borderRadius: 8, fontSize: 11, fontWeight: 800, border: '1px solid rgba(255,255,255,0.05)', background: taskForm.priority === p ? 'var(--accent)' : 'rgba(255,255,255,0.03)', color: taskForm.priority === p ? 'white' : 'rgba(255,255,255,0.3)' }}>{p}</button>))}</div></div><div style={{ marginBottom: 20 }}><label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'white', marginBottom: 10 }}>Due Date</label><input type="date" value={taskForm.dueDate} onChange={e => setTaskForm({...taskForm, dueDate: e.target.value})} className="auth-input" style={{ width: '100%', background: 'rgba(255,255,255,0.03)', padding: '14px 18px' }} /></div><div style={{ display: 'flex', gap: 12, marginTop: 32 }}><button type="button" onClick={() => setShowAddTask(false)} className="btn-secondary" style={{ flex: 1, padding: 14 }}>Cancel</button><button type="submit" className="btn-submit" style={{ flex: 1, padding: 14, width: 'auto' }}>Create Task</button></div></form></motion.div></div>)}

        {/* SETTINGS MODAL */}
        {showSettings && (<div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}><motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bento-item" style={{ width: '100%', maxWidth: 500, padding: 40, position: 'relative', background: '#0a0a14' }}><button onClick={() => setShowSettings(false)} style={{ position: 'absolute', top: 24, right: 24, background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer' }}><X size={24} /></button><h2 style={{ fontSize: 28, fontWeight: 800, color: 'white', marginBottom: 8 }}>Project Settings</h2><p style={{ color: 'rgba(255,255,255,0.4)', marginBottom: 32 }}>Update your project details and identity.</p><form onSubmit={handleUpdateProject}><div style={{ marginBottom: 24 }}><label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'white', marginBottom: 10 }}>Project Name</label><input type="text" value={projectForm.name} onChange={e => setProjectForm({...projectForm, name: e.target.value})} className="auth-input" style={{ width: '100%', background: 'rgba(255,255,255,0.03)', padding: '14px 18px' }} required /></div><div style={{ marginBottom: 24 }}><label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'white', marginBottom: 10 }}>Description</label><textarea value={projectForm.description} onChange={e => setProjectForm({...projectForm, description: e.target.value})} className="auth-input" style={{ width: '100%', background: 'rgba(255,255,255,0.03)', padding: '14px 18px', minHeight: 100, resize: 'none' }} /></div><div style={{ marginBottom: 24 }}><label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'white', marginBottom: 10 }}>Project Identity Color</label><div style={{ display: 'flex', gap: 12 }}>{['#fbbf24', '#f87171', '#60a5fa', '#34d399', '#a78bfa', '#f472b6'].map(c => (<button key={c} type="button" onClick={() => setProjectForm({...projectForm, color: c})} style={{ width: 32, height: 32, borderRadius: '50%', background: c, border: projectForm.color === c ? '3px solid white' : 'none', cursor: 'pointer' }} />))}</div></div><div style={{ display: 'flex', gap: 12, marginTop: 40 }}><button type="button" onClick={() => setShowSettings(false)} className="btn-secondary" style={{ flex: 1, padding: 14 }}>Cancel</button><button type="submit" className="btn-submit" style={{ flex: 1, padding: 14, width: 'auto' }}>Save Changes</button></div></form></motion.div></div>)}

        {/* ADD MEMBER MODAL */}
        {showAddMember && (
          <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bento-item" style={{ width: '100%', maxWidth: 500, padding: 40, position: 'relative', background: '#0a0a14' }}>
              <button onClick={() => setShowAddMember(false)} style={{ position: 'absolute', top: 24, right: 24, background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer' }}><X size={24} /></button>
              <h2 style={{ fontSize: 28, fontWeight: 800, color: 'white', marginBottom: 8 }}>Add Team Member</h2>
              <div style={{ maxHeight: 400, overflowY: 'auto', marginTop: 24, paddingRight: 8 }}>
                {allUsers.map(u => {
                  const alreadyMember = isUserMember(u.id);
                  return (
                    <div key={u.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: 16, marginBottom: 12, border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: 'white', fontSize: 16 }}>{u.name[0]}</div>
                        <div>
                          <div style={{ fontSize: 15, fontWeight: 700, color: 'white' }}>{u.name}</div>
                          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>{u.email}</div>
                        </div>
                      </div>
                      
                      <AnimatePresence mode="wait">
                        {alreadyMember ? (
                          <motion.div 
                            key="check"
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(52, 211, 153, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#34d399', border: '1px solid rgba(52, 211, 153, 0.2)' }}
                          >
                            <Check size={18} strokeWidth={3} />
                          </motion.div>
                        ) : (
                          <motion.button 
                            key="add"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ scale: 0, opacity: 0 }}
                            onClick={() => handleAddMember(u.id)} 
                            className="btn-secondary" 
                            style={{ padding: '8px 16px', fontSize: 13, borderRadius: 10, fontWeight: 700 }}
                          >
                            Add
                          </motion.button>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
