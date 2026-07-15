'use client';

import { useState, useEffect, useMemo } from 'react';
import { useApp } from '@/lib/store';
import { generateId, formatDate, formatDateTime } from '@/lib/data';

const DEPARTMENTS = ['Sales', 'Marketing', 'HR', 'Finance', 'Operations', 'IT', 'Legal', 'Admin', 'Other'];
const DESIGNATIONS = ['Manager', 'Executive', 'Senior Executive', 'Assistant Manager', 'Director', 'Intern', 'Lead', 'Coordinator', 'Consultant', 'Other'];
const LEAVE_TYPES = ['sick', 'casual', 'earned', 'unpaid'];

export default function EmployeesPage() {
  const { getCollection, addItemToCollection, updateItemInCollection, deleteItemFromCollection, checkPermission, user, refresh } = useApp();

  const [activeTab, setActiveTab] = useState('employees');
  const [toast, setToast] = useState(null);

  const [employees, setEmployees] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [empData, attData, leaveData] = await Promise.all([
        getCollection('employees'), getCollection('attendance'), getCollection('leaveRequests')
      ]);
      setEmployees(empData); setAttendance(attData); setLeaveRequests(leaveData);
      setLoading(false);
    }
    load();
  }, [getCollection, refresh]);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const tabs = [
    { id: 'employees', label: 'Employees', permission: 'employees_view' },
    { id: 'attendance', label: 'Attendance', permission: 'employees_attendance' },
    { id: 'leaves', label: 'Leaves', permission: 'employees_leave' },
  ].filter(t => checkPermission(t.permission));

  useEffect(() => {
    if (tabs.length > 0 && !tabs.find(t => t.id === activeTab)) {
      setActiveTab(tabs[0].id);
    }
  }, [tabs.length]);

  if (tabs.length === 0) {
    return (
      <div className="text-center py-20 text-white/50">
        <p className="text-lg">You don&apos;t have permission to access this module.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Employee Management</h1>
          <p className="text-sm text-white/50 mt-1">Manage employees, attendance, and leaves</p>
        </div>
      </div>

      {tabs.length > 1 && (
        <div className="tabs-container w-fit overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="text-center py-20 text-white/50">
          <p className="text-lg">Loading...</p>
        </div>
      ) : (
        <>
          {activeTab === 'employees' && <EmployeesTab user={user} checkPermission={checkPermission} employees={employees} addItemToCollection={addItemToCollection} updateItemInCollection={updateItemInCollection} deleteItemFromCollection={deleteItemFromCollection} refresh={refresh} showToast={showToast} setEmployees={setEmployees} />}
          {activeTab === 'attendance' && <AttendanceTab user={user} checkPermission={checkPermission} employees={employees} attendance={attendance} addItemToCollection={addItemToCollection} updateItemInCollection={updateItemInCollection} refresh={refresh} showToast={showToast} setAttendance={setAttendance} />}
          {activeTab === 'leaves' && <LeavesTab user={user} checkPermission={checkPermission} employees={employees} leaveRequests={leaveRequests} addItemToCollection={addItemToCollection} updateItemInCollection={updateItemInCollection} refresh={refresh} showToast={showToast} setLeaveRequests={setLeaveRequests} />}
        </>
      )}

      {toast && (
        <div className={`toast toast-${toast.type}`}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}

function EmployeesTab({ user, checkPermission, employees, addItemToCollection, updateItemInCollection, deleteItemFromCollection, refresh, showToast, setEmployees }) {
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);

  const [form, setForm] = useState({
    name: '', email: '', phone: '', designation: '', department: '',
    dateOfJoining: '', salary: '', status: 'active',
  });

  const resetForm = () => {
    setForm({ name: '', email: '', phone: '', designation: '', department: '', dateOfJoining: '', salary: '', status: 'active' });
    setEditing(null);
  };

  const openAdd = () => {
    resetForm();
    setShowModal(true);
  };

  const openEdit = (emp) => {
    setForm({
      name: emp.name || '', email: emp.email || '', phone: emp.phone || '',
      designation: emp.designation || '', department: emp.department || '',
      dateOfJoining: emp.dateOfJoining || '', salary: emp.salary || '', status: emp.status || 'active',
    });
    setEditing(emp);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) {
      showToast('Name and email are required', 'error');
      return;
    }

    if (editing) {
      await updateItemInCollection('employees', editing.id, form);
      setEmployees(prev => prev.map(emp => emp.id === editing.id ? { ...emp, ...form } : emp));
      showToast('Employee updated successfully');
    } else {
      const newEmp = { ...form, id: generateId(), createdAt: new Date().toISOString() };
      await addItemToCollection('employees', newEmp);
      setEmployees(prev => [...prev, newEmp]);
      showToast('Employee added successfully');
    }
    setShowModal(false);
    resetForm();
  };

  const handleDelete = async (emp) => {
    await deleteItemFromCollection('employees', emp.id);
    setEmployees(prev => prev.filter(e => e.id !== emp.id));
    setConfirmDelete(null);
    showToast('Employee deleted');
  };

  const filtered = employees.filter(emp =>
    emp.name?.toLowerCase().includes(search.toLowerCase()) ||
    emp.email?.toLowerCase().includes(search.toLowerCase()) ||
    emp.phone?.includes(search) ||
    emp.department?.toLowerCase().includes(search.toLowerCase()) ||
    emp.designation?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <input
          type="text"
          placeholder="Search employees..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="glass-input max-w-sm flex-1 min-w-0"
        />
        {checkPermission('employees_create') && (
          <button className="glass-btn" onClick={openAdd}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Add Employee
          </button>
        )}
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="glass-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Designation</th>
                <th>Department</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={8} className="text-center text-white/40 py-8">No employees found</td></tr>
              ) : filtered.map(emp => (
                <tr key={emp.id}>
                  <td className="font-medium text-white">{emp.name}</td>
                  <td className="text-white/70">{emp.email}</td>
                  <td className="text-white/70">{emp.phone || '-'}</td>
                  <td className="text-white/70">{emp.designation || '-'}</td>
                  <td className="text-white/70">{emp.department || '-'}</td>
                  <td>
                    <span className={`badge ${emp.status === 'active' ? 'badge-success' : 'badge-danger'}`}>
                      {emp.status}
                    </span>
                  </td>
                  <td className="text-white/50 text-sm">{formatDate(emp.createdAt)}</td>
                  <td>
                    <div className="flex items-center gap-1">
                      {checkPermission('employees_edit') && (
                        <button className="glass-btn-secondary px-3 py-1.5 text-xs min-h-[44px] min-w-[44px]" onClick={() => openEdit(emp)}>
                          Edit
                        </button>
                      )}
                      {checkPermission('employees_delete') && (
                        <button className="glass-btn-danger px-3 py-1.5 text-xs min-h-[44px] min-w-[44px]" onClick={() => setConfirmDelete(emp)}>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-6" onClick={() => setShowModal(false)}>
          <div className="bg-[#1a1a2e] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] sm:max-h-[80vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-white mb-4">{editing ? 'Edit Employee' : 'Add Employee'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-white/60 mb-1">Name *</label>
                  <input type="text" className="glass-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                </div>
                <div>
                  <label className="block text-sm text-white/60 mb-1">Email *</label>
                  <input type="email" className="glass-input" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
                </div>
                <div>
                  <label className="block text-sm text-white/60 mb-1">Phone</label>
                  <input type="text" className="glass-input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm text-white/60 mb-1">Designation</label>
                  <select className="glass-select" value={form.designation} onChange={e => setForm({ ...form, designation: e.target.value })}>
                    <option value="">Select</option>
                    {DESIGNATIONS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-white/60 mb-1">Department</label>
                  <select className="glass-select" value={form.department} onChange={e => setForm({ ...form, department: e.target.value })}>
                    <option value="">Select</option>
                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-white/60 mb-1">Date of Joining</label>
                  <input type="date" className="glass-input" value={form.dateOfJoining} onChange={e => setForm({ ...form, dateOfJoining: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm text-white/60 mb-1">Salary</label>
                  <input type="number" className="glass-input" value={form.salary} onChange={e => setForm({ ...form, salary: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm text-white/60 mb-1">Status</label>
                  <select className="glass-select" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" className="glass-btn-secondary" onClick={() => { setShowModal(false); resetForm(); }}>Cancel</button>
                <button type="submit" className="glass-btn">{editing ? 'Update' : 'Add'} Employee</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setConfirmDelete(null)}>
          <div className="bg-[#1a1a2e] border border-white/10 rounded-2xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
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

function AttendanceTab({ user, checkPermission, employees, attendance, addItemToCollection, updateItemInCollection, refresh, showToast, setAttendance }) {
  const todayStr = new Date().toISOString().split('T')[0];

  const currentEmployee = useMemo(() => {
    return employees.find(e => e.email === user?.email) || null;
  }, [employees, user]);

  const todayRecord = useMemo(() => {
    if (!currentEmployee) return null;
    return attendance.find(a => a.employeeId === currentEmployee.id && a.date === todayStr) || null;
  }, [attendance, currentEmployee, todayStr]);

  const todayRecords = useMemo(() => {
    return attendance.filter(a => a.date === todayStr);
  }, [attendance, todayStr]);

  const isAdmin = checkPermission('employees_attendance');

  const handlePunchIn = async () => {
    if (!currentEmployee) {
      showToast('No employee record found for your account. Please contact admin.', 'error');
      return;
    }
    const record = {
      id: generateId(),
      employeeId: currentEmployee.id,
      date: todayStr,
      punchIn: new Date().toISOString(),
      punchOut: null,
      status: 'pending',
      approvedBy: null,
    };
    await addItemToCollection('attendance', record);
    setAttendance(prev => [...prev, record]);
    showToast('Punched in successfully');
  };

  const handlePunchOut = async () => {
    if (todayRecord) {
      const punchOutTime = new Date().toISOString();
      await updateItemInCollection('attendance', todayRecord.id, { punchOut: punchOutTime });
      setAttendance(prev => prev.map(a => a.id === todayRecord.id ? { ...a, punchOut: punchOutTime } : a));
      showToast('Punched out successfully');
    }
  };

  const handleApprove = async (record) => {
    await updateItemInCollection('attendance', record.id, { status: 'approved', approvedBy: user.id });
    setAttendance(prev => prev.map(a => a.id === record.id ? { ...a, status: 'approved', approvedBy: user.id } : a));
    showToast('Attendance approved');
  };

  const handleReject = async (record) => {
    await updateItemInCollection('attendance', record.id, { status: 'rejected', approvedBy: user.id });
    setAttendance(prev => prev.map(a => a.id === record.id ? { ...a, status: 'rejected', approvedBy: user.id } : a));
    showToast('Attendance rejected');
  };

  const getEmployeeName = (empId) => {
    const emp = employees.find(e => e.id === empId);
    return emp?.name || 'Unknown';
  };

  const formatTime = (iso) => {
    if (!iso) return '-';
    return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  };

  const calcDuration = (punchIn, punchOut) => {
    if (!punchIn) return '-';
    const start = new Date(punchIn);
    const end = punchOut ? new Date(punchOut) : new Date();
    const diff = Math.floor((end - start) / 60000);
    const h = Math.floor(diff / 60);
    const m = diff % 60;
    return `${h}h ${m}m`;
  };

  return (
    <div className="space-y-6">
      {(checkPermission('employees_punch') || currentEmployee) && (
        <div className="glass-card p-6">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="flex-1 text-center md:text-left">
              <h3 className="text-xl font-bold text-white">Punch In / Punch Out</h3>
              <p className="text-white/50 text-sm mt-1">
                {currentEmployee ? `Hello, ${currentEmployee.name}` : 'Link your account to an employee record to punch in'}
              </p>
              {todayRecord && (
                <div className="mt-3 flex flex-wrap gap-4 text-sm">
                  <div>
                    <span className="text-white/40">Punch In: </span>
                    <span className="text-white font-medium">{formatTime(todayRecord.punchIn)}</span>
                  </div>
                  {todayRecord.punchOut && (
                    <div>
                      <span className="text-white/40">Punch Out: </span>
                      <span className="text-white font-medium">{formatTime(todayRecord.punchOut)}</span>
                    </div>
                  )}
                  <div>
                    <span className="text-white/40">Duration: </span>
                    <span className="text-white font-medium">{calcDuration(todayRecord.punchIn, todayRecord.punchOut)}</span>
                  </div>
                  <div>
                    <span className="text-white/40">Status: </span>
                    <span className={`badge ${todayRecord.status === 'approved' ? 'badge-success' : todayRecord.status === 'rejected' ? 'badge-danger' : 'badge-warning'}`}>
                      {todayRecord.status}
                    </span>
                  </div>
                </div>
              )}
            </div>
            <div className="flex gap-3">
              {!todayRecord ? (
                <button
                  className="glass-btn-success px-8 py-4 text-lg font-bold min-h-[56px] w-full md:w-auto"
                  onClick={handlePunchIn}
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  Punch In
                </button>
              ) : !todayRecord.punchOut ? (
                <button
                  className="glass-btn-danger px-8 py-4 text-lg font-bold min-h-[56px] w-full md:w-auto"
                  onClick={handlePunchOut}
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" /></svg>
                  Punch Out
                </button>
              ) : (
                <div className="text-center text-white/50 px-8 py-4">
                  <p className="text-sm">You&apos;ve completed your day</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {isAdmin && (
        <div className="glass-card overflow-hidden">
          <div className="px-5 py-4 border-b border-white/5">
            <h3 className="font-semibold text-white">Today&apos;s Attendance ({formatDate(todayStr)})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="glass-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Punch In</th>
                  <th>Punch Out</th>
                  <th>Duration</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {todayRecords.length === 0 ? (
                  <tr><td colSpan={6} className="text-center text-white/40 py-8">No attendance records for today</td></tr>
                ) : todayRecords.map(rec => (
                  <tr key={rec.id}>
                    <td className="font-medium text-white">{getEmployeeName(rec.employeeId)}</td>
                    <td className="text-white/70">{formatTime(rec.punchIn)}</td>
                    <td className="text-white/70">{formatTime(rec.punchOut)}</td>
                    <td className="text-white/70">{calcDuration(rec.punchIn, rec.punchOut)}</td>
                    <td>
                      <span className={`badge ${rec.status === 'approved' ? 'badge-success' : rec.status === 'rejected' ? 'badge-danger' : 'badge-warning'}`}>
                        {rec.status}
                      </span>
                    </td>
                    <td>
                      {rec.status === 'pending' ? (
                        <div className="flex items-center gap-1">
                          <button className="glass-btn-success px-3 py-1.5 text-xs min-h-[44px] min-w-[44px]" onClick={() => handleApprove(rec)}>Approve</button>
                          <button className="glass-btn-danger px-3 py-1.5 text-xs min-h-[44px] min-w-[44px]" onClick={() => handleReject(rec)}>Reject</button>
                        </div>
                      ) : (
                        <span className="text-white/30 text-sm">{rec.approvedBy ? 'by admin' : ''}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function LeavesTab({ user, checkPermission, employees, leaveRequests, addItemToCollection, updateItemInCollection, refresh, showToast, setLeaveRequests }) {
  const isAdmin = checkPermission('employees_leave');

  const currentEmployee = useMemo(() => {
    return employees.find(e => e.email === user?.email) || null;
  }, [employees, user]);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ leaveType: 'sick', startDate: '', endDate: '', reason: '' });
  const [statusFilter, setStatusFilter] = useState('all');

  const myRequests = useMemo(() => {
    if (!currentEmployee) return [];
    return leaveRequests.filter(l => l.employeeId === currentEmployee.id).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [leaveRequests, currentEmployee]);

  const allRequests = useMemo(() => {
    let reqs = [...leaveRequests].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    if (statusFilter !== 'all') reqs = reqs.filter(l => l.status === statusFilter);
    return reqs;
  }, [leaveRequests, statusFilter]);

  const getEmployeeName = (empId) => {
    const emp = employees.find(e => e.id === empId);
    return emp?.name || 'Unknown';
  };

  const handleApply = async (e) => {
    e.preventDefault();
    if (!form.startDate || !form.endDate || !form.reason.trim()) {
      showToast('Please fill all required fields', 'error');
      return;
    }
    if (!currentEmployee) {
      showToast('No employee record found for your account', 'error');
      return;
    }
    const newReq = {
      id: generateId(),
      employeeId: currentEmployee.id,
      employeeName: currentEmployee.name,
      leaveType: form.leaveType,
      startDate: form.startDate,
      endDate: form.endDate,
      reason: form.reason,
      status: 'pending',
      approvedBy: null,
      createdAt: new Date().toISOString(),
    };
    await addItemToCollection('leaveRequests', newReq);
    setLeaveRequests(prev => [...prev, newReq]);
    setForm({ leaveType: 'sick', startDate: '', endDate: '', reason: '' });
    setShowForm(false);
    showToast('Leave request submitted');
  };

  const handleApprove = async (record) => {
    await updateItemInCollection('leaveRequests', record.id, { status: 'approved', approvedBy: user.id });
    setLeaveRequests(prev => prev.map(l => l.id === record.id ? { ...l, status: 'approved', approvedBy: user.id } : l));
    showToast('Leave approved');
  };

  const handleReject = async (record) => {
    await updateItemInCollection('leaveRequests', record.id, { status: 'rejected', approvedBy: user.id });
    setLeaveRequests(prev => prev.map(l => l.id === record.id ? { ...l, status: 'rejected', approvedBy: user.id } : l));
    showToast('Leave rejected');
  };

  const statusBadge = (status) => {
    return <span className={`badge ${status === 'approved' ? 'badge-success' : status === 'rejected' ? 'badge-danger' : 'badge-warning'}`}>{status}</span>;
  };

  const leaveTypeLabel = (type) => {
    return type?.charAt(0).toUpperCase() + type?.slice(1);
  };

  return (
    <div className="space-y-6">
      {checkPermission('employees_punch') && currentEmployee && (
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white">My Leave Requests</h3>
            <button className="glass-btn text-sm min-h-[44px]" onClick={() => setShowForm(!showForm)}>
              {showForm ? 'Cancel' : 'Apply for Leave'}
            </button>
          </div>

          {showForm && (
            <form onSubmit={handleApply} className="glass-card p-4 mb-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-white/60 mb-1">Leave Type</label>
                  <select className="glass-select" value={form.leaveType} onChange={e => setForm({ ...form, leaveType: e.target.value })}>
                    {LEAVE_TYPES.map(t => <option key={t} value={t}>{leaveTypeLabel(t)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-white/60 mb-1">Start Date *</label>
                  <input type="date" className="glass-input" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} required />
                </div>
                <div>
                  <label className="block text-sm text-white/60 mb-1">End Date *</label>
                  <input type="date" className="glass-input" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} required />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm text-white/60 mb-1">Reason *</label>
                  <textarea className="glass-input" rows={3} value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} required placeholder="Describe your reason for leave..." />
                </div>
              </div>
              <div className="flex justify-end">
                <button type="submit" className="glass-btn min-h-[44px]">Submit Request</button>
              </div>
            </form>
          )}

          <div className="overflow-x-auto">
            <table className="glass-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Reason</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {myRequests.length === 0 ? (
                  <tr><td colSpan={5} className="text-center text-white/40 py-6">No leave requests yet</td></tr>
                ) : myRequests.map(req => (
                  <tr key={req.id}>
                    <td className="text-white/70">{leaveTypeLabel(req.leaveType)}</td>
                    <td className="text-white/70">{formatDate(req.startDate)}</td>
                    <td className="text-white/70">{formatDate(req.endDate)}</td>
                    <td className="text-white/70 max-w-xs truncate">{req.reason}</td>
                    <td>{statusBadge(req.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {isAdmin && (
        <div className="glass-card overflow-hidden">
          <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between flex-wrap gap-3">
            <h3 className="font-semibold text-white">All Leave Requests</h3>
            <div className="flex items-center gap-2">
              <span className="text-sm text-white/40">Filter:</span>
              <select className="glass-select w-auto text-sm py-1.5" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                <option value="all">All</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="glass-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Type</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {allRequests.length === 0 ? (
                  <tr><td colSpan={7} className="text-center text-white/40 py-8">No leave requests found</td></tr>
                ) : allRequests.map(req => (
                  <tr key={req.id}>
                    <td className="font-medium text-white">{req.employeeName || getEmployeeName(req.employeeId)}</td>
                    <td className="text-white/70">{leaveTypeLabel(req.leaveType)}</td>
                    <td className="text-white/70">{formatDate(req.startDate)}</td>
                    <td className="text-white/70">{formatDate(req.endDate)}</td>
                    <td className="text-white/70 max-w-xs truncate">{req.reason}</td>
                    <td>{statusBadge(req.status)}</td>
                    <td>
                      {req.status === 'pending' ? (
                        <div className="flex items-center gap-1">
                          <button className="glass-btn-success px-3 py-1.5 text-xs min-h-[44px] min-w-[44px]" onClick={() => handleApprove(req)}>Approve</button>
                          <button className="glass-btn-danger px-3 py-1.5 text-xs min-h-[44px] min-w-[44px]" onClick={() => handleReject(req)}>Reject</button>
                        </div>
                      ) : (
                        <span className="text-white/30 text-sm">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!isAdmin && !checkPermission('employees_punch') && (
        <div className="text-center py-12 text-white/40">
          <p>You don&apos;t have permission to access leaves.</p>
        </div>
      )}
    </div>
  );
}