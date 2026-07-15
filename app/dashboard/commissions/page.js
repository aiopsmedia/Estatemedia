'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useApp } from '@/lib/store';
import { generateId, formatDate, formatDateTime, formatCurrency } from '@/lib/data';

const STATUS_OPTIONS = ['pending', 'approved', 'rejected', 'paid'];
const PAID_VIA_OPTIONS = [
  { value: 'cash', label: 'Cash' },
  { value: 'upi', label: 'UPI' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'other', label: 'Other' },
];

const STATUS_BADGES = {
  pending: 'badge-warning',
  approved: 'badge-success',
  rejected: 'badge-danger',
  paid: 'badge-info',
};

const INITIAL_COMMISSION_FORM = {
  leadId: '',
  leadName: '',
  clientId: '',
  clientName: '',
  commissionType: 'percentage',
  dealValue: '',
  commissionRate: '',
  commissionAmount: '',
  reason: '',
  notes: '',
};

function RequestCommissionModal({ leads, clients, user, onSave, onClose }) {
  const [form, setForm] = useState({ ...INITIAL_COMMISSION_FORM });

  const handleChange = (field, value) => {
    setForm(prev => {
      const next = { ...prev, [field]: value };
      if (field === 'leadId') {
        const lead = leads.find(l => (l._id || l.id) === value);
        next.leadName = lead ? (lead.society || lead.city || lead.mobile || '') : '';
      }
      if (field === 'clientId') {
        const client = clients.find(c => (c._id || c.id) === value);
        next.clientName = client ? client.name : '';
      }
      if (field === 'dealValue' || field === 'commissionRate' || field === 'commissionType') {
        const deal = Number(field === 'dealValue' ? value : next.dealValue) || 0;
        const rate = Number(field === 'commissionRate' ? value : next.commissionRate) || 0;
        const type = field === 'commissionType' ? value : next.commissionType;
        next.commissionAmount = type === 'percentage' ? (deal * rate / 100).toString() : rate.toString();
      }
      return next;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.dealValue || !form.commissionAmount) return;
    onSave({
      ...form,
      dealValue: Number(form.dealValue),
      commissionRate: Number(form.commissionRate),
      commissionAmount: Number(form.commissionAmount),
      employeeId: user.id,
      employeeName: user.name,
      requestedBy: user.id,
      requestedByName: user.name,
      status: 'pending',
      paidAmount: 0,
      paidDate: null,
      paidVia: null,
      paidReference: '',
      approvedBy: null,
      approvedByName: null,
      approvedAt: null,
      createdAt: new Date().toISOString(),
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content max-sm:w-full max-sm:h-full max-sm:rounded-none max-sm:p-4" style={{ maxWidth: 600 }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Request Commission</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-white/60 mb-1">Lead</label>
              <select className="glass-select w-full" value={form.leadId} onChange={e => handleChange('leadId', e.target.value)}>
                <option value="">Select Lead</option>
                {leads.map(l => (
                  <option key={l._id || l.id} value={l._id || l.id}>{l.society || l.city || l.mobile || l._id || l.id}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-1">Client</label>
              <select className="glass-select w-full" value={form.clientId} onChange={e => handleChange('clientId', e.target.value)}>
                <option value="">Select Client</option>
                {clients.map(c => (
                  <option key={c._id || c.id} value={c._id || c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-white/60 mb-1">Commission Type *</label>
              <select className="glass-select w-full" value={form.commissionType} onChange={e => handleChange('commissionType', e.target.value)} required>
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-1">Deal Value *</label>
              <input type="number" className="glass-input w-full" value={form.dealValue} onChange={e => handleChange('dealValue', e.target.value)} required min="0" placeholder="0" />
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-1">
                {form.commissionType === 'percentage' ? 'Rate (%)' : 'Amount'} *
              </label>
              <input type="number" className="glass-input w-full" value={form.commissionRate} onChange={e => handleChange('commissionRate', e.target.value)} required min="0" step="0.01" placeholder={form.commissionType === 'percentage' ? 'e.g. 5' : 'e.g. 50000'} />
            </div>
          </div>

          <div className="glass-card p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/60">Commission Amount</span>
              <span className="text-xl font-bold text-green-400">{formatCurrency(form.commissionAmount || 0)}</span>
            </div>
          </div>

          <div>
            <label className="block text-sm text-white/60 mb-1">Reason</label>
            <textarea className="glass-input w-full" rows={2} value={form.reason} onChange={e => handleChange('reason', e.target.value)} placeholder="Reason for commission request..." />
          </div>

          <div>
            <label className="block text-sm text-white/60 mb-1">Notes</label>
            <textarea className="glass-input w-full" rows={2} value={form.notes} onChange={e => handleChange('notes', e.target.value)} placeholder="Additional notes..." />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" className="glass-btn glass-btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="glass-btn glass-btn-success">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              Submit Request
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function MarkPaidModal({ commission, onSave, onClose }) {
  const [form, setForm] = useState({
    paidAmount: commission.commissionAmount - (commission.paidAmount || 0),
    paidDate: new Date().toISOString().split('T')[0],
    paidVia: 'bank_transfer',
    paidReference: '',
  });

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.paidAmount || !form.paidVia) return;
    onSave(commission._id || commission.id, {
      paidAmount: Number(form.paidAmount) + (commission.paidAmount || 0),
      paidDate: new Date(form.paidDate).toISOString(),
      paidVia: form.paidVia,
      paidReference: form.paidReference,
      status: (Number(form.paidAmount) + (commission.paidAmount || 0)) >= commission.commissionAmount ? 'paid' : 'approved',
    });
  };

  const remainingAmount = commission.commissionAmount - (commission.paidAmount || 0);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content max-sm:w-full max-sm:h-full max-sm:rounded-none max-sm:p-4" style={{ maxWidth: 500 }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Mark as Paid</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="glass-card p-4 mb-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><span className="text-white/40">Commission:</span> <span className="text-white">{formatCurrency(commission.commissionAmount)}</span></div>
            <div><span className="text-white/40">Already Paid:</span> <span className="text-green-400">{formatCurrency(commission.paidAmount || 0)}</span></div>
            <div className="col-span-2"><span className="text-white/40">Remaining:</span> <span className="text-yellow-400 font-bold">{formatCurrency(remainingAmount)}</span></div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-white/60 mb-1">Amount to Pay *</label>
            <input type="number" className="glass-input w-full" value={form.paidAmount} onChange={e => handleChange('paidAmount', e.target.value)} required min="0" max={remainingAmount} step="0.01" placeholder="0" />
          </div>
          <div>
            <label className="block text-sm text-white/60 mb-1">Payment Date *</label>
            <input type="date" className="glass-input w-full" value={form.paidDate} onChange={e => handleChange('paidDate', e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm text-white/60 mb-1">Paid Via *</label>
            <select className="glass-select w-full" value={form.paidVia} onChange={e => handleChange('paidVia', e.target.value)} required>
              {PAID_VIA_OPTIONS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-white/60 mb-1">Transaction Reference</label>
            <input type="text" className="glass-input w-full" value={form.paidReference} onChange={e => handleChange('paidReference', e.target.value)} placeholder="Transaction ID / Cheque No." />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" className="glass-btn glass-btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="glass-btn glass-btn-success">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              Confirm Payment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function RejectModal({ onSave, onClose }) {
  const [reason, setReason] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ reason });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content max-sm:w-full max-sm:h-full max-sm:rounded-none max-sm:p-4" style={{ maxWidth: 440 }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Reject Commission</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-white/60 mb-1">Rejection Reason *</label>
            <textarea className="glass-input w-full" rows={3} value={reason} onChange={e => setReason(e.target.value)} required placeholder="Provide reason for rejection..." />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" className="glass-btn glass-btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="glass-btn glass-btn-danger">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              Reject
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CommissionDetailModal({ commission, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content max-sm:w-full max-sm:h-full max-sm:rounded-none max-sm:p-4" style={{ maxWidth: 580 }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Commission Details</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          <div className="glass-card p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-white/40">Employee</p>
                <p className="text-white font-medium mt-1">{commission.employeeName || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-white/40">Status</p>
                <span className={"badge " + (STATUS_BADGES[commission.status] || "") + " mt-1"}>{commission.status?.toUpperCase()}</span>
              </div>
              <div>
                <p className="text-xs text-white/40">Lead</p>
                <p className="text-white mt-1">{commission.leadName || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-white/40">Client</p>
                <p className="text-white mt-1">{commission.clientName || '-'}</p>
              </div>
            </div>
          </div>

          <div className="glass-card p-4">
            <h4 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Financial Details</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div><p className="text-xs text-white/30">Deal Value</p><p className="text-white">{formatCurrency(commission.dealValue)}</p></div>
              <div><p className="text-xs text-white/30">Commission Type</p><p className="text-white capitalize">{commission.commissionType === 'percentage' ? (commission.commissionRate + '%') : 'Fixed'}</p></div>
              <div><p className="text-xs text-white/30">Commission Amount</p><p className="text-green-400 font-bold">{formatCurrency(commission.commissionAmount)}</p></div>
              <div><p className="text-xs text-white/30">Status</p><p className="text-white capitalize">{commission.status}</p></div>
            </div>
          </div>

          {commission.paidAmount > 0 && (
            <div className="glass-card p-4">
              <h4 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Payment Details</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div><p className="text-xs text-white/30">Paid Amount</p><p className="text-green-400">{formatCurrency(commission.paidAmount)}</p></div>
                <div><p className="text-xs text-white/30">Paid Date</p><p className="text-white">{formatDate(commission.paidDate)}</p></div>
                <div><p className="text-xs text-white/30">Paid Via</p><p className="text-white capitalize">{commission.paidVia?.replace('_', ' ') || '-'}</p></div>
                <div><p className="text-xs text-white/30">Reference</p><p className="text-white">{commission.paidReference || '-'}</p></div>
              </div>
            </div>
          )}

          {commission.status === 'approved' && (
            <div className="glass-card p-4">
              <h4 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Approval Details</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div><p className="text-xs text-white/30">Approved By</p><p className="text-white">{commission.approvedByName || '-'}</p></div>
                <div><p className="text-xs text-white/30">Approved At</p><p className="text-white">{formatDateTime(commission.approvedAt)}</p></div>
              </div>
            </div>
          )}

          {commission.status === 'rejected' && commission.reason && (
            <div className="glass-card p-4">
              <h4 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">Rejection Reason</h4>
              <p className="text-white/80 text-sm">{commission.reason}</p>
            </div>
          )}

          {commission.reason && commission.status !== 'rejected' && (
            <div className="glass-card p-4">
              <h4 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">Reason</h4>
              <p className="text-white/80 text-sm whitespace-pre-wrap">{commission.reason}</p>
            </div>
          )}

          {commission.notes && (
            <div className="glass-card p-4">
              <h4 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">Notes</h4>
              <p className="text-white/80 text-sm whitespace-pre-wrap">{commission.notes}</p>
            </div>
          )}

          <div className="text-xs text-white/30">
            <p>Requested by {commission.requestedByName || '-'} on {formatDateTime(commission.createdAt)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function PrintStatement({ commissions, userName, onClose }) {
  const total = commissions.reduce((s, c) => s + (c.commissionAmount || 0), 0);
  const totalPaid = commissions.reduce((s, c) => s + (c.paidAmount || 0), 0);
  const totalPending = commissions.filter(c => c.status === 'pending').reduce((s, c) => s + (c.commissionAmount || 0), 0);
  const totalRejected = commissions.filter(c => c.status === 'rejected').reduce((s, c) => s + (c.commissionAmount || 0), 0);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content max-sm:w-full max-sm:h-full max-sm:rounded-none max-sm:p-4" style={{ maxWidth: 800, maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6 no-print">
          <h2 className="text-xl font-bold text-white">Commission Statement</h2>
          <div className="flex items-center gap-2">
            <button onClick={() => window.print()} className="glass-btn glass-btn-success text-sm py-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
              Print
            </button>
            <button onClick={onClose} className="text-white/40 hover:text-white p-1">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-xl p-8 print-area">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-white">Estate ERP</h1>
            <p className="text-white/40 text-sm mt-1">Commission Statement</p>
          </div>

          <div className="glass-card p-4 mb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div><span className="text-white/40">Employee:</span> <span className="text-white">{userName}</span></div>
              <div><span className="text-white/40">Generated:</span> <span className="text-white">{formatDateTime(new Date().toISOString())}</span></div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm mb-6">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-2 text-white/60">Date</th>
                  <th className="text-left py-2 text-white/60">Lead</th>
                  <th className="text-left py-2 text-white/60">Client</th>
                  <th className="text-right py-2 text-white/60">Deal Value</th>
                  <th className="text-right py-2 text-white/60">Commission</th>
                  <th className="text-center py-2 text-white/60">Status</th>
                </tr>
              </thead>
              <tbody>
                {commissions.map(c => (
                  <tr key={c._id || c.id} className="border-b border-white/5">
                    <td className="py-2 text-white/70">{formatDate(c.createdAt)}</td>
                    <td className="py-2 text-white">{c.leadName || '-'}</td>
                    <td className="py-2 text-white">{c.clientName || '-'}</td>
                    <td className="py-2 text-white text-right">{formatCurrency(c.dealValue)}</td>
                    <td className="py-2 text-white text-right font-medium">{formatCurrency(c.commissionAmount)}</td>
                    <td className="py-2 text-center">
                      <span className={"badge " + (STATUS_BADGES[c.status] || "")}>{c.status?.toUpperCase()}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="glass-card p-4 mb-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-xs text-white/40 uppercase">Total</p>
                <p className="text-lg font-bold text-white mt-1">{formatCurrency(total)}</p>
              </div>
              <div>
                <p className="text-xs text-white/40 uppercase">Paid</p>
                <p className="text-lg font-bold text-green-400 mt-1">{formatCurrency(totalPaid)}</p>
              </div>
              <div>
                <p className="text-xs text-white/40 uppercase">Pending</p>
                <p className="text-lg font-bold text-yellow-400 mt-1">{formatCurrency(totalPending)}</p>
              </div>
              <div>
                <p className="text-xs text-white/40 uppercase">Rejected</p>
                <p className="text-lg font-bold text-red-400 mt-1">{formatCurrency(totalRejected)}</p>
              </div>
            </div>
          </div>

          <div className="text-xs text-white/30 border-t border-white/5 pt-4 mt-6">
            <p>This is a computer-generated commission statement.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CommissionsPage() {
  const { user, getCollection, addItemToCollection, updateItemInCollection, deleteItemFromCollection, checkPermission } = useApp();

  const [activeTab, setActiveTab] = useState('my');
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterEmployee, setFilterEmployee] = useState('');
  const [markPaidCommission, setMarkPaidCommission] = useState(null);
  const [rejectCommission, setRejectCommission] = useState(null);
  const [viewCommission, setViewCommission] = useState(null);
  const [showPrintStatement, setShowPrintStatement] = useState(false);
  const [toast, setToast] = useState(null);

  const [commissions, setCommissions] = useState([]);
  const [leads, setLeads] = useState([]);
  const [clients, setClients] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const doRefresh = () => setRefreshKey(k => k + 1);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [commsResult, leadsResult, clientsResult, employeesResult] = await Promise.all([
          getCollection('commissions'),
          getCollection('leads'),
          getCollection('clients'),
          getCollection('employees'),
        ]);
        setCommissions(commsResult || []);
        setLeads(leadsResult || []);
        setClients(clientsResult || []);
        setEmployees(employeesResult || []);
      } catch (err) {
        console.error('Failed to load commissions data:', err);
      }
      setLoading(false);
    }
    load();
  }, [getCollection, refreshKey]);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const isAdmin = checkPermission('commissions_approve');
  const canView = checkPermission('commissions_view');
  const canRequest = checkPermission('commissions_request');

  const myCommissions = useMemo(() => {
    return commissions
      .filter(c => c.requestedBy === user?.id)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [commissions, user]);

  const allCommissions = useMemo(() => {
    let result = [...commissions];
    if (filterStatus) result = result.filter(c => c.status === filterStatus);
    if (filterEmployee) result = result.filter(c => c.requestedBy === filterEmployee);
    result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return result;
  }, [commissions, filterStatus, filterEmployee]);

  const employeesList = useMemo(() => {
    const map = new Map();
    commissions.forEach(c => {
      if (c.requestedBy && c.requestedByName) {
        map.set(c.requestedBy, { id: c.requestedBy, name: c.requestedByName });
      }
    });
    employees.forEach(e => map.set(e._id || e.id, { id: e._id || e.id, name: e.name }));
    return Array.from(map.values());
  }, [commissions, employees]);

  const stats = useMemo(() => {
    const visible = isAdmin ? commissions : myCommissions;
    return {
      total: visible.length,
      pending: visible.filter(c => c.status === 'pending').length,
      approved: visible.filter(c => c.status === 'approved').length,
      paid: visible.filter(c => c.status === 'paid').length,
      rejected: visible.filter(c => c.status === 'rejected').length,
      totalValue: visible.reduce((s, c) => s + (c.commissionAmount || 0), 0),
      totalPaid: visible.reduce((s, c) => s + (c.paidAmount || 0), 0),
      totalPending: visible.filter(c => c.status === 'pending').reduce((s, c) => s + (c.commissionAmount || 0), 0),
    };
  }, [commissions, myCommissions, isAdmin]);

  const handleRequestCommission = async (form) => {
    await addItemToCollection('commissions', form);
    setShowRequestForm(false);
    showToast('Commission request submitted');
    doRefresh();
  };

  const handleApprove = async (commission) => {
    const commissionId = commission._id || commission.id;
    await updateItemInCollection('commissions', commissionId, {
      status: 'approved',
      approvedBy: user.id,
      approvedByName: user.name,
      approvedAt: new Date().toISOString(),
    });
    showToast('Commission approved');
    doRefresh();
  };

  const handleReject = async (commissionId, { reason }) => {
    await updateItemInCollection('commissions', commissionId, {
      status: 'rejected',
      reason,
      approvedBy: user.id,
      approvedByName: user.name,
      approvedAt: new Date().toISOString(),
    });
    setRejectCommission(null);
    showToast('Commission rejected');
    doRefresh();
  };

  const handleMarkPaid = async (commissionId, updates) => {
    await updateItemInCollection('commissions', commissionId, updates);
    setMarkPaidCommission(null);
    showToast('Payment recorded successfully');
    doRefresh();
  };

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this commission request?')) {
      await deleteItemFromCollection('commissions', id);
      showToast('Commission deleted');
      doRefresh();
    }
  };

  if (!canView) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <svg className="w-16 h-16 mx-auto mb-4 text-white/10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <p className="text-white/40 text-lg">You don&apos;t have permission to view commissions.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/40">Loading commissions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Commissions</h1>
          <p className="text-sm text-white/40 mt-1">Manage commission requests and payouts</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canRequest && (
            <button onClick={() => setShowRequestForm(true)} className="glass-btn glass-btn-success">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              Request Commission
            </button>
          )}
          <button onClick={() => setShowPrintStatement(true)} className="glass-btn">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
            Print Statement
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="stat-card">
          <p className="text-xs text-white/40 uppercase tracking-wider">Total Commissions</p>
          <p className="text-2xl font-bold text-white mt-1">{stats.total}</p>
        </div>
        <div className="stat-card">
          <p className="text-xs text-white/40 uppercase tracking-wider">Pending</p>
          <p className="text-2xl font-bold text-yellow-400 mt-1">{stats.pending}</p>
        </div>
        <div className="stat-card">
          <p className="text-xs text-white/40 uppercase tracking-wider">Approved</p>
          <p className="text-2xl font-bold text-green-400 mt-1">{stats.approved}</p>
        </div>
        <div className="stat-card">
          <p className="text-xs text-white/40 uppercase tracking-wider">Paid</p>
          <p className="text-2xl font-bold text-blue-400 mt-1">{stats.paid}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        <div className="stat-card">
          <p className="text-xs text-white/40 uppercase tracking-wider">Total Commission Value</p>
          <p className="text-xl font-bold text-white mt-1">{formatCurrency(stats.totalValue)}</p>
        </div>
        <div className="stat-card">
          <p className="text-xs text-white/40 uppercase tracking-wider">Total Paid Value</p>
          <p className="text-xl font-bold text-green-400 mt-1">{formatCurrency(stats.totalPaid)}</p>
        </div>
        <div className="stat-card">
          <p className="text-xs text-white/40 uppercase tracking-wider">Total Pending Value</p>
          <p className="text-xl font-bold text-yellow-400 mt-1">{formatCurrency(stats.totalPending)}</p>
        </div>
      </div>

      <div className="tabs-container overflow-x-auto">
        <button onClick={() => setActiveTab('my')} className={"tab-btn whitespace-nowrap " + (activeTab === "my" ? "active" : "")}>
          My Commissions
        </button>
        {isAdmin && (
          <button onClick={() => setActiveTab('all')} className={"tab-btn whitespace-nowrap " + (activeTab === "all" ? "active" : "")}>
            All Commissions
          </button>
        )}
      </div>

      {activeTab === 'my' && (
        <div className="space-y-4">
          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="glass-table">
                <thead>
                  <tr>
                    <th>Lead</th>
                    <th>Client</th>
                    <th className="text-right">Deal Value</th>
                    <th className="text-right">Commission</th>
                    <th>Status</th>
                    <th className="hidden md:table-cell">Paid Via</th>
                    <th className="hidden lg:table-cell">Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {myCommissions.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-12 text-white/30">
                        <svg className="w-12 h-12 mx-auto mb-3 text-white/10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        <p>No commission requests yet</p>
                      </td>
                    </tr>
                  ) : (
                    myCommissions.map(c => (
                      <tr key={c._id || c.id} className="cursor-pointer" onClick={() => setViewCommission(c)}>
                        <td className="text-white text-sm">{c.leadName || '-'}</td>
                        <td className="text-white text-sm">{c.clientName || '-'}</td>
                        <td className="text-white text-right text-sm">{formatCurrency(c.dealValue)}</td>
                        <td className="text-white text-right font-medium">{formatCurrency(c.commissionAmount)}</td>
                        <td>
                          <span className={"badge " + (STATUS_BADGES[c.status] || "")}>{c.status?.toUpperCase()}</span>
                        </td>
                        <td className="hidden md:table-cell text-white/60 text-sm capitalize">{c.paidVia?.replace('_', ' ') || '-'}</td>
                        <td className="hidden lg:table-cell text-white/50 text-sm">{formatDate(c.createdAt)}</td>
                        <td onClick={e => e.stopPropagation()}>
                          <div className="flex items-center gap-1">
                            {c.status === 'pending' && (
                              <button onClick={() => handleDelete(c._id || c.id)} className="p-1.5 rounded-lg hover:bg-white/5 text-white/50 hover:text-red-400" title="Delete">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {myCommissions.length > 0 && (
              <div className="px-4 py-3 border-t border-white/5 text-sm text-white/40">
                Showing {myCommissions.length} commission requests
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'all' && isAdmin && (
        <div className="space-y-4">
          <div className="glass-card p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <select className="glass-select w-full sm:w-48" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                <option value="">All Status</option>
                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
              </select>
              <select className="glass-select w-full sm:w-48" value={filterEmployee} onChange={e => setFilterEmployee(e.target.value)}>
                <option value="">All Employees</option>
                {employeesList.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
            </div>
          </div>

          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="glass-table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Lead</th>
                    <th>Client</th>
                    <th className="text-right">Deal Value</th>
                    <th className="text-right">Commission</th>
                    <th>Status</th>
                    <th className="hidden md:table-cell">Paid Via</th>
                    <th className="hidden lg:table-cell">Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {allCommissions.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="text-center py-12 text-white/30">
                        <svg className="w-12 h-12 mx-auto mb-3 text-white/10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        <p>No commissions found</p>
                      </td>
                    </tr>
                  ) : (
                    allCommissions.map(c => (
                      <tr key={c._id || c.id}>
                        <td className="text-white text-sm font-medium">{c.requestedByName || '-'}</td>
                        <td className="text-white text-sm">{c.leadName || '-'}</td>
                        <td className="text-white text-sm">{c.clientName || '-'}</td>
                        <td className="text-white text-right text-sm">{formatCurrency(c.dealValue)}</td>
                        <td className="text-white text-right font-medium">{formatCurrency(c.commissionAmount)}</td>
                        <td>
                          <span className={"badge " + (STATUS_BADGES[c.status] || "")}>{c.status?.toUpperCase()}</span>
                        </td>
                        <td className="hidden md:table-cell text-white/60 text-sm capitalize">{c.paidVia?.replace('_', ' ') || '-'}</td>
                        <td className="hidden lg:table-cell text-white/50 text-sm">{formatDate(c.createdAt)}</td>
                        <td onClick={e => e.stopPropagation()}>
                          <div className="flex items-center gap-1">
                            {c.status === 'pending' && (
                              <>
                                <button onClick={() => handleApprove(c)} className="p-1.5 rounded-lg hover:bg-white/5 text-white/50 hover:text-green-400" title="Approve">
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                </button>
                                <button onClick={() => setRejectCommission(c)} className="p-1.5 rounded-lg hover:bg-white/5 text-white/50 hover:text-red-400" title="Reject">
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                              </>
                            )}
                            {c.status === 'approved' && (
                              <button onClick={() => setMarkPaidCommission(c)} className="p-1.5 rounded-lg hover:bg-white/5 text-white/50 hover:text-blue-400" title="Mark as Paid">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                              </button>
                            )}
                            <button onClick={() => setViewCommission(c)} className="p-1.5 rounded-lg hover:bg-white/5 text-white/50 hover:text-white" title="View Details">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {allCommissions.length > 0 && (
              <div className="px-4 py-3 border-t border-white/5 text-sm text-white/40">
                Showing {allCommissions.length} of {commissions.length} commissions
              </div>
            )}
          </div>
        </div>
      )}

      {showRequestForm && (
        <RequestCommissionModal
          leads={leads}
          clients={clients}
          user={user}
          onSave={handleRequestCommission}
          onClose={() => setShowRequestForm(false)}
        />
      )}

      {markPaidCommission && (
        <MarkPaidModal
          commission={markPaidCommission}
          onSave={handleMarkPaid}
          onClose={() => setMarkPaidCommission(null)}
        />
      )}

      {rejectCommission && (
        <RejectModal
          onSave={(data) => handleReject(rejectCommission._id || rejectCommission.id, data)}
          onClose={() => setRejectCommission(null)}
        />
      )}

      {viewCommission && (
        <CommissionDetailModal
          commission={viewCommission}
          onClose={() => setViewCommission(null)}
        />
      )}

      {showPrintStatement && (
        <PrintStatement
          commissions={isAdmin ? allCommissions : myCommissions}
          userName={user?.name}
          onClose={() => setShowPrintStatement(false)}
        />
      )}

      {toast && (
        <div className={"toast toast-" + toast.type}>
          {toast.message}
        </div>
      )}
    </div>
  );
}