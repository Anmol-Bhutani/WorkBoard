import { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, Briefcase, CheckCircle2, Clock, Search, ListFilter, ClipboardList,
  ChevronDown, MoreHorizontal, MoreVertical, Plus, Mail, X, Trash2,
  ShieldCheck, User, Filter, ArrowUpDown, ChevronLeft, ChevronRight,
  Inbox, UserPlus, Settings
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function Members() {
  const { user: currentUser } = useAuth();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalMembers: 0, totalProjects: 0, completedTasks: 0, pendingTasks: 0 });
  
  // UI States
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('NAME_AZ');
  const [selectedMember, setSelectedMember] = useState(null);
  const [memberTasks, setMemberTasks] = useState([]);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [workspaceName, setWorkspaceName] = useState('WorkBoard');
  const [settingsForm, setSettingsForm] = useState({ restrictInvite: false, weeklyReports: true });
  const [inviteForm, setInviteForm] = useState({ name: '', email: '', role: 'MEMBER' });

  const loadData = async () => {
    try {
      const [membersData, dashData, workspaceData] = await Promise.all([
        api.get('/api/members'),
        api.get('/api/dashboard'),
        api.get('/api/workspace')
      ]);
      
      setMembers(membersData.members || []);
      setWorkspaceName(workspaceData.name || 'WorkBoard');
      setSettingsForm({
        restrictInvite: workspaceData.restrictInvite || false,
        weeklyReports: workspaceData.weeklyReports || false
      });
      
      setStats({
        totalMembers: membersData.members?.length || dashData.membersCount || 0,
        totalProjects: dashData.projectsCount || 0,
        completedTasks: dashData.stats?.done || 0,
        pendingTasks: (dashData.stats?.todo || 0) + (dashData.stats?.inProgress || 0) + (dashData.stats?.inReview || 0)
      });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      await api.put('/api/workspace', {
        name: workspaceName,
        ...settingsForm
      });
      toast.success('Workspace settings updated!');
      setShowSettingsModal(false);
      loadData();
    } catch (err) {
      toast.error(err.message || 'Failed to update settings');
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    document.title = `${workspaceName} — Team Management`;
  }, [workspaceName]);

  const handleInvite = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/members/invite', inviteForm);
      
      // Generate Gmail URL with attractive message
      const subject = encodeURIComponent(`You're invited to join the ${workspaceName} Workspace! 🚀`);
      const body = encodeURIComponent(
        `Hello ${inviteForm.name},\n\n` +
        `You've been invited to join the ${workspaceName} professional workspace.\n\n` +
        `Your account has been prepared and you can log in using the following credentials:\n` +
        `----------------------------------------\n` +
        `Email: ${inviteForm.email}\n` +
        `Temporary Password: welcome123\n` +
        `----------------------------------------\n\n` +
        `Login here: http://localhost:5174/login\n\n` +
        `We look forward to having you on the team!\n\n` +
        `Best regards,\n` +
        `${currentUser.name}\n` +
        `${workspaceName} Team`
      );

      const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${inviteForm.email}&su=${subject}&body=${body}`;
      
      window.open(gmailUrl, '_blank');
      
      setShowInviteModal(false);
      setInviteForm({ name: '', email: '', role: 'MEMBER' });
      loadData();
      toast.success('Member created & Gmail opened!');
    } catch (err) {
      toast.error(err.message || 'Failed to invite member');
    }
  };

  const handleDeleteMember = async (userId) => {
    if (!window.confirm('Are you sure you want to remove this member? This action cannot be undone.')) return;
    try {
      await api.delete(`/api/members/${userId}`);
      toast.success('Member removed successfully');
      loadData();
    } catch (err) {
      toast.error(err.message || 'Failed to remove member');
    }
  };

  const handleExportCSV = () => {
    try {
      const headers = ['Name', 'Email', 'Role', 'Status', 'Tasks', 'Projects', 'Joined Date'];
      const rows = members.map(m => [
        m.name,
        m.email,
        m.role,
        m.status,
        m._count?.assignedTasks || 0,
        m._count?.ownedProjects || 0,
        new Date(m.createdAt).toLocaleDateString()
      ]);

      const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `WorkBoard_Team_Export_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Team list exported successfully!');
      setShowMoreMenu(false);
    } catch (err) {
      toast.error('Failed to export CSV');
    }
  };

  const handleMemberClick = async (member) => {
    setSelectedMember(member);
    try {
      const data = await api.get(`/api/tasks?assigneeId=${member.id}`);
      setMemberTasks(data.tasks || []);
    } catch (err) {
      console.error('Failed to load member tasks', err);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await api.put(`/api/members/${userId}/role`, { role: newRole });
      toast.success('Role updated successfully');
      loadData();
      if (selectedMember?.id === userId) {
        setSelectedMember({ ...selectedMember, role: newRole });
      }
    } catch (err) {
      toast.error(err.message);
    }
  };

  const filteredMembers = members
    .filter(m => {
      const matchesSearch = m.name.toLowerCase().includes(search.toLowerCase()) || m.email.toLowerCase().includes(search.toLowerCase());
      const matchesRole = roleFilter === 'ALL' || m.role === roleFilter;
      return matchesSearch && matchesRole;
    })
    .sort((a, b) => {
      if (sortBy === 'NAME_AZ') return a.name.localeCompare(b.name);
      if (sortBy === 'NAME_ZA') return b.name.localeCompare(a.name);
      return 0;
    });

  if (loading) return <div className="loader"><div className="spinner"></div></div>;

  const statCards = [
    { label: 'Total Members', count: stats.totalMembers, icon: Users, color: '#a78bfa', sub: 'Across organization' },
    { label: 'Total Projects', count: stats.totalProjects, icon: Briefcase, color: '#3b82f6', sub: 'Active workstreams' },
    { label: 'Completed Tasks', count: stats.completedTasks, icon: CheckCircle2, color: '#10b981', sub: 'Historical output' },
    { label: 'Pending Tasks', count: stats.pendingTasks, icon: Clock, color: '#fbbf24', sub: 'Current backlog' }
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="dashboard-content" style={{ paddingBottom: 60 }}>
      {/* --- TOP HEADER --- */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(124,58,237,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}>
            <Users size={24} />
          </div>
          <div>
            <h1 className="hero-heading" style={{ fontSize: 32, margin: 0 }}>Team Members</h1>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, marginTop: 4 }}>Manage your organization's team and their permissions.</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12, position: 'relative' }}>
          <button 
            onClick={() => setShowInviteModal(true)}
            className="btn-submit" 
            style={{ padding: '12px 24px', display: 'flex', gap: 8, alignItems: 'center', width: 'auto', borderRadius: 12 }}
          >
            <Plus size={20} /> Invite Member
          </button>
          <button 
            onClick={() => setShowMoreMenu(!showMoreMenu)}
            className="btn-secondary" 
            style={{ padding: 12, borderRadius: 12, border: showMoreMenu ? '1px solid var(--accent)' : '1px solid rgba(255,255,255,0.05)' }}
          >
            <MoreHorizontal size={20} />
          </button>

          <AnimatePresence>
            {showMoreMenu && (
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                style={{ position: 'absolute', top: '100%', right: 0, marginTop: 12, width: 220, background: '#0a0a14', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 8, zIndex: 100, boxShadow: '0 20px 40px rgba(0,0,0,0.4)', backdropFilter: 'blur(20px)' }}
              >
                <button onClick={handleExportCSV} style={{ width: '100%', padding: '12px 16px', background: 'none', border: 'none', color: 'white', fontSize: 13, fontWeight: 600, textAlign: 'left', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 10 }} className="menu-item-hover">
                   <Briefcase size={16} style={{ opacity: 0.5 }} /> Export CSV
                </button>
                <button onClick={() => { setShowSettingsModal(true); setShowMoreMenu(false); }} style={{ width: '100%', padding: '12px 16px', background: 'none', border: 'none', color: 'white', fontSize: 13, fontWeight: 600, textAlign: 'left', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 10 }} className="menu-item-hover">
                   <Settings size={16} style={{ opacity: 0.5 }} /> Team Settings
                </button>
                <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', margin: '8px 12px' }} />
                <button onClick={() => setShowMoreMenu(false)} style={{ width: '100%', padding: '12px 16px', background: 'none', border: 'none', color: '#f87171', fontSize: 13, fontWeight: 700, textAlign: 'left', borderRadius: 10 }}>
                   Close Menu
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* --- STATS ROW --- */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 40, marginTop: 32 }}>
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
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontWeight: 600, marginTop: 16 }}>{card.sub}</div>
          </motion.div>
        ))}
      </div>

      {/* --- FILTER CONTROL BAR --- */}
      <div className="bento-item" style={{ padding: 24, marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 12, flex: 1 }}>
            <div style={{ position: 'relative', width: 320 }}>
              <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', opacity: 0.3 }} />
              <input 
                className="search-input" 
                placeholder="Search team members..." 
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', paddingLeft: 40, borderRadius: 10, width: '100%', height: 44, fontSize: 13, color: 'white' }} 
              />
            </div>
            
            <div style={{ position: 'relative' }}>
              <button 
                onClick={() => { setShowRoleDropdown(!showRoleDropdown); setShowSortDropdown(false); }}
                className="filter-select-premium" 
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', color: 'white', padding: '0 16px', borderRadius: 10, width: 160, height: 44, fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}
              >
                <Filter size={14} style={{ opacity: 0.5 }} />
                {roleFilter === 'ALL' ? 'All Roles' : (roleFilter === 'ADMIN' ? 'Admins' : 'Members')}
                <ChevronDown size={14} style={{ marginLeft: 'auto', opacity: 0.5, transform: showRoleDropdown ? 'rotate(180deg)' : 'none', transition: 'all 0.3s' }} />
              </button>
              
              <AnimatePresence>
                {showRoleDropdown && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    style={{ position: 'absolute', top: '100%', left: 0, width: '100%', marginTop: 8, background: '#0a0a14', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 6, zIndex: 100, boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}
                  >
                    {['ALL', 'ADMIN', 'MEMBER'].map(role => (
                      <button 
                        key={role}
                        onClick={() => { setRoleFilter(role); setShowRoleDropdown(false); }}
                        style={{ width: '100%', padding: '10px 12px', background: roleFilter === role ? 'rgba(124,58,237,0.1)' : 'transparent', border: 'none', color: roleFilter === role ? 'var(--accent)' : 'rgba(255,255,255,0.6)', textAlign: 'left', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                        className="menu-item-hover"
                      >
                        {role === 'ALL' ? 'All Roles' : (role === 'ADMIN' ? 'Admins Only' : 'Members Only')}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div style={{ position: 'relative' }}>
              <button 
                onClick={() => { setShowSortDropdown(!showSortDropdown); setShowRoleDropdown(false); }}
                className="filter-select-premium" 
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', color: 'white', padding: '0 16px', borderRadius: 10, width: 180, height: 44, fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}
              >
                <ArrowUpDown size={14} style={{ opacity: 0.5 }} />
                {sortBy === 'NAME_AZ' ? 'Name A-Z' : 'Name Z-A'}
                <ChevronDown size={14} style={{ marginLeft: 'auto', opacity: 0.5, transform: showSortDropdown ? 'rotate(180deg)' : 'none', transition: 'all 0.3s' }} />
              </button>

              <AnimatePresence>
                {showSortDropdown && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    style={{ position: 'absolute', top: '100%', left: 0, width: '100%', marginTop: 8, background: '#0a0a14', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 6, zIndex: 100, boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}
                  >
                    {[
                      { id: 'NAME_AZ', label: 'Name A-Z' },
                      { id: 'NAME_ZA', label: 'Name Z-A' }
                    ].map(sort => (
                      <button 
                        key={sort.id}
                        onClick={() => { setSortBy(sort.id); setShowSortDropdown(false); }}
                        style={{ width: '100%', padding: '10px 12px', background: sortBy === sort.id ? 'rgba(124,58,237,0.1)' : 'transparent', border: 'none', color: sortBy === sort.id ? 'var(--accent)' : 'rgba(255,255,255,0.6)', textAlign: 'left', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                        className="menu-item-hover"
                      >
                        {sort.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* --- TABLE AREA --- */}
        <div style={{ marginTop: 32, borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 0 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '60px 2.5fr 1fr 1fr 1fr 50px', padding: '20px 24px', background: 'rgba(0,0,0,0.2)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
             <div style={{ fontSize: 12, fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Member</div>
             <div></div>
             <div style={{ fontSize: 12, fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Tasks</div>
             <div style={{ fontSize: 12, fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Projects</div>
             <div style={{ fontSize: 12, fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 0.5, textAlign: 'center' }}>Role</div>
             <div style={{ textAlign: 'center' }}></div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <AnimatePresence mode="popLayout">
              {filteredMembers.length > 0 ? (
                filteredMembers.map((member, i) => {
                  const isCurrent = member.id === currentUser?.id;
                  const initials = member.name?.split(' ').map(n => n[0]).join('').toUpperCase();
                  const avatarColor = member.role === 'ADMIN' ? 'var(--accent)' : '#3b82f6';

                  return (
                    <motion.div 
                      key={member.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      transition={{ delay: i * 0.03 }}
                      onClick={() => handleMemberClick(member)}
                      style={{ 
                        display: 'grid', gridTemplateColumns: '60px 2.5fr 1fr 1fr 1fr 50px', 
                        padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.03)', 
                        alignItems: 'center', transition: 'all 0.2s', cursor: 'pointer'
                      }}
                      className="task-table-row-hover"
                    >
                      <div style={{ 
                        width: 44, height: 44, borderRadius: '50%', 
                        background: `linear-gradient(135deg, ${avatarColor} 0%, rgba(255,255,255,0.05) 100%)`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 14, fontWeight: 800, color: 'white',
                        boxShadow: `0 4px 12px ${avatarColor}30`
                      }}>
                        {initials}
                      </div>
                      
                      <div style={{ paddingLeft: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 15, fontWeight: 700, color: 'white' }}>{member.name}</span>
                          {isCurrent && <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>(You)</span>}
                          {isCurrent && <span style={{ fontSize: 10, fontWeight: 900, background: 'rgba(124,58,237,0.15)', color: 'var(--accent)', padding: '2px 8px', borderRadius: 6, textTransform: 'uppercase' }}>Owner</span>}
                          {member.status === 'PENDING' && <span style={{ fontSize: 10, fontWeight: 900, background: 'rgba(251,191,36,0.1)', color: '#fbbf24', padding: '2px 8px', borderRadius: 6, textTransform: 'uppercase', border: '1px solid rgba(251,191,36,0.2)' }}>Invited</span>}
                        </div>
                        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>{member.email}</div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                         <span style={{ fontSize: 16, fontWeight: 800, color: 'white' }}>{member._count?.assignedTasks || 0}</span>
                         <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>Tasks</span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                         <span style={{ fontSize: 16, fontWeight: 800, color: 'white' }}>{member._count?.ownedProjects || 0}</span>
                         <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>Projects</span>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'center' }}>
                         <button 
                          onClick={(e) => { e.stopPropagation(); isCurrent ? null : handleRoleChange(member.id, member.role === 'ADMIN' ? 'MEMBER' : 'ADMIN') }}
                          disabled={isCurrent}
                          style={{ 
                            padding: '6px 16px', borderRadius: 8, fontSize: 11, fontWeight: 900, 
                            background: member.role === 'ADMIN' ? 'rgba(124,58,237,0.1)' : 'rgba(59,130,246,0.1)',
                            color: member.role === 'ADMIN' ? 'var(--accent)' : '#60a5fa',
                            border: `1px solid ${member.role === 'ADMIN' ? 'rgba(124,58,237,0.2)' : 'rgba(59,130,246,0.2)'}`,
                            cursor: isCurrent ? 'default' : 'pointer',
                            textTransform: 'uppercase',
                            letterSpacing: 0.5
                          }}
                         >
                           {member.role}
                         </button>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        {!isCurrent && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleDeleteMember(member.id); }}
                            className="btn-delete-hover"
                            style={{ background: 'none', border: 'none', color: 'rgba(248,113,113,0.4)', cursor: 'pointer', padding: 8, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                      </div>
                    </motion.div>
                  );
                })
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '100px 0' }}>
                   <div style={{ width: 80, height: 80, borderRadius: 24, background: 'rgba(124,58,237,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
                      <Inbox size={40} style={{ color: 'var(--accent)', opacity: 0.8 }} />
                   </div>
                   <h3 style={{ fontSize: 24, fontWeight: 800, color: 'white', marginBottom: 8 }}>No members found</h3>
                   <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 15, marginBottom: 32 }}>Try adjusting your search or filters.</p>
                   <button onClick={() => setShowInviteModal(true)} className="btn-submit" style={{ width: 'auto', padding: '12px 24px', borderRadius: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
                      <UserPlus size={20} /> Invite Member
                   </button>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* --- FOOTER --- */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 24, padding: '0 8px' }}>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>
            Showing 1 to {filteredMembers.length} of {members.length} members
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn-secondary" style={{ padding: 8, borderRadius: 10, opacity: 0.5 }}><ChevronLeft size={18} /></button>
            <button className="btn-submit" style={{ width: 36, height: 36, padding: 0, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800 }}>1</button>
            <button className="btn-secondary" style={{ padding: 8, borderRadius: 10, opacity: 0.5 }}><ChevronRight size={18} /></button>
          </div>
        </div>
      </div>

      {/* --- MEMBER DETAIL MODAL --- */}
      <AnimatePresence>
        {selectedMember && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setSelectedMember(null)}
              style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)' }} 
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bento-item" 
              style={{ width: '100%', maxWidth: 600, padding: 40, position: 'relative', zIndex: 1, background: '#0a0a14', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <button onClick={() => setSelectedMember(null)} style={{ position: 'absolute', top: 24, right: 24, background: 'rgba(255,255,255,0.05)', border: 'none', color: 'white', width: 36, height: 36, borderRadius: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={20} />
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 40 }}>
                <div style={{ 
                  width: 80, height: 80, borderRadius: '50%', 
                  background: `linear-gradient(135deg, var(--accent) 0%, rgba(255,255,255,0.05) 100%)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 28, fontWeight: 800, color: 'white',
                  boxShadow: `0 8px 24px rgba(124,58,237,0.3)`
                }}>
                  {selectedMember.name?.split(' ').map(n => n[0]).join('').toUpperCase()}
                </div>
                <div>
                  <h2 style={{ fontSize: 28, fontWeight: 800, color: 'white', margin: 0 }}>{selectedMember.name}</h2>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8 }}>
                    <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', gap: 6 }}><Mail size={14} /> {selectedMember.email}</span>
                    <span style={{ fontSize: 11, fontWeight: 900, background: 'rgba(124,58,237,0.1)', color: 'var(--accent)', padding: '2px 10px', borderRadius: 100, textTransform: 'uppercase' }}>{selectedMember.role}</span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 40 }}>
                <div className="bento-item" style={{ padding: 20, background: 'rgba(255,255,255,0.02)' }}>
                  <div style={{ fontSize: 24, fontWeight: 900, color: 'white' }}>{selectedMember._count?.assignedTasks || 0}</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginTop: 4 }}>Total Tasks</div>
                </div>
                <div className="bento-item" style={{ padding: 20, background: 'rgba(255,255,255,0.02)' }}>
                  <div style={{ fontSize: 24, fontWeight: 900, color: 'white' }}>{selectedMember._count?.ownedProjects || 0}</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginTop: 4 }}>Total Projects</div>
                </div>
              </div>

              <div>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: 'white', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <ClipboardList size={18} style={{ color: 'var(--accent)' }} /> 
                  Active Tasks ({memberTasks.filter(t => t.status !== 'DONE').length})
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 300, overflowY: 'auto', paddingRight: 8 }}>
                  {memberTasks.filter(t => t.status !== 'DONE').length > 0 ? (
                    memberTasks.filter(t => t.status !== 'DONE').map(task => (
                      <div key={task.id} style={{ padding: 16, background: 'rgba(255,255,255,0.03)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: 'white' }}>{task.title}</div>
                          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>{task.project?.name}</div>
                        </div>
                        <div style={{ fontSize: 10, fontWeight: 900, background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)', padding: '4px 10px', borderRadius: 8, textTransform: 'uppercase' }}>{task.status}</div>
                      </div>
                    ))
                  ) : (
                    <div style={{ textAlign: 'center', padding: '40px 0', color: 'rgba(255,255,255,0.2)', fontSize: 14 }}>No active tasks found</div>
                  )}
                </div>
              </div>

              <div style={{ marginTop: 40, paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: 12 }}>
                <button 
                  onClick={() => window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=${selectedMember.email}`, '_blank')}
                  className="btn-submit" 
                  style={{ flex: 1, padding: 14, width: 'auto', display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'center' }}
                >
                  <Mail size={18} /> Send Email
                </button>
                <button onClick={() => setSelectedMember(null)} className="btn-secondary" style={{ padding: 14 }}>Close</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- INVITE MEMBER MODAL --- */}
      <AnimatePresence>
        {showInviteModal && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setShowInviteModal(false)}
              style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)' }} 
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bento-item" 
              style={{ width: '100%', maxWidth: 500, padding: 40, position: 'relative', zIndex: 1, background: '#0a0a14', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <button onClick={() => setShowInviteModal(false)} style={{ position: 'absolute', top: 24, right: 24, background: 'rgba(255,255,255,0.05)', border: 'none', color: 'white', width: 36, height: 36, borderRadius: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={20} />
              </button>

              <h2 style={{ fontSize: 28, fontWeight: 800, color: 'white', marginBottom: 8 }}>Invite Member</h2>
              <p style={{ color: 'rgba(255,255,255,0.4)', marginBottom: 32 }}>Add a new member to your organization.</p>

              <form onSubmit={handleInvite}>
                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'white', marginBottom: 10 }}>Full Name</label>
                  <input 
                    type="text" 
                    value={inviteForm.name} 
                    onChange={e => setInviteForm({...inviteForm, name: e.target.value})}
                    placeholder="e.g. John Doe" 
                    className="auth-input" 
                    style={{ width: '100%', background: 'rgba(255,255,255,0.03)', padding: '14px 18px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)', color: 'white' }} 
                    required 
                  />
                </div>
                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'white', marginBottom: 10 }}>Email Address</label>
                  <input 
                    type="email" 
                    value={inviteForm.email} 
                    onChange={e => setInviteForm({...inviteForm, email: e.target.value})}
                    placeholder="name@company.com" 
                    className="auth-input" 
                    style={{ width: '100%', background: 'rgba(255,255,255,0.03)', padding: '14px 18px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)', color: 'white' }} 
                    required 
                  />
                </div>
                <div style={{ marginBottom: 32 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'white', marginBottom: 10 }}>Initial Role</label>
                  <div style={{ display: 'flex', gap: 12 }}>
                    {['MEMBER', 'ADMIN'].map(role => (
                      <button 
                        key={role}
                        type="button"
                        onClick={() => setInviteForm({...inviteForm, role})}
                        style={{ flex: 1, padding: '12px', borderRadius: 10, fontSize: 12, fontWeight: 800, border: '1px solid', borderColor: inviteForm.role === role ? 'var(--accent)' : 'rgba(255,255,255,0.05)', background: inviteForm.role === role ? 'rgba(124,58,237,0.1)' : 'rgba(255,255,255,0.02)', color: inviteForm.role === role ? 'var(--accent)' : 'rgba(255,255,255,0.4)' }}
                      >
                        {role}
                      </button>
                    ))}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                  <button type="button" onClick={() => setShowInviteModal(false)} className="btn-secondary" style={{ flex: 1, padding: 14 }}>Cancel</button>
                  <button type="submit" className="btn-submit" style={{ flex: 1, padding: 14, width: 'auto' }}>Send Invite</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- TEAM SETTINGS MODAL --- */}
      <AnimatePresence>
        {showSettingsModal && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setShowSettingsModal(false)}
              style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)' }} 
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bento-item" 
              style={{ width: '100%', maxWidth: 500, padding: 40, position: 'relative', zIndex: 1, background: '#0a0a14', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <button onClick={() => setShowSettingsModal(false)} style={{ position: 'absolute', top: 24, right: 24, background: 'rgba(255,255,255,0.05)', border: 'none', color: 'white', width: 36, height: 36, borderRadius: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={20} />
              </button>

              <h2 style={{ fontSize: 28, fontWeight: 800, color: 'white', marginBottom: 8 }}>Team Settings</h2>
              <p style={{ color: 'rgba(255,255,255,0.4)', marginBottom: 32 }}>Manage your workspace branding and configurations.</p>

              <div style={{ marginBottom: 32 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'white', marginBottom: 10 }}>Workspace Name</label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type="text" 
                    value={workspaceName} 
                    onChange={e => setWorkspaceName(e.target.value)}
                    placeholder="Enter Workspace Name" 
                    className="auth-input" 
                    style={{ width: '100%', background: 'rgba(255,255,255,0.03)', padding: '14px 18px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)', color: 'white', fontSize: 16 }} 
                  />
                  <Briefcase size={18} style={{ position: 'absolute', right: 18, top: '50%', transform: 'translateY(-50%)', opacity: 0.3 }} />
                </div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 16, padding: 20, marginBottom: 32 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                   <div>
                     <div style={{ fontSize: 14, fontWeight: 700, color: 'white' }}>Restrict Invite Power</div>
                     <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>Only owners can invite new members</div>
                   </div>
                   <div 
                    onClick={() => setSettingsForm({...settingsForm, restrictInvite: !settingsForm.restrictInvite})}
                    style={{ width: 44, height: 24, background: settingsForm.restrictInvite ? 'var(--accent)' : 'rgba(255,255,255,0.05)', borderRadius: 20, position: 'relative', cursor: 'pointer', transition: 'all 0.3s' }}
                   >
                      <motion.div 
                        animate={{ x: settingsForm.restrictInvite ? 20 : 2 }}
                        style={{ width: 20, height: 20, borderRadius: '50%', background: 'white', position: 'absolute', top: 2 }} 
                      />
                   </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                   <div>
                     <div style={{ fontSize: 14, fontWeight: 700, color: 'white' }}>Weekly Reports</div>
                     <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>Send automated activity reports</div>
                   </div>
                   <div 
                    onClick={() => setSettingsForm({...settingsForm, weeklyReports: !settingsForm.weeklyReports})}
                    style={{ width: 44, height: 24, background: settingsForm.weeklyReports ? 'var(--accent)' : 'rgba(255,255,255,0.05)', borderRadius: 20, position: 'relative', cursor: 'pointer', transition: 'all 0.3s' }}
                   >
                      <motion.div 
                        animate={{ x: settingsForm.weeklyReports ? 20 : 2 }}
                        style={{ width: 20, height: 20, borderRadius: '50%', background: 'white', position: 'absolute', top: 2 }} 
                      />
                   </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <button onClick={() => setShowSettingsModal(false)} className="btn-secondary" style={{ flex: 1, padding: 14 }}>Cancel</button>
                <button 
                  onClick={handleSaveSettings} 
                  className="btn-submit" 
                  style={{ flex: 1, padding: 14, width: 'auto' }}
                >
                  Save Changes
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style>{`
        .filter-select-premium:hover { background: rgba(255,255,255,0.06) !important; border-color: rgba(255,255,255,0.1) !important; }
        .task-table-row-hover:hover { background: rgba(255,255,255,0.02) !important; }
        .btn-delete-hover:hover { background: rgba(248,113,113,0.1) !important; color: rgba(248,113,113,1) !important; }
      `}</style>
    </motion.div>
  );
}
