'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useApp } from '@/lib/store';
import { generateId, formatDate, formatDateTime } from '@/lib/data';

const STATUS_OPTIONS = ['new', 'contacted', 'qualified', 'hot', 'warm', 'cold', 'converted', 'lost'];
const SOURCE_OPTIONS = [
  { value: 'call', label: 'Call' },
  { value: 'website', label: 'Website' },
  { value: 'referral', label: 'Referral' },
  { value: 'walk_in', label: 'Walk-in' },
  { value: 'other', label: 'Other' },
];
const PROPERTY_TYPES = [
  { value: 'apartment', label: 'Apartment' },
  { value: 'villa', label: 'Villa' },
  { value: 'independent_house', label: 'Independent House' },
  { value: 'plot', label: 'Plot' },
  { value: 'other', label: 'Other' },
];
const CLIENT_TYPES = [
  { value: 'purchase', label: 'Purchase' },
  { value: 'rent_take', label: 'Rent Take' },
  { value: 'rent_give', label: 'Rent Give' },
  { value: 'interior', label: 'Interior' },
];

const STATUS_BADGES = {
  hot: 'badge-danger',
  warm: 'badge-warning',
  cold: 'badge-info',
  new: 'badge-success',
  converted: 'badge-success',
  lost: 'badge-neutral',
  contacted: 'badge-info',
  qualified: 'badge-warning',
};

const EMPTY_LEAD = {
  mobile: '',
  email: '',
  source: 'call',
  latestNotes: '',
  assignedTo: '',
  assignedToName: '',
  budget: '',
  propertyType: '',
  nextFollowup: '',
  city: '',
  state: '',
  society: '',
  flatNumber: '',
  tower: '',
  keyAvailable: 'no',
  flatSize: '',
  requirement: '',
  status: 'new',
  leadType: 'buyer',
};

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Delhi', 'Jammu & Kashmir', 'Ladakh', 'Chandigarh', 'Puducherry',
];

function LeadFormModal({ lead, employees, onSave, onClose }) {
  const [form, setForm] = useState(lead || { ...EMPTY_LEAD });

  const handleChange = (field, value) => {
    setForm(prev => {
      const next = { ...prev, [field]: value };
      if (field === 'assignedTo') {
        const emp = employees.find(e => e.id === value);
        next.assignedToName = emp ? emp.name : '';
      }
      return next;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.mobile) return;
    onSave(form);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content max-sm:!w-full max-sm:!h-full max-sm:rounded-none max-sm:max-w-none" style={{ maxWidth: 720 }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">{lead?.id ? 'Edit Lead' : 'Add New Lead'}</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-3">Contact Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-sm text-white/60 mb-1">Mobile *</label>
                <input type="text" className="glass-input" value={form.mobile} onChange={e => handleChange('mobile', e.target.value)} required placeholder="10-digit mobile" />
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-1">Email</label>
                <input type="email" className="glass-input" value={form.email} onChange={e => handleChange('email', e.target.value)} placeholder="email@example.com" />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-3">Lead Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
              <div>
                <label className="block text-sm text-white/60 mb-1">Source</label>
                <select className="glass-select" value={form.source} onChange={e => handleChange('source', e.target.value)}>
                  {SOURCE_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-1">Status</label>
                <select className="glass-select" value={form.status} onChange={e => handleChange('status', e.target.value)}>
                  {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-1">Lead Type</label>
                <select className="glass-select" value={form.leadType} onChange={e => handleChange('leadType', e.target.value)}>
                  <option value="buyer">Buyer</option>
                  <option value="tenant">Tenant</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-3">Property Preference</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
              <div>
                <label className="block text-sm text-white/60 mb-1">Property Type</label>
                <select className="glass-select" value={form.propertyType} onChange={e => handleChange('propertyType', e.target.value)}>
                  <option value="">Select</option>
                  {PROPERTY_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-1">Budget</label>
                <input type="number" className="glass-input" value={form.budget} onChange={e => handleChange('budget', e.target.value)} placeholder="₹ Amount" />
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-1">Flat Size (sq ft)</label>
                <input type="text" className="glass-input" value={form.flatSize} onChange={e => handleChange('flatSize', e.target.value)} placeholder="e.g. 1200" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mt-4">
              <div>
                <label className="block text-sm text-white/60 mb-1">City</label>
                <input type="text" className="glass-input" value={form.city} onChange={e => handleChange('city', e.target.value)} placeholder="City" />
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-1">State</label>
                <select className="glass-select" value={form.state} onChange={e => handleChange('state', e.target.value)}>
                  <option value="">Select</option>
                  {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-1">Society</label>
                <input type="text" className="glass-input" value={form.society} onChange={e => handleChange('society', e.target.value)} placeholder="Society name" />
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-1">Tower</label>
                <input type="text" className="glass-input" value={form.tower} onChange={e => handleChange('tower', e.target.value)} placeholder="Tower/Wing" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 mt-4">
              <div>
                <label className="block text-sm text-white/60 mb-1">Flat Number</label>
                <input type="text" className="glass-input" value={form.flatNumber} onChange={e => handleChange('flatNumber', e.target.value)} placeholder="Flat/House No." />
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-1">Key Available</label>
                <select className="glass-select" value={form.keyAvailable} onChange={e => handleChange('keyAvailable', e.target.value)}>
                  <option value="no">No</option>
                  <option value="yes">Yes</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-3">Assignment & Follow-up</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-sm text-white/60 mb-1">Assign To</label>
                <select className="glass-select" value={form.assignedTo} onChange={e => handleChange('assignedTo', e.target.value)}>
                  <option value="">Unassigned</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-1">Next Follow-up</label>
                <input type="datetime-local" className="glass-input" value={form.nextFollowup} onChange={e => handleChange('nextFollowup', e.target.value)} />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-3">Requirements & Notes</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-white/60 mb-1">Requirement</label>
                <textarea className="glass-input" rows={2} value={form.requirement} onChange={e => handleChange('requirement', e.target.value)} placeholder="Client requirements..." />
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-1">Latest Notes</label>
                <textarea className="glass-input" rows={2} value={form.latestNotes} onChange={e => handleChange('latestNotes', e.target.value)} placeholder="Add notes..." />
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-2">
            <button type="button" className="glass-btn glass-btn-secondary sm:w-auto w-full" onClick={onClose}>Cancel</button>
            <button type="submit" className="glass-btn glass-btn-success sm:w-auto w-full">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              {lead?.id ? 'Update Lead' : 'Create Lead'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function LeadDetailModal({ lead, employees, followups, onAddFollowup, onConvert, onTransfer, onEdit, onClose, user, checkPermission }) {
  const [showFollowupForm, setShowFollowupForm] = useState(false);
  const [followupNote, setFollowupNote] = useState('');
  const [followupDate, setFollowupDate] = useState('');
  const [showTransfer, setShowTransfer] = useState(false);
  const [transferTo, setTransferTo] = useState('');
  const [showConvert, setShowConvert] = useState(false);
  const [convertType, setConvertType] = useState('');
  const [convertInterior, setConvertInterior] = useState({ rooms: '', requirement: '', estimatedBudget: '' });
  const [convertProperty, setConvertProperty] = useState('existing');
  const [selectedProperty, setSelectedProperty] = useState('');

  const leadFollowups = useMemo(() => {
    return followups
      .filter(f => f.leadId === lead.id)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [followups, lead.id]);

  const handleAddFollowup = () => {
    if (!followupNote.trim()) return;
    onAddFollowup(lead.id, {
      note: followupNote,
      nextDate: followupDate || null,
    });
    setFollowupNote('');
    setFollowupDate('');
    setShowFollowupForm(false);
  };

  const handleTransfer = () => {
    if (!transferTo) return;
    const emp = employees.find(e => e.id === transferTo);
    onTransfer(lead.id, transferTo, emp?.name || '');
    setShowTransfer(false);
    setTransferTo('');
  };

  const handleConvert = () => {
    if (!convertType) return;
    onConvert(lead.id, {
      clientType: convertType,
      interiorDetails: convertType === 'interior' ? convertInterior : null,
    });
    setShowConvert(false);
    setConvertType('');
    setConvertInterior({ rooms: '', requirement: '', estimatedBudget: '' });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content max-sm:!w-full max-sm:!h-full max-sm:rounded-none max-sm:max-w-none" style={{ maxWidth: 780 }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-white">Lead Details</h2>
            <p className="text-sm text-white/40 mt-1">Created {formatDateTime(lead.createdAt)}</p>
          </div>
          <div className="flex items-center gap-2">
            {checkPermission('leads_edit') && (
              <button onClick={() => { onClose(); onEdit(lead); }} className="glass-btn glass-btn-secondary text-sm py-2 px-3">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                Edit
              </button>
            )}
            <button onClick={onClose} className="text-white/40 hover:text-white p-1">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="space-y-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="col-span-2 md:col-span-1">
              <p className="text-xs text-white/40">Status</p>
              <span className={`badge ${STATUS_BADGES[lead.status] || 'badge-neutral'} mt-1`}>{lead.status?.toUpperCase()}</span>
            </div>
            <div>
              <p className="text-xs text-white/40">Lead Type</p>
              <p className="text-white text-sm font-medium mt-1 capitalize">{lead.leadType || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-white/40">Source</p>
              <p className="text-white text-sm font-medium mt-1 capitalize">{lead.source?.replace('_', ' ') || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-white/40">Assigned To</p>
              <p className="text-white text-sm font-medium mt-1">{lead.assignedToName || 'Unassigned'}</p>
            </div>
          </div>

          <div className="glass-card p-4">
            <h4 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Contact</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-white/30">Mobile</p>
                <p className="text-white text-sm">{lead.mobile || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-white/30">Email</p>
                <p className="text-white text-sm">{lead.email || '-'}</p>
              </div>
            </div>
          </div>

          <div className="glass-card p-4">
            <h4 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Property Details</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div><p className="text-xs text-white/30">Type</p><p className="text-white capitalize">{lead.propertyType?.replace('_', ' ') || '-'}</p></div>
              <div><p className="text-xs text-white/30">Budget</p><p className="text-white">{lead.budget ? '₹' + Number(lead.budget).toLocaleString('en-IN') : '-'}</p></div>
              <div><p className="text-xs text-white/30">Size</p><p className="text-white">{lead.flatSize ? lead.flatSize + ' sq ft' : '-'}</p></div>
              <div><p className="text-xs text-white/30">City</p><p className="text-white">{lead.city || '-'}</p></div>
              <div><p className="text-xs text-white/30">State</p><p className="text-white">{lead.state || '-'}</p></div>
              <div><p className="text-xs text-white/30">Society</p><p className="text-white">{lead.society || '-'}</p></div>
              <div><p className="text-xs text-white/30">Tower / Flat</p><p className="text-white">{[lead.tower, lead.flatNumber].filter(Boolean).join(', ') || '-'}</p></div>
              <div><p className="text-xs text-white/30">Key Available</p><p className="text-white capitalize">{lead.keyAvailable || 'no'}</p></div>
            </div>
          </div>

          {lead.requirement && (
            <div className="glass-card p-4">
              <h4 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">Requirement</h4>
              <p className="text-white/80 text-sm whitespace-pre-wrap">{lead.requirement}</p>
            </div>
          )}

          {lead.latestNotes && (
            <div className="glass-card p-4">
              <h4 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">Latest Notes</h4>
              <p className="text-white/80 text-sm whitespace-pre-wrap">{lead.latestNotes}</p>
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-white/40">Next Follow-up</p>
              <p className="text-white text-sm mt-1">{formatDateTime(lead.nextFollowup)}</p>
            </div>
            <div>
              <p className="text-xs text-white/40">Created By</p>
              <p className="text-white text-sm mt-1">{lead.createdByName || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-white/40">Last Updated</p>
              <p className="text-white text-sm mt-1">{formatDateTime(lead.updatedAt)}</p>
            </div>
          </div>

          <div className="border-t border-white/5 pt-4">
            <div className="flex flex-wrap gap-2">
              {checkPermission('leads_edit') && lead.status !== 'converted' && (
                <button onClick={() => setShowFollowupForm(!showFollowupForm)} className="glass-btn text-sm py-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  Add Follow-up
                </button>
              )}
              {checkPermission('leads_convert') && lead.status !== 'converted' && lead.status !== 'lost' && (
                <button onClick={() => setShowConvert(true)} className="glass-btn glass-btn-success text-sm py-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  Convert to Client
                </button>
              )}
              {checkPermission('leads_transfer') && (
                <button onClick={() => setShowTransfer(!showTransfer)} className="glass-btn glass-btn-secondary text-sm py-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                  Transfer
                </button>
              )}
            </div>
          </div>

          {showFollowupForm && (
            <div className="glass-card p-4 space-y-3 fade-in">
              <h4 className="text-sm font-semibold text-white/70">New Follow-up</h4>
              <textarea className="glass-input" rows={2} value={followupNote} onChange={e => setFollowupNote(e.target.value)} placeholder="Follow-up notes..." />
              <input type="datetime-local" className="glass-input" value={followupDate} onChange={e => setFollowupDate(e.target.value)} />
              <div className="flex gap-2">
                <button onClick={handleAddFollowup} className="glass-btn glass-btn-success text-sm py-2">Save Follow-up</button>
                <button onClick={() => setShowFollowupForm(false)} className="glass-btn glass-btn-secondary text-sm py-2">Cancel</button>
              </div>
            </div>
          )}

          {showTransfer && (
            <div className="glass-card p-4 space-y-3 fade-in">
              <h4 className="text-sm font-semibold text-white/70">Transfer Lead</h4>
              <select className="glass-select" value={transferTo} onChange={e => setTransferTo(e.target.value)}>
                <option value="">Select Employee</option>
                {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
              </select>
              <div className="flex gap-2">
                <button onClick={handleTransfer} className="glass-btn text-sm py-2">Transfer</button>
                <button onClick={() => setShowTransfer(false)} className="glass-btn glass-btn-secondary text-sm py-2">Cancel</button>
              </div>
            </div>
          )}

          {showConvert && (
            <div className="glass-card p-4 space-y-3 fade-in">
              <h4 className="text-sm font-semibold text-white/70">Convert to Client</h4>
              <select className="glass-select" value={convertType} onChange={e => setConvertType(e.target.value)}>
                <option value="">Select Client Type</option>
                {CLIENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
              {convertType === 'interior' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-white/60 mb-1">Number of Rooms</label>
                    <input type="text" className="glass-input" value={convertInterior.rooms} onChange={e => setConvertInterior(prev => ({ ...prev, rooms: e.target.value }))} placeholder="e.g. 2 BHK" />
                  </div>
                  <div>
                    <label className="block text-sm text-white/60 mb-1">Interior Requirement</label>
                    <textarea className="glass-input" rows={2} value={convertInterior.requirement} onChange={e => setConvertInterior(prev => ({ ...prev, requirement: e.target.value }))} placeholder="Interior details..." />
                  </div>
                  <div>
                    <label className="block text-sm text-white/60 mb-1">Estimated Budget</label>
                    <input type="number" className="glass-input" value={convertInterior.estimatedBudget} onChange={e => setConvertInterior(prev => ({ ...prev, estimatedBudget: e.target.value }))} placeholder="₹ Amount" />
                  </div>
                </div>
              )}
              <div className="flex gap-2">
                <button onClick={handleConvert} className="glass-btn glass-btn-success text-sm py-2" disabled={!convertType}>Convert</button>
                <button onClick={() => setShowConvert(false)} className="glass-btn glass-btn-secondary text-sm py-2">Cancel</button>
              </div>
            </div>
          )}

          {leadFollowups.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Follow-up History</h4>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {leadFollowups.map(f => (
                  <div key={f.id} className="glass-card p-3">
                    <div className="flex items-start justify-between">
                      <p className="text-white/80 text-sm whitespace-pre-wrap">{f.note}</p>
                      <span className="text-xs text-white/30 whitespace-nowrap ml-3">{formatDateTime(f.createdAt)}</span>
                    </div>
                    {f.nextDate && (
                      <p className="text-xs text-accent-light mt-1">Next: {formatDateTime(f.nextDate)}</p>
                    )}
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

export default function LeadsPage() {
  const { user, getCollection, addItemToCollection, updateItemInCollection, deleteItemFromCollection, checkPermission } = useApp();

  const [leads, setLeads] = useState([]);
  const [users, setUsers] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [followups, setFollowups] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterAssigned, setFilterAssigned] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  const [viewLead, setViewLead] = useState(null);
  const [toast, setToast] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [leadsData, usersData, employeesData, followupsData, clientsData] = await Promise.all([
        getCollection('leads'),
        getCollection('users'),
        getCollection('employees'),
        getCollection('followups'),
        getCollection('clients'),
      ]);
      setLeads(leadsData);
      setUsers(usersData);
      setEmployees(employeesData);
      setFollowups(followupsData);
      setClients(clientsData);
      setLoading(false);
    }
    load();
  }, [getCollection, refreshKey]);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const allPersons = useMemo(() => {
    const personMap = new Map();
    employees.forEach(e => personMap.set(e.id, { id: e.id, name: e.name }));
    users.forEach(u => personMap.set(u.id, { id: u.id, name: u.name }));
    return Array.from(personMap.values());
  }, [employees, users]);

  const filteredLeads = useMemo(() => {
    let result = [...leads];

    if (!user?.isSuperAdmin) {
      result = result.filter(l => l.createdBy === user?.id || l.assignedTo === user?.id);
    }

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(l =>
        l.mobile?.toLowerCase().includes(q) ||
        l.email?.toLowerCase().includes(q) ||
        l.society?.toLowerCase().includes(q) ||
        l.city?.toLowerCase().includes(q) ||
        l.assignedToName?.toLowerCase().includes(q) ||
        l.createdByName?.toLowerCase().includes(q)
      );
    }

    if (filterStatus) {
      result = result.filter(l => l.status === filterStatus);
    }

    if (filterAssigned) {
      result = result.filter(l => l.assignedTo === filterAssigned);
    }

    result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return result;
  }, [leads, user, search, filterStatus, filterAssigned]);

  const stats = useMemo(() => {
    const visible = !user?.isSuperAdmin
      ? leads.filter(l => l.createdBy === user?.id || l.assignedTo === user?.id)
      : leads;
    return {
      total: visible.length,
      new: visible.filter(l => l.status === 'new').length,
      hot: visible.filter(l => l.status === 'hot').length,
      converted: visible.filter(l => l.status === 'converted').length,
    };
  }, [leads, user]);

  const handleSaveLead = async (form) => {
    const isNew = !form.id;
    if (isNew) {
      await addItemToCollection('leads', {
        ...form,
        id: generateId(),
        createdBy: user.id,
        createdByName: user.name,
        createdAt: new Date().toISOString(),
      });
      showToast('Lead created successfully');
    } else {
      await updateItemInCollection('leads', form.id, {
        ...form,
        updatedAt: new Date().toISOString(),
      });
      showToast('Lead updated successfully');
    }
    setShowForm(false);
    setEditingLead(null);
    setRefreshKey(k => k + 1);
  };

  const handleDeleteLead = async (id) => {
    if (confirm('Are you sure you want to delete this lead?')) {
      await deleteItemFromCollection('leads', id);
      showToast('Lead deleted');
      setRefreshKey(k => k + 1);
    }
  };

  const handleAddFollowup = async (leadId, { note, nextDate }) => {
    await addItemToCollection('followups', {
      id: generateId(),
      leadId,
      note,
      nextDate: nextDate || null,
      createdBy: user.id,
      createdByName: user.name,
      createdAt: new Date().toISOString(),
    });

    await updateItemInCollection('leads', leadId, {
      latestNotes: note,
      updatedAt: new Date().toISOString(),
    });

    showToast('Follow-up added');
    setRefreshKey(k => k + 1);
  };

  const handleTransferLead = async (leadId, toUserId, toUserName) => {
    await updateItemInCollection('leads', leadId, {
      assignedTo: toUserId,
      assignedToName: toUserName,
      updatedAt: new Date().toISOString(),
    });
    showToast(`Lead transferred to ${toUserName}`);
    setRefreshKey(k => k + 1);
  };

  const handleConvertLead = async (leadId, { clientType, interiorDetails }) => {
    const lead = leads.find(l => l.id === leadId);
    if (!lead) return;

    const clientId = generateId();
    const newClient = {
      id: clientId,
      leadId,
      name: lead.society || lead.city || lead.mobile,
      mobile: lead.mobile,
      email: lead.email,
      clientType,
      interiorDetails: clientType === 'interior' ? interiorDetails : null,
      propertyId: null,
      createdAt: new Date().toISOString(),
      createdBy: user.id,
      createdByName: user.name,
    };

    await addItemToCollection('clients', newClient);
    await updateItemInCollection('leads', leadId, {
      status: 'converted',
      updatedAt: new Date().toISOString(),
    });

    showToast('Lead converted to client successfully!');
    setRefreshKey(k => k + 1);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <svg className="w-10 h-10 mx-auto mb-3 animate-spin text-accent-light" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-white/40 text-sm">Loading leads...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Leads Management</h1>
          <p className="text-sm text-white/40 mt-1">Manage and track your leads</p>
        </div>
        {checkPermission('leads_create') && (
          <button onClick={() => { setEditingLead(null); setShowForm(true); }} className="glass-btn sm:w-auto w-full">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Add Lead
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
        <div className="stat-card">
          <p className="text-xs text-white/40 uppercase tracking-wider">Total Leads</p>
          <p className="text-2xl font-bold text-white mt-1">{stats.total}</p>
        </div>
        <div className="stat-card">
          <p className="text-xs text-white/40 uppercase tracking-wider">New</p>
          <p className="text-2xl font-bold text-green-400 mt-1">{stats.new}</p>
        </div>
        <div className="stat-card">
          <p className="text-xs text-white/40 uppercase tracking-wider">Hot</p>
          <p className="text-2xl font-bold text-red-400 mt-1">{stats.hot}</p>
        </div>
        <div className="stat-card">
          <p className="text-xs text-white/40 uppercase tracking-wider">Converted</p>
          <p className="text-2xl font-bold text-accent-light mt-1">{stats.converted}</p>
        </div>
      </div>

      <div className="glass-card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              className="glass-input pl-10"
              placeholder="Search by mobile, email, society, city..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select className="glass-select sm:w-48" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">All Status</option>
            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
          </select>
          <select className="glass-select sm:w-48" value={filterAssigned} onChange={e => setFilterAssigned(e.target.value)}>
            <option value="">All Assigned</option>
            {allPersons.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="glass-table">
            <thead>
              <tr>
                <th>Mobile</th>
                <th>Source</th>
                <th>Status</th>
                <th className="hidden md:table-cell">Assigned To</th>
                <th className="hidden lg:table-cell">Created</th>
                <th className="hidden lg:table-cell">Next Follow-up</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-white/30">
                    <svg className="w-12 h-12 mx-auto mb-3 text-white/10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                    <p>No leads found</p>
                  </td>
                </tr>
              ) : (
                filteredLeads.map(lead => (
                  <tr key={lead.id} className="cursor-pointer" onClick={() => setViewLead(lead)}>
                    <td>
                      <div className="text-white font-medium">{lead.mobile || '-'}</div>
                      {lead.email && <div className="text-xs text-white/40 truncate max-w-[160px]">{lead.email}</div>}
                    </td>
                    <td className="capitalize text-white/70 text-sm">{lead.source?.replace('_', ' ') || '-'}</td>
                    <td>
                      <span className={`badge ${STATUS_BADGES[lead.status] || 'badge-neutral'}`}>
                        {lead.status?.toUpperCase()}
                      </span>
                    </td>
                    <td className="hidden md:table-cell text-white/70 text-sm">{lead.assignedToName || 'Unassigned'}</td>
                    <td className="hidden lg:table-cell text-white/50 text-sm">{formatDate(lead.createdAt)}</td>
                    <td className="hidden lg:table-cell text-white/50 text-sm">{lead.nextFollowup ? formatDate(lead.nextFollowup) : '-'}</td>
                    <td onClick={e => e.stopPropagation()}>
                      <div className="flex items-center gap-1">
                        <button onClick={() => setViewLead(lead)} className="p-1.5 rounded-lg hover:bg-white/5 text-white/50 hover:text-white" title="View">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                        </button>
                        {checkPermission('leads_edit') && (
                          <button onClick={() => { setEditingLead(lead); setShowForm(true); }} className="p-1.5 rounded-lg hover:bg-white/5 text-white/50 hover:text-accent-light" title="Edit">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                          </button>
                        )}
                        {checkPermission('leads_delete') && (
                          <button onClick={() => handleDeleteLead(lead.id)} className="p-1.5 rounded-lg hover:bg-white/5 text-white/50 hover:text-danger" title="Delete">
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
        {filteredLeads.length > 0 && (
          <div className="px-4 py-3 border-t border-white/5 text-sm text-white/40">
            Showing {filteredLeads.length} of {leads.length} leads
          </div>
        )}
      </div>

      {showForm && (
        <LeadFormModal
          lead={editingLead}
          employees={allPersons}
          onSave={handleSaveLead}
          onClose={() => { setShowForm(false); setEditingLead(null); }}
        />
      )}

      {viewLead && (
        <LeadDetailModal
          lead={viewLead}
          employees={allPersons}
          followups={followups}
          onAddFollowup={handleAddFollowup}
          onConvert={handleConvertLead}
          onTransfer={handleTransferLead}
          onEdit={(lead) => { setEditingLead(lead); setShowForm(true); }}
          onClose={() => setViewLead(null)}
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
