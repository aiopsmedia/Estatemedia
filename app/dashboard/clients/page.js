'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useApp } from '@/lib/store';
import { generateId, formatDate, formatDateTime, formatCurrency } from '@/lib/data';

const CLIENT_TYPES = [
  { value: 'purchase', label: 'Purchase' },
  { value: 'rent_take', label: 'Rent Take' },
  { value: 'rent_give', label: 'Rent Give' },
  { value: 'interior', label: 'Interior' },
];

const PAYMENT_TYPES = [
  { value: 'welcome_charge', label: 'Welcome Charge' },
  { value: 'security_deposit', label: 'Security Deposit' },
  { value: 'token_advance_rent', label: 'Token Advance Rent' },
  { value: 'police_verification', label: 'Police Verification' },
  { value: 'rent_agreement', label: 'Rent Agreement' },
  { value: 'documents', label: 'Documents' },
  { value: 'brokerage', label: 'Brokerage' },
  { value: 'other', label: 'Other' },
];

const PAYMENT_STATUSES = [
  { value: 'paid', label: 'Paid' },
  { value: 'due', label: 'Due' },
  { value: 'partial', label: 'Partial' },
];

const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'upi', label: 'UPI' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'other', label: 'Other' },
];

const FOLLOWUP_TYPES = [
  { value: 'call', label: 'Call' },
  { value: 'visit', label: 'Visit' },
  { value: 'email', label: 'Email' },
  { value: 'whatsapp', label: 'WhatsApp' },
];

const CLIENT_TYPE_BADGES = {
  purchase: 'badge-info',
  rent_take: 'badge-success',
  rent_give: 'badge-warning',
  interior: 'badge-neutral',
};

const PAYMENT_STATUS_BADGES = {
  paid: 'badge-success',
  due: 'badge-danger',
  partial: 'badge-warning',
};

const INITIAL_CLIENT_FORM = {
  name: '', mobile: '', email: '', clientType: 'purchase',
  propertyId: '', notes: '',
  interiorDetails: { rooms: '', requirement: '', estimatedBudget: '' },
};

const INITIAL_PAYMENT_FORM = {
  paymentType: 'welcome_charge', otherReason: '', amount: '',
  status: 'paid', paidAmount: '', paidDate: '', paidVia: 'cash',
};

function ClientFormModal({ client, onSave, onClose }) {
  const [form, setForm] = useState(client || { ...INITIAL_CLIENT_FORM });
  const [showInterior, setShowInterior] = useState(form.clientType === 'interior');

  const handleChange = (field, value) => {
    setForm(prev => {
      const next = { ...prev, [field]: value };
      if (field === 'clientType') {
        setShowInterior(value === 'interior');
      }
      return next;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.mobile.trim()) return;
    onSave(form);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content max-sm:w-full max-sm:h-full max-sm:rounded-none max-sm:p-4 max-sm:overflow-y-auto" style={{ maxWidth: 640 }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">{client?.id ? 'Edit Client' : 'Add New Client'}</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-3">Contact Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-white/60 mb-1">Client Name *</label>
                <input type="text" className="glass-input" value={form.name} onChange={e => handleChange('name', e.target.value)} required placeholder="Full name" />
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-1">Mobile *</label>
                <input type="text" className="glass-input" value={form.mobile} onChange={e => handleChange('mobile', e.target.value)} required placeholder="10-digit mobile" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm text-white/60 mb-1">Email</label>
                <input type="email" className="glass-input" value={form.email} onChange={e => handleChange('email', e.target.value)} placeholder="email@example.com" />
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-1">Client Type</label>
                <select className="glass-select" value={form.clientType} onChange={e => handleChange('clientType', e.target.value)}>
                  {CLIENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-3">Property & Notes</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-white/60 mb-1">Property ID (Optional)</label>
                <input type="text" className="glass-input" value={form.propertyId} onChange={e => handleChange('propertyId', e.target.value)} placeholder="Linked property ID" />
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm text-white/60 mb-1">Notes</label>
              <textarea className="glass-input" rows={3} value={form.notes} onChange={e => handleChange('notes', e.target.value)} placeholder="Additional notes..." />
            </div>
          </div>

          {showInterior && (
            <div>
              <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-3">Interior Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-white/60 mb-1">Number of Rooms</label>
                  <input type="text" className="glass-input" value={form.interiorDetails?.rooms || ''} onChange={e => handleChange('interiorDetails', { ...form.interiorDetails, rooms: e.target.value })} placeholder="e.g. 2 BHK" />
                </div>
                <div>
                  <label className="block text-sm text-white/60 mb-1">Estimated Budget</label>
                  <input type="number" className="glass-input" value={form.interiorDetails?.estimatedBudget || ''} onChange={e => handleChange('interiorDetails', { ...form.interiorDetails, estimatedBudget: e.target.value })} placeholder="₹ Amount" />
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm text-white/60 mb-1">Interior Requirement</label>
                <textarea className="glass-input" rows={2} value={form.interiorDetails?.requirement || ''} onChange={e => handleChange('interiorDetails', { ...form.interiorDetails, requirement: e.target.value })} placeholder="Interior details..." />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" className="glass-btn glass-btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="glass-btn glass-btn-success">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              {client?.id ? 'Update Client' : 'Create Client'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function PaymentFormModal({ payment, clientId, clientName, onSave, onClose }) {
  const [form, setForm] = useState(payment || { ...INITIAL_PAYMENT_FORM });

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.amount) return;
    onSave({
      ...form,
      clientId,
      clientName,
      amount: Number(form.amount),
      paidAmount: form.status === 'paid' ? Number(form.amount) : (form.paidAmount ? Number(form.paidAmount) : 0),
      paidDate: form.status === 'paid' ? (form.paidDate || new Date().toISOString()) : form.paidDate || null,
      paidVia: form.status === 'paid' ? form.paidVia : null,
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content max-sm:w-full max-sm:h-full max-sm:rounded-none max-sm:p-4 max-sm:overflow-y-auto" style={{ maxWidth: 520 }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">{payment?.id ? 'Edit Payment' : 'Add Payment'}</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-white/60 mb-1">Payment Type *</label>
            <select className="glass-select" value={form.paymentType} onChange={e => handleChange('paymentType', e.target.value)} required>
              {PAYMENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>

          {form.paymentType === 'other' && (
            <div>
              <label className="block text-sm text-white/60 mb-1">Reason *</label>
              <input type="text" className="glass-input" value={form.otherReason} onChange={e => handleChange('otherReason', e.target.value)} required placeholder="Specify reason" />
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-white/60 mb-1">Amount (₹) *</label>
              <input type="number" className="glass-input" value={form.amount} onChange={e => handleChange('amount', e.target.value)} required min="0" placeholder="0" />
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-1">Status *</label>
              <select className="glass-select" value={form.status} onChange={e => handleChange('status', e.target.value)} required>
                {PAYMENT_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
          </div>

          {form.status !== 'due' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-white/60 mb-1">Paid Amount (₹)</label>
                <input type="number" className="glass-input" value={form.paidAmount} onChange={e => handleChange('paidAmount', e.target.value)} min="0" placeholder="0" />
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-1">Paid Date</label>
                <input type="date" className="glass-input" value={form.paidDate ? form.paidDate.split('T')[0] : ''} onChange={e => handleChange('paidDate', e.target.value ? new Date(e.target.value).toISOString() : '')} />
              </div>
            </div>
          )}

          {form.status !== 'due' && (
            <div>
              <label className="block text-sm text-white/60 mb-1">Paid Via</label>
              <select className="glass-select" value={form.paidVia} onChange={e => handleChange('paidVia', e.target.value)}>
                {PAYMENT_METHODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" className="glass-btn glass-btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="glass-btn glass-btn-success">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              {payment?.id ? 'Update Payment' : 'Add Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DocumentFormModal({ onSave, onClose }) {
  const [form, setForm] = useState({ fileName: '', fileType: '', fileSize: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.fileName.trim()) return;
    onSave(form);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content max-sm:w-full max-sm:h-full max-sm:rounded-none max-sm:p-4 max-sm:overflow-y-auto" style={{ maxWidth: 440 }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Add Document</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-white/60 mb-1">Document Name *</label>
            <input type="text" className="glass-input" value={form.fileName} onChange={e => setForm(p => ({ ...p, fileName: e.target.value }))} required placeholder="e.g. Aadhaar Card" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-white/60 mb-1">Document Type</label>
              <select className="glass-select" value={form.fileType} onChange={e => setForm(p => ({ ...p, fileType: e.target.value }))}>
                <option value="">Select</option>
                <option value="id_proof">ID Proof</option>
                <option value="address_proof">Address Proof</option>
                <option value="income_proof">Income Proof</option>
                <option value="agreement">Agreement</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-1">File Size</label>
              <input type="text" className="glass-input" value={form.fileSize} onChange={e => setForm(p => ({ ...p, fileSize: e.target.value }))} placeholder="e.g. 2.5 MB" />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" className="glass-btn glass-btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="glass-btn glass-btn-success">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              Add Document
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function FollowupFormModal({ onSave, onClose }) {
  const [form, setForm] = useState({ date: '', type: 'call', notes: '', status: 'pending' });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.notes.trim()) return;
    onSave(form);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content max-sm:w-full max-sm:h-full max-sm:rounded-none max-sm:p-4 max-sm:overflow-y-auto" style={{ maxWidth: 440 }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Add Follow-up</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-white/60 mb-1">Follow-up Date</label>
              <input type="date" className="glass-input" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-1">Type *</label>
              <select className="glass-select" value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}>
                {FOLLOWUP_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm text-white/60 mb-1">Notes *</label>
            <textarea className="glass-input" rows={3} value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} required placeholder="Follow-up notes..." />
          </div>
          <div>
            <label className="block text-sm text-white/60 mb-1">Status</label>
            <select className="glass-select" value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" className="glass-btn glass-btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="glass-btn glass-btn-success">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              Add Follow-up
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function PrintBillView({ client, payments, onClose }) {
  const totalAmount = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const totalPaid = payments.reduce((sum, p) => sum + (p.paidAmount || 0), 0);
  const totalDue = totalAmount - totalPaid;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content max-sm:w-full max-sm:h-full max-sm:rounded-none max-sm:p-4 max-sm:overflow-y-auto" style={{ maxWidth: 800, maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6 no-print">
          <h2 className="text-xl font-bold text-white">Print Bill</h2>
          <div className="flex items-center gap-2">
            <button onClick={handlePrint} className="glass-btn glass-btn-success text-sm py-2">
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
            <p className="text-white/40 text-sm mt-1">Client Payment Bill</p>
          </div>

          <div className="glass-card p-4 mb-6">
            <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-3">Client Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div><span className="text-white/40">Name:</span> <span className="text-white">{client.name}</span></div>
              <div><span className="text-white/40">Mobile:</span> <span className="text-white">{client.mobile}</span></div>
              <div><span className="text-white/40">Email:</span> <span className="text-white">{client.email || '-'}</span></div>
              <div><span className="text-white/40">Type:</span> <span className="text-white capitalize">{client.clientType?.replace('_', ' ')}</span></div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm mb-6">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-2 text-white/60">Type</th>
                  <th className="text-right py-2 text-white/60">Amount</th>
                  <th className="text-right py-2 text-white/60">Paid</th>
                  <th className="text-right py-2 text-white/60">Due</th>
                  <th className="text-center py-2 text-white/60">Status</th>
                  <th className="text-left py-2 text-white/60">Method</th>
                </tr>
              </thead>
              <tbody>
                {payments.map(p => {
                  const due = (p.amount || 0) - (p.paidAmount || 0);
                  return (
                    <tr key={p._id || p.id} className="border-b border-white/5">
                      <td className="py-2 text-white capitalize">{p.paymentType?.replace('_', ' ')}{p.otherReason ? ` (${p.otherReason})` : ''}</td>
                      <td className="py-2 text-white text-right">{formatCurrency(p.amount)}</td>
                      <td className="py-2 text-green-400 text-right">{formatCurrency(p.paidAmount)}</td>
                      <td className="py-2 text-red-400 text-right">{due > 0 ? formatCurrency(due) : '-'}</td>
                      <td className="py-2 text-center">
                        <span className={`badge ${PAYMENT_STATUS_BADGES[p.status]}`}>{p.status?.toUpperCase()}</span>
                      </td>
                      <td className="py-2 text-white/60 capitalize">{p.paidVia?.replace('_', ' ') || '-'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="glass-card p-4 mb-6">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-xs text-white/40 uppercase">Total Amount</p>
                <p className="text-lg font-bold text-white mt-1">{formatCurrency(totalAmount)}</p>
              </div>
              <div>
                <p className="text-xs text-white/40 uppercase">Total Paid</p>
                <p className="text-lg font-bold text-green-400 mt-1">{formatCurrency(totalPaid)}</p>
              </div>
              <div>
                <p className="text-xs text-white/40 uppercase">Total Due</p>
                <p className="text-lg font-bold text-red-400 mt-1">{formatCurrency(totalDue)}</p>
              </div>
            </div>
          </div>

          <div className="text-xs text-white/30 border-t border-white/5 pt-4 mt-6">
            <p className="font-semibold text-white/50 mb-2">Terms & Conditions:</p>
            <ul className="space-y-1 list-disc list-inside">
              <li>This is a computer-generated bill and does not require a signature.</li>
              <li>All amounts are in Indian Rupees (INR).</li>
              <li>Payment due dates must be strictly adhered to.</li>
              <li>For any queries, please contact the office.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function ClientDetailModal({ client, payments, documents, followups, onSavePayment, onDeletePayment, onEditPayment, onSaveDocument, onDeleteDocument, onSaveFollowup, onDeleteFollowup, onClose, user, checkPermission }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);
  const [showDocumentForm, setShowDocumentForm] = useState(false);
  const [showFollowupForm, setShowFollowupForm] = useState(false);
  const [showPrintBill, setShowPrintBill] = useState(false);

  const clientPayments = useMemo(() => {
    const id = client._id || client.id;
    return payments.filter(p => (p.clientId === id || p.clientId === client.id)).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [payments, client]);

  const clientDocuments = useMemo(() => {
    const id = client._id || client.id;
    return documents.filter(d => (d.clientId === id || d.clientId === client.id)).sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
  }, [documents, client]);

  const clientFollowups = useMemo(() => {
    const id = client._id || client.id;
    return followups.filter(f => (f.clientId === id || f.clientId === client.id)).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [followups, client]);

  const paymentStats = useMemo(() => {
    const total = clientPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const paid = clientPayments.reduce((sum, p) => sum + (p.paidAmount || 0), 0);
    return { total, paid, due: total - paid };
  }, [clientPayments]);

  const handleSavePayment = (form) => {
    if (editingPayment) {
      onEditPayment(editingPayment._id || editingPayment.id, form);
    } else {
      onSavePayment(form);
    }
    setShowPaymentForm(false);
    setEditingPayment(null);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content max-sm:w-full max-sm:h-full max-sm:rounded-none max-sm:p-4 max-sm:overflow-y-auto" style={{ maxWidth: 900, maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <div className="min-w-0">
            <h2 className="text-xl font-bold text-white truncate">{client.name}</h2>
            <p className="text-sm text-white/40 mt-1">Client since {formatDate(client.createdAt)}</p>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white p-1 flex-shrink-0">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="glass-card p-4 mb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-white/40">Mobile</p>
              <p className="text-white text-sm font-medium mt-1">{client.mobile}</p>
            </div>
            <div>
              <p className="text-xs text-white/40">Email</p>
              <p className="text-white text-sm font-medium mt-1">{client.email || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-white/40">Client Type</p>
              <span className={`badge ${CLIENT_TYPE_BADGES[client.clientType] || 'badge-neutral'} mt-1`}>
                {client.clientType?.replace('_', ' ').toUpperCase()}
              </span>
            </div>
            <div>
              <p className="text-xs text-white/40">Created By</p>
              <p className="text-white text-sm font-medium mt-1">{client.createdByName || '-'}</p>
            </div>
          </div>
          {client.interiorDetails && (
            <div className="mt-4 pt-4 border-t border-white/5">
              <h4 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">Interior Details</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                <div><span className="text-white/40">Rooms:</span> <span className="text-white">{client.interiorDetails.rooms || '-'}</span></div>
                <div><span className="text-white/40">Budget:</span> <span className="text-white">{client.interiorDetails.estimatedBudget ? formatCurrency(client.interiorDetails.estimatedBudget) : '-'}</span></div>
                <div><span className="text-white/40">Requirement:</span> <span className="text-white">{client.interiorDetails.requirement || '-'}</span></div>
              </div>
            </div>
          )}
          {client.notes && (
            <div className="mt-4 pt-4 border-t border-white/5">
              <p className="text-xs text-white/40">Notes</p>
              <p className="text-white/80 text-sm mt-1 whitespace-pre-wrap">{client.notes}</p>
            </div>
          )}
        </div>

        <div className="tabs-container mb-6 overflow-x-auto">
          {['overview', 'payments', 'documents', 'followups'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`tab-btn whitespace-nowrap ${activeTab === tab ? 'active' : ''}`}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="glass-card p-4 text-center">
              <p className="text-xs text-white/40 uppercase">Total Payments</p>
              <p className="text-2xl font-bold text-white mt-1">{formatCurrency(paymentStats.total)}</p>
            </div>
            <div className="glass-card p-4 text-center">
              <p className="text-xs text-white/40 uppercase">Paid</p>
              <p className="text-2xl font-bold text-green-400 mt-1">{formatCurrency(paymentStats.paid)}</p>
            </div>
            <div className="glass-card p-4 text-center">
              <p className="text-xs text-white/40 uppercase">Due</p>
              <p className="text-2xl font-bold text-red-400 mt-1">{formatCurrency(paymentStats.due)}</p>
            </div>
          </div>
        )}

        {activeTab === 'payments' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider">Payments</h3>
              <div className="flex gap-2">
                {checkPermission('clients_payments') && (
                  <button onClick={() => { setEditingPayment(null); setShowPaymentForm(true); }} className="glass-btn glass-btn-success text-sm py-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                    Add Payment
                  </button>
                )}
                {clientPayments.length > 0 && (
                  <button onClick={() => setShowPrintBill(true)} className="glass-btn text-sm py-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                    Print Bill
                  </button>
                )}
              </div>
            </div>

            {clientPayments.length === 0 ? (
              <div className="glass-card p-8 text-center text-white/30">
                <p>No payments recorded yet.</p>
              </div>
            ) : (
              <div className="glass-card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="glass-table">
                    <thead>
                      <tr>
                        <th>Type</th>
                        <th className="text-right">Amount</th>
                        <th className="text-center">Status</th>
                        <th className="text-right">Paid</th>
                        <th>Via</th>
                        <th>Date</th>
                        {checkPermission('clients_payments') && <th>Actions</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {clientPayments.map(p => (
                        <tr key={p._id || p.id}>
                          <td className="text-white capitalize">{p.paymentType?.replace('_', ' ')}{p.otherReason ? ` (${p.otherReason})` : ''}</td>
                          <td className="text-white text-right font-medium">{formatCurrency(p.amount)}</td>
                          <td className="text-center">
                            <span className={`badge ${PAYMENT_STATUS_BADGES[p.status]}`}>{p.status?.toUpperCase()}</span>
                          </td>
                          <td className="text-green-400 text-right">{formatCurrency(p.paidAmount)}</td>
                          <td className="text-white/60 capitalize">{p.paidVia?.replace('_', ' ') || '-'}</td>
                          <td className="text-white/50 text-sm">{formatDate(p.paidDate || p.createdAt)}</td>
                          {checkPermission('clients_payments') && (
                            <td onClick={e => e.stopPropagation()}>
                              <div className="flex items-center gap-1">
                                <button onClick={() => { setEditingPayment(p); setShowPaymentForm(true); }} className="p-1.5 rounded-lg hover:bg-white/5 text-white/50 hover:text-accent-light" title="Edit">
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                </button>
                                <button onClick={() => onDeletePayment(p._id || p.id)} className="p-1.5 rounded-lg hover:bg-white/5 text-white/50 hover:text-danger" title="Delete">
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'documents' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider">Documents</h3>
              {checkPermission('clients_documents') && (
                <button onClick={() => setShowDocumentForm(true)} className="glass-btn glass-btn-success text-sm py-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                  Add Document
                </button>
              )}
            </div>

            {clientDocuments.length === 0 ? (
              <div className="glass-card p-8 text-center text-white/30">
                <p>No documents uploaded yet.</p>
              </div>
            ) : (
              <div className="glass-card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="glass-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Type</th>
                        <th>Size</th>
                        <th>Uploaded</th>
                        <th>By</th>
                        {checkPermission('clients_documents') && <th>Actions</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {clientDocuments.map(d => (
                        <tr key={d._id || d.id}>
                          <td className="text-white font-medium">{d.fileName}</td>
                          <td className="text-white/60 capitalize">{d.fileType?.replace('_', ' ') || '-'}</td>
                          <td className="text-white/60 text-sm">{d.fileSize || '-'}</td>
                          <td className="text-white/50 text-sm">{formatDate(d.uploadedAt)}</td>
                          <td className="text-white/60 text-sm">{d.uploadedBy || '-'}</td>
                          {checkPermission('clients_documents') && (
                            <td onClick={e => e.stopPropagation()}>
                              <button onClick={() => onDeleteDocument(d._id || d.id)} className="p-1.5 rounded-lg hover:bg-white/5 text-white/50 hover:text-danger" title="Delete">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'followups' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider">Follow-ups</h3>
              {checkPermission('followups_create') && (
                <button onClick={() => setShowFollowupForm(true)} className="glass-btn glass-btn-success text-sm py-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                  Add Follow-up
                </button>
              )}
            </div>

            {clientFollowups.length === 0 ? (
              <div className="glass-card p-8 text-center text-white/30">
                <p>No follow-ups recorded yet.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {clientFollowups.map(f => (
                  <div key={f._id || f.id} className="glass-card p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="badge badge-info">{f.type?.toUpperCase()}</span>
                          <span className={`badge ${f.status === 'completed' ? 'badge-success' : f.status === 'cancelled' ? 'badge-neutral' : 'badge-warning'}`}>
                            {f.status?.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-white/80 text-sm whitespace-pre-wrap">{f.notes}</p>
                      </div>
                      <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                        <span className="text-xs text-white/30 whitespace-nowrap">{formatDate(f.date || f.createdAt)}</span>
                        {checkPermission('followups_delete') && (
                          <button onClick={() => onDeleteFollowup(f._id || f.id)} className="p-1 rounded-lg hover:bg-white/5 text-white/40 hover:text-danger" title="Delete">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {showPaymentForm && (
        <PaymentFormModal
          payment={editingPayment}
          clientId={client._id || client.id}
          clientName={client.name}
          onSave={handleSavePayment}
          onClose={() => { setShowPaymentForm(false); setEditingPayment(null); }}
        />
      )}

      {showDocumentForm && (
        <DocumentFormModal
          onSave={(form) => {
            onSaveDocument({
              clientId: client._id || client.id,
              fileName: form.fileName,
              fileType: form.fileType,
              fileSize: form.fileSize,
              uploadedAt: new Date().toISOString(),
              uploadedBy: user.name,
            });
            setShowDocumentForm(false);
          }}
          onClose={() => setShowDocumentForm(false)}
        />
      )}

      {showFollowupForm && (
        <FollowupFormModal
          onSave={(form) => {
            onSaveFollowup({
              clientId: client._id || client.id,
              clientName: client.name,
              date: form.date || null,
              type: form.type,
              notes: form.notes,
              status: form.status,
              createdBy: user.id,
              createdByName: user.name,
              createdAt: new Date().toISOString(),
            });
            setShowFollowupForm(false);
          }}
          onClose={() => setShowFollowupForm(false)}
        />
      )}

      {showPrintBill && (
        <PrintBillView
          client={client}
          payments={clientPayments}
          onClose={() => setShowPrintBill(false)}
        />
      )}
    </div>
  );
}

export default function ClientsPage() {
  const { user, getCollection, addItemToCollection, updateItemInCollection, deleteItemFromCollection, checkPermission } = useApp();

  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [viewClient, setViewClient] = useState(null);
  const [toast, setToast] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const [clients, setClients] = useState([]);
  const [payments, setPayments] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [followups, setFollowups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const [clData, payData, docData, fuData] = await Promise.all([
          getCollection('clients'),
          getCollection('payments'),
          getCollection('documents'),
          getCollection('followups'),
        ]);
        if (!cancelled) {
          setClients(clData || []);
          setPayments(payData || []);
          setDocuments(docData || []);
          setFollowups(fuData || []);
        }
      } catch (err) {
        console.error('Failed to load clients data:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [getCollection, refreshKey]);

  const propertiesResult = useMemo(() => {
    return [];
  }, []);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const filteredClients = useMemo(() => {
    let result = [...clients];

    if (!user?.isSuperAdmin) {
      result = result.filter(c => c.createdBy === user?.id);
    }

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(c =>
        c.name?.toLowerCase().includes(q) ||
        c.mobile?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q)
      );
    }

    if (filterType) {
      result = result.filter(c => c.clientType === filterType);
    }

    result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return result;
  }, [clients, user, search, filterType]);

  const stats = useMemo(() => {
    const visible = !user?.isSuperAdmin ? clients.filter(c => c.createdBy === user?.id) : clients;
    return {
      total: visible.length,
      purchase: visible.filter(c => c.clientType === 'purchase').length,
      rentTake: visible.filter(c => c.clientType === 'rent_take').length,
      rentGive: visible.filter(c => c.clientType === 'rent_give').length,
      interior: visible.filter(c => c.clientType === 'interior').length,
    };
  }, [clients, user]);

  const getPropertyLabel = useCallback((propertyId) => {
    if (!propertyId) return '-';
    return propertyId;
  }, []);

  const handleSaveClient = async (form) => {
    const isNew = !form.id;
    if (isNew) {
      await addItemToCollection('clients', {
        ...form,
        id: generateId(),
        createdBy: user.id,
        createdByName: user.name,
        createdAt: new Date().toISOString(),
      });
      showToast('Client created successfully');
    } else {
      await updateItemInCollection('clients', form.id, {
        ...form,
        updatedAt: new Date().toISOString(),
      });
      showToast('Client updated successfully');
    }
    setShowForm(false);
    setEditingClient(null);
    setRefreshKey(k => k + 1);
  };

  const handleDeleteClient = async (id) => {
    if (confirm('Are you sure you want to delete this client? This will also remove associated payments, documents, and follow-ups.')) {
      await deleteItemFromCollection('clients', id);
      showToast('Client deleted');
      setRefreshKey(k => k + 1);
      if (viewClient && (viewClient._id === id || viewClient.id === id)) {
        setViewClient(null);
      }
    }
  };

  const handleSavePayment = async (form) => {
    await addItemToCollection('payments', {
      ...form,
      id: generateId(),
      createdBy: user.id,
      createdAt: new Date().toISOString(),
    });
    showToast('Payment added successfully');
    setRefreshKey(k => k + 1);
  };

  const handleEditPayment = async (id, form) => {
    await updateItemInCollection('payments', id, {
      ...form,
      updatedAt: new Date().toISOString(),
    });
    showToast('Payment updated successfully');
    setRefreshKey(k => k + 1);
  };

  const handleDeletePayment = async (id) => {
    if (confirm('Are you sure you want to delete this payment?')) {
      await deleteItemFromCollection('payments', id);
      showToast('Payment deleted');
      setRefreshKey(k => k + 1);
    }
  };

  const handleSaveDocument = async (doc) => {
    await addItemToCollection('documents', doc);
    showToast('Document added successfully');
    setRefreshKey(k => k + 1);
  };

  const handleDeleteDocument = async (id) => {
    if (confirm('Are you sure you want to delete this document?')) {
      await deleteItemFromCollection('documents', id);
      showToast('Document deleted');
      setRefreshKey(k => k + 1);
    }
  };

  const handleSaveFollowup = async (followup) => {
    await addItemToCollection('followups', followup);
    showToast('Follow-up added successfully');
    setRefreshKey(k => k + 1);
  };

  const handleDeleteFollowup = async (id) => {
    if (confirm('Are you sure you want to delete this follow-up?')) {
      await deleteItemFromCollection('followups', id);
      showToast('Follow-up deleted');
      setRefreshKey(k => k + 1);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Client Management</h1>
          <p className="text-sm text-white/40 mt-1">Manage your clients and their payments</p>
        </div>
        {checkPermission('clients_create') && (
          <button onClick={() => { setEditingClient(null); setShowForm(true); }} className="glass-btn">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Add Client
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="stat-card">
          <p className="text-xs text-white/40 uppercase tracking-wider">Total Clients</p>
          <p className="text-2xl font-bold text-white mt-1">{stats.total}</p>
        </div>
        <div className="stat-card">
          <p className="text-xs text-white/40 uppercase tracking-wider">Purchase</p>
          <p className="text-2xl font-bold text-blue-400 mt-1">{stats.purchase}</p>
        </div>
        <div className="stat-card">
          <p className="text-xs text-white/40 uppercase tracking-wider">Rent Take</p>
          <p className="text-2xl font-bold text-green-400 mt-1">{stats.rentTake}</p>
        </div>
        <div className="stat-card">
          <p className="text-xs text-white/40 uppercase tracking-wider">Rent Give</p>
          <p className="text-2xl font-bold text-yellow-400 mt-1">{stats.rentGive}</p>
        </div>
        <div className="stat-card">
          <p className="text-xs text-white/40 uppercase tracking-wider">Interior</p>
          <p className="text-2xl font-bold text-purple-400 mt-1">{stats.interior}</p>
        </div>
      </div>

      <div className="glass-card p-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              className="glass-input pl-10"
              placeholder="Search by name, mobile, email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select className="glass-select md:w-48" value={filterType} onChange={e => setFilterType(e.target.value)}>
            <option value="">All Types</option>
            {CLIENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="glass-card p-12 text-center text-white/30">
          <div className="inline-block w-8 h-8 border-2 border-white/20 border-t-white/60 rounded-full animate-spin mb-3" />
          <p>Loading clients...</p>
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="glass-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Mobile</th>
                  <th className="hidden md:table-cell">Email</th>
                  <th>Type</th>
                  <th className="hidden lg:table-cell">Property</th>
                  <th className="hidden lg:table-cell">Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredClients.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-white/30">
                      <svg className="w-12 h-12 mx-auto mb-3 text-white/10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <p>No clients found</p>
                    </td>
                  </tr>
                ) : (
                  filteredClients.map(client => (
                    <tr key={client._id || client.id} className="cursor-pointer" onClick={() => setViewClient(client)}>
                      <td>
                        <div className="text-white font-medium">{client.name}</div>
                      </td>
                      <td className="text-white/70 text-sm">{client.mobile || '-'}</td>
                      <td className="hidden md:table-cell text-white/50 text-sm truncate max-w-[160px]">{client.email || '-'}</td>
                      <td>
                        <span className={`badge ${CLIENT_TYPE_BADGES[client.clientType] || 'badge-neutral'}`}>
                          {client.clientType?.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                      <td className="hidden lg:table-cell text-white/50 text-sm">{getPropertyLabel(client.propertyId)}</td>
                      <td className="hidden lg:table-cell text-white/50 text-sm">{formatDate(client.createdAt)}</td>
                      <td onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-1">
                          <button onClick={() => setViewClient(client)} className="p-1.5 rounded-lg hover:bg-white/5 text-white/50 hover:text-white" title="View">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                          </button>
                          {checkPermission('clients_edit') && (
                            <button onClick={() => { setEditingClient(client); setShowForm(true); }} className="p-1.5 rounded-lg hover:bg-white/5 text-white/50 hover:text-accent-light" title="Edit">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                            </button>
                          )}
                          {checkPermission('clients_delete') && (
                            <button onClick={() => handleDeleteClient(client._id || client.id)} className="p-1.5 rounded-lg hover:bg-white/5 text-white/50 hover:text-danger" title="Delete">
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
          {filteredClients.length > 0 && (
            <div className="px-4 py-3 border-t border-white/5 text-sm text-white/40">
              Showing {filteredClients.length} of {clients.length} clients
            </div>
          )}
        </div>
      )}

      {showForm && (
        <ClientFormModal
          client={editingClient}
          onSave={handleSaveClient}
          onClose={() => { setShowForm(false); setEditingClient(null); }}
        />
      )}

      {viewClient && (
        <ClientDetailModal
          client={viewClient}
          payments={payments}
          documents={documents}
          followups={followups}
          onSavePayment={handleSavePayment}
          onDeletePayment={handleDeletePayment}
          onEditPayment={handleEditPayment}
          onSaveDocument={handleSaveDocument}
          onDeleteDocument={handleDeleteDocument}
          onSaveFollowup={handleSaveFollowup}
          onDeleteFollowup={handleDeleteFollowup}
          onClose={() => setViewClient(null)}
          user={user}
          checkPermission={checkPermission}
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
