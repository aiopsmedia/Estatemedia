'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useApp } from '@/lib/store';
import { generateId, formatDate, formatDateTime } from '@/lib/data';

const FOLLOWUP_TYPES = [
  { value: 'call', label: 'Call' },
  { value: 'visit', label: 'Visit' },
  { value: 'email', label: 'Email' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'meeting', label: 'Meeting' },
];

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'rescheduled', label: 'Rescheduled' },
];

const TYPE_COLORS = {
  call: 'badge-success',
  visit: 'badge-info',
  email: 'badge-warning',
  whatsapp: 'badge-success',
  meeting: 'badge-danger',
};

const TYPE_DOT_COLORS = {
  call: 'bg-green-400',
  visit: 'bg-blue-400',
  email: 'bg-yellow-400',
  whatsapp: 'bg-emerald-400',
  meeting: 'bg-red-400',
};

const STATUS_BADGES = {
  pending: 'badge-warning',
  completed: 'badge-success',
  cancelled: 'badge-neutral',
  rescheduled: 'badge-info',
};

const EMPTY_FORM = {
  leadId: '',
  leadName: '',
  clientId: '',
  clientName: '',
  type: 'call',
  date: '',
  time: '',
  notes: '',
  status: 'pending',
  nextFollowupDate: '',
  assignedTo: '',
  assignedToName: '',
};

function FollowupFormModal({ followup, leads, clients, employees, onSave, onClose }) {
  const [form, setForm] = useState(followup || { ...EMPTY_FORM });

  const handleChange = (field, value) => {
    setForm(prev => {
      const next = { ...prev, [field]: value };
      if (field === 'leadId') {
        const lead = leads.find(l => l.id === value);
        next.leadName = lead ? (lead.society || lead.city || lead.mobile || 'Lead') : '';
        next.clientId = '';
        next.clientName = '';
      }
      if (field === 'clientId') {
        const client = clients.find(c => c.id === value);
        next.clientName = client ? (client.name || client.mobile || 'Client') : '';
        next.leadId = '';
        next.leadName = '';
      }
      if (field === 'assignedTo') {
        const emp = employees.find(e => e.id === value);
        next.assignedToName = emp ? emp.name : '';
      }
      return next;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.date) return;
    onSave(form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-[#1a1f2e] border border-white/10 rounded-none sm:rounded-2xl w-full sm:max-w-[640px] h-full sm:h-auto sm:max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-5 sm:p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">{followup?.id ? 'Edit Follow-up' : 'Add New Follow-up'}</h2>
            <button onClick={onClose} className="text-white/40 hover:text-white">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-3">Link To</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-white/60 mb-1">Lead</label>
                  <select className="glass-select" value={form.leadId} onChange={e => handleChange('leadId', e.target.value)}>
                    <option value="">Select Lead</option>
                    {leads.map(l => (
                      <option key={l.id} value={l.id}>{l.society || l.city || l.mobile || l.id}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-white/60 mb-1">Client</label>
                  <select className="glass-select" value={form.clientId} onChange={e => handleChange('clientId', e.target.value)}>
                    <option value="">Select Client</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>{c.name || c.mobile || c.id}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-3">Follow-up Details</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-white/60 mb-1">Type</label>
                  <select className="glass-select" value={form.type} onChange={e => handleChange('type', e.target.value)}>
                    {FOLLOWUP_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-white/60 mb-1">Date *</label>
                  <input type="date" className="glass-input" value={form.date} onChange={e => handleChange('date', e.target.value)} required />
                </div>
                <div>
                  <label className="block text-sm text-white/60 mb-1">Time</label>
                  <input type="time" className="glass-input" value={form.time} onChange={e => handleChange('time', e.target.value)} />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm text-white/60 mb-1">Notes</label>
              <textarea className="glass-input" rows={3} value={form.notes} onChange={e => handleChange('notes', e.target.value)} placeholder="Follow-up notes..." />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-white/60 mb-1">Status</label>
                <select className="glass-select" value={form.status} onChange={e => handleChange('status', e.target.value)}>
                  {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-1">Assign To</label>
                <select className="glass-select" value={form.assignedTo} onChange={e => handleChange('assignedTo', e.target.value)}>
                  <option value="">Unassigned</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm text-white/60 mb-1">Next Follow-up Date (optional)</label>
              <input type="date" className="glass-input" value={form.nextFollowupDate} onChange={e => handleChange('nextFollowupDate', e.target.value)} />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button type="button" className="glass-btn glass-btn-secondary" onClick={onClose}>Cancel</button>
              <button type="submit" className="glass-btn glass-btn-success">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                {followup?.id ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function CompleteFollowupModal({ followup, onSave, onClose }) {
  const [outcome, setOutcome] = useState('');
  const [nextDate, setNextDate] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ outcome, nextFollowupDate: nextDate || '' });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-[#1a1f2e] border border-white/10 rounded-none sm:rounded-2xl w-full sm:max-w-[480px] h-full sm:h-auto sm:max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-5 sm:p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">Complete Follow-up</h2>
            <button onClick={onClose} className="text-white/40 hover:text-white">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="glass-card p-4">
              <div className="flex items-center gap-3">
                <span className={`badge ${TYPE_COLORS[followup.type] || 'badge-neutral'}`}>{followup.type}</span>
                <div>
                  <p className="text-white text-sm font-medium">{followup.leadName || followup.clientName || 'Follow-up'}</p>
                  <p className="text-xs text-white/40">{formatDate(followup.date)} {followup.time || ''}</p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm text-white/60 mb-1">Outcome Notes</label>
              <textarea className="glass-input" rows={3} value={outcome} onChange={e => setOutcome(e.target.value)} placeholder="What was discussed/achieved..." />
            </div>

            <div>
              <label className="block text-sm text-white/60 mb-1">Next Follow-up Date (optional)</label>
              <input type="date" className="glass-input" value={nextDate} onChange={e => setNextDate(e.target.value)} />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button type="button" className="glass-btn glass-btn-secondary" onClick={onClose}>Cancel</button>
              <button type="submit" className="glass-btn glass-btn-success">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                Mark Completed
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function CalendarView({ followups, leads, clients }) {
  const grouped = useMemo(() => {
    const map = new Map();
    followups.forEach(f => {
      if (!f.date) return;
      if (!map.has(f.date)) map.set(f.date, []);
      map.get(f.date).push(f);
    });
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [followups]);

  if (grouped.length === 0) {
    return (
      <div className="text-center py-12 text-white/30">
        <svg className="w-12 h-12 mx-auto mb-3 text-white/10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <p>No follow-ups to display</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {grouped.map(([date, items]) => (
        <div key={date} className="glass-card p-4">
          <div className="flex items-center gap-3 mb-3 pb-3 border-b border-white/5">
            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
              <span className="text-sm font-bold text-white">{new Date(date + 'T00:00:00').getDate()}</span>
            </div>
            <div className="min-w-0">
              <p className="text-white font-medium text-sm">{formatDate(date)}</p>
              <p className="text-xs text-white/40">{items.length} follow-up{items.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <div className="space-y-2">
            {items.map(f => (
              <div key={f.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5">
                <div className={`w-2 h-2 rounded-full shrink-0 ${TYPE_DOT_COLORS[f.type] || 'bg-white/30'}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`badge text-xs ${TYPE_COLORS[f.type] || 'badge-neutral'}`}>{f.type}</span>
                    <span className={`badge text-xs ${STATUS_BADGES[f.status] || 'badge-neutral'}`}>{f.status}</span>
                    {f.time && <span className="text-xs text-white/40">{f.time}</span>}
                  </div>
                  <p className="text-sm text-white/70 mt-1 truncate">{f.leadName || f.clientName || 'Unlinked'}</p>
                  {f.notes && <p className="text-xs text-white/40 truncate mt-0.5">{f.notes}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function FollowupsPage() {
  const { user, getCollection, addItemToCollection, updateItemInCollection, deleteItemFromCollection, checkPermission, refresh, refreshKey } = useApp();

  const [followups, setFollowups] = useState([]);
  const [leads, setLeads] = useState([]);
  const [clients, setClients] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState('today');
  const [viewMode, setViewMode] = useState('list');
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterAssigned, setFilterAssigned] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingFollowup, setEditingFollowup] = useState(null);
  const [completingFollowup, setCompletingFollowup] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const [fData, lData, cData, eData, uData] = await Promise.all([
          getCollection('followups'),
          getCollection('leads'),
          getCollection('clients'),
          getCollection('employees'),
          getCollection('users'),
        ]);
        if (!cancelled) {
          setFollowups(fData);
          setLeads(lData);
          setClients(cData);
          setEmployees(eData);
          setUsers(uData);
        }
      } catch {
        // silently handle
      }
      if (!cancelled) setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, [getCollection, refreshKey]);

  const allPersons = useMemo(() => {
    const personMap = new Map();
    employees.forEach(e => personMap.set(e.id, { id: e.id, name: e.name }));
    users.forEach(u => personMap.set(u.id, { id: u.id, name: u.name }));
    return Array.from(personMap.values());
  }, [employees, users]);

  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const baseFollowups = useMemo(() => {
    if (user?.isSuperAdmin) return followups;
    return followups.filter(f => f.createdBy === user?.id || f.assignedTo === user?.id);
  }, [followups, user]);

  const stats = useMemo(() => {
    const all = baseFollowups;
    const today = all.filter(f => f.date === todayStr);
    const upcoming = all.filter(f => f.date > todayStr && f.status === 'pending');
    const overdue = all.filter(f => f.date < todayStr && f.status === 'pending');
    const completed = all.filter(f => f.status === 'completed');
    return {
      total: all.length,
      today: today.length,
      upcoming: upcoming.length,
      overdue: overdue.length,
      completed: completed.length,
    };
  }, [baseFollowups, todayStr]);

  const filteredFollowups = useMemo(() => {
    let result = [...baseFollowups];

    if (activeTab === 'today') {
      result = result.filter(f => f.date === todayStr);
    } else if (activeTab === 'upcoming') {
      result = result.filter(f => f.date >= todayStr);
    } else if (activeTab === 'overdue') {
      result = result.filter(f => f.date < todayStr && f.status === 'pending');
    } else if (activeTab === 'completed') {
      result = result.filter(f => f.status === 'completed');
    }

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(f =>
        f.leadName?.toLowerCase().includes(q) ||
        f.clientName?.toLowerCase().includes(q) ||
        f.notes?.toLowerCase().includes(q) ||
        f.outcome?.toLowerCase().includes(q)
      );
    }

    if (filterType) {
      result = result.filter(f => f.type === filterType);
    }

    if (filterStatus) {
      result = result.filter(f => f.status === filterStatus);
    }

    if (filterAssigned) {
      result = result.filter(f => f.assignedTo === filterAssigned);
    }

    result.sort((a, b) => {
      const da = a.date || '';
      const db = b.date || '';
      if (da !== db) return da.localeCompare(db);
      return (a.time || '').localeCompare(b.time || '');
    });

    return result;
  }, [baseFollowups, activeTab, todayStr, search, filterType, filterStatus, filterAssigned]);

  const handleSave = async (form) => {
    const isNew = !form.id;
    if (isNew) {
      await addItemToCollection('followups', {
        ...form,
        id: generateId(),
        createdBy: user.id,
        createdByName: user.name,
        createdAt: new Date().toISOString(),
      });
      showToast('Follow-up created');
    } else {
      await updateItemInCollection('followups', form.id, { ...form });
      showToast('Follow-up updated');
    }
    setShowForm(false);
    setEditingFollowup(null);
  };

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this follow-up?')) {
      await deleteItemFromCollection('followups', id);
      showToast('Follow-up deleted');
    }
  };

  const handleComplete = async ({ outcome, nextFollowupDate }) => {
    const updates = {
      status: 'completed',
      outcome: outcome || '',
    };
    if (nextFollowupDate) {
      updates.nextFollowupDate = nextFollowupDate;
    }
    await updateItemInCollection('followups', completingFollowup.id, updates);

    if (nextFollowupDate && completingFollowup.leadId) {
      await updateItemInCollection('leads', completingFollowup.leadId, {
        nextFollowup: nextFollowupDate + 'T00:00:00.000Z',
        latestNotes: outcome || completingFollowup.notes || '',
      });
    }

    setCompletingFollowup(null);
    showToast('Follow-up completed');
  };

  const tabs = [
    { id: 'today', label: 'Today', permission: 'followups_view' },
    { id: 'upcoming', label: 'Upcoming', permission: 'followups_view' },
    { id: 'overdue', label: 'Overdue', permission: 'followups_view' },
    { id: 'completed', label: 'Completed', permission: 'followups_view' },
    { id: 'all', label: 'All', permission: 'followups_view' },
  ].filter(t => checkPermission(t.permission));

  if (tabs.length === 0) {
    return (
      <div className="text-center py-20 text-white/50">
        <p className="text-lg">You don&apos;t have permission to access follow-ups.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-white/20 border-t-white/60 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-white/40">Loading follow-ups...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Follow-ups</h1>
          <p className="text-sm text-white/40 mt-1">Manage and track your follow-ups</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-xl overflow-hidden border border-white/10">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-2 text-sm transition-colors ${viewMode === 'list' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60'}`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-3 py-2 text-sm transition-colors ${viewMode === 'calendar' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60'}`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            </button>
          </div>
          {checkPermission('followups_create') && (
            <button onClick={() => { setEditingFollowup(null); setShowForm(true); }} className="glass-btn">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              <span className="hidden sm:inline">Add Follow-up</span>
              <span className="sm:hidden">Add</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="stat-card">
          <p className="text-xs text-white/40 uppercase tracking-wider">Total</p>
          <p className="text-2xl font-bold text-white mt-1">{stats.total}</p>
        </div>
        <div className="stat-card">
          <p className="text-xs text-white/40 uppercase tracking-wider">Today</p>
          <p className="text-2xl font-bold text-blue-400 mt-1">{stats.today}</p>
        </div>
        <div className="stat-card">
          <p className="text-xs text-white/40 uppercase tracking-wider">Upcoming</p>
          <p className="text-2xl font-bold text-green-400 mt-1">{stats.upcoming}</p>
        </div>
        <div className="stat-card">
          <p className="text-xs text-white/40 uppercase tracking-wider">Overdue</p>
          <p className="text-2xl font-bold text-red-400 mt-1">{stats.overdue}</p>
        </div>
        <div className="stat-card">
          <p className="text-xs text-white/40 uppercase tracking-wider">Completed</p>
          <p className="text-2xl font-bold text-emerald-400 mt-1">{stats.completed}</p>
        </div>
      </div>

      {tabs.length > 1 && (
        <div className="overflow-x-auto -mx-1 px-1">
          <div className="flex gap-1 w-max">
            {tabs.map(tab => (
              <button
                key={tab.id}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${activeTab === tab.id ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60 hover:bg-white/5'}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
                {tab.id === 'overdue' && stats.overdue > 0 && (
                  <span className="ml-1.5 text-xs bg-red-500/20 text-red-300 px-1.5 py-0.5 rounded-full">{stats.overdue}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="glass-card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              className="glass-input pl-10"
              placeholder="Search by lead, client, notes..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <select className="glass-select" value={filterType} onChange={e => setFilterType(e.target.value)}>
              <option value="">All Types</option>
              {FOLLOWUP_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            <select className="glass-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="">All Status</option>
              {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
            <select className="glass-select" value={filterAssigned} onChange={e => setFilterAssigned(e.target.value)}>
              <option value="">All Assigned</option>
              {allPersons.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      {viewMode === 'list' ? (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="glass-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Date & Time</th>
                  <th>Lead / Client</th>
                  <th className="hidden md:table-cell">Status</th>
                  <th className="hidden lg:table-cell">Assigned To</th>
                  <th className="hidden lg:table-cell">Notes</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredFollowups.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-white/30">
                      <svg className="w-12 h-12 mx-auto mb-3 text-white/10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p>No follow-ups found</p>
                    </td>
                  </tr>
                ) : (
                  filteredFollowups.map(f => {
                    const isOverdue = f.date < todayStr && f.status === 'pending';
                    return (
                      <tr key={f.id} className={isOverdue ? 'border-l-2 border-l-red-400' : ''}>
                        <td>
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${TYPE_DOT_COLORS[f.type] || 'bg-white/30'}`} />
                            <span className={`badge ${TYPE_COLORS[f.type] || 'badge-neutral'} text-xs`}>{f.type}</span>
                          </div>
                        </td>
                        <td>
                          <div className="text-white text-sm">{formatDate(f.date)}</div>
                          {f.time && <div className="text-xs text-white/40">{f.time}</div>}
                        </td>
                        <td>
                          <div className="text-white text-sm font-medium">{f.leadName || f.clientName || 'Unlinked'}</div>
                          {f.leadName && f.clientName && <div className="text-xs text-white/40">{f.clientName}</div>}
                        </td>
                        <td className="hidden md:table-cell">
                          <span className={`badge ${STATUS_BADGES[f.status] || 'badge-neutral'} text-xs`}>{f.status}</span>
                        </td>
                        <td className="hidden lg:table-cell text-white/60 text-sm">{f.assignedToName || 'Unassigned'}</td>
                        <td className="hidden lg:table-cell">
                          <p className="text-white/50 text-sm truncate max-w-[180px]">{f.notes || '-'}</p>
                          {f.outcome && <p className="text-xs text-emerald-400/60 truncate max-w-[180px] mt-0.5">Outcome: {f.outcome}</p>}
                        </td>
                        <td>
                          <div className="flex items-center gap-1">
                            {f.status === 'pending' && checkPermission('followups_edit') && (
                              <button
                                onClick={() => setCompletingFollowup(f)}
                                className="p-1.5 rounded-lg hover:bg-white/5 text-white/50 hover:text-emerald-400"
                                title="Complete"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                              </button>
                            )}
                            {checkPermission('followups_edit') && (
                              <button
                                onClick={() => { setEditingFollowup(f); setShowForm(true); }}
                                className="p-1.5 rounded-lg hover:bg-white/5 text-white/50 hover:text-blue-400"
                                title="Edit"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                              </button>
                            )}
                            {checkPermission('followups_delete') && (
                              <button
                                onClick={() => handleDelete(f.id)}
                                className="p-1.5 rounded-lg hover:bg-white/5 text-white/50 hover:text-red-400"
                                title="Delete"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          {filteredFollowups.length > 0 && (
            <div className="px-4 py-3 border-t border-white/5 text-sm text-white/40">
              Showing {filteredFollowups.length} of {baseFollowups.length} follow-ups
            </div>
          )}
        </div>
      ) : (
        <CalendarView followups={filteredFollowups} leads={leads} clients={clients} />
      )}

      {showForm && (
        <FollowupFormModal
          followup={editingFollowup}
          leads={leads}
          clients={clients}
          employees={allPersons}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditingFollowup(null); }}
        />
      )}

      {completingFollowup && (
        <CompleteFollowupModal
          followup={completingFollowup}
          onSave={handleComplete}
          onClose={() => setCompletingFollowup(null)}
        />
      )}

      {toast && (
        <div className={`toast toast-${toast.type}`}>
          {toast.message}
        </div>
      )}
    </div>
  );
}
