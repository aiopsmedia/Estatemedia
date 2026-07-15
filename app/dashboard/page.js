'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useApp } from '@/lib/store';
import { formatCurrency, formatDate } from '@/lib/data';

const LEAD_STATUSES = ['new', 'contacted', 'qualified', 'hot', 'warm', 'cold', 'converted', 'lost'];
const CLIENT_TYPES = ['purchase', 'rent_take', 'rent_give', 'interior'];
const INTERIOR_STATUSES = ['not_started', 'running', 'on_hold', 'completed', 'closed'];

const STATUS_COLORS = {
  new: 'badge-info', contacted: 'badge-info', qualified: 'badge-info',
  hot: 'badge-danger', warm: 'badge-warning', cold: 'badge-neutral',
  converted: 'badge-success', lost: 'badge-danger',
  purchase: 'badge-info', rent_take: 'badge-success', rent_give: 'badge-warning', interior: 'badge-info',
  paid: 'badge-success', due: 'badge-danger', partial: 'badge-warning',
  not_started: 'badge-neutral', running: 'badge-info', on_hold: 'badge-warning', completed: 'badge-success', closed: 'badge-neutral',
};

function getStatusBadge(status) { return STATUS_COLORS[status] || 'badge-neutral'; }
function formatStatus(status) { return (status || '').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()); }

function StatCard({ label, value, icon, gradient }) {
  return (
    <div className="stat-card relative overflow-hidden">
      <div className="absolute top-0 right-0 w-20 h-20 sm:w-24 sm:h-24 rounded-full opacity-10 blur-2xl -mr-6 -mt-6 sm:-mr-8 sm:-mt-8" style={{ background: gradient }} />
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[10px] sm:text-xs font-medium text-white/50 uppercase tracking-wider truncate">{label}</p>
          <p className="text-lg sm:text-2xl font-bold text-white mt-1 truncate">{value}</p>
        </div>
        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: gradient, opacity: 0.9 }}>
          <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
          </svg>
        </div>
      </div>
    </div>
  );
}

function BarChart({ data, maxValue, label }) {
  if (!data || data.length === 0) return <p className="text-white/40 text-sm">No data</p>;
  const max = maxValue || Math.max(...data.map(d => d.value), 1);
  return (
    <div>
      {label && <p className="text-xs font-medium text-white/50 uppercase tracking-wider mb-3">{label}</p>}
      <div className="space-y-2">
        {data.map((item, i) => (
          <div key={i} className="flex items-center gap-2 sm:gap-3">
            <span className="text-[10px] sm:text-xs text-white/50 w-14 sm:w-20 text-right truncate">{item.label}</span>
            <div className="flex-1 h-5 sm:h-6 bg-white/5 rounded-lg overflow-hidden">
              <div className="h-full rounded-lg transition-all duration-500 flex items-center justify-end px-2"
                style={{ width: `${Math.max((item.value / max) * 100, item.value > 0 ? 8 : 0)}%`, background: item.color || 'linear-gradient(90deg, #6366f1, #818cf8)' }}>
                {item.value > 0 && <span className="text-[10px] font-semibold text-white/90">{item.value}</span>}
              </div>
            </div>
            {item.amount !== undefined && (
              <span className="text-[10px] sm:text-xs text-white/40 w-16 sm:w-24 text-right hidden sm:block">{formatCurrency(item.amount)}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user, getCollection } = useApp();
  const [activeTab, setActiveTab] = useState('overview');
  const [data, setData] = useState({ leads: [], clients: [], properties: [], payments: [], followups: [], interiorProjects: [], employees: [] });
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    async function load() {
      setLoadingData(true);
      const [leads, clients, properties, payments, followups, interiorProjects, employees] = await Promise.all([
        getCollection('leads'), getCollection('clients'), getCollection('properties'),
        getCollection('payments'), getCollection('followups'), getCollection('interiorProjects'),
        getCollection('employees'),
      ]);
      setData({ leads, clients, properties, payments, followups, interiorProjects, employees });
      setLoadingData(false);
    }
    load();
  }, [getCollection]);

  const { leads, clients, properties, payments, followups, interiorProjects, employees } = data;

  const stats = useMemo(() => {
    const totalRevenue = payments.filter(p => p.status === 'paid').reduce((s, p) => s + (Number(p.amount) || 0), 0);
    const totalExpenses = interiorProjects.reduce((s, p) => s + (Number(p.totalCost) || 0), 0);
    const pendingPayments = payments.filter(p => p.status === 'due' || p.status === 'partial').reduce((s, p) => s + (Number(p.amount) || 0), 0);
    const upcomingFollowups = followups.filter(f => {
      if (f.status === 'completed') return false;
      const d = new Date(f.date || f.scheduledDate);
      const now = new Date();
      return d >= now && d <= new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    }).length;
    return {
      totalLeads: leads.length,
      hotLeads: leads.filter(l => l.status === 'hot').length,
      warmLeads: leads.filter(l => l.status === 'warm').length,
      coldLeads: leads.filter(l => l.status === 'cold').length,
      totalClients: clients.length,
      totalProperties: properties.length,
      totalRevenue, totalExpenses, profit: totalRevenue - totalExpenses,
      pendingPayments, upcomingFollowups,
    };
  }, [leads, clients, properties, payments, followups, interiorProjects]);

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'leads', label: 'Leads' },
    { id: 'clients', label: 'Clients' },
    { id: 'financial', label: 'Financial' },
    { id: 'activity', label: 'Activity' },
  ];

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  if (loadingData) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          <p className="text-white/40 text-sm">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">{greeting}, {user?.name || 'User'}</h1>
          <p className="text-xs sm:text-sm text-white/40 mt-1">Here&apos;s your business overview for {now.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
        </div>
        <Link href="/dashboard/leads" className="glass-btn text-sm self-start">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Add Lead
        </Link>
      </div>

      <div className="overflow-x-auto -mx-3 px-3 sm:mx-0 sm:px-0">
        <div className="tabs-container min-w-max sm:min-w-0">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={"tab-btn whitespace-nowrap " + (activeTab === tab.id ? 'active' : '') + ""}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-4 sm:space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <StatCard label="Total Leads" value={stats.totalLeads} icon="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" gradient="linear-gradient(135deg, #6366f1, #8b5cf6)" />
            <StatCard label="Hot Leads" value={stats.hotLeads} icon="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" gradient="linear-gradient(135deg, #ef4444, #f97316)" />
            <StatCard label="Total Clients" value={stats.totalClients} icon="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" gradient="linear-gradient(135deg, #3b82f6, #06b6d4)" />
            <StatCard label="Properties" value={stats.totalProperties} icon="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" gradient="linear-gradient(135deg, #10b981, #34d399)" />
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <StatCard label="Revenue" value={formatCurrency(stats.totalRevenue)} icon="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" gradient="linear-gradient(135deg, #10b981, #059669)" />
            <StatCard label="Expenses" value={formatCurrency(stats.totalExpenses)} icon="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" gradient="linear-gradient(135deg, #f59e0b, #f97316)" />
            <StatCard label="Profit" value={formatCurrency(stats.profit)} icon="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" gradient={stats.profit >= 0 ? "linear-gradient(135deg, #10b981, #34d399)" : "linear-gradient(135deg, #ef4444, #f87171)"} />
            <StatCard label="Pending" value={formatCurrency(stats.pendingPayments)} icon="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" gradient="linear-gradient(135deg, #ef4444, #dc2626)" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
            <StatCard label="Warm Leads" value={stats.warmLeads} icon="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" gradient="linear-gradient(135deg, #f59e0b, #fbbf24)" />
            <StatCard label="Cold Leads" value={stats.coldLeads} icon="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" gradient="linear-gradient(135deg, #6b7280, #9ca3af)" />
            <StatCard label="Follow-ups" value={stats.upcomingFollowups} icon="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" gradient="linear-gradient(135deg, #6366f1, #8b5cf6)" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <div className="glass-card overflow-hidden">
              <div className="p-3 sm:p-4 border-b border-white/5 flex items-center justify-between">
                <h3 className="text-xs sm:text-sm font-semibold text-white/80">Recent Leads</h3>
                <Link href="/dashboard/leads" className="text-[10px] sm:text-xs text-accent hover:text-accent-light transition-colors">View All</Link>
              </div>
              <div className="overflow-x-auto">
                <table className="glass-table">
                  <thead><tr><th>Name</th><th>Status</th><th className="hidden sm:table-cell">Budget</th></tr></thead>
                  <tbody>
                    {leads.slice(-5).reverse().map(lead => (
                      <tr key={lead.id}>
                        <td className="text-white/80 font-medium text-sm">{lead.society || lead.mobile || '-'}</td>
                        <td><span className={"badge " + (getStatusBadge(lead.status)) + " text-[10px]"}>{formatStatus(lead.status)}</span></td>
                        <td className="hidden sm:table-cell text-white/60 text-sm">{lead.budget ? formatCurrency(lead.budget) : '-'}</td>
                      </tr>
                    ))}
                    {leads.length === 0 && <tr><td colSpan={3} className="text-center text-white/30 py-6 text-sm">No leads yet</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="glass-card overflow-hidden">
              <div className="p-3 sm:p-4 border-b border-white/5 flex items-center justify-between">
                <h3 className="text-xs sm:text-sm font-semibold text-white/80">Upcoming Follow-ups</h3>
                <Link href="/dashboard/followups" className="text-[10px] sm:text-xs text-accent hover:text-accent-light transition-colors">View All</Link>
              </div>
              <div className="p-3 sm:p-4 space-y-2 sm:space-y-3">
                {followups.filter(f => f.status !== 'completed').sort((a, b) => new Date(a.date || a.scheduledDate) - new Date(b.date || b.scheduledDate)).slice(0, 6).map(f => (
                  <div key={f.id} className="flex items-center gap-3 p-2.5 sm:p-3 rounded-xl bg-white/[0.03] border border-white/5">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-accent/20 flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 text-accent-light" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm text-white/80 font-medium truncate">{f.clientName || f.leadName || 'Unknown'}</p>
                      <p className="text-[10px] sm:text-xs text-white/40 truncate">{f.notes || 'Follow-up'}</p>
                    </div>
                    <span className="text-[10px] sm:text-xs text-white/30 flex-shrink-0">{formatDate(f.date || f.scheduledDate)}</span>
                  </div>
                ))}
                {followups.filter(f => f.status !== 'completed').length === 0 && <div className="text-center text-white/30 py-6 text-sm">No pending follow-ups</div>}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'leads' && (
        <div className="space-y-4 sm:space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
            {LEAD_STATUSES.map(status => (
              <div key={status} className="stat-card flex items-center gap-2 sm:gap-3">
                <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full flex-shrink-0" style={{ background: status === 'hot' ? '#ef4444' : status === 'warm' ? '#f59e0b' : status === 'cold' ? '#6b7280' : status === 'converted' ? '#10b981' : '#3b82f6' }} />
                <div>
                  <p className="text-[10px] sm:text-xs text-white/50">{formatStatus(status)}</p>
                  <p className="text-base sm:text-lg font-bold text-white">{leads.filter(l => l.status === status).length}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'clients' && (
        <div className="space-y-4 sm:space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
            {CLIENT_TYPES.map(type => (
              <div key={type} className="stat-card">
                <p className="text-[10px] sm:text-xs text-white/50">{formatStatus(type)}</p>
                <p className="text-base sm:text-lg font-bold text-white">{clients.filter(c => c.clientType === type || c.type === type).length}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'financial' && (
        <div className="space-y-4 sm:space-y-6">
          {(() => {
            const paid = payments.filter(p => p.status === 'paid').reduce((s, p) => s + (Number(p.amount) || 0), 0);
            const due = payments.filter(p => p.status === 'due').reduce((s, p) => s + (Number(p.amount) || 0), 0);
            const partial = payments.filter(p => p.status === 'partial').reduce((s, p) => s + (Number(p.amount) || 0), 0);
            const totalExpenses = interiorProjects.reduce((s, p) => s + (Number(p.totalCost) || 0), 0);
            return (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                  <StatCard label="Total Revenue" value={formatCurrency(paid)} icon="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" gradient="linear-gradient(135deg, #10b981, #059669)" />
                  <StatCard label="Total Expenses" value={formatCurrency(totalExpenses)} icon="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" gradient="linear-gradient(135deg, #f59e0b, #f97316)" />
                  <StatCard label="Net Profit" value={formatCurrency(paid - totalExpenses)} icon="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" gradient={paid - totalExpenses >= 0 ? "linear-gradient(135deg, #10b981, #34d399)" : "linear-gradient(135deg, #ef4444, #f87171)"} />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="stat-card text-center"><p className="text-[10px] sm:text-xs text-white/50">Received</p><p className="text-sm sm:text-lg font-bold text-success">{formatCurrency(paid)}</p></div>
                  <div className="stat-card text-center"><p className="text-[10px] sm:text-xs text-white/50">Partial</p><p className="text-sm sm:text-lg font-bold text-warning">{formatCurrency(partial)}</p></div>
                  <div className="stat-card text-center"><p className="text-[10px] sm:text-xs text-white/50">Due</p><p className="text-sm sm:text-lg font-bold text-danger">{formatCurrency(due)}</p></div>
                </div>
              </>
            );
          })()}
        </div>
      )}

      {activeTab === 'activity' && (
        <div className="glass-card overflow-hidden">
          <div className="p-3 sm:p-4 border-b border-white/5">
            <h3 className="text-xs sm:text-sm font-semibold text-white/80">Recent Activity</h3>
          </div>
          <div className="divide-y divide-white/5">
            {[...leads.map(l => ({ type: 'Lead', name: l.society || l.mobile || 'Unknown', action: `Status: ${formatStatus(l.status)}`, date: l.updatedAt || l.createdAt, color: '#6366f1' })),
              ...clients.map(c => ({ type: 'Client', name: c.name || 'Unknown', action: `Type: ${formatStatus(c.clientType || c.type)}`, date: c.updatedAt || c.createdAt, color: '#3b82f6' })),
              ...properties.map(p => ({ type: 'Property', name: p.flatId || p.society || 'Unknown', action: p.status || 'Active', date: p.updatedAt || p.createdAt, color: '#10b981' })),
              ...payments.map(p => ({ type: 'Payment', name: p.clientName || 'Unknown', action: `${formatCurrency(p.amount)} (${formatStatus(p.status)})`, date: p.date || p.createdAt, color: '#f59e0b' })),
            ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 15).map((act, i) => (
              <div key={i} className="flex items-center gap-3 px-3 sm:px-4 py-2.5 sm:py-3 hover:bg-white/[0.02] transition-colors">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${act.color}20` }}>
                  <span className="text-[10px] sm:text-xs font-bold" style={{ color: act.color }}>{act.type.charAt(0)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <span className="text-[10px] sm:text-xs font-medium px-1.5 py-0.5 rounded-md" style={{ background: `${act.color}20`, color: act.color }}>{act.type}</span>
                    <span className="text-xs sm:text-sm text-white/80 font-medium truncate">{act.name}</span>
                  </div>
                  <p className="text-[10px] sm:text-xs text-white/40 truncate">{act.action}</p>
                </div>
                <span className="text-[10px] sm:text-xs text-white/30 flex-shrink-0">{formatDate(act.date)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
