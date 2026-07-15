'use client';

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useApp } from '@/lib/store';
import { generateId, formatDate, formatDateTime, formatCurrency } from '@/lib/data';

const STATUS_LIST = [
  { value: 'not_started', label: 'Not Started', badge: 'badge-neutral' },
  { value: 'running', label: 'Running', badge: 'badge-info' },
  { value: 'on_hold', label: 'On Hold', badge: 'badge-warning' },
  { value: 'completed', label: 'Completed', badge: 'badge-success' },
  { value: 'closed', label: 'Closed', badge: 'badge-neutral' },
];

const BRANCH_OPTIONS = [
  { value: 'head_office', label: 'Head Office' },
  { value: 'branch', label: 'Branch' },
];

const PROJECT_TYPE_OPTIONS = [
  { value: 'residential', label: 'Residential' },
  { value: 'commercial', label: 'Commercial' },
];

const EXPENSE_CATEGORIES = [
  { value: 'material', label: 'Material' },
  { value: 'labour', label: 'Labour' },
  { value: 'other', label: 'Other' },
];

const PAYMENT_TYPES = [
  { value: 'advance', label: 'Advance' },
  { value: 'progress', label: 'Progress' },
  { value: 'final', label: 'Final' },
];

const ESTIMATE_UNITS = [
  { value: 'nos', label: 'Nos' },
  { value: 'sqft', label: 'Sqft' },
  { value: 'sqm', label: 'Sqm' },
  { value: 'rft', label: 'Rft' },
  { value: 'lot', label: 'Lot' },
  { value: 'set', label: 'Set' },
  { value: 'pair', label: 'Pair' },
  { value: 'kg', label: 'Kg' },
  { value: 'ltr', label: 'Ltr' },
  { value: 'bag', label: 'Bag' },
];

const DEFAULT_TERMS = `TERMS & CONDITIONS:
1. 40% amount before start the work
2. 40% amount paid on structure carcase fixing
3. 20% balance amount after completion of the work (GST extra)

MATERIAL DETAIL DESCRIPTIONS:
- Structure providing in HDHMR 16.75mm Century
- All shutter providing in MDF Century
- All hinges and channels use in Century/SVFT normal
- Kitchen accessories are not included
- Handle use in PR PC under ₹100
- Ceiling light & concealed light not included
- Fire fighting work not included
- Chimney core cutting extra charge - ₹1200
- The company will only do work written above`;

function getStatusBadge(status) {
  const found = STATUS_LIST.find(s => s.value === status);
  return found ? found.badge : 'badge-neutral';
}

function getStatusLabel(status) {
  const found = STATUS_LIST.find(s => s.value === status);
  return found ? found.label : status;
}

function genProjectCode(existing) {
  const nums = existing.map(p => {
    const m = p.code?.match(/IP-(\d+)/);
    return m ? parseInt(m[1], 10) : 0;
  });
  const next = nums.length > 0 ? Math.max(...nums) + 1 : 1;
  return 'IP-' + String(next).padStart(7, '0');
}

function Toast({ message, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div className={`toast toast-${type}`}>
      {message}
    </div>
  );
}

function AddProjectModal({ properties, employees, onSave, onClose }) {
  const [form, setForm] = useState({
    flatId: '',
    clientName: '',
    clientId: '',
    branch: 'head_office',
    projectType: 'residential',
    area: '',
    startDate: '',
    expectedEnd: '',
    assignedTo: '',
    assignedToName: '',
    contractAmount: '',
    scopeOfWork: '',
    status: 'not_started',
  });

  const [customFlat, setCustomFlat] = useState(false);

  const handleChange = (field, value) => {
    setForm(prev => {
      const next = { ...prev, [field]: value };
      if (field === 'flatId') {
        const prop = properties.find(p => p.id === value);
        if (prop) {
          next.clientName = prop.clientName || '';
          next.clientId = prop.clientId || '';
        }
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
    if (!form.clientName || !form.contractAmount) return;
    onSave({
      ...form,
      contractAmount: Number(form.contractAmount) || 0,
      area: Number(form.area) || 0,
      totalCost: 0,
      materialCost: 0,
      otherCost: 0,
      receivedAmount: 0,
      balanceAmount: Number(form.contractAmount) || 0,
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-fullscreen-mobile" style={{ maxWidth: 720 }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">New Interior Project</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-3">Property & Client</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-white/60 mb-1">Flat / Property</label>
                <div className="flex gap-2">
                  {!customFlat ? (
                    <select className="glass-select flex-1" value={form.flatId} onChange={e => handleChange('flatId', e.target.value)}>
                      <option value="">Select Property</option>
                      {properties.map(p => (
                        <option key={p.id} value={p.id}>{p.flatNumber || p.name || p.id}</option>
                      ))}
                    </select>
                  ) : (
                    <input type="text" className="glass-input flex-1" value={form.flatId} onChange={e => handleChange('flatId', e.target.value)} placeholder="Enter flat ID manually" />
                  )}
                  <button type="button" className="glass-btn-secondary text-xs px-3 py-2 rounded-lg whitespace-nowrap" onClick={() => setCustomFlat(!customFlat)}>
                    {customFlat ? 'Select' : 'Manual'}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-1">Client Name *</label>
                <input type="text" className="glass-input" value={form.clientName} onChange={e => handleChange('clientName', e.target.value)} required placeholder="Client name" />
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-1">Branch</label>
                <select className="glass-select" value={form.branch} onChange={e => handleChange('branch', e.target.value)}>
                  {BRANCH_OPTIONS.map(b => <option key={b.value} value={b.value}>{b.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-1">Project Type</label>
                <select className="glass-select" value={form.projectType} onChange={e => handleChange('projectType', e.target.value)}>
                  {PROJECT_TYPE_OPTIONS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-3">Project Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-white/60 mb-1">Area (sqft)</label>
                <input type="number" className="glass-input" value={form.area} onChange={e => handleChange('area', e.target.value)} placeholder="e.g. 1200" />
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-1">Start Date</label>
                <input type="date" className="glass-input" value={form.startDate} onChange={e => handleChange('startDate', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-1">Expected End Date</label>
                <input type="date" className="glass-input" value={form.expectedEnd} onChange={e => handleChange('expectedEnd', e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm text-white/60 mb-1">Assigned To</label>
                <select className="glass-select" value={form.assignedTo} onChange={e => handleChange('assignedTo', e.target.value)}>
                  <option value="">Unassigned</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-1">Contract Amount *</label>
                <input type="number" className="glass-input" value={form.contractAmount} onChange={e => handleChange('contractAmount', e.target.value)} required placeholder="₹ Amount" />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm text-white/60 mb-1">Scope of Work</label>
            <textarea className="glass-input" rows={3} value={form.scopeOfWork} onChange={e => handleChange('scopeOfWork', e.target.value)} placeholder="Describe the scope of work..." />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" className="glass-btn glass-btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="glass-btn glass-btn-success">Create Project</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ProjectDetailView({ project, expenses, payments, employees, onSaveProject, onAddExpense, onUpdateExpense, onDeleteExpense, onAddPayment, onDeletePayment, onClose, checkPermission, user, projects }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [editingProject, setEditingProject] = useState(false);
  const [editForm, setEditForm] = useState({ ...project });

  const projectExpenses = useMemo(() => expenses.filter(e => e.projectId === project.id), [expenses, project.id]);
  const projectPayments = useMemo(() => payments.filter(p => p.projectId === project.id), [payments, project.id]);

  const totalExpenses = useMemo(() => projectExpenses.reduce((s, e) => s + (Number(e.amount) || 0), 0), [projectExpenses]);
  const totalPayments = useMemo(() => projectPayments.reduce((s, p) => s + (Number(p.amount) || 0), 0), [projectPayments]);
  const profitLoss = (Number(project.contractAmount) || 0) - (Number(project.totalCost) || 0);

  const materialExpenses = useMemo(() => projectExpenses.filter(e => e.category === 'material').reduce((s, e) => s + (Number(e.amount) || 0), 0), [projectExpenses]);
  const labourExpenses = useMemo(() => projectExpenses.filter(e => e.category === 'labour').reduce((s, e) => s + (Number(e.amount) || 0), 0), [projectExpenses]);
  const otherExpenses = useMemo(() => projectExpenses.filter(e => e.category === 'other').reduce((s, e) => s + (Number(e.amount) || 0), 0), [projectExpenses]);

  const handleEditProject = (field, value) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
  };

  const saveProjectEdit = () => {
    onSaveProject(project.id, editForm);
    setEditingProject(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-fullscreen-mobile" style={{ maxWidth: 960 }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-white">{project.code || 'Interior Project'}</h2>
            <p className="text-sm text-white/40 mt-1">{project.clientName} &middot; {getStatusLabel(project.status)}</p>
          </div>
          <div className="flex items-center gap-2">
            {checkPermission('interior_edit') && (
              <button onClick={() => { setEditingProject(!editingProject); setEditForm({ ...project }); }} className="glass-btn glass-btn-secondary text-sm py-2 px-3">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                Edit
              </button>
            )}
            <button onClick={onClose} className="text-white/40 hover:text-white p-1">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>

        <div className="tabs-container mb-5 overflow-x-auto">
          {['overview', 'materials', 'payments', 'budget', 'expenses', 'team', 'invoices'].map(tab => (
            <button key={tab} className={`tab-btn ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && (
          <div className="space-y-4">
            {editingProject ? (
              <div className="glass-card p-4 space-y-4">
                <h4 className="text-sm font-semibold text-white/70">Edit Project</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-white/50 mb-1">Client Name</label>
                    <input type="text" className="glass-input" value={editForm.clientName} onChange={e => handleEditProject('clientName', e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-xs text-white/50 mb-1">Contract Amount</label>
                    <input type="number" className="glass-input" value={editForm.contractAmount} onChange={e => handleEditProject('contractAmount', e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-xs text-white/50 mb-1">Status</label>
                    <select className="glass-select" value={editForm.status} onChange={e => handleEditProject('status', e.target.value)}>
                      {STATUS_LIST.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-white/50 mb-1">Area (sqft)</label>
                    <input type="number" className="glass-input" value={editForm.area} onChange={e => handleEditProject('area', e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-xs text-white/50 mb-1">Start Date</label>
                    <input type="date" className="glass-input" value={editForm.startDate} onChange={e => handleEditProject('startDate', e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-xs text-white/50 mb-1">Expected End</label>
                    <input type="date" className="glass-input" value={editForm.expectedEnd} onChange={e => handleEditProject('expectedEnd', e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-xs text-white/50 mb-1">Total Cost</label>
                    <input type="number" className="glass-input" value={editForm.totalCost} onChange={e => handleEditProject('totalCost', e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-xs text-white/50 mb-1">Material Cost</label>
                    <input type="number" className="glass-input" value={editForm.materialCost} onChange={e => handleEditProject('materialCost', e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-xs text-white/50 mb-1">Other Cost</label>
                    <input type="number" className="glass-input" value={editForm.otherCost} onChange={e => handleEditProject('otherCost', e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-xs text-white/50 mb-1">Received Amount</label>
                    <input type="number" className="glass-input" value={editForm.receivedAmount} onChange={e => handleEditProject('receivedAmount', e.target.value)} />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-white/50 mb-1">Scope of Work</label>
                  <textarea className="glass-input" rows={3} value={editForm.scopeOfWork || ''} onChange={e => handleEditProject('scopeOfWork', e.target.value)} />
                </div>
                <div className="flex gap-2">
                  <button onClick={saveProjectEdit} className="glass-btn glass-btn-success text-sm py-2">Save Changes</button>
                  <button onClick={() => setEditingProject(false)} className="glass-btn glass-btn-secondary text-sm py-2">Cancel</button>
                </div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-white/40">Status</p>
                    <span className={`badge ${getStatusBadge(project.status)} mt-1`}>{getStatusLabel(project.status)}</span>
                  </div>
                  <div>
                    <p className="text-xs text-white/40">Branch</p>
                    <p className="text-white text-sm font-medium mt-1 capitalize">{project.branch?.replace('_', ' ') || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-white/40">Type</p>
                    <p className="text-white text-sm font-medium mt-1 capitalize">{project.projectType || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-white/40">Area</p>
                    <p className="text-white text-sm font-medium mt-1">{project.area ? project.area + ' sqft' : '-'}</p>
                  </div>
                </div>

                <div className="glass-card p-4">
                  <h4 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Financial Summary</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-xs text-white/30">Contract Amount</p>
                      <p className="text-white font-medium">{formatCurrency(project.contractAmount)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-white/30">Total Cost</p>
                      <p className="text-white font-medium">{formatCurrency(project.totalCost)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-white/30">Received</p>
                      <p className="text-green-400 font-medium">{formatCurrency(project.receivedAmount)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-white/30">Balance</p>
                      <p className="text-yellow-400 font-medium">{formatCurrency(project.balanceAmount)}</p>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-white/5">
                    <p className="text-xs text-white/30">Profit / Loss</p>
                    <p className={`text-lg font-bold ${profitLoss >= 0 ? 'text-green-400' : 'text-red-400'}`}>{formatCurrency(profitLoss)}</p>
                  </div>
                </div>

                <div className="glass-card p-4">
                  <h4 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Project Info</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-xs text-white/30">Client</p>
                      <p className="text-white">{project.clientName || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-white/30">Flat / Property</p>
                      <p className="text-white">{project.flatId || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-white/30">Assigned To</p>
                      <p className="text-white">{project.assignedToName || 'Unassigned'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-white/30">Start Date</p>
                      <p className="text-white">{formatDate(project.startDate)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-white/30">Expected End</p>
                      <p className="text-white">{formatDate(project.expectedEnd)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-white/30">Created</p>
                      <p className="text-white">{formatDateTime(project.createdAt)}</p>
                    </div>
                  </div>
                </div>

                {project.scopeOfWork && (
                  <div className="glass-card p-4">
                    <h4 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">Scope of Work</h4>
                    <p className="text-white/80 text-sm whitespace-pre-wrap">{project.scopeOfWork}</p>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {activeTab === 'materials' && (
          <MaterialsTab projectId={project.id} expenses={projectExpenses} onAdd={onAddExpense} onUpdate={onUpdateExpense} onDelete={onDeleteExpense} checkPermission={checkPermission} />
        )}

        {activeTab === 'payments' && (
          <PaymentsTab projectId={project.id} payments={projectPayments} onAdd={onAddPayment} onDelete={onDeletePayment} checkPermission={checkPermission} />
        )}

        {activeTab === 'budget' && (
          <div className="space-y-4">
            <div className="glass-card p-4">
              <h4 className="text-sm font-semibold text-white/70 mb-4">Contract vs Actual Breakdown</h4>
              <div className="overflow-x-auto">
                <table className="glass-table">
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="text-white/70">Contract Amount</td>
                      <td className="text-white font-medium">{formatCurrency(project.contractAmount)}</td>
                    </tr>
                    <tr>
                      <td className="text-white/70">Material Cost</td>
                      <td className="text-white">{formatCurrency(project.materialCost || materialExpenses)}</td>
                    </tr>
                    <tr>
                      <td className="text-white/70">Labour Cost</td>
                      <td className="text-white">{formatCurrency(labourExpenses)}</td>
                    </tr>
                    <tr>
                      <td className="text-white/70">Other Cost</td>
                      <td className="text-white">{formatCurrency(project.otherCost || otherExpenses)}</td>
                    </tr>
                    <tr className="border-t border-white/10">
                      <td className="text-white font-semibold">Total Cost</td>
                      <td className="text-white font-semibold">{formatCurrency(project.totalCost || totalExpenses)}</td>
                    </tr>
                    <tr>
                      <td className="text-white font-semibold">Profit / Loss</td>
                      <td className={`font-semibold ${profitLoss >= 0 ? 'text-green-400' : 'text-red-400'}`}>{formatCurrency(profitLoss)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'expenses' && (
          <ExpensesTab projectId={project.id} expenses={projectExpenses} onAdd={onAddExpense} onDelete={onDeleteExpense} checkPermission={checkPermission} />
        )}

        {activeTab === 'team' && (
          <div className="space-y-4">
            <div className="glass-card p-4">
              <h4 className="text-sm font-semibold text-white/70 mb-3">Assigned Team</h4>
              {project.assignedToName ? (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                    {project.assignedToName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-white font-medium">{project.assignedToName}</p>
                    <p className="text-xs text-white/40">Interior Project Lead</p>
                  </div>
                </div>
              ) : (
                <p className="text-white/40 text-sm">No team member assigned</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'invoices' && (
          <div className="space-y-4">
            <div className="glass-card p-8 text-center text-white/30">
              <svg className="w-12 h-12 mx-auto mb-3 text-white/10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              <p>Invoices for this project will appear here</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function MaterialsTab({ projectId, expenses, onAdd, onUpdate, onDelete, checkPermission }) {
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ description: '', quantity: '', unitPrice: '', amount: '' });

  const materialItems = useMemo(() => expenses.filter(e => e.category === 'material'), [expenses]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const item = {
      projectId,
      category: 'material',
      description: form.description,
      quantity: Number(form.quantity) || 0,
      unitPrice: Number(form.unitPrice) || 0,
      amount: Number(form.amount) || (Number(form.quantity) || 0) * (Number(form.unitPrice) || 0),
      date: new Date().toISOString(),
    };
    if (editId) {
      onUpdate(editId, item);
    } else {
      onAdd(item);
    }
    setForm({ description: '', quantity: '', unitPrice: '', amount: '' });
    setEditId(null);
    setShowForm(false);
  };

  const startEdit = (exp) => {
    setForm({ description: exp.description, quantity: exp.quantity || '', unitPrice: exp.unitPrice || '', amount: exp.amount || '' });
    setEditId(exp.id);
    setShowForm(true);
  };

  const calcAmount = (q, u) => (Number(q) || 0) * (Number(u) || 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-white/70">Material Entries ({materialItems.length})</h4>
        {checkPermission('interior_edit') && (
          <button onClick={() => { setShowForm(!showForm); setEditId(null); setForm({ description: '', quantity: '', unitPrice: '', amount: '' }); }} className="glass-btn text-sm py-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Add Material
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="glass-card p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs text-white/50 mb-1">Description</label>
              <input type="text" className="glass-input" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} required placeholder="Material description" />
            </div>
            <div>
              <label className="block text-xs text-white/50 mb-1">Quantity</label>
              <input type="number" className="glass-input" value={form.quantity} onChange={e => {
                const v = e.target.value;
                setForm(p => ({ ...p, quantity: v, amount: calcAmount(v, p.unitPrice) }));
              }} placeholder="Qty" />
            </div>
            <div>
              <label className="block text-xs text-white/50 mb-1">Unit Price</label>
              <input type="number" className="glass-input" value={form.unitPrice} onChange={e => {
                const v = e.target.value;
                setForm(p => ({ ...p, unitPrice: v, amount: calcAmount(p.quantity, v) }));
              }} placeholder="₹ Price" />
            </div>
            <div>
              <label className="block text-xs text-white/50 mb-1">Amount</label>
              <input type="number" className="glass-input" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} placeholder="Total" />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="glass-btn glass-btn-success text-sm py-2">{editId ? 'Update' : 'Add'} Material</button>
            <button type="button" className="glass-btn glass-btn-secondary text-sm py-2" onClick={() => { setShowForm(false); setEditId(null); }}>Cancel</button>
          </div>
        </form>
      )}

      {materialItems.length > 0 ? (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="glass-table">
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Qty</th>
                  <th>Unit Price</th>
                  <th>Amount</th>
                  <th>Date</th>
                  {checkPermission('interior_edit') && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {materialItems.map(item => (
                  <tr key={item.id}>
                    <td className="text-white text-sm">{item.description}</td>
                    <td className="text-white/70 text-sm">{item.quantity || '-'}</td>
                    <td className="text-white/70 text-sm">{formatCurrency(item.unitPrice)}</td>
                    <td className="text-white font-medium text-sm">{formatCurrency(item.amount)}</td>
                    <td className="text-white/50 text-sm">{formatDate(item.date || item.createdAt)}</td>
                    {checkPermission('interior_edit') && (
                      <td>
                        <div className="flex gap-1">
                          <button onClick={() => startEdit(item)} className="p-1 rounded hover:bg-white/5 text-white/50 hover:text-accent-light"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg></button>
                          <button onClick={() => onDelete(item.id)} className="p-1 rounded hover:bg-white/5 text-white/50 hover:text-danger"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="glass-card p-8 text-center text-white/30">No material entries yet</div>
      )}
    </div>
  );
}

function PaymentsTab({ projectId, payments, onAdd, onDelete, checkPermission }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ amount: '', type: 'advance', paidDate: '', paidVia: '', notes: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    onAdd({
      projectId,
      amount: Number(form.amount) || 0,
      type: form.type,
      paidDate: form.paidDate || new Date().toISOString().split('T')[0],
      paidVia: form.paidVia,
      notes: form.notes,
    });
    setForm({ amount: '', type: 'advance', paidDate: '', paidVia: '', notes: '' });
    setShowForm(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-white/70">Payment Entries ({payments.length})</h4>
        {checkPermission('interior_edit') && (
          <button onClick={() => setShowForm(!showForm)} className="glass-btn glass-btn-success text-sm py-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Add Payment
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="glass-card p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-white/50 mb-1">Amount *</label>
              <input type="number" className="glass-input" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} required placeholder="₹ Amount" />
            </div>
            <div>
              <label className="block text-xs text-white/50 mb-1">Payment Type</label>
              <select className="glass-select" value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}>
                {PAYMENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-white/50 mb-1">Paid Date</label>
              <input type="date" className="glass-input" value={form.paidDate} onChange={e => setForm(p => ({ ...p, paidDate: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs text-white/50 mb-1">Paid Via</label>
              <input type="text" className="glass-input" value={form.paidVia} onChange={e => setForm(p => ({ ...p, paidVia: e.target.value }))} placeholder="Cash / UPI / Bank Transfer" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs text-white/50 mb-1">Notes</label>
              <input type="text" className="glass-input" value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="Optional notes" />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="glass-btn glass-btn-success text-sm py-2">Save Payment</button>
            <button type="button" className="glass-btn glass-btn-secondary text-sm py-2" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </form>
      )}

      {payments.length > 0 ? (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="glass-table">
              <thead>
                <tr>
                  <th>Amount</th>
                  <th>Type</th>
                  <th>Date</th>
                  <th>Via</th>
                  <th>Notes</th>
                  {checkPermission('interior_edit') && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {payments.sort((a, b) => new Date(b.paidDate || b.createdAt) - new Date(a.paidDate || a.createdAt)).map(p => (
                  <tr key={p.id}>
                    <td className="text-green-400 font-medium">{formatCurrency(p.amount)}</td>
                    <td className="capitalize text-white/70 text-sm">{p.type}</td>
                    <td className="text-white/50 text-sm">{formatDate(p.paidDate)}</td>
                    <td className="text-white/70 text-sm">{p.paidVia || '-'}</td>
                    <td className="text-white/50 text-sm">{p.notes || '-'}</td>
                    {checkPermission('interior_edit') && (
                      <td>
                        <button onClick={() => onDelete(p.id)} className="p-1 rounded hover:bg-white/5 text-white/50 hover:text-danger"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="glass-card p-8 text-center text-white/30">No payments recorded yet</div>
      )}
    </div>
  );
}

function ExpensesTab({ projectId, expenses, onAdd, onDelete, checkPermission }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ category: 'material', description: '', amount: '', date: '', vendor: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    onAdd({
      projectId,
      category: form.category,
      description: form.description,
      amount: Number(form.amount) || 0,
      date: form.date || new Date().toISOString().split('T')[0],
      vendor: form.vendor,
    });
    setForm({ category: 'material', description: '', amount: '', date: '', vendor: '' });
    setShowForm(false);
  };

  const groupedExpenses = useMemo(() => {
    const groups = { material: [], labour: [], other: [] };
    expenses.forEach(e => {
      const cat = groups[e.category] ? e.category : 'other';
      groups[cat].push(e);
    });
    return groups;
  }, [expenses]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-white/70">All Expenses ({expenses.length})</h4>
        {checkPermission('interior_edit') && (
          <button onClick={() => setShowForm(!showForm)} className="glass-btn text-sm py-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Add Expense
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="glass-card p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-white/50 mb-1">Category</label>
              <select className="glass-select" value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
                {EXPENSE_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-white/50 mb-1">Amount *</label>
              <input type="number" className="glass-input" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} required placeholder="₹ Amount" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs text-white/50 mb-1">Description</label>
              <input type="text" className="glass-input" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} required placeholder="Expense description" />
            </div>
            <div>
              <label className="block text-xs text-white/50 mb-1">Date</label>
              <input type="date" className="glass-input" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs text-white/50 mb-1">Vendor</label>
              <input type="text" className="glass-input" value={form.vendor} onChange={e => setForm(p => ({ ...p, vendor: e.target.value }))} placeholder="Vendor name" />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="glass-btn glass-btn-success text-sm py-2">Save Expense</button>
            <button type="button" className="glass-btn glass-btn-secondary text-sm py-2" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </form>
      )}

      {Object.entries(groupedExpenses).filter(([, items]) => items.length > 0).map(([cat, items]) => (
        <div key={cat} className="glass-card overflow-hidden">
          <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
            <h5 className="text-sm font-semibold text-white/70 capitalize">{cat} Expenses</h5>
            <span className="text-xs text-white/40">{formatCurrency(items.reduce((s, e) => s + (Number(e.amount) || 0), 0))}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="glass-table">
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Amount</th>
                  <th>Date</th>
                  <th>Vendor</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id}>
                    <td className="text-white text-sm">{item.description}</td>
                    <td className="text-white font-medium text-sm">{formatCurrency(item.amount)}</td>
                    <td className="text-white/50 text-sm">{formatDate(item.date || item.createdAt)}</td>
                    <td className="text-white/70 text-sm">{item.vendor || '-'}</td>
                    <td>
                      <button onClick={() => onDelete(item.id)} className="p-1 rounded hover:bg-white/5 text-white/50 hover:text-danger"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {expenses.length === 0 && (
        <div className="glass-card p-8 text-center text-white/30">No expenses recorded yet</div>
      )}
    </div>
  );
}

function CreateEstimateModal({ onSave, onClose, leads, properties, projects, employees, user }) {
  const [form, setForm] = useState({
    title: '',
    validUntil: '',
    leadId: '',
    projectId: '',
    fullName: '',
    mobile: '',
    email: '',
    instructions: '',
    deliveryTerms: '',
    paymentTerms: DEFAULT_TERMS,
    items: [{ title: '', description: '', quantity: 1, unit: 'nos', rate: 0, amount: 0 }],
    taxPercent: 0,
    discount: 0,
    notes: '',
  });

  const handleChange = (field, value) => {
    setForm(prev => {
      const next = { ...prev, [field]: value };
      if (field === 'leadId') {
        const lead = leads.find(l => l.id === value);
        if (lead) {
          next.fullName = lead.name || lead.society || '';
          next.mobile = lead.mobile || '';
          next.email = lead.email || '';
        }
      }
      return next;
    });
  };

  const handleItemChange = (index, field, value) => {
    setForm(prev => {
      const items = [...prev.items];
      items[index] = { ...items[index], [field]: value };
      if (field === 'quantity' || field === 'rate') {
        const qty = field === 'quantity' ? Number(value) || 0 : Number(items[index].quantity) || 0;
        const rate = field === 'rate' ? Number(value) || 0 : Number(items[index].rate) || 0;
        items[index].amount = qty * rate;
      }
      return { ...prev, items };
    });
  };

  const addItem = () => {
    setForm(prev => ({
      ...prev,
      items: [...prev.items, { title: '', description: '', quantity: 1, unit: 'nos', rate: 0, amount: 0 }],
    }));
  };

  const removeItem = (index) => {
    setForm(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const subtotal = useMemo(() => form.items.reduce((s, i) => s + (Number(i.amount) || 0), 0), [form.items]);
  const tax = subtotal * (Number(form.taxPercent) || 0) / 100;
  const total = subtotal + tax - (Number(form.discount) || 0);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title) return;
    const emp = employees.find(e => e.id === user?.id);
    onSave({
      ...form,
      subtotal,
      tax,
      total,
      createdBy: user?.id,
      createdByName: emp?.name || user?.name || '',
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-fullscreen-mobile" style={{ maxWidth: 860 }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Create Estimate</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-white/60 mb-1">Title *</label>
              <input type="text" className="glass-input" value={form.title} onChange={e => handleChange('title', e.target.value)} required placeholder="Estimate title" />
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-1">Valid Until</label>
              <input type="date" className="glass-input" value={form.validUntil} onChange={e => handleChange('validUntil', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-1">Lead</label>
              <select className="glass-select" value={form.leadId} onChange={e => handleChange('leadId', e.target.value)}>
                <option value="">Select Lead</option>
                {leads.map(l => <option key={l.id} value={l.id}>{l.society || l.mobile || l.id}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-1">Project</label>
              <select className="glass-select" value={form.projectId} onChange={e => handleChange('projectId', e.target.value)}>
                <option value="">Select Project</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.code} - {p.clientName}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-white/60 mb-1">Full Name</label>
              <input type="text" className="glass-input" value={form.fullName} onChange={e => handleChange('fullName', e.target.value)} placeholder="Client full name" />
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-1">Mobile</label>
              <input type="text" className="glass-input" value={form.mobile} onChange={e => handleChange('mobile', e.target.value)} placeholder="Phone number" />
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-1">Email</label>
              <input type="email" className="glass-input" value={form.email} onChange={e => handleChange('email', e.target.value)} placeholder="Email address" />
            </div>
          </div>

          <div>
            <label className="block text-sm text-white/60 mb-1">Instructions / Scope</label>
            <textarea className="glass-input" rows={2} value={form.instructions} onChange={e => handleChange('instructions', e.target.value)} placeholder="Instructions or scope of work..." />
          </div>

          <div>
            <label className="block text-sm text-white/60 mb-1">Delivery Terms</label>
            <textarea className="glass-input" rows={2} value={form.deliveryTerms} onChange={e => handleChange('deliveryTerms', e.target.value)} placeholder="Delivery terms..." />
          </div>

          <div>
            <label className="block text-sm text-white/60 mb-1">Payment Terms</label>
            <textarea className="glass-input" rows={6} value={form.paymentTerms} onChange={e => handleChange('paymentTerms', e.target.value)} placeholder="Payment terms..." />
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider">Items</h3>
              <button type="button" onClick={addItem} className="glass-btn text-xs py-1 px-3">+ Add Item</button>
            </div>
            <div className="space-y-3">
              {form.items.map((item, idx) => (
                <div key={idx} className="glass-card p-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-3">
                    <div className="sm:col-span-2 md:col-span-2">
                      <label className="block text-xs text-white/40 mb-1">Title</label>
                      <input type="text" className="glass-input text-sm" value={item.title} onChange={e => handleItemChange(idx, 'title', e.target.value)} placeholder="Item title" />
                    </div>
                    <div>
                      <label className="block text-xs text-white/40 mb-1">Qty</label>
                      <input type="number" className="glass-input text-sm" value={item.quantity} onChange={e => handleItemChange(idx, 'quantity', e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-xs text-white/40 mb-1">Unit</label>
                      <select className="glass-select text-sm" value={item.unit} onChange={e => handleItemChange(idx, 'unit', e.target.value)}>
                        {ESTIMATE_UNITS.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-white/40 mb-1">Rate</label>
                      <input type="number" className="glass-input text-sm" value={item.rate} onChange={e => handleItemChange(idx, 'rate', e.target.value)} />
                    </div>
                    <div className="flex items-end gap-1">
                      <div className="flex-1">
                        <label className="block text-xs text-white/40 mb-1">Amount</label>
                        <div className="glass-input text-sm bg-white/5 text-white font-medium">{formatCurrency(item.amount)}</div>
                      </div>
                      {form.items.length > 1 && (
                        <button type="button" onClick={() => removeItem(idx)} className="p-2 rounded-lg hover:bg-white/5 text-white/40 hover:text-danger mb-0.5">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="mt-2">
                    <input type="text" className="glass-input text-xs" value={item.description} onChange={e => handleItemChange(idx, 'description', e.target.value)} placeholder="Item description (optional)" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-white/60 mb-1">Tax %</label>
              <input type="number" className="glass-input" value={form.taxPercent} onChange={e => handleChange('taxPercent', e.target.value)} placeholder="e.g. 18" />
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-1">Discount (₹)</label>
              <input type="number" className="glass-input" value={form.discount} onChange={e => handleChange('discount', e.target.value)} placeholder="0" />
            </div>
            <div className="flex flex-col justify-end">
              <div className="glass-card p-3 space-y-1">
                <div className="flex justify-between text-sm"><span className="text-white/50">Subtotal</span><span className="text-white">{formatCurrency(subtotal)}</span></div>
                <div className="flex justify-between text-sm"><span className="text-white/50">Tax</span><span className="text-white">{formatCurrency(tax)}</span></div>
                <div className="flex justify-between text-sm"><span className="text-white/50">Discount</span><span className="text-white">-{formatCurrency(form.discount)}</span></div>
                <div className="flex justify-between text-sm font-bold border-t border-white/10 pt-1"><span className="text-white">Total</span><span className="text-accent-light">{formatCurrency(total)}</span></div>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm text-white/60 mb-1">Notes</label>
            <textarea className="glass-input" rows={2} value={form.notes} onChange={e => handleChange('notes', e.target.value)} placeholder="Additional notes..." />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" className="glass-btn glass-btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="glass-btn glass-btn-success">Create Estimate</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EstimatePrintView({ estimate, onClose }) {
  const printRef = useRef(null);

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      <div className="no-print modal-overlay" onClick={onClose}>
        <div className="modal-content modal-fullscreen-mobile" style={{ maxWidth: 860 }} onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between mb-4 no-print">
            <h2 className="text-xl font-bold text-white">Estimate Preview</h2>
            <div className="flex gap-2">
              <button onClick={handlePrint} className="glass-btn glass-btn-success text-sm py-2">Print / Save PDF</button>
              <button onClick={onClose} className="text-white/40 hover:text-white p-1">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          </div>

          <div ref={printRef} className="bg-white text-gray-900 p-4 sm:p-8 rounded-lg" style={{ fontFamily: 'Georgia, serif' }}>
            <div className="text-center border-b-2 border-gray-800 pb-4 mb-6">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 tracking-wide">Estate ERP</h1>
              <p className="text-gray-500 text-sm mt-1">Interior Design &amp; Execution</p>
            </div>

            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-800">ESTIMATE</h2>
                <p className="text-sm text-gray-600 mt-1">{estimate.title}</p>
              </div>
              <div className="sm:text-right text-sm">
                <p><strong>Date:</strong> {formatDate(estimate.createdAt)}</p>
                {estimate.validUntil && <p><strong>Valid Until:</strong> {formatDate(estimate.validUntil)}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6 p-4 bg-gray-50 rounded">
              <div>
                <h3 className="font-bold text-sm text-gray-500 uppercase mb-2">From</h3>
                <p className="font-bold">Estate ERP</p>
                <p className="text-sm text-gray-600">Interior Design Studio</p>
              </div>
              <div>
                <h3 className="font-bold text-sm text-gray-500 uppercase mb-2">To</h3>
                <p className="font-bold">{estimate.fullName || 'Client'}</p>
                {estimate.mobile && <p className="text-sm text-gray-600">Mobile: {estimate.mobile}</p>}
                {estimate.email && <p className="text-sm text-gray-600">Email: {estimate.email}</p>}
              </div>
            </div>

            {estimate.instructions && (
              <div className="mb-6">
                <h3 className="font-bold text-sm text-gray-500 uppercase mb-2">Scope / Instructions</h3>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{estimate.instructions}</p>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full border-collapse mb-6 text-sm">
                <thead>
                  <tr className="bg-gray-800 text-white">
                    <th className="p-2 text-left">#</th>
                    <th className="p-2 text-left">Title</th>
                    <th className="p-2 text-left hidden sm:table-cell">Description</th>
                    <th className="p-2 text-center">Qty</th>
                    <th className="p-2 text-center hidden sm:table-cell">Unit</th>
                    <th className="p-2 text-right">Rate</th>
                    <th className="p-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {estimate.items.map((item, idx) => (
                    <tr key={idx} className="border-b border-gray-200">
                      <td className="p-2 text-gray-500">{idx + 1}</td>
                      <td className="p-2 font-medium">{item.title}</td>
                      <td className="p-2 text-gray-600 hidden sm:table-cell">{item.description || '-'}</td>
                      <td className="p-2 text-center">{item.quantity}</td>
                      <td className="p-2 text-center uppercase hidden sm:table-cell">{item.unit}</td>
                      <td className="p-2 text-right">₹{Number(item.rate).toLocaleString('en-IN')}</td>
                      <td className="p-2 text-right font-medium">₹{Number(item.amount).toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end mb-6">
              <div className="w-full sm:w-64">
                <div className="flex justify-between py-1 text-sm"><span className="text-gray-600">Subtotal</span><span>₹{estimate.subtotal?.toLocaleString('en-IN') || '0'}</span></div>
                {estimate.taxPercent > 0 && (
                  <div className="flex justify-between py-1 text-sm"><span className="text-gray-600">Tax ({estimate.taxPercent}%)</span><span>₹{estimate.tax?.toLocaleString('en-IN') || '0'}</span></div>
                )}
                {estimate.discount > 0 && (
                  <div className="flex justify-between py-1 text-sm"><span className="text-gray-600">Discount</span><span>-₹{estimate.discount?.toLocaleString('en-IN') || '0'}</span></div>
                )}
                <div className="flex justify-between py-2 text-lg font-bold border-t-2 border-gray-800 mt-1"><span>Total</span><span>₹{estimate.total?.toLocaleString('en-IN') || '0'}</span></div>
              </div>
            </div>

            {estimate.deliveryTerms && (
              <div className="mb-4">
                <h3 className="font-bold text-sm text-gray-500 uppercase mb-2">Delivery Terms</h3>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{estimate.deliveryTerms}</p>
              </div>
            )}

            <div className="mb-6">
              <h3 className="font-bold text-sm text-gray-500 uppercase mb-2">Terms &amp; Conditions</h3>
              <pre className="text-xs text-gray-600 whitespace-pre-wrap font-sans leading-relaxed">{estimate.paymentTerms || DEFAULT_TERMS}</pre>
            </div>

            {estimate.notes && (
              <div className="mb-6">
                <h3 className="font-bold text-sm text-gray-500 uppercase mb-2">Notes</h3>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{estimate.notes}</p>
              </div>
            )}

            <div className="border-t border-gray-300 pt-4 mt-8">
              <div className="flex justify-between items-end">
                <div className="text-sm text-gray-500">
                  {estimate.createdByName && <p>Prepared by: <strong>{estimate.createdByName}</strong></p>}
                  <p className="text-xs mt-1">This is a computer-generated estimate.</p>
                </div>
                <div className="text-right">
                  <div className="border-t border-gray-400 w-48 mb-1"></div>
                  <p className="text-sm text-gray-500">Authorized Signatory</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          body * { visibility: hidden; }
          .modal-content, .modal-content * { visibility: visible; }
          .modal-content { position: absolute; left: 0; top: 0; width: 100%; max-width: 100%; padding: 20px; max-height: none; overflow: visible; }
          .no-print { display: none !important; }
        }
        @media (max-width: 640px) {
          .modal-fullscreen-mobile {
            max-width: 100% !important;
            width: 100% !important;
            height: 100% !important;
            max-height: 100% !important;
            border-radius: 0 !important;
            margin: 0 !important;
          }
          .modal-overlay {
            padding: 0 !important;
          }
        }
      `}</style>
    </>
  );
}

export default function InteriorPage() {
  const { user, getCollection, addItemToCollection, updateItemInCollection, deleteItemFromCollection, checkPermission, refresh, refreshKey: storeRefreshKey } = useApp();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [viewProject, setViewProject] = useState(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [toast, setToast] = useState(null);
  const [showEstimateForm, setShowEstimateForm] = useState(false);
  const [printEstimate, setPrintEstimate] = useState(null);
  const [localRefreshKey, setLocalRefreshKey] = useState(0);

  const [projects, setProjects] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [payments, setPayments] = useState([]);
  const [properties, setProperties] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [leads, setLeads] = useState([]);
  const [estimates, setEstimates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [projData, expData, payData, propData, empData, leadData, estData] = await Promise.all([
        getCollection('interiorProjects'),
        getCollection('interiorExpenses'),
        getCollection('interiorPayments'),
        getCollection('properties'),
        getCollection('employees'),
        getCollection('leads'),
        getCollection('estimates'),
      ]);
      setProjects(projData);
      setExpenses(expData);
      setPayments(payData);
      setProperties(propData);
      setEmployees(empData);
      setLeads(leadData);
      setEstimates(estData);
      setLoading(false);
    }
    load();
  }, [getCollection, storeRefreshKey, localRefreshKey]);

  const triggerRefresh = useCallback(() => {
    setLocalRefreshKey(k => k + 1);
  }, []);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const allPersons = useMemo(() => {
    const personMap = new Map();
    employees.forEach(e => personMap.set(e.id, { id: e.id, name: e.name }));
    if (user) personMap.set(user.id, { id: user.id, name: user.name });
    return Array.from(personMap.values());
  }, [employees, user]);

  const stats = useMemo(() => {
    const tc = projects.reduce((s, p) => s + (Number(p.contractAmount) || 0), 0);
    const tcost = projects.reduce((s, p) => s + (Number(p.totalCost) || 0), 0);
    const tmat = projects.reduce((s, p) => s + (Number(p.materialCost) || 0), 0);
    const toth = projects.reduce((s, p) => s + (Number(p.otherCost) || 0), 0);
    const trec = projects.reduce((s, p) => s + (Number(p.receivedAmount) || 0), 0);
    const tbal = projects.reduce((s, p) => s + (Number(p.balanceAmount) || 0), 0);
    return {
      totalContract: tc,
      totalCost: tcost,
      totalMaterial: tmat,
      totalReceived: trec,
      totalBalance: tbal,
      profitLoss: tc - tcost,
      count: projects.length,
      notStarted: projects.filter(p => p.status === 'not_started').length,
      running: projects.filter(p => p.status === 'running').length,
      onHold: projects.filter(p => p.status === 'on_hold').length,
      completed: projects.filter(p => p.status === 'completed').length,
      closed: projects.filter(p => p.status === 'closed').length,
    };
  }, [projects]);

  const filteredProjects = useMemo(() => {
    let result = [...projects];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(p =>
        p.clientName?.toLowerCase().includes(q) ||
        p.code?.toLowerCase().includes(q) ||
        p.flatId?.toLowerCase().includes(q) ||
        p.assignedToName?.toLowerCase().includes(q)
      );
    }
    if (filterStatus) {
      result = result.filter(p => p.status === filterStatus);
    }
    result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return result;
  }, [projects, search, filterStatus]);

  const handleAddProject = async (formData) => {
    const code = genProjectCode(projects);
    await addItemToCollection('interiorProjects', {
      ...formData,
      code,
      id: generateId(),
      createdBy: user?.id,
      createdByName: user?.name,
      createdAt: new Date().toISOString(),
    });
    setShowProjectForm(false);
    triggerRefresh();
    showToast('Interior project created successfully');
  };

  const handleSaveProject = async (id, updates) => {
    await updateItemInCollection('interiorProjects', id, {
      ...updates,
      contractAmount: Number(updates.contractAmount) || 0,
      totalCost: Number(updates.totalCost) || 0,
      materialCost: Number(updates.materialCost) || 0,
      otherCost: Number(updates.otherCost) || 0,
      receivedAmount: Number(updates.receivedAmount) || 0,
      balanceAmount: (Number(updates.contractAmount) || 0) - (Number(updates.receivedAmount) || 0),
    });
    setViewProject(prev => prev && prev.id === id ? { ...prev, ...updates } : prev);
    triggerRefresh();
    showToast('Project updated');
  };

  const handleDeleteProject = async (id) => {
    if (confirm('Are you sure you want to delete this project? This will also remove all associated expenses and payments.')) {
      await deleteItemFromCollection('interiorProjects', id);
      const projExpenses = expenses.filter(e => e.projectId === id);
      const projPayments = payments.filter(p => p.projectId === id);
      await Promise.all([
        ...projExpenses.map(e => deleteItemFromCollection('interiorExpenses', e.id)),
        ...projPayments.map(p => deleteItemFromCollection('interiorPayments', p.id)),
      ]);
      if (viewProject?.id === id) setViewProject(null);
      triggerRefresh();
      showToast('Project deleted');
    }
  };

  const handleAddExpense = async (data) => {
    await addItemToCollection('interiorExpenses', {
      ...data,
      id: generateId(),
      createdAt: new Date().toISOString(),
    });
    const projExpenses = [...expenses.filter(e => e.projectId === data.projectId), data];
    const totalMat = projExpenses.filter(e => e.category === 'material').reduce((s, e) => s + (Number(e.amount) || 0), 0);
    const totalLabour = projExpenses.filter(e => e.category === 'labour').reduce((s, e) => s + (Number(e.amount) || 0), 0);
    const totalOther = projExpenses.filter(e => e.category === 'other').reduce((s, e) => s + (Number(e.amount) || 0), 0);
    await updateItemInCollection('interiorProjects', data.projectId, {
      materialCost: totalMat,
      totalCost: totalMat + totalLabour + totalOther,
    });
    triggerRefresh();
    showToast('Expense added');
  };

  const handleUpdateExpense = async (id, data) => {
    await updateItemInCollection('interiorExpenses', id, data);
    const projExpenses = expenses.map(e => e.id === id ? { ...e, ...data } : e).filter(e => e.projectId === data.projectId);
    const totalMat = projExpenses.filter(e => e.category === 'material').reduce((s, e) => s + (Number(e.amount) || 0), 0);
    const totalLabour = projExpenses.filter(e => e.category === 'labour').reduce((s, e) => s + (Number(e.amount) || 0), 0);
    const totalOther = projExpenses.filter(e => e.category === 'other').reduce((s, e) => s + (Number(e.amount) || 0), 0);
    await updateItemInCollection('interiorProjects', data.projectId, {
      materialCost: totalMat,
      totalCost: totalMat + totalLabour + totalOther,
    });
    triggerRefresh();
    showToast('Expense updated');
  };

  const handleDeleteExpense = async (id) => {
    const exp = expenses.find(e => e.id === id);
    if (!exp) return;
    if (confirm('Delete this expense?')) {
      await deleteItemFromCollection('interiorExpenses', id);
      const projExpenses = expenses.filter(e => e.projectId === exp.projectId && e.id !== id);
      const totalMat = projExpenses.filter(e => e.category === 'material').reduce((s, e) => s + (Number(e.amount) || 0), 0);
      const totalLabour = projExpenses.filter(e => e.category === 'labour').reduce((s, e) => s + (Number(e.amount) || 0), 0);
      const totalOther = projExpenses.filter(e => e.category === 'other').reduce((s, e) => s + (Number(e.amount) || 0), 0);
      await updateItemInCollection('interiorProjects', exp.projectId, {
        materialCost: totalMat,
        totalCost: totalMat + totalLabour + totalOther,
      });
      triggerRefresh();
      showToast('Expense deleted');
    }
  };

  const handleAddPayment = async (data) => {
    await addItemToCollection('interiorPayments', {
      ...data,
      id: generateId(),
      createdAt: new Date().toISOString(),
    });
    const projPayments = [...payments.filter(p => p.projectId === data.projectId), data];
    const totalRec = projPayments.reduce((s, p) => s + (Number(p.amount) || 0), 0);
    const proj = projects.find(p => p.id === data.projectId);
    if (proj) {
      await updateItemInCollection('interiorProjects', data.projectId, {
        receivedAmount: totalRec,
        balanceAmount: (Number(proj.contractAmount) || 0) - totalRec,
      });
    }
    triggerRefresh();
    showToast('Payment recorded');
  };

  const handleDeletePayment = async (id) => {
    const pay = payments.find(p => p.id === id);
    if (!pay) return;
    if (confirm('Delete this payment?')) {
      await deleteItemFromCollection('interiorPayments', id);
      const projPayments = payments.filter(p => p.projectId === pay.projectId && p.id !== id);
      const totalRec = projPayments.reduce((s, p) => s + (Number(p.amount) || 0), 0);
      const proj = projects.find(p => p.id === pay.projectId);
      if (proj) {
        await updateItemInCollection('interiorProjects', pay.projectId, {
          receivedAmount: totalRec,
          balanceAmount: (Number(proj.contractAmount) || 0) - totalRec,
        });
      }
      triggerRefresh();
      showToast('Payment deleted');
    }
  };

  const handleAddEstimate = async (formData) => {
    await addItemToCollection('estimates', {
      ...formData,
      id: generateId(),
      createdAt: new Date().toISOString(),
    });
    setShowEstimateForm(false);
    triggerRefresh();
    showToast('Estimate created successfully');
  };

  const handleDeleteEstimate = async (id) => {
    if (confirm('Delete this estimate?')) {
      await deleteItemFromCollection('estimates', id);
      triggerRefresh();
      showToast('Estimate deleted');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-white/40 text-lg">Loading interior data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Interior Management</h1>
          <p className="text-sm text-white/40 mt-1">Manage interior projects, expenses & estimates</p>
        </div>
        {checkPermission('interior_create') && (
          <button onClick={() => setShowProjectForm(true)} className="glass-btn">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            New Project
          </button>
        )}
      </div>

      <div className="tabs-container overflow-x-auto">
        {['dashboard', 'projects', 'estimates', 'invoices'].map(tab => (
          <button key={tab} className={`tab-btn ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="stat-card">
              <p className="text-xs text-white/40 uppercase tracking-wider">Total Contract</p>
              <p className="text-xl font-bold text-white mt-1">{formatCurrency(stats.totalContract)}</p>
              <p className="text-xs text-white/30 mt-1">{stats.count} Projects</p>
            </div>
            <div className="stat-card">
              <p className="text-xs text-white/40 uppercase tracking-wider">Total Cost</p>
              <p className="text-xl font-bold text-white mt-1">{formatCurrency(stats.totalCost)}</p>
              <p className="text-xs text-white/30 mt-1">Material: {formatCurrency(stats.totalMaterial)}</p>
            </div>
            <div className="stat-card">
              <p className="text-xs text-white/40 uppercase tracking-wider">Profit / Loss</p>
              <p className={`text-xl font-bold mt-1 ${stats.profitLoss >= 0 ? 'text-green-400' : 'text-red-400'}`}>{formatCurrency(stats.profitLoss)}</p>
              <p className="text-xs text-white/30 mt-1">{stats.profitLoss >= 0 ? 'Profitable' : 'Loss'}</p>
            </div>
            <div className="stat-card">
              <p className="text-xs text-white/40 uppercase tracking-wider">Received</p>
              <p className="text-xl font-bold text-green-400 mt-1">{formatCurrency(stats.totalReceived)}</p>
              <p className="text-xs text-white/30 mt-1">Pending: {formatCurrency(stats.totalBalance)}</p>
            </div>
            <div className="stat-card">
              <p className="text-xs text-white/40 uppercase tracking-wider">Client Balance</p>
              <p className="text-xl font-bold text-yellow-400 mt-1">{formatCurrency(stats.totalBalance)}</p>
              <p className="text-xs text-white/30 mt-1">{stats.totalContract > 0 ? Math.round((stats.totalReceived / stats.totalContract) * 100) : 0}% Received</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="glass-card p-5">
              <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-4">Cost Breakdown</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-white/60 text-sm">Material Cost</span>
                  <span className="text-white font-medium">{formatCurrency(stats.totalMaterial)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/60 text-sm">Other / Labour Cost</span>
                  <span className="text-white font-medium">{formatCurrency(stats.totalCost - stats.totalMaterial)}</span>
                </div>
                <div className="border-t border-white/5 pt-2 flex justify-between items-center">
                  <span className="text-white font-semibold text-sm">Total Cost</span>
                  <span className="text-white font-bold">{formatCurrency(stats.totalCost)}</span>
                </div>
              </div>
            </div>

            <div className="glass-card p-5">
              <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-4">Payment Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-white/60 text-sm">Total Contract</span>
                  <span className="text-white font-medium">{formatCurrency(stats.totalContract)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/60 text-sm">Received</span>
                  <span className="text-green-400 font-medium">{formatCurrency(stats.totalReceived)}</span>
                </div>
                <div className="border-t border-white/5 pt-2 flex justify-between items-center">
                  <span className="text-white/60 text-sm">Pending</span>
                  <span className="text-yellow-400 font-bold">{formatCurrency(stats.totalBalance)}</span>
                </div>
              </div>
            </div>

            <div className="glass-card p-5">
              <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-4">Project Status</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center"><span className="text-white/60 text-sm">Not Started</span><span className="badge badge-neutral">{stats.notStarted}</span></div>
                <div className="flex justify-between items-center"><span className="text-white/60 text-sm">Running</span><span className="badge badge-info">{stats.running}</span></div>
                <div className="flex justify-between items-center"><span className="text-white/60 text-sm">On Hold</span><span className="badge badge-warning">{stats.onHold}</span></div>
                <div className="flex justify-between items-center"><span className="text-white/60 text-sm">Completed</span><span className="badge badge-success">{stats.completed}</span></div>
                <div className="flex justify-between items-center"><span className="text-white/60 text-sm">Closed</span><span className="badge badge-neutral">{stats.closed}</span></div>
                <div className="border-t border-white/5 pt-2 flex justify-between items-center"><span className="text-white font-semibold text-sm">Total</span><span className="text-white font-bold">{stats.count}</span></div>
              </div>
            </div>
          </div>

          <div className="glass-card overflow-hidden">
            <div className="px-5 py-4 border-b border-white/5">
              <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider">All Projects Overview</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="glass-table">
                <thead>
                  <tr>
                    <th>Flat</th>
                    <th>Client</th>
                    <th>Status</th>
                    <th>Contract</th>
                    <th className="hidden md:table-cell">Material</th>
                    <th className="hidden md:table-cell">Other Cost</th>
                    <th>Total Cost</th>
                    <th>Received</th>
                    <th className="hidden lg:table-cell">Balance</th>
                    <th className="hidden lg:table-cell">P/L</th>
                  </tr>
                </thead>
                <tbody>
                  {projects.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="text-center py-12 text-white/30">
                        <p>No projects yet</p>
                      </td>
                    </tr>
                  ) : (
                    projects.map(p => {
                      const pl = (Number(p.contractAmount) || 0) - (Number(p.totalCost) || 0);
                      return (
                        <tr key={p.id} className="cursor-pointer" onClick={() => setViewProject(p)}>
                          <td className="text-white text-sm font-medium">{p.flatId || '-'}</td>
                          <td className="text-white/70 text-sm">{p.clientName || '-'}</td>
                          <td><span className={`badge ${getStatusBadge(p.status)}`}>{getStatusLabel(p.status)}</span></td>
                          <td className="text-white text-sm">{formatCurrency(p.contractAmount)}</td>
                          <td className="hidden md:table-cell text-white/70 text-sm">{formatCurrency(p.materialCost)}</td>
                          <td className="hidden md:table-cell text-white/70 text-sm">{formatCurrency(p.otherCost)}</td>
                          <td className="text-white text-sm font-medium">{formatCurrency(p.totalCost)}</td>
                          <td className="text-green-400 text-sm">{formatCurrency(p.receivedAmount)}</td>
                          <td className="hidden lg:table-cell text-yellow-400 text-sm">{formatCurrency(p.balanceAmount)}</td>
                          <td className={`hidden lg:table-cell text-sm font-medium ${pl >= 0 ? 'text-green-400' : 'text-red-400'}`}>{formatCurrency(pl)}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'projects' && (
        <div className="space-y-4">
          <div className="glass-card p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                <input type="text" className="glass-input pl-10" placeholder="Search by client, code, flat, assigned..." value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <select className="glass-select sm:w-48" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                <option value="">All Status</option>
                {STATUS_LIST.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
          </div>

          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="glass-table">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Flat</th>
                    <th>Client</th>
                    <th>Status</th>
                    <th className="hidden md:table-cell">Contract</th>
                    <th className="hidden md:table-cell">Cost</th>
                    <th className="hidden lg:table-cell">Received</th>
                    <th className="hidden lg:table-cell">Balance</th>
                    <th className="hidden lg:table-cell">P/L</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProjects.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="text-center py-12 text-white/30">
                        <svg className="w-12 h-12 mx-auto mb-3 text-white/10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                        <p>No projects found</p>
                      </td>
                    </tr>
                  ) : (
                    filteredProjects.map(p => {
                      const pl = (Number(p.contractAmount) || 0) - (Number(p.totalCost) || 0);
                      return (
                        <tr key={p.id} className="cursor-pointer" onClick={() => setViewProject(p)}>
                          <td className="text-accent-light text-sm font-medium">{p.code || '-'}</td>
                          <td className="text-white text-sm">{p.flatId || '-'}</td>
                          <td className="text-white/70 text-sm">{p.clientName || '-'}</td>
                          <td><span className={`badge ${getStatusBadge(p.status)}`}>{getStatusLabel(p.status)}</span></td>
                          <td className="hidden md:table-cell text-white text-sm">{formatCurrency(p.contractAmount)}</td>
                          <td className="hidden md:table-cell text-white/70 text-sm">{formatCurrency(p.totalCost)}</td>
                          <td className="hidden lg:table-cell text-green-400 text-sm">{formatCurrency(p.receivedAmount)}</td>
                          <td className="hidden lg:table-cell text-yellow-400 text-sm">{formatCurrency(p.balanceAmount)}</td>
                          <td className={`hidden lg:table-cell text-sm font-medium ${pl >= 0 ? 'text-green-400' : 'text-red-400'}`}>{formatCurrency(pl)}</td>
                          <td onClick={e => e.stopPropagation()}>
                            <div className="flex items-center gap-1">
                              <button onClick={() => setViewProject(p)} className="p-1.5 rounded-lg hover:bg-white/5 text-white/50 hover:text-white" title="View">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                              </button>
                              {checkPermission('interior_delete') && (
                                <button onClick={() => handleDeleteProject(p.id)} className="p-1.5 rounded-lg hover:bg-white/5 text-white/50 hover:text-danger" title="Delete">
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
            {filteredProjects.length > 0 && (
              <div className="px-4 py-3 border-t border-white/5 text-sm text-white/40">
                Showing {filteredProjects.length} of {projects.length} projects
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'estimates' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white">Estimates ({estimates.length})</h3>
            {checkPermission('interior_create') && (
              <button onClick={() => setShowEstimateForm(true)} className="glass-btn">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                Create Estimate
              </button>
            )}
          </div>

          {estimates.length === 0 ? (
            <div className="glass-card p-12 text-center text-white/30">
              <svg className="w-16 h-16 mx-auto mb-3 text-white/10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              <p className="text-lg mb-2">No estimates created yet</p>
              <p className="text-sm">Create your first estimate for interior projects</p>
            </div>
          ) : (
            <div className="glass-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="glass-table">
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Client</th>
                      <th className="hidden md:table-cell">Mobile</th>
                      <th>Items</th>
                      <th className="hidden md:table-cell">Subtotal</th>
                      <th className="hidden md:table-cell">Tax</th>
                      <th>Total</th>
                      <th className="hidden lg:table-cell">Created</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {estimates.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).map(est => (
                      <tr key={est.id}>
                        <td className="text-white text-sm font-medium">{est.title || '-'}</td>
                        <td className="text-white/70 text-sm">{est.fullName || '-'}</td>
                        <td className="hidden md:table-cell text-white/50 text-sm">{est.mobile || '-'}</td>
                        <td className="text-white/70 text-sm">{est.items?.length || 0}</td>
                        <td className="hidden md:table-cell text-white/70 text-sm">{formatCurrency(est.subtotal)}</td>
                        <td className="hidden md:table-cell text-white/50 text-sm">{formatCurrency(est.tax)}</td>
                        <td className="text-accent-light font-medium text-sm">{formatCurrency(est.total)}</td>
                        <td className="hidden lg:table-cell text-white/50 text-sm">{formatDate(est.createdAt)}</td>
                        <td>
                          <div className="flex items-center gap-1">
                            <button onClick={() => setPrintEstimate(est)} className="p-1.5 rounded-lg hover:bg-white/5 text-white/50 hover:text-white" title="Print">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                            </button>
                            {checkPermission('interior_delete') && (
                              <button onClick={() => handleDeleteEstimate(est.id)} className="p-1.5 rounded-lg hover:bg-white/5 text-white/50 hover:text-danger" title="Delete">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'invoices' && (
        <div className="space-y-4">
          <div className="glass-card p-12 text-center text-white/30">
            <svg className="w-16 h-16 mx-auto mb-3 text-white/10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" /></svg>
            <p className="text-lg mb-2">Invoices coming soon</p>
            <p className="text-sm">Interior project invoices will be managed here</p>
          </div>
        </div>
      )}

      {showProjectForm && (
        <AddProjectModal
          properties={properties}
          employees={allPersons}
          onSave={handleAddProject}
          onClose={() => setShowProjectForm(false)}
        />
      )}

      {viewProject && (
        <ProjectDetailView
          project={viewProject}
          expenses={expenses}
          payments={payments}
          employees={allPersons}
          projects={projects}
          onSaveProject={handleSaveProject}
          onAddExpense={handleAddExpense}
          onUpdateExpense={handleUpdateExpense}
          onDeleteExpense={handleDeleteExpense}
          onAddPayment={handleAddPayment}
          onDeletePayment={handleDeletePayment}
          onClose={() => setViewProject(null)}
          checkPermission={checkPermission}
          user={user}
        />
      )}

      {showEstimateForm && (
        <CreateEstimateModal
          leads={leads}
          properties={properties}
          projects={projects}
          employees={allPersons}
          user={user}
          onSave={handleAddEstimate}
          onClose={() => setShowEstimateForm(false)}
        />
      )}

      {printEstimate && (
        <EstimatePrintView
          estimate={printEstimate}
          onClose={() => setPrintEstimate(null)}
        />
      )}

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
}