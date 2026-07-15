'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useApp } from '@/lib/store';
import { generateId, formatDate, formatDateTime, formatCurrency } from '@/lib/data';

const PROPERTY_TYPES = [
  { value: 'apartment', label: 'Apartment' },
  { value: 'villa', label: 'Villa' },
  { value: 'independent_house', label: 'Independent House' },
  { value: 'plot', label: 'Plot' },
  { value: 'commercial', label: 'Commercial' },
];

const STATUS_OPTIONS = [
  { value: 'available', label: 'Available' },
  { value: 'occupied', label: 'Occupied' },
  { value: 'maintenance', label: 'Maintenance' },
];

const FURNISHING_OPTIONS = [
  { value: 'unfurnished', label: 'Unfurnished' },
  { value: 'semi_furnished', label: 'Semi Furnished' },
  { value: 'furnished', label: 'Furnished' },
];

const STATUS_BADGES = {
  available: 'badge-success',
  occupied: 'badge-warning',
  maintenance: 'badge-info',
};

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Delhi', 'Jammu & Kashmir', 'Ladakh', 'Chandigarh', 'Puducherry',
];

const EMPTY_PROPERTY = {
  flatId: '',
  society: '',
  tower: '',
  flatNumber: '',
  city: '',
  state: '',
  size: '',
  type: 'apartment',
  status: 'available',
  keyAvailable: true,
  keyHolder: '',
  keyHolderName: '',
  ownerName: '',
  ownerContact: '',
  monthlyRent: '',
  securityDeposit: '',
  furnishing: 'unfurnished',
  description: '',
};

const ACTION_ICONS = {
  issued: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
    </svg>
  ),
  returned: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  transferred: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
    </svg>
  ),
};

function PropertyFormModal({ property, onSave, onClose }) {
  const [form, setForm] = useState(() => {
    if (property) {
      return { ...EMPTY_PROPERTY, ...property };
    }
    return { ...EMPTY_PROPERTY, flatId: 'P-' + generateId().toUpperCase().slice(0, 6) };
  });

  const [autoGenerate, setAutoGenerate] = useState(!property);

  const handleChange = (field, value) => {
    setForm(prev => {
      const next = { ...prev, [field]: value };
      if (field === 'keyAvailable' && value === false) {
        next.keyHolder = '';
        next.keyHolderName = '';
      }
      return next;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.flatId || !form.society) return;
    onSave({
      ...form,
      size: form.size ? Number(form.size) : 0,
      monthlyRent: form.monthlyRent ? Number(form.monthlyRent) : 0,
      securityDeposit: form.securityDeposit ? Number(form.securityDeposit) : 0,
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content w-full max-w-[calc(100vw-1rem)] sm:max-w-[760px] max-h-[calc(100vh-1rem)] sm:max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg sm:text-xl font-bold text-white">{property?.id ? 'Edit Property' : 'Add New Property'}</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          <div>
            <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-3">Property Identification</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
              <div>
                <label className="block text-sm text-white/60 mb-1">Flat ID *</label>
                <input type="text" className="glass-input" value={form.flatId} onChange={e => handleChange('flatId', e.target.value)} required placeholder="e.g. P-ABC123" disabled={autoGenerate && !property} />
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-1">Society *</label>
                <input type="text" className="glass-input" value={form.society} onChange={e => handleChange('society', e.target.value)} required placeholder="Society name" />
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-1">Tower</label>
                <input type="text" className="glass-input" value={form.tower} onChange={e => handleChange('tower', e.target.value)} placeholder="Tower/Wing" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 mt-4">
              <div>
                <label className="block text-sm text-white/60 mb-1">Flat Number</label>
                <input type="text" className="glass-input" value={form.flatNumber} onChange={e => handleChange('flatNumber', e.target.value)} placeholder="Flat/House No." />
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-1">City</label>
                <input type="text" className="glass-input" value={form.city} onChange={e => handleChange('city', e.target.value)} placeholder="City" />
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-1">State</label>
                <select className="glass-select" value={form.state} onChange={e => handleChange('state', e.target.value)}>
                  <option value="">Select State</option>
                  {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-3">Property Details</h3>
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
              <div>
                <label className="block text-sm text-white/60 mb-1">Size (sqft)</label>
                <input type="number" className="glass-input" value={form.size} onChange={e => handleChange('size', e.target.value)} placeholder="e.g. 1200" />
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-1">Type</label>
                <select className="glass-select" value={form.type} onChange={e => handleChange('type', e.target.value)}>
                  {PROPERTY_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-1">Status</label>
                <select className="glass-select" value={form.status} onChange={e => handleChange('status', e.target.value)}>
                  {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-1">Furnishing</label>
                <select className="glass-select" value={form.furnishing} onChange={e => handleChange('furnishing', e.target.value)}>
                  {FURNISHING_OPTIONS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-3">Key Management</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <div className="flex items-center gap-3 pt-6">
                <button
                  type="button"
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.keyAvailable ? 'bg-green-500' : 'bg-white/20'}`}
                  onClick={() => handleChange('keyAvailable', !form.keyAvailable)}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${form.keyAvailable ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
                <span className="text-sm text-white/70">Key Available</span>
              </div>
              {!form.keyAvailable && (
                <>
                  <div>
                    <label className="block text-sm text-white/60 mb-1">Key Holder</label>
                    <input type="text" className="glass-input" value={form.keyHolder} onChange={e => handleChange('keyHolder', e.target.value)} placeholder="Person/Company name" />
                  </div>
                  <div>
                    <label className="block text-sm text-white/60 mb-1">Key Holder Name</label>
                    <input type="text" className="glass-input" value={form.keyHolderName} onChange={e => handleChange('keyHolderName', e.target.value)} placeholder="Contact person" />
                  </div>
                </>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-3">Owner & Financial</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
              <div>
                <label className="block text-sm text-white/60 mb-1">Owner Name</label>
                <input type="text" className="glass-input" value={form.ownerName} onChange={e => handleChange('ownerName', e.target.value)} placeholder="Owner name" />
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-1">Owner Contact</label>
                <input type="text" className="glass-input" value={form.ownerContact} onChange={e => handleChange('ownerContact', e.target.value)} placeholder="Phone/Email" />
              </div>
              <div></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mt-4">
              <div>
                <label className="block text-sm text-white/60 mb-1">Monthly Rent</label>
                <input type="number" className="glass-input" value={form.monthlyRent} onChange={e => handleChange('monthlyRent', e.target.value)} placeholder="₹ Monthly rent" />
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-1">Security Deposit</label>
                <input type="number" className="glass-input" value={form.securityDeposit} onChange={e => handleChange('securityDeposit', e.target.value)} placeholder="₹ Security deposit" />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm text-white/60 mb-1">Description</label>
            <textarea className="glass-input" rows={2} value={form.description} onChange={e => handleChange('description', e.target.value)} placeholder="Additional notes about the property..." />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" className="glass-btn glass-btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="glass-btn glass-btn-success">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              {property?.id ? 'Update Property' : 'Add Property'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function PropertyDetailModal({ property, clients, keyHistory, user, checkPermission, onIssueKey, onReturnKey, onTransferKey, onEdit, onClose }) {
  const [keyAction, setKeyAction] = useState(null);
  const [keyForm, setKeyForm] = useState({ personName: '', notes: '', newPersonName: '' });

  const propertyHistory = useMemo(() => {
    return keyHistory
      .filter(h => h.propertyId === property.id)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [keyHistory, property.id]);

  const linkedClients = useMemo(() => {
    return clients.filter(c => c.propertyId === property.id);
  }, [clients, property.id]);

  const handleKeyAction = () => {
    if (keyAction === 'issue') {
      if (!keyForm.personName.trim()) return;
      onIssueKey(property.id, { personName: keyForm.personName, notes: keyForm.notes });
    } else if (keyAction === 'return') {
      onReturnKey(property.id, { notes: keyForm.notes });
    } else if (keyAction === 'transfer') {
      if (!keyForm.newPersonName.trim()) return;
      onTransferKey(property.id, { newPersonName: keyForm.newPersonName, notes: keyForm.notes });
    }
    setKeyAction(null);
    setKeyForm({ personName: '', notes: '', newPersonName: '' });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content w-full max-w-[calc(100vw-1rem)] sm:max-w-[820px] max-h-[calc(100vh-1rem)] sm:max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <div className="min-w-0">
            <h2 className="text-lg sm:text-xl font-bold text-white">Property Details</h2>
            <p className="text-xs sm:text-sm text-white/40 mt-1 truncate">Flat ID: {property.flatId} | Created {formatDateTime(property.createdAt)}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {checkPermission('properties_edit') && (
              <button onClick={() => { onClose(); onEdit(property); }} className="glass-btn glass-btn-secondary text-sm py-2 px-2 sm:px-3">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                <span className="hidden sm:inline">Edit</span>
              </button>
            )}
            <button onClick={onClose} className="text-white/40 hover:text-white p-1">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="space-y-4 sm:space-y-5">
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            <div>
              <p className="text-xs text-white/40">Status</p>
              <span className={`badge ${STATUS_BADGES[property.status] || 'badge-neutral'} mt-1`}>{property.status?.toUpperCase()}</span>
            </div>
            <div>
              <p className="text-xs text-white/40">Type</p>
              <p className="text-white text-sm font-medium mt-1 capitalize">{property.type?.replace('_', ' ') || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-white/40">Size</p>
              <p className="text-white text-sm font-medium mt-1">{property.size ? property.size + ' sqft' : '-'}</p>
            </div>
            <div>
              <p className="text-xs text-white/40">Furnishing</p>
              <p className="text-white text-sm font-medium mt-1 capitalize">{property.furnishing?.replace('_', ' ') || '-'}</p>
            </div>
          </div>

          <div className="glass-card p-4">
            <h4 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Location</h4>
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 text-sm">
              <div><p className="text-xs text-white/30">Society</p><p className="text-white">{property.society || '-'}</p></div>
              <div><p className="text-xs text-white/30">Tower</p><p className="text-white">{property.tower || '-'}</p></div>
              <div><p className="text-xs text-white/30">Flat Number</p><p className="text-white">{property.flatNumber || '-'}</p></div>
              <div><p className="text-xs text-white/30">City</p><p className="text-white">{property.city || '-'}</p></div>
              <div><p className="text-xs text-white/30">State</p><p className="text-white">{property.state || '-'}</p></div>
            </div>
          </div>

          {(property.ownerName || property.monthlyRent) && (
            <div className="glass-card p-4">
              <h4 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Owner & Financial</h4>
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 text-sm">
                <div><p className="text-xs text-white/30">Owner</p><p className="text-white">{property.ownerName || '-'}</p></div>
                <div><p className="text-xs text-white/30">Contact</p><p className="text-white">{property.ownerContact || '-'}</p></div>
                <div><p className="text-xs text-white/30">Monthly Rent</p><p className="text-white">{formatCurrency(property.monthlyRent)}</p></div>
                <div><p className="text-xs text-white/30">Security Deposit</p><p className="text-white">{formatCurrency(property.securityDeposit)}</p></div>
              </div>
            </div>
          )}

          {property.description && (
            <div className="glass-card p-4">
              <h4 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">Description</h4>
              <p className="text-white/80 text-sm whitespace-pre-wrap">{property.description}</p>
            </div>
          )}

          <div className="glass-card p-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-semibold text-white/70">Key Management</h4>
              <span className={`badge ${property.keyAvailable ? 'badge-success' : 'badge-warning'}`}>
                {property.keyAvailable ? 'Key Available' : 'Key Issued'}
              </span>
            </div>

            {!property.keyAvailable && property.keyHolder && (
              <div className="glass-card p-3 mb-4">
                <p className="text-xs text-white/40">Current Key Holder</p>
                <p className="text-white text-sm font-medium">{property.keyHolder}{property.keyHolderName ? ` (${property.keyHolderName})` : ''}</p>
              </div>
            )}

            {checkPermission('properties_keys') && (
              <div className="flex flex-wrap gap-2 mb-4">
                {property.keyAvailable && (
                  <button onClick={() => setKeyAction(keyAction === 'issue' ? null : 'issue')} className="glass-btn glass-btn-success text-sm py-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" /></svg>
                    Issue Key
                  </button>
                )}
                {!property.keyAvailable && (
                  <>
                    <button onClick={() => setKeyAction(keyAction === 'return' ? null : 'return')} className="glass-btn glass-btn text-sm py-2">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      Return Key
                    </button>
                    <button onClick={() => setKeyAction(keyAction === 'transfer' ? null : 'transfer')} className="glass-btn glass-btn-secondary text-sm py-2">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                      Transfer Key
                    </button>
                  </>
                )}
              </div>
            )}

            {keyAction && (
              <div className="glass-card p-4 space-y-3 fade-in">
                <h4 className="text-sm font-semibold text-white/70">
                  {keyAction === 'issue' ? 'Issue Key' : keyAction === 'return' ? 'Return Key' : 'Transfer Key'}
                </h4>
                {keyAction === 'issue' && (
                  <input type="text" className="glass-input" value={keyForm.personName} onChange={e => setKeyForm(prev => ({ ...prev, personName: e.target.value }))} placeholder="Person name *" />
                )}
                {keyAction === 'transfer' && (
                  <input type="text" className="glass-input" value={keyForm.newPersonName} onChange={e => setKeyForm(prev => ({ ...prev, newPersonName: e.target.value }))} placeholder="New person name *" />
                )}
                <textarea className="glass-input" rows={2} value={keyForm.notes} onChange={e => setKeyForm(prev => ({ ...prev, notes: e.target.value }))} placeholder="Notes (optional)" />
                <div className="flex gap-2">
                  <button onClick={handleKeyAction} className="glass-btn glass-btn-success text-sm py-2">Confirm</button>
                  <button onClick={() => { setKeyAction(null); setKeyForm({ personName: '', notes: '', newPersonName: '' }); }} className="glass-btn glass-btn-secondary text-sm py-2">Cancel</button>
                </div>
              </div>
            )}
          </div>

          {propertyHistory.length > 0 && (
            <div className="glass-card p-4">
              <h4 className="text-sm font-semibold text-white/70 mb-4">Key History</h4>
              <div className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-px bg-white/10" />
                <div className="space-y-4">
                  {propertyHistory.map((h, idx) => (
                    <div key={h.id} className="relative flex gap-3 sm:gap-4 pl-10 sm:pl-10">
                      <div className={`absolute left-0 w-8 h-8 rounded-full flex items-center justify-center ${
                        h.action === 'issued' ? 'bg-yellow-500/20 text-yellow-400' :
                        h.action === 'returned' ? 'bg-green-500/20 text-green-400' :
                        'bg-blue-500/20 text-blue-400'
                      }`}>
                        {ACTION_ICONS[h.action]}
                      </div>
                      <div className="flex-1 glass-card p-3">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1 sm:gap-2">
                          <div className="min-w-0">
                            <p className="text-white text-sm font-medium capitalize">
                              {h.action === 'issued' ? `Key Issued to ${h.personName}` :
                               h.action === 'returned' ? `Key Returned${h.personName ? ` from ${h.personName}` : ''}` :
                               `Key Transferred to ${h.personName}`}
                            </p>
                            {h.notes && <p className="text-white/50 text-xs mt-1">{h.notes}</p>}
                          </div>
                          <div className="text-left sm:text-right flex-shrink-0">
                            <p className="text-xs text-white/30">{formatDateTime(h.issuedDate || h.returnedDate || h.createdAt)}</p>
                            {h.createdBy && <p className="text-xs text-white/20 mt-0.5">by {h.createdByName || h.createdBy}</p>}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {linkedClients.length > 0 && (
            <div className="glass-card p-4">
              <h4 className="text-sm font-semibold text-white/70 mb-3">Linked Clients</h4>
              <div className="space-y-2">
                {linkedClients.map(c => (
                  <div key={c.id} className="glass-card p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-white text-sm font-medium">{c.name || c.mobile || 'Client'}</p>
                      <p className="text-xs text-white/40">{c.clientType?.replace('_', ' ') || '-'} | {c.mobile || '-'}</p>
                    </div>
                    <span className="badge badge-info text-xs self-start">{c.clientType?.replace('_', ' ')?.toUpperCase()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PropertiesPage() {
  const { user, getCollection, addItemToCollection, updateItemInCollection, deleteItemFromCollection, checkPermission } = useApp();

  const [properties, setProperties] = useState([]);
  const [keyHistory, setKeyHistory] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterCity, setFilterCity] = useState('');
  const [filterKey, setFilterKey] = useState('');
  const [viewMode, setViewMode] = useState('table');
  const [showForm, setShowForm] = useState(false);
  const [editingProperty, setEditingProperty] = useState(null);
  const [viewProperty, setViewProperty] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const [pData, kData, cData] = await Promise.all([
          getCollection('properties'),
          getCollection('keyHistory'),
          getCollection('clients'),
        ]);
        if (!cancelled) {
          setProperties(pData);
          setKeyHistory(kData);
          setClients(cData);
        }
      } catch (err) {
        console.error('Failed to load properties data:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [getCollection, refreshKey]);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const cities = useMemo(() => {
    const set = new Set(properties.map(p => p.city).filter(Boolean));
    return Array.from(set).sort();
  }, [properties]);

  const filteredProperties = useMemo(() => {
    let result = [...properties];

    if (!user?.isSuperAdmin) {
      result = result.filter(p => p.createdBy === user?.id);
    }

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(p =>
        p.flatId?.toLowerCase().includes(q) ||
        p.society?.toLowerCase().includes(q) ||
        p.city?.toLowerCase().includes(q) ||
        p.flatNumber?.toLowerCase().includes(q) ||
        p.tower?.toLowerCase().includes(q)
      );
    }

    if (filterStatus) {
      result = result.filter(p => p.status === filterStatus);
    }

    if (filterType) {
      result = result.filter(p => p.type === filterType);
    }

    if (filterCity) {
      result = result.filter(p => p.city === filterCity);
    }

    if (filterKey === 'available') {
      result = result.filter(p => p.keyAvailable === true);
    } else if (filterKey === 'issued') {
      result = result.filter(p => p.keyAvailable === false);
    }

    result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return result;
  }, [properties, user, search, filterStatus, filterType, filterCity, filterKey]);

  const stats = useMemo(() => {
    const visible = !user?.isSuperAdmin
      ? properties.filter(p => p.createdBy === user?.id)
      : properties;
    return {
      total: visible.length,
      available: visible.filter(p => p.status === 'available').length,
      occupied: visible.filter(p => p.status === 'occupied').length,
      keyAvailable: visible.filter(p => p.keyAvailable === true).length,
    };
  }, [properties, user]);

  const handleSaveProperty = async (form) => {
    const isNew = !form.id;
    if (isNew) {
      await addItemToCollection('properties', {
        ...form,
        id: generateId(),
        createdBy: user.id,
        createdByName: user.name,
        createdAt: new Date().toISOString(),
      });
      showToast('Property added successfully');
    } else {
      await updateItemInCollection('properties', form.id, {
        ...form,
        updatedAt: new Date().toISOString(),
      });
      showToast('Property updated successfully');
    }
    setShowForm(false);
    setEditingProperty(null);
    setRefreshKey(k => k + 1);
  };

  const handleDeleteProperty = async (id) => {
    if (confirm('Are you sure you want to delete this property?')) {
      await deleteItemFromCollection('properties', id);
      showToast('Property deleted');
      setRefreshKey(k => k + 1);
    }
  };

  const handleIssueKey = async (propertyId, { personName, notes }) => {
    const prop = properties.find(p => p.id === propertyId);
    if (!prop) return;

    await addItemToCollection('keyHistory', {
      id: generateId(),
      propertyId,
      propertyFlatId: prop.flatId,
      action: 'issued',
      personName,
      issuedDate: new Date().toISOString(),
      notes,
      createdBy: user.id,
      createdByName: user.name,
      createdAt: new Date().toISOString(),
    });

    await updateItemInCollection('properties', propertyId, {
      keyAvailable: false,
      keyHolder: personName,
      keyHolderName: personName,
      updatedAt: new Date().toISOString(),
    });

    setViewProperty(prev => prev?.id === propertyId ? {
      ...prev,
      keyAvailable: false,
      keyHolder: personName,
      keyHolderName: personName,
    } : prev);

    showToast(`Key issued to ${personName}`);
    setRefreshKey(k => k + 1);
  };

  const handleReturnKey = async (propertyId, { notes }) => {
    const prop = properties.find(p => p.id === propertyId);
    if (!prop) return;

    await addItemToCollection('keyHistory', {
      id: generateId(),
      propertyId,
      propertyFlatId: prop.flatId,
      action: 'returned',
      personName: prop.keyHolderName || prop.keyHolder || '',
      returnedDate: new Date().toISOString(),
      notes,
      createdBy: user.id,
      createdByName: user.name,
      createdAt: new Date().toISOString(),
    });

    await updateItemInCollection('properties', propertyId, {
      keyAvailable: true,
      keyHolder: '',
      keyHolderName: '',
      updatedAt: new Date().toISOString(),
    });

    setViewProperty(prev => prev?.id === propertyId ? {
      ...prev,
      keyAvailable: true,
      keyHolder: '',
      keyHolderName: '',
    } : prev);

    showToast('Key returned successfully');
    setRefreshKey(k => k + 1);
  };

  const handleTransferKey = async (propertyId, { newPersonName, notes }) => {
    const prop = properties.find(p => p.id === propertyId);
    if (!prop) return;

    const now = new Date().toISOString();
    const prevHolder = prop.keyHolderName || prop.keyHolder || '';

    await addItemToCollection('keyHistory', {
      id: generateId(),
      propertyId,
      propertyFlatId: prop.flatId,
      action: 'returned',
      personName: prevHolder,
      returnedDate: now,
      notes: notes ? `Transferred to ${newPersonName}: ${notes}` : `Transferred to ${newPersonName}`,
      createdBy: user.id,
      createdByName: user.name,
      createdAt: now,
    });

    await addItemToCollection('keyHistory', {
      id: generateId(),
      propertyId,
      propertyFlatId: prop.flatId,
      action: 'issued',
      personName: newPersonName,
      issuedDate: now,
      notes: notes ? `Transferred from ${prevHolder}: ${notes}` : `Transferred from ${prevHolder}`,
      createdBy: user.id,
      createdByName: user.name,
      createdAt: now,
    });

    await updateItemInCollection('properties', propertyId, {
      keyAvailable: false,
      keyHolder: newPersonName,
      keyHolderName: newPersonName,
      updatedAt: now,
    });

    setViewProperty(prev => prev?.id === propertyId ? {
      ...prev,
      keyAvailable: false,
      keyHolder: newPersonName,
      keyHolderName: newPersonName,
    } : prev);

    showToast(`Key transferred to ${newPersonName}`);
    setRefreshKey(k => k + 1);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">Property Management</h1>
          <p className="text-xs sm:text-sm text-white/40 mt-1">Manage properties, keys, and owner details</p>
        </div>
        {checkPermission('properties_create') && (
          <button onClick={() => { setEditingProperty(null); setShowForm(true); }} className="glass-btn">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Add Property
          </button>
        )}
      </div>

      {loading && (
        <div className="glass-card p-12 text-center text-white/40">
          <div className="animate-spin w-8 h-8 border-2 border-white/20 border-t-white rounded-full mx-auto mb-3" />
          <p>Loading properties...</p>
        </div>
      )}

      {!loading && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            <div className="stat-card">
              <p className="text-xs text-white/40 uppercase tracking-wider">Total Properties</p>
              <p className="text-xl sm:text-2xl font-bold text-white mt-1">{stats.total}</p>
            </div>
            <div className="stat-card">
              <p className="text-xs text-white/40 uppercase tracking-wider">Available</p>
              <p className="text-xl sm:text-2xl font-bold text-green-400 mt-1">{stats.available}</p>
            </div>
            <div className="stat-card">
              <p className="text-xs text-white/40 uppercase tracking-wider">Occupied</p>
              <p className="text-xl sm:text-2xl font-bold text-yellow-400 mt-1">{stats.occupied}</p>
            </div>
            <div className="stat-card">
              <p className="text-xs text-white/40 uppercase tracking-wider">Key Available</p>
              <p className="text-xl sm:text-2xl font-bold text-accent-light mt-1">{stats.keyAvailable}</p>
            </div>
          </div>

          <div className="glass-card p-3 sm:p-4">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1 relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  className="glass-input pl-10"
                  placeholder="Search by Flat ID, Society, City..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:flex gap-3">
                <select className="glass-select md:w-40" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                  <option value="">All Status</option>
                  {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
                <select className="glass-select md:w-40" value={filterType} onChange={e => setFilterType(e.target.value)}>
                  <option value="">All Types</option>
                  {PROPERTY_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
                <select className="glass-select md:w-36" value={filterCity} onChange={e => setFilterCity(e.target.value)}>
                  <option value="">All Cities</option>
                  {cities.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <select className="glass-select md:w-36" value={filterKey} onChange={e => setFilterKey(e.target.value)}>
                  <option value="">All Keys</option>
                  <option value="available">Key Available</option>
                  <option value="issued">Key Issued</option>
                </select>
              </div>
              <div className="hidden sm:flex items-center gap-1 border border-white/10 rounded-lg p-1 self-start">
                <button
                  onClick={() => setViewMode('table')}
                  className={`p-2 rounded-md transition-colors ${viewMode === 'table' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white'}`}
                  title="Table View"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18M3 6h18M3 18h18" /></svg>
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white'}`}
                  title="Grid View"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                </button>
              </div>
              <div className="flex sm:hidden items-center gap-1 border border-white/10 rounded-lg p-1 self-start">
                <button
                  onClick={() => setViewMode('table')}
                  className={`p-2 rounded-md transition-colors ${viewMode === 'table' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white'}`}
                  title="Table View"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18M3 6h18M3 18h18" /></svg>
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white'}`}
                  title="Grid View"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                </button>
              </div>
            </div>
          </div>

          {viewMode === 'table' ? (
            <div className="glass-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="glass-table">
                  <thead>
                    <tr>
                      <th>Flat ID</th>
                      <th>Society</th>
                      <th className="hidden md:table-cell">Tower</th>
                      <th className="hidden md:table-cell">Flat</th>
                      <th className="hidden lg:table-cell">City</th>
                      <th className="hidden lg:table-cell">Type</th>
                      <th>Status</th>
                      <th>Key</th>
                      <th className="hidden lg:table-cell">Size</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProperties.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="text-center py-12 text-white/30">
                          <svg className="w-12 h-12 mx-auto mb-3 text-white/10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                          <p>No properties found</p>
                        </td>
                      </tr>
                    ) : (
                      filteredProperties.map(prop => (
                        <tr key={prop.id} className="cursor-pointer" onClick={() => setViewProperty(prop)}>
                          <td>
                            <div className="text-white font-medium">{prop.flatId || '-'}</div>
                          </td>
                          <td className="text-white/70 text-sm">{prop.society || '-'}</td>
                          <td className="hidden md:table-cell text-white/70 text-sm">{prop.tower || '-'}</td>
                          <td className="hidden md:table-cell text-white/70 text-sm">{prop.flatNumber || '-'}</td>
                          <td className="hidden lg:table-cell text-white/70 text-sm">{prop.city || '-'}</td>
                          <td className="hidden lg:table-cell text-white/70 text-sm capitalize">{prop.type?.replace('_', ' ') || '-'}</td>
                          <td>
                            <span className={`badge ${STATUS_BADGES[prop.status] || 'badge-neutral'}`}>
                              {prop.status?.toUpperCase()}
                            </span>
                          </td>
                          <td>
                            <span className={`badge ${prop.keyAvailable ? 'badge-success' : 'badge-warning'}`}>
                              {prop.keyAvailable ? 'Available' : 'Issued'}
                            </span>
                          </td>
                          <td className="hidden lg:table-cell text-white/50 text-sm">{prop.size ? prop.size + ' sqft' : '-'}</td>
                          <td onClick={e => e.stopPropagation()}>
                            <div className="flex items-center gap-1">
                              <button onClick={() => setViewProperty(prop)} className="p-1.5 rounded-lg hover:bg-white/5 text-white/50 hover:text-white" title="View">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                              </button>
                              {checkPermission('properties_edit') && (
                                <button onClick={() => { setEditingProperty(prop); setShowForm(true); }} className="p-1.5 rounded-lg hover:bg-white/5 text-white/50 hover:text-accent-light" title="Edit">
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                </button>
                              )}
                              {checkPermission('properties_delete') && (
                                <button onClick={() => handleDeleteProperty(prop.id)} className="p-1.5 rounded-lg hover:bg-white/5 text-white/50 hover:text-danger" title="Delete">
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
              {filteredProperties.length > 0 && (
                <div className="px-4 py-3 border-t border-white/5 text-sm text-white/40">
                  Showing {filteredProperties.length} of {properties.length} properties
                </div>
              )}
            </div>
          ) : (
            <div>
              {filteredProperties.length === 0 ? (
                <div className="glass-card p-12 text-center text-white/30">
                  <svg className="w-12 h-12 mx-auto mb-3 text-white/10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <p>No properties found</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredProperties.map(prop => (
                    <div key={prop.id} className="glass-card p-4 cursor-pointer hover:bg-white/5 transition-colors" onClick={() => setViewProperty(prop)}>
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-white font-bold">{prop.flatId || 'N/A'}</h3>
                          <p className="text-xs text-white/40 mt-0.5">{prop.society || '-'}</p>
                        </div>
                        <span className={`badge ${STATUS_BADGES[prop.status] || 'badge-neutral'}`}>
                          {prop.status?.toUpperCase()}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                        <div>
                          <p className="text-xs text-white/30">Tower / Flat</p>
                          <p className="text-white/70">{[prop.tower, prop.flatNumber].filter(Boolean).join(', ') || '-'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-white/30">City</p>
                          <p className="text-white/70">{prop.city || '-'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-white/30">Type</p>
                          <p className="text-white/70 capitalize">{prop.type?.replace('_', ' ') || '-'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-white/30">Size</p>
                          <p className="text-white/70">{prop.size ? prop.size + ' sqft' : '-'}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-3 border-t border-white/5">
                        <span className={`badge ${prop.keyAvailable ? 'badge-success' : 'badge-warning'}`}>
                          {prop.keyAvailable ? 'Key Available' : 'Key Issued'}
                        </span>
                        <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                          {checkPermission('properties_edit') && (
                            <button onClick={() => { setEditingProperty(prop); setShowForm(true); }} className="p-1.5 rounded-lg hover:bg-white/5 text-white/50 hover:text-accent-light" title="Edit">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                            </button>
                          )}
                          {checkPermission('properties_delete') && (
                            <button onClick={() => handleDeleteProperty(prop.id)} className="p-1.5 rounded-lg hover:bg-white/5 text-white/50 hover:text-danger" title="Delete">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {filteredProperties.length > 0 && (
                <div className="mt-3 text-sm text-white/40">
                  Showing {filteredProperties.length} of {properties.length} properties
                </div>
              )}
            </div>
          )}
        </>
      )}

      {showForm && (
        <PropertyFormModal
          property={editingProperty}
          onSave={handleSaveProperty}
          onClose={() => { setShowForm(false); setEditingProperty(null); }}
        />
      )}

      {viewProperty && (
        <PropertyDetailModal
          property={viewProperty}
          clients={clients}
          keyHistory={keyHistory}
          user={user}
          checkPermission={checkPermission}
          onIssueKey={handleIssueKey}
          onReturnKey={handleReturnKey}
          onTransferKey={handleTransferKey}
          onEdit={(prop) => { setEditingProperty(prop); setShowForm(true); }}
          onClose={() => setViewProperty(null)}
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
