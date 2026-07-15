'use client';

import { useState, useMemo, useEffect } from 'react';
import { useApp } from '@/lib/store';
import { generateId, formatDate, formatCurrency } from '@/lib/data';

const CATEGORIES = [
  { value: 'material_supplier', label: 'Material Supplier' },
  { value: 'contractor', label: 'Contractor' },
  { value: 'labour', label: 'Labour' },
  { value: 'interior', label: 'Interior' },
  { value: 'transport', label: 'Transport' },
  { value: 'other', label: 'Other' },
];

const CATEGORY_BADGES = {
  material_supplier: 'badge-info',
  contractor: 'badge-success',
  labour: 'badge-warning',
  interior: 'badge-info',
  transport: 'badge-neutral',
  other: 'badge-neutral',
};

function getCategoryLabel(val) {
  return CATEGORIES.find(c => c.value === val)?.label || val;
}

export default function VendorsPage() {
  const { getCollection, addItemToCollection, updateItemInCollection, deleteItemFromCollection, checkPermission, user, refresh } = useApp();

  const [toast, setToast] = useState(null);
  const [activeView, setActiveView] = useState('list');
  const [vendors, setVendors] = useState([]);
  const [interiorProjects, setInteriorProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const doRefresh = () => setRefreshKey(k => k + 1);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [vendorsResult, projectsResult] = await Promise.all([
          getCollection('vendors'),
          getCollection('interiorProjects'),
        ]);
        setVendors(vendorsResult || []);
        setInteriorProjects(projectsResult || []);
      } catch (err) {
        console.error('Failed to load vendors data:', err);
      }
      setLoading(false);
    }
    load();
  }, [getCollection, refreshKey]);

  if (!checkPermission('vendors_view')) {
    return (
      <div className="text-center py-20 text-white/50">
        <p className="text-lg">You don&apos;t have permission to access this module.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/40">Loading vendors...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Vendor Management</h1>
          <p className="text-sm text-white/50 mt-1">Manage suppliers, contractors, and service vendors</p>
        </div>
      </div>

      {activeView === 'list' && (
        <VendorsList
          user={user}
          checkPermission={checkPermission}
          getCollection={getCollection}
          addItemToCollection={addItemToCollection}
          updateItemInCollection={updateItemInCollection}
          deleteItemFromCollection={deleteItemFromCollection}
          vendors={vendors}
          interiorProjects={interiorProjects}
          doRefresh={doRefresh}
          showToast={showToast}
          onViewDetail={(v) => setActiveView({ type: 'detail', vendor: v })}
        />
      )}

      {activeView.type === 'detail' && (
        <VendorDetail
          vendorId={activeView.vendor._id || activeView.vendor.id}
          user={user}
          checkPermission={checkPermission}
          getCollection={getCollection}
          updateItemInCollection={updateItemInCollection}
          deleteItemFromCollection={deleteItemFromCollection}
          vendors={vendors}
          interiorProjects={interiorProjects}
          doRefresh={doRefresh}
          showToast={showToast}
          onBack={() => setActiveView('list')}
          onEdit={(v) => setActiveView({ type: 'detail', vendor: v })}
        />
      )}

      {toast && (
        <div className={`toast toast-${toast.type}`}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}

function VendorsList({ user, checkPermission, addItemToCollection, updateItemInCollection, deleteItemFromCollection, vendors: allVendors, interiorProjects, doRefresh, showToast, onViewDetail }) {
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCity, setFilterCity] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [activeTab, setActiveTab] = useState('all');

  const isSuperAdmin = user?.isSuperAdmin;

  const vendors = useMemo(() => {
    let list = allVendors;
    if (!isSuperAdmin) {
      list = list.filter(v => v.createdBy === user?.id);
    }
    return list;
  }, [allVendors, isSuperAdmin, user]);

  const tabs = useMemo(() => {
    const cats = CATEGORIES.map(c => ({
      id: c.value,
      label: c.label,
      count: vendors.filter(v => v.category === c.value).length,
    }));
    return [
      { id: 'all', label: 'All Vendors', count: vendors.length },
      { id: 'active', label: 'Active', count: vendors.filter(v => v.status === 'active').length },
      ...cats,
    ];
  }, [vendors]);

  const cities = useMemo(() => {
    const set = new Set(vendors.map(v => v.city).filter(Boolean));
    return [...set].sort();
  }, [vendors]);

  const filtered = useMemo(() => {
    let list = vendors;

    if (activeTab === 'active') {
      list = list.filter(v => v.status === 'active');
    } else if (activeTab !== 'all') {
      list = list.filter(v => v.category === activeTab);
    }

    if (search) {
      const q = search.toLowerCase();
      list = list.filter(v =>
        v.name?.toLowerCase().includes(q) ||
        v.company?.toLowerCase().includes(q) ||
        v.phone?.includes(q)
      );
    }
    if (filterCategory) list = list.filter(v => v.category === filterCategory);
    if (filterStatus) list = list.filter(v => v.status === filterStatus);
    if (filterCity) list = list.filter(v => v.city === filterCity);

    return list;
  }, [vendors, activeTab, search, filterCategory, filterStatus, filterCity]);

  const stats = useMemo(() => {
    const totalBusiness = vendors.reduce((s, v) => s + (Number(v.totalBusiness) || 0), 0);
    const pendingPayments = vendors.reduce((s, v) => s + (Number(v.pendingPayments) || 0), 0);
    return {
      total: vendors.length,
      active: vendors.filter(v => v.status === 'active').length,
      totalBusiness,
      pendingPayments,
    };
  }, [vendors]);

  const [form, setForm] = useState({
    name: '', company: '', phone: '', email: '', category: 'material_supplier',
    address: '', city: '', state: '', gstNumber: '', panNumber: '',
    bankName: '', accountNumber: '', ifscCode: '',
    status: 'active', notes: '', totalBusiness: '', pendingPayments: '',
  });

  const resetForm = () => {
    setForm({
      name: '', company: '', phone: '', email: '', category: 'material_supplier',
      address: '', city: '', state: '', gstNumber: '', panNumber: '',
      bankName: '', accountNumber: '', ifscCode: '',
      status: 'active', notes: '', totalBusiness: '', pendingPayments: '',
    });
    setEditing(null);
  };

  const openAdd = () => {
    resetForm();
    setShowModal(true);
  };

  const openEdit = (vendor) => {
    setForm({
      name: vendor.name || '', company: vendor.company || '', phone: vendor.phone || '',
      email: vendor.email || '', category: vendor.category || 'material_supplier',
      address: vendor.address || '', city: vendor.city || '', state: vendor.state || '',
      gstNumber: vendor.gstNumber || '', panNumber: vendor.panNumber || '',
      bankName: vendor.bankName || '', accountNumber: vendor.accountNumber || '',
      ifscCode: vendor.ifscCode || '', status: vendor.status || 'active',
      notes: vendor.notes || '', totalBusiness: vendor.totalBusiness || '',
      pendingPayments: vendor.pendingPayments || '',
    });
    setEditing(vendor);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      showToast('Vendor name is required', 'error');
      return;
    }
    const payload = {
      ...form,
      totalBusiness: Number(form.totalBusiness) || 0,
      pendingPayments: Number(form.pendingPayments) || 0,
    };

    if (editing) {
      const vendorId = editing._id || editing.id;
      await updateItemInCollection('vendors', vendorId, payload);
      showToast('Vendor updated successfully');
    } else {
      await addItemToCollection('vendors', {
        ...payload,
        id: generateId(),
        createdAt: new Date().toISOString(),
        createdBy: user?.id,
      });
      showToast('Vendor added successfully');
    }
    setShowModal(false);
    resetForm();
    doRefresh();
  };

  const handleDelete = async (vendor) => {
    const vendorId = vendor._id || vendor.id;
    await deleteItemFromCollection('vendors', vendorId);
    setConfirmDelete(null);
    showToast('Vendor deleted');
    doRefresh();
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div className="stat-card">
          <p className="text-sm text-white/50">Total Vendors</p>
          <p className="text-2xl font-bold text-white mt-1">{stats.total}</p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-white/50">Active</p>
          <p className="text-2xl font-bold text-white mt-1">{stats.active}</p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-white/50">Total Business</p>
          <p className="text-2xl font-bold text-white mt-1">{formatCurrency(stats.totalBusiness)}</p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-white/50">Pending Payments</p>
          <p className="text-2xl font-bold text-white mt-1">{formatCurrency(stats.pendingPayments)}</p>
        </div>
      </div>

      <div className="tabs-container overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab-btn whitespace-nowrap ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <input
          type="text"
          placeholder="Search by name, company, phone..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="glass-input w-full sm:max-w-sm"
        />
        <select className="glass-select w-full sm:w-auto" value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
          <option value="">All Categories</option>
          {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
        <select className="glass-select w-full sm:w-auto" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <select className="glass-select w-full sm:w-auto" value={filterCity} onChange={e => setFilterCity(e.target.value)}>
          <option value="">All Cities</option>
          {cities.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <div className="flex-1" />
        {checkPermission('vendors_create') && (
          <button className="glass-btn w-full sm:w-auto" onClick={openAdd}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Add Vendor
          </button>
        )}
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="glass-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Company</th>
                <th>Phone</th>
                <th>Category</th>
                <th>City</th>
                <th>Business</th>
                <th>Pending</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={9} className="text-center text-white/40 py-8">No vendors found</td></tr>
              ) : filtered.map(vendor => (
                <tr key={vendor._id || vendor.id}>
                  <td className="font-medium text-white cursor-pointer hover:text-blue-300" onClick={() => onViewDetail(vendor)}>{vendor.name}</td>
                  <td className="text-white/70">{vendor.company || '-'}</td>
                  <td className="text-white/70">{vendor.phone || '-'}</td>
                  <td>
                    <span className={`badge ${CATEGORY_BADGES[vendor.category] || 'badge-neutral'}`}>
                      {getCategoryLabel(vendor.category)}
                    </span>
                  </td>
                  <td className="text-white/70">{vendor.city || '-'}</td>
                  <td className="text-white/70">{formatCurrency(vendor.totalBusiness)}</td>
                  <td className="text-white/70">{formatCurrency(vendor.pendingPayments)}</td>
                  <td>
                    <span className={`badge ${vendor.status === 'active' ? 'badge-success' : 'badge-danger'}`}>
                      {vendor.status}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center gap-1">
                      <button className="glass-btn-secondary px-3 py-1.5 text-xs" onClick={() => onViewDetail(vendor)}>
                        View
                      </button>
                      {checkPermission('vendors_edit') && (
                        <button className="glass-btn-secondary px-3 py-1.5 text-xs" onClick={() => openEdit(vendor)}>
                          Edit
                        </button>
                      )}
                      {checkPermission('vendors_delete') && (
                        <button className="glass-btn-danger px-3 py-1.5 text-xs" onClick={() => setConfirmDelete(vendor)}>
                          Delete
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

      {showModal && (
        <VendorModal
          form={form}
          setForm={setForm}
          editing={editing}
          onSubmit={handleSubmit}
          onClose={() => { setShowModal(false); resetForm(); }}
        />
      )}

      {confirmDelete && (
        <div className="modal-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="modal-content max-w-sm max-sm:w-full max-sm:h-full max-sm:rounded-none max-sm:p-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-white mb-2">Confirm Delete</h3>
            <p className="text-white/60 mb-6">Are you sure you want to delete <span className="text-white font-medium">{confirmDelete.name}</span>? This action cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <button className="glass-btn-secondary" onClick={() => setConfirmDelete(null)}>Cancel</button>
              <button className="glass-btn-danger" onClick={() => handleDelete(confirmDelete)}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function VendorModal({ form, setForm, editing, onSubmit, onClose }) {
  const [activeSection, setActiveSection] = useState('basic');

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content max-sm:w-full max-sm:h-full max-sm:rounded-none max-sm:p-4" style={{ maxWidth: 720 }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">{editing ? 'Edit Vendor' : 'Add Vendor'}</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="tabs-container overflow-x-auto mb-6">
          <button className={`tab-btn whitespace-nowrap ${activeSection === 'basic' ? 'active' : ''}`} onClick={() => setActiveSection('basic')}>Basic Info</button>
          <button className={`tab-btn whitespace-nowrap ${activeSection === 'financial' ? 'active' : ''}`} onClick={() => setActiveSection('financial')}>Financial</button>
          <button className={`tab-btn whitespace-nowrap ${activeSection === 'other' ? 'active' : ''}`} onClick={() => setActiveSection('other')}>Other</button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          {activeSection === 'basic' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-white/60 mb-1">Name *</label>
                <input type="text" className="glass-input w-full" value={form.name} onChange={e => handleChange('name', e.target.value)} required placeholder="Vendor name" />
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-1">Company</label>
                <input type="text" className="glass-input w-full" value={form.company} onChange={e => handleChange('company', e.target.value)} placeholder="Company name" />
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-1">Phone</label>
                <input type="text" className="glass-input w-full" value={form.phone} onChange={e => handleChange('phone', e.target.value)} placeholder="Phone number" />
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-1">Email</label>
                <input type="email" className="glass-input w-full" value={form.email} onChange={e => handleChange('email', e.target.value)} placeholder="Email address" />
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-1">Category *</label>
                <select className="glass-select w-full" value={form.category} onChange={e => handleChange('category', e.target.value)}>
                  {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-1">Status</label>
                <select className="glass-select w-full" value={form.status} onChange={e => handleChange('status', e.target.value)}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm text-white/60 mb-1">Address</label>
                <input type="text" className="glass-input w-full" value={form.address} onChange={e => handleChange('address', e.target.value)} placeholder="Full address" />
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-1">City</label>
                <input type="text" className="glass-input w-full" value={form.city} onChange={e => handleChange('city', e.target.value)} placeholder="City" />
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-1">State</label>
                <input type="text" className="glass-input w-full" value={form.state} onChange={e => handleChange('state', e.target.value)} placeholder="State" />
              </div>
            </div>
          )}

          {activeSection === 'financial' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-white/60 mb-1">GST Number</label>
                <input type="text" className="glass-input w-full" value={form.gstNumber} onChange={e => handleChange('gstNumber', e.target.value)} placeholder="GSTIN" />
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-1">PAN Number</label>
                <input type="text" className="glass-input w-full" value={form.panNumber} onChange={e => handleChange('panNumber', e.target.value)} placeholder="PAN" />
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-1">Bank Name</label>
                <input type="text" className="glass-input w-full" value={form.bankName} onChange={e => handleChange('bankName', e.target.value)} placeholder="Bank name" />
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-1">Account Number</label>
                <input type="text" className="glass-input w-full" value={form.accountNumber} onChange={e => handleChange('accountNumber', e.target.value)} placeholder="Account number" />
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-1">IFSC Code</label>
                <input type="text" className="glass-input w-full" value={form.ifscCode} onChange={e => handleChange('ifscCode', e.target.value)} placeholder="IFSC" />
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-1">Total Business</label>
                <input type="number" className="glass-input w-full" value={form.totalBusiness} onChange={e => handleChange('totalBusiness', e.target.value)} placeholder="0" />
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-1">Pending Payments</label>
                <input type="number" className="glass-input w-full" value={form.pendingPayments} onChange={e => handleChange('pendingPayments', e.target.value)} placeholder="0" />
              </div>
            </div>
          )}

          {activeSection === 'other' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-white/60 mb-1">Notes</label>
                <textarea className="glass-input w-full min-h-[100px]" value={form.notes} onChange={e => handleChange('notes', e.target.value)} placeholder="Additional notes about this vendor..." />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" className="glass-btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="glass-btn">{editing ? 'Update' : 'Add'} Vendor</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function VendorDetail({ vendorId, user, checkPermission, getCollection, updateItemInCollection, deleteItemFromCollection, vendors: allVendors, interiorProjects: allInteriorProjects, doRefresh, showToast, onBack, onEdit }) {
  const [vendor, setVendor] = useState(null);
  const [linkedProjects, setLinkedProjects] = useState([]);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [detailLoading, setDetailLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setDetailLoading(true);
      if (vendorId) {
        const found = allVendors.find(v => (v._id || v.id) === vendorId);
        setVendor(found || null);
        if (found) {
          const name = found.name;
          const projects = allInteriorProjects.filter(p =>
            p.vendor === name || p.assignedToName === name
          );
          setLinkedProjects(projects);
        }
      }
      setDetailLoading(false);
    }
    load();
  }, [vendorId, allVendors, allInteriorProjects]);

  if (detailLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="space-y-4">
        <button className="glass-btn-secondary" onClick={onBack}>Back to List</button>
        <div className="glass-card p-8 text-center text-white/50">Vendor not found</div>
      </div>
    );
  }

  const handleDelete = async () => {
    const vendorIdToDelete = vendor._id || vendor.id;
    await deleteItemFromCollection('vendors', vendorIdToDelete);
    setConfirmDelete(null);
    showToast('Vendor deleted');
    doRefresh();
    onBack();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <button className="glass-btn-secondary" onClick={onBack}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Back
        </button>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-white">{vendor.name}</h2>
          {vendor.company && <p className="text-white/50 text-sm">{vendor.company}</p>}
        </div>
        <div className="flex items-center gap-2">
          {checkPermission('vendors_edit') && (
            <button className="glass-btn-secondary" onClick={() => onEdit(vendor)}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
              Edit
            </button>
          )}
          {checkPermission('vendors_delete') && (
            <button className="glass-btn-danger" onClick={() => setConfirmDelete(vendor)}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              Delete
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div className="stat-card">
          <p className="text-sm text-white/50">Total Business</p>
          <p className="text-2xl font-bold text-white mt-1">{formatCurrency(vendor.totalBusiness)}</p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-white/50">Pending Payments</p>
          <p className="text-2xl font-bold text-white mt-1">{formatCurrency(vendor.pendingPayments)}</p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-white/50">Category</p>
          <p className="text-lg font-bold text-white mt-1">{getCategoryLabel(vendor.category)}</p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-white/50">Status</p>
          <div className="mt-2">
            <span className={`badge ${vendor.status === 'active' ? 'badge-success' : 'badge-danger'}`}>
              {vendor.status}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-6 space-y-4">
          <h3 className="text-lg font-bold text-white">Contact Information</h3>
          <div className="space-y-3">
            <DetailRow label="Name" value={vendor.name} />
            <DetailRow label="Company" value={vendor.company} />
            <DetailRow label="Phone" value={vendor.phone} />
            <DetailRow label="Email" value={vendor.email} />
            <DetailRow label="Address" value={vendor.address} />
            <DetailRow label="City" value={vendor.city} />
            <DetailRow label="State" value={vendor.state} />
          </div>
        </div>

        <div className="glass-card p-6 space-y-4">
          <h3 className="text-lg font-bold text-white">Financial Details</h3>
          <div className="space-y-3">
            <DetailRow label="GST Number" value={vendor.gstNumber} />
            <DetailRow label="PAN Number" value={vendor.panNumber} />
            <DetailRow label="Bank Name" value={vendor.bankName} />
            <DetailRow label="Account Number" value={vendor.accountNumber} />
            <DetailRow label="IFSC Code" value={vendor.ifscCode} />
          </div>
        </div>
      </div>

      {vendor.notes && (
        <div className="glass-card p-6">
          <h3 className="text-lg font-bold text-white mb-2">Notes</h3>
          <p className="text-white/70 whitespace-pre-wrap">{vendor.notes}</p>
        </div>
      )}

      <div className="glass-card p-6">
        <h3 className="text-lg font-bold text-white mb-4">Linked Interior Projects ({linkedProjects.length})</h3>
        {linkedProjects.length === 0 ? (
          <p className="text-white/40 text-sm">No interior projects linked to this vendor.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="glass-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Client</th>
                  <th>Status</th>
                  <th>Contract Amount</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {linkedProjects.map(p => (
                  <tr key={p._id || p.id}>
                    <td className="text-white font-medium">{p.code || '-'}</td>
                    <td className="text-white/70">{p.clientName || '-'}</td>
                    <td>
                      <span className={`badge ${p.status === 'completed' ? 'badge-success' : p.status === 'running' ? 'badge-info' : 'badge-neutral'}`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="text-white/70">{formatCurrency(p.contractAmount)}</td>
                    <td className="text-white/50 text-sm">{formatDate(p.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="glass-card p-6">
        <h3 className="text-sm font-bold text-white/40 uppercase tracking-wider">Meta</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
          <DetailRow label="Created" value={formatDate(vendor.createdAt)} />
          <DetailRow label="Created By" value={vendor.createdBy || '-'} />
        </div>
      </div>

      {confirmDelete && (
        <div className="modal-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="modal-content max-w-sm max-sm:w-full max-sm:h-full max-sm:rounded-none max-sm:p-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-white mb-2">Confirm Delete</h3>
            <p className="text-white/60 mb-6">Are you sure you want to delete <span className="text-white font-medium">{confirmDelete.name}</span>? This action cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <button className="glass-btn-secondary" onClick={() => setConfirmDelete(null)}>Cancel</button>
              <button className="glass-btn-danger" onClick={handleDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailRow({ label, value }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-2">
      <span className="text-sm text-white/40 min-w-[120px]">{label}:</span>
      <span className="text-sm text-white/80">{value}</span>
    </div>
  );
}
