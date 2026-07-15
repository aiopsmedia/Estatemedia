'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useApp } from '@/lib/store';
import { generateId, formatDate, formatDateTime, formatCurrency } from '@/lib/data';

const INCOME_CATEGORIES = [
  { value: 'lead_payment', label: 'Lead Payment' },
  { value: 'client_payment', label: 'Client Payment' },
  { value: 'interior_payment', label: 'Interior Payment' },
  { value: 'other', label: 'Other Income' },
];

const EXPENSE_CATEGORIES = [
  { value: 'vendor_payment', label: 'Vendor Payment' },
  { value: 'salary', label: 'Salary' },
  { value: 'rent', label: 'Rent' },
  { value: 'utilities', label: 'Utilities' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'office_expense', label: 'Office Expense' },
  { value: 'other', label: 'Other Expense' },
];

const ALL_CATEGORIES = [
  { value: 'lead_payment', label: 'Lead Payment', type: 'income' },
  { value: 'client_payment', label: 'Client Payment', type: 'income' },
  { value: 'interior_payment', label: 'Interior Payment', type: 'income' },
  { value: 'vendor_payment', label: 'Vendor Payment', type: 'expense' },
  { value: 'salary', label: 'Salary', type: 'expense' },
  { value: 'rent', label: 'Rent', type: 'expense' },
  { value: 'utilities', label: 'Utilities', type: 'expense' },
  { value: 'marketing', label: 'Marketing', type: 'expense' },
  { value: 'office_expense', label: 'Office Expense', type: 'expense' },
  { value: 'other', label: 'Other', type: 'both' },
];

const RELATED_TO_OPTIONS = [
  { value: '', label: 'None' },
  { value: 'lead', label: 'Lead' },
  { value: 'client', label: 'Client' },
  { value: 'interior_project', label: 'Interior Project' },
  { value: 'vendor', label: 'Vendor' },
  { value: 'other', label: 'Other' },
];

const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'upi', label: 'UPI' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'other', label: 'Other' },
];

const INITIAL_FORM = {
  type: 'income',
  category: 'client_payment',
  description: '',
  amount: '',
  relatedTo: '',
  relatedId: '',
  relatedName: '',
  paymentMethod: 'cash',
  reference: '',
  date: new Date().toISOString().split('T')[0],
};

function TransactionFormModal({ transaction, onSave, onClose, leads, clients, interiorProjects, vendors }) {
  const [form, setForm] = useState(transaction || { ...INITIAL_FORM });
  const categories = form.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  const relatedEntities = useMemo(() => {
    switch (form.relatedTo) {
      case 'lead': return leads.map(l => ({ id: l._id || l.id, name: l.name || l.leadName || 'Lead' }));
      case 'client': return clients.map(c => ({ id: c._id || c.id, name: c.name || 'Client' }));
      case 'interior_project': return interiorProjects.map(p => ({ id: p._id || p.id, name: p.clientName || p.code || 'Project' }));
      case 'vendor': return vendors.map(v => ({ id: v._id || v.id, name: v.name || v.companyName || 'Vendor' }));
      default: return [];
    }
  }, [form.relatedTo, leads, clients, interiorProjects, vendors]);

  const handleChange = (field, value) => {
    setForm(prev => {
      const next = { ...prev, [field]: value };
      if (field === 'type') {
        const cats = value === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
        next.category = cats[0].value;
      }
      if (field === 'relatedTo') {
        next.relatedId = '';
        next.relatedName = '';
      }
      if (field === 'relatedId' && value) {
        const entity = relatedEntities.find(e => e.id === value);
        next.relatedName = entity ? entity.name : '';
      }
      return next;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.description.trim() || !form.amount) return;
    onSave({
      ...form,
      amount: Number(form.amount),
      date: form.date ? new Date(form.date).toISOString() : new Date().toISOString(),
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content max-sm:w-full max-sm:h-full max-sm:rounded-none max-sm:p-4" style={{ maxWidth: 640 }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">{transaction?.id || transaction?._id ? 'Edit Transaction' : 'Add Transaction'}</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-white/60 mb-1">Type *</label>
              <select className="glass-select w-full" value={form.type} onChange={e => handleChange('type', e.target.value)} disabled={!!(transaction?.id || transaction?._id)}>
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-1">Category *</label>
              <select className="glass-select w-full" value={form.category} onChange={e => handleChange('category', e.target.value)} required>
                {categories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm text-white/60 mb-1">Description *</label>
            <input type="text" className="glass-input w-full" value={form.description} onChange={e => handleChange('description', e.target.value)} required placeholder="Transaction description" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-white/60 mb-1">Amount (₹) *</label>
              <input type="number" className="glass-input w-full" value={form.amount} onChange={e => handleChange('amount', e.target.value)} required min="0" step="0.01" placeholder="0.00" />
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-1">Date *</label>
              <input type="date" className="glass-input w-full" value={form.date ? form.date.split('T')[0] : ''} onChange={e => handleChange('date', e.target.value)} required />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-white/60 mb-1">Payment Method</label>
              <select className="glass-select w-full" value={form.paymentMethod} onChange={e => handleChange('paymentMethod', e.target.value)}>
                {PAYMENT_METHODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-1">Reference Number</label>
              <input type="text" className="glass-input w-full" value={form.reference} onChange={e => handleChange('reference', e.target.value)} placeholder="Cheque/UPI/Ref number" />
            </div>
          </div>

          <div className="border-t border-white/5 pt-4">
            <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-3">Related To</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-white/60 mb-1">Entity Type</label>
                <select className="glass-select w-full" value={form.relatedTo} onChange={e => handleChange('relatedTo', e.target.value)}>
                  {RELATED_TO_OPTIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
              {form.relatedTo && relatedEntities.length > 0 && (
                <div>
                  <label className="block text-sm text-white/60 mb-1">Select Entity</label>
                  <select className="glass-select w-full" value={form.relatedId} onChange={e => handleChange('relatedId', e.target.value)}>
                    <option value="">Select...</option>
                    {relatedEntities.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                  </select>
                </div>
              )}
              {form.relatedTo && !relatedEntities.length && (
                <div>
                  <label className="block text-sm text-white/60 mb-1">Name</label>
                  <input type="text" className="glass-input w-full" value={form.relatedName} onChange={e => handleChange('relatedName', e.target.value)} placeholder="Related entity name" />
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" className="glass-btn glass-btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="glass-btn glass-btn-success">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              {transaction?.id || transaction?._id ? 'Update Transaction' : 'Add Transaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function QuickActionModal({ type, onSave, onClose, clients, vendors }) {
  const [form, setForm] = useState({
    amount: '',
    description: '',
    paymentMethod: 'cash',
    reference: '',
    date: new Date().toISOString().split('T')[0],
    relatedId: '',
    relatedName: '',
  });

  const entities = type === 'client' ? clients : vendors;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.description.trim() || !form.amount) return;
    onSave({
      type: type === 'client' ? 'income' : 'expense',
      category: type === 'client' ? 'client_payment' : 'vendor_payment',
      description: form.description,
      amount: Number(form.amount),
      relatedTo: type,
      relatedId: form.relatedId,
      relatedName: form.relatedName,
      paymentMethod: form.paymentMethod,
      reference: form.reference,
      date: new Date(form.date).toISOString(),
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content max-sm:w-full max-sm:h-full max-sm:rounded-none max-sm:p-4" style={{ maxWidth: 520 }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">{type === 'client' ? 'Record Payment from Client' : 'Record Vendor Payment'}</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-white/60 mb-1">{type === 'client' ? 'Client' : 'Vendor'} *</label>
            <select className="glass-select w-full" value={form.relatedId} onChange={e => {
              const id = e.target.value;
              const entity = entities.find(en => (en._id || en.id) === id);
              setForm(p => ({ ...p, relatedId: id, relatedName: entity ? entity.name : '' }));
            }} required>
              <option value="">Select {type === 'client' ? 'Client' : 'Vendor'}</option>
              {entities.map(e => <option key={e._id || e.id} value={e._id || e.id}>{e.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-white/60 mb-1">Description *</label>
            <input type="text" className="glass-input w-full" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} required placeholder={type === 'client' ? 'e.g. Client payment received' : 'e.g. Vendor payment made'} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-white/60 mb-1">Amount (₹) *</label>
              <input type="number" className="glass-input w-full" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} required min="0" step="0.01" placeholder="0.00" />
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-1">Date</label>
              <input type="date" className="glass-input w-full" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-white/60 mb-1">Payment Method</label>
              <select className="glass-select w-full" value={form.paymentMethod} onChange={e => setForm(p => ({ ...p, paymentMethod: e.target.value }))}>
                {PAYMENT_METHODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-1">Reference</label>
              <input type="text" className="glass-input w-full" value={form.reference} onChange={e => setForm(p => ({ ...p, reference: e.target.value }))} placeholder="Ref number" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" className="glass-btn glass-btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className={type === 'client' ? 'glass-btn glass-btn-success' : 'glass-btn'}>
              {type === 'client' ? 'Record Income' : 'Record Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function FinancePage() {
  const { user, getCollection, addItemToCollection, updateItemInCollection, deleteItemFromCollection, checkPermission } = useApp();

  const [activeTab, setActiveTab] = useState('overview');
  const [showForm, setShowForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [toast, setToast] = useState(null);
  const [filterCategory, setFilterCategory] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [quickAction, setQuickAction] = useState(null);

  const [transactions, setTransactions] = useState([]);
  const [leads, setLeads] = useState([]);
  const [clients, setClients] = useState([]);
  const [interiorProjects, setInteriorProjects] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const doRefresh = () => setRefreshKey(k => k + 1);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [txResult, leadsResult, clientsResult, projectsResult, vendorsResult] = await Promise.all([
          getCollection('financeTransactions'),
          getCollection('leads'),
          getCollection('clients'),
          getCollection('interiorProjects'),
          getCollection('vendors'),
        ]);
        setTransactions(txResult || []);
        setLeads(leadsResult || []);
        setClients(clientsResult || []);
        setInteriorProjects(projectsResult || []);
        setVendors(vendorsResult || []);
      } catch (err) {
        console.error('Failed to load finance data:', err);
      }
      setLoading(false);
    }
    load();
  }, [getCollection, refreshKey]);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const stats = useMemo(() => {
    const income = transactions.filter(t => t.type === 'income');
    const expense = transactions.filter(t => t.type === 'expense');
    const totalIncome = income.reduce((s, t) => s + (t.amount || 0), 0);
    const totalExpense = expense.reduce((s, t) => s + (t.amount || 0), 0);

    const now = new Date();
    const thisMonth = now.toISOString().slice(0, 7);
    const monthIncome = income.filter(t => t.date?.startsWith(thisMonth)).reduce((s, t) => s + (t.amount || 0), 0);
    const monthExpense = expense.filter(t => t.date?.startsWith(thisMonth)).reduce((s, t) => s + (t.amount || 0), 0);

    return { totalIncome, totalExpense, netProfit: totalIncome - totalExpense, monthIncome, monthExpense };
  }, [transactions]);

  const monthlyData = useMemo(() => {
    const months = {};
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toISOString().slice(0, 7);
      const label = d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
      months[key] = { label, income: 0, expense: 0 };
    }
    transactions.forEach(t => {
      const key = t.date?.slice(0, 7);
      if (months[key]) {
        if (t.type === 'income') months[key].income += t.amount || 0;
        else months[key].expense += t.amount || 0;
      }
    });
    return Object.values(months);
  }, [transactions]);

  const categoryBreakdown = useMemo(() => {
    const map = {};
    transactions.forEach(t => {
      const label = ALL_CATEGORIES.find(c => c.value === t.category)?.label || t.category;
      if (!map[t.category]) map[t.category] = { label, income: 0, expense: 0, count: 0 };
      map[t.category][t.type] += t.amount || 0;
      map[t.category].count++;
    });
    return Object.values(map).sort((a, b) => (b.income + b.expense) - (a.income + a.expense));
  }, [transactions]);

  const maxMonthlyAmount = useMemo(() => {
    return Math.max(1, ...monthlyData.map(m => Math.max(m.income, m.expense)));
  }, [monthlyData]);

  const filteredTransactions = useCallback((type) => {
    let result = transactions.filter(t => t.type === type);
    if (filterCategory) result = result.filter(t => t.category === filterCategory);
    if (filterDateFrom) result = result.filter(t => t.date && t.date >= filterDateFrom);
    if (filterDateTo) result = result.filter(t => t.date && t.date <= filterDateTo + 'T23:59:59');
    return result.sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt));
  }, [transactions, filterCategory, filterDateFrom, filterDateTo]);

  const incomeTransactions = useMemo(() => filteredTransactions('income'), [filteredTransactions]);
  const expenseTransactions = useMemo(() => filteredTransactions('expense'), [filteredTransactions]);

  const monthlySummary = useMemo(() => {
    const months = {};
    transactions.forEach(t => {
      const key = t.date?.slice(0, 7) || 'Unknown';
      if (!months[key]) months[key] = { income: 0, expense: 0 };
      months[key][t.type] += t.amount || 0;
    });
    return Object.entries(months).sort((a, b) => b[0].localeCompare(a[0])).map(([month, data]) => ({
      month,
      label: (() => { try { return new Date(month + '-01').toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }); } catch { return month; } })(),
      ...data,
      net: data.income - data.expense,
    }));
  }, [transactions]);

  const handleSaveTransaction = async (form) => {
    const isNew = !form.id && !form._id;
    if (isNew) {
      await addItemToCollection('financeTransactions', {
        ...form,
        id: generateId(),
        createdBy: user.id,
        createdByName: user.name,
        createdAt: new Date().toISOString(),
      });
      showToast('Transaction added successfully');
    } else {
      const txId = form._id || form.id;
      await updateItemInCollection('financeTransactions', txId, {
        ...form,
        updatedAt: new Date().toISOString(),
      });
      showToast('Transaction updated successfully');
    }
    setShowForm(false);
    setEditingTransaction(null);
    doRefresh();
  };

  const handleDeleteTransaction = async (id) => {
    if (confirm('Are you sure you want to delete this transaction?')) {
      await deleteItemFromCollection('financeTransactions', id);
      showToast('Transaction deleted');
      doRefresh();
    }
  };

  const handleQuickAction = async (form) => {
    await addItemToCollection('financeTransactions', {
      ...form,
      id: generateId(),
      createdBy: user.id,
      createdByName: user.name,
      createdAt: new Date().toISOString(),
    });
    showToast('Payment recorded successfully');
    setQuickAction(null);
    doRefresh();
  };

  const getCategoryLabel = (cat) => ALL_CATEGORIES.find(c => c.value === cat)?.label || cat;

  if (!checkPermission('finance_view')) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <svg className="w-16 h-16 mx-auto mb-4 text-white/10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
          <h2 className="text-xl font-bold text-white mb-2">Access Denied</h2>
          <p className="text-white/40">You don&apos;t have permission to view finance data.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/40">Loading finance data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {toast && (
        <div className={`toast toast-${toast.type}`} style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999 }}>
          {toast.message}
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Finance Management</h1>
          <p className="text-sm text-white/40 mt-1">Track income, expenses, and financial overview</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {checkPermission('finance_manage') && (
            <>
              <button onClick={() => setQuickAction('client')} className="glass-btn glass-btn-success text-sm py-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Client Payment
              </button>
              <button onClick={() => setQuickAction('vendor')} className="glass-btn text-sm py-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                Vendor Payment
              </button>
            </>
          )}
          {checkPermission('finance_manage') && (
            <button onClick={() => { setEditingTransaction(null); setShowForm(true); }} className="glass-btn text-sm py-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              Add Transaction
            </button>
          )}
        </div>
      </div>

      <div className="tabs-container overflow-x-auto">
        {['overview', 'income', 'expenses', 'reports'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`tab-btn whitespace-nowrap ${activeTab === tab ? 'active' : ''}`}>
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="stat-card">
              <p className="text-xs text-white/40 uppercase tracking-wider">Total Income</p>
              <p className="text-2xl font-bold text-green-400 mt-1">{formatCurrency(stats.totalIncome)}</p>
            </div>
            <div className="stat-card">
              <p className="text-xs text-white/40 uppercase tracking-wider">Total Expenses</p>
              <p className="text-2xl font-bold text-red-400 mt-1">{formatCurrency(stats.totalExpense)}</p>
            </div>
            <div className="stat-card">
              <p className="text-xs text-white/40 uppercase tracking-wider">Net Profit</p>
              <p className={`text-2xl font-bold mt-1 ${stats.netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>{formatCurrency(stats.netProfit)}</p>
            </div>
            <div className="stat-card">
              <p className="text-xs text-white/40 uppercase tracking-wider">This Month Income</p>
              <p className="text-2xl font-bold text-blue-400 mt-1">{formatCurrency(stats.monthIncome)}</p>
            </div>
            <div className="stat-card">
              <p className="text-xs text-white/40 uppercase tracking-wider">This Month Expenses</p>
              <p className="text-2xl font-bold text-orange-400 mt-1">{formatCurrency(stats.monthExpense)}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass-card p-5">
              <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-4">Monthly Comparison</h3>
              <div className="space-y-3">
                {monthlyData.map((m, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-white/50">{m.label}</span>
                      <span className="text-white/30">{formatCurrency(m.income)} / {formatCurrency(m.expense)}</span>
                    </div>
                    <div className="flex gap-1 h-5">
                      <div
                        className="bg-green-500/80 rounded-sm transition-all"
                        style={{ width: `${(m.income / maxMonthlyAmount) * 100}%`, minWidth: m.income > 0 ? 4 : 0 }}
                        title={`Income: ${formatCurrency(m.income)}`}
                      />
                      <div
                        className="bg-red-500/80 rounded-sm transition-all"
                        style={{ width: `${(m.expense / maxMonthlyAmount) * 100}%`, minWidth: m.expense > 0 ? 4 : 0 }}
                        title={`Expense: ${formatCurrency(m.expense)}`}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-4 mt-4 text-xs text-white/40">
                <span className="flex items-center gap-1"><span className="w-3 h-3 bg-green-500/80 rounded-sm inline-block" /> Income</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 bg-red-500/80 rounded-sm inline-block" /> Expense</span>
              </div>
            </div>

            <div className="glass-card p-5">
              <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-4">Income vs Expense</h3>
              {stats.totalIncome + stats.totalExpense > 0 ? (
                <div className="flex items-center justify-center gap-8 py-6">
                  <div className="text-center">
                    <div className="relative w-28 h-28 mx-auto mb-3">
                      <svg viewBox="0 0 36 36" className="w-28 h-28 -rotate-90">
                        <circle cx="18" cy="18" r="15.91549430918954" fill="transparent" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
                        <circle
                          cx="18" cy="18" r="15.91549430918954" fill="transparent"
                          stroke="#22c55e" strokeWidth="3"
                          strokeDasharray={`${(stats.totalIncome / (stats.totalIncome + stats.totalExpense)) * 100} ${100}`}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-sm font-bold text-white">
                          {Math.round((stats.totalIncome / (stats.totalIncome + stats.totalExpense)) * 100)}%
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-green-400 font-medium">Income</p>
                    <p className="text-sm font-bold text-white">{formatCurrency(stats.totalIncome)}</p>
                  </div>
                  <div className="text-center">
                    <div className="relative w-28 h-28 mx-auto mb-3">
                      <svg viewBox="0 0 36 36" className="w-28 h-28 -rotate-90">
                        <circle cx="18" cy="18" r="15.91549430918954" fill="transparent" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
                        <circle
                          cx="18" cy="18" r="15.91549430918954" fill="transparent"
                          stroke="#ef4444" strokeWidth="3"
                          strokeDasharray={`${(stats.totalExpense / (stats.totalIncome + stats.totalExpense)) * 100} ${100}`}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-sm font-bold text-white">
                          {Math.round((stats.totalExpense / (stats.totalIncome + stats.totalExpense)) * 100)}%
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-red-400 font-medium">Expense</p>
                    <p className="text-sm font-bold text-white">{formatCurrency(stats.totalExpense)}</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-white/30">No transactions yet</div>
              )}
            </div>
          </div>

          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-4">Category Breakdown</h3>
            {categoryBreakdown.length === 0 ? (
              <div className="text-center py-8 text-white/30">No data available</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="glass-table">
                  <thead>
                    <tr>
                      <th>Category</th>
                      <th className="text-right">Income</th>
                      <th className="text-right">Expense</th>
                      <th className="text-right">Transactions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categoryBreakdown.map((cat, i) => (
                      <tr key={i}>
                        <td className="text-white font-medium">{cat.label}</td>
                        <td className="text-right text-green-400">{cat.income > 0 ? formatCurrency(cat.income) : '-'}</td>
                        <td className="text-right text-red-400">{cat.expense > 0 ? formatCurrency(cat.expense) : '-'}</td>
                        <td className="text-right text-white/50">{cat.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'income' && (
        <div className="space-y-4">
          <div className="glass-card p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <select className="glass-select w-full sm:w-48" value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
                <option value="">All Categories</option>
                {INCOME_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
              <input type="date" className="glass-input w-full sm:w-40" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)} placeholder="From" />
              <input type="date" className="glass-input w-full sm:w-40" value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)} placeholder="To" />
              {(filterCategory || filterDateFrom || filterDateTo) && (
                <button onClick={() => { setFilterCategory(''); setFilterDateFrom(''); setFilterDateTo(''); }} className="glass-btn-secondary text-sm py-2">Clear Filters</button>
              )}
            </div>
          </div>

          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="glass-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Category</th>
                    <th>Description</th>
                    <th className="text-right">Amount</th>
                    <th>Payment</th>
                    <th className="hidden lg:table-cell">Related To</th>
                    {checkPermission('finance_manage') && <th>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {incomeTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-white/30">
                        <svg className="w-12 h-12 mx-auto mb-3 text-white/10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        <p>No income transactions found</p>
                      </td>
                    </tr>
                  ) : (
                    incomeTransactions.map(t => (
                      <tr key={t._id || t.id}>
                        <td className="text-white/70 text-sm whitespace-nowrap">{formatDate(t.date || t.createdAt)}</td>
                        <td><span className="badge badge-success">{getCategoryLabel(t.category)}</span></td>
                        <td className="text-white font-medium max-w-48 truncate">{t.description}</td>
                        <td className="text-right text-green-400 font-bold">{formatCurrency(t.amount)}</td>
                        <td className="text-white/50 capitalize text-sm">{t.paymentMethod?.replace('_', ' ')}</td>
                        <td className="text-white/50 text-sm hidden lg:table-cell">{t.relatedName || '-'}</td>
                        {checkPermission('finance_manage') && (
                          <td onClick={e => e.stopPropagation()}>
                            <div className="flex items-center gap-1">
                              <button onClick={() => { setEditingTransaction(t); setShowForm(true); }} className="p-1.5 rounded-lg hover:bg-white/5 text-white/50 hover:text-white" title="Edit">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                              </button>
                              <button onClick={() => handleDeleteTransaction(t._id || t.id)} className="p-1.5 rounded-lg hover:bg-white/5 text-white/50 hover:text-red-400" title="Delete">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'expenses' && (
        <div className="space-y-4">
          <div className="glass-card p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <select className="glass-select w-full sm:w-48" value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
                <option value="">All Categories</option>
                {EXPENSE_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
              <input type="date" className="glass-input w-full sm:w-40" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)} placeholder="From" />
              <input type="date" className="glass-input w-full sm:w-40" value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)} placeholder="To" />
              {(filterCategory || filterDateFrom || filterDateTo) && (
                <button onClick={() => { setFilterCategory(''); setFilterDateFrom(''); setFilterDateTo(''); }} className="glass-btn-secondary text-sm py-2">Clear Filters</button>
              )}
            </div>
          </div>

          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="glass-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Category</th>
                    <th>Description</th>
                    <th className="text-right">Amount</th>
                    <th>Payment</th>
                    <th className="hidden lg:table-cell">Related To</th>
                    {checkPermission('finance_manage') && <th>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {expenseTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-white/30">
                        <svg className="w-12 h-12 mx-auto mb-3 text-white/10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                        <p>No expense transactions found</p>
                      </td>
                    </tr>
                  ) : (
                    expenseTransactions.map(t => (
                      <tr key={t._id || t.id}>
                        <td className="text-white/70 text-sm whitespace-nowrap">{formatDate(t.date || t.createdAt)}</td>
                        <td><span className="badge badge-danger">{getCategoryLabel(t.category)}</span></td>
                        <td className="text-white font-medium max-w-48 truncate">{t.description}</td>
                        <td className="text-right text-red-400 font-bold">{formatCurrency(t.amount)}</td>
                        <td className="text-white/50 capitalize text-sm">{t.paymentMethod?.replace('_', ' ')}</td>
                        <td className="text-white/50 text-sm hidden lg:table-cell">{t.relatedName || '-'}</td>
                        {checkPermission('finance_manage') && (
                          <td onClick={e => e.stopPropagation()}>
                            <div className="flex items-center gap-1">
                              <button onClick={() => { setEditingTransaction(t); setShowForm(true); }} className="p-1.5 rounded-lg hover:bg-white/5 text-white/50 hover:text-white" title="Edit">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                              </button>
                              <button onClick={() => handleDeleteTransaction(t._id || t.id)} className="p-1.5 rounded-lg hover:bg-white/5 text-white/50 hover:text-red-400" title="Delete">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'reports' && (
        <div className="space-y-6">
          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-4">Category Summary</h3>
            {categoryBreakdown.length === 0 ? (
              <div className="text-center py-8 text-white/30">No data available</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="glass-table">
                  <thead>
                    <tr>
                      <th>Category</th>
                      <th className="text-right">Income</th>
                      <th className="text-right">Expense</th>
                      <th className="text-right">Net</th>
                      <th className="text-right">Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categoryBreakdown.map((cat, i) => {
                      const net = cat.income - cat.expense;
                      return (
                        <tr key={i}>
                          <td className="text-white font-medium">{cat.label}</td>
                          <td className="text-right text-green-400">{cat.income > 0 ? formatCurrency(cat.income) : '-'}</td>
                          <td className="text-right text-red-400">{cat.expense > 0 ? formatCurrency(cat.expense) : '-'}</td>
                          <td className={`text-right font-medium ${net >= 0 ? 'text-green-400' : 'text-red-400'}`}>{formatCurrency(net)}</td>
                          <td className="text-right text-white/50">{cat.count}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-white/10">
                      <td className="text-white font-bold">Total</td>
                      <td className="text-right text-green-400 font-bold">{formatCurrency(stats.totalIncome)}</td>
                      <td className="text-right text-red-400 font-bold">{formatCurrency(stats.totalExpense)}</td>
                      <td className={`text-right font-bold ${stats.netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>{formatCurrency(stats.netProfit)}</td>
                      <td className="text-right text-white/50 font-bold">{transactions.length}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>

          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-4">Monthly Totals</h3>
            {monthlySummary.length === 0 ? (
              <div className="text-center py-8 text-white/30">No data available</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="glass-table">
                  <thead>
                    <tr>
                      <th>Month</th>
                      <th className="text-right">Income</th>
                      <th className="text-right">Expense</th>
                      <th className="text-right">Net</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthlySummary.map((m, i) => (
                      <tr key={i}>
                        <td className="text-white font-medium">{m.label}</td>
                        <td className="text-right text-green-400">{formatCurrency(m.income)}</td>
                        <td className="text-right text-red-400">{formatCurrency(m.expense)}</td>
                        <td className={`text-right font-medium ${m.net >= 0 ? 'text-green-400' : 'text-red-400'}`}>{formatCurrency(m.net)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-4">Income vs Expense Comparison</h3>
            {monthlySummary.length === 0 ? (
              <div className="text-center py-8 text-white/30">No data available</div>
            ) : (
              <div className="space-y-4">
                {monthlySummary.map((m, i) => {
                  const maxVal = Math.max(m.income, m.expense, 1);
                  return (
                    <div key={i} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-white/70 font-medium">{m.label}</span>
                        <span className="text-white/40 text-xs">Net: <span className={m.net >= 0 ? 'text-green-400' : 'text-red-400'}>{formatCurrency(m.net)}</span></span>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-green-400 w-16">Income</span>
                          <div className="flex-1 bg-white/5 rounded h-4 overflow-hidden">
                            <div className="bg-green-500/70 h-full rounded transition-all" style={{ width: `${(m.income / maxVal) * 100}%`, minWidth: m.income > 0 ? 2 : 0 }} />
                          </div>
                          <span className="text-xs text-white/40 w-24 text-right">{formatCurrency(m.income)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-red-400 w-16">Expense</span>
                          <div className="flex-1 bg-white/5 rounded h-4 overflow-hidden">
                            <div className="bg-red-500/70 h-full rounded transition-all" style={{ width: `${(m.expense / maxVal) * 100}%`, minWidth: m.expense > 0 ? 2 : 0 }} />
                          </div>
                          <span className="text-xs text-white/40 w-24 text-right">{formatCurrency(m.expense)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {showForm && (
        <TransactionFormModal
          transaction={editingTransaction}
          onSave={handleSaveTransaction}
          onClose={() => { setShowForm(false); setEditingTransaction(null); }}
          leads={leads}
          clients={clients}
          interiorProjects={interiorProjects}
          vendors={vendors}
        />
      )}

      {quickAction && (
        <QuickActionModal
          type={quickAction}
          onSave={handleQuickAction}
          onClose={() => setQuickAction(null)}
          clients={clients}
          vendors={vendors}
        />
      )}
    </div>
  );
}
