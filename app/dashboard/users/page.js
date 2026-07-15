'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useApp } from '@/lib/store';
import { generateId, ALL_PERMISSIONS, formatDate } from '@/lib/data';

const MODULES = [...new Set(ALL_PERMISSIONS.map(p => p.module))];

const EMPTY_USER = { name: '', email: '', password: '', roleId: '' };
const EMPTY_ROLE = { name: '', permissions: [] };

export default function UsersRolesPage() {
  const {
    getCollection, addItemToCollection, updateItemInCollection,
    deleteItemFromCollection, checkPermission, user: currentUser, refresh,
    refreshKey,
  } = useApp();

  const [activeTab, setActiveTab] = useState('users');
  const [userModal, setUserModal] = useState(null);
  const [roleModal, setRoleModal] = useState(null);
  const [toast, setToast] = useState(null);
  const [roles, setRoles] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const [rolesData, usersData] = await Promise.all([
        getCollection('roles'), getCollection('users')
      ]);
      if (!cancelled) {
        setRoles(rolesData);
        setUsers(usersData);
        setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [getCollection, refreshKey]);

  const roleMap = useMemo(() => {
    const m = {};
    roles.forEach(r => { m[r.id] = r; });
    return m;
  }, [roles]);

  const filteredUsers = useMemo(() => {
    if (!search.trim()) return users;
    const q = search.toLowerCase();
    return users.filter(u =>
      u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) || roleMap[u.roleId]?.name?.toLowerCase().includes(q)
    );
  }, [users, search, roleMap]);

  const filteredRoles = useMemo(() => {
    if (!search.trim()) return roles;
    const q = search.toLowerCase();
    return roles.filter(r => r.name?.toLowerCase().includes(q));
  }, [roles, search]);

  const showToast = useCallback((msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const handleSaveUser = useCallback(async (form, editId) => {
    if (!form.name.trim() || !form.email.trim() || (!editId && !form.password.trim()) || !form.roleId) {
      showToast('Please fill all required fields', 'error');
      return;
    }
    const emailLower = form.email.trim().toLowerCase();
    const duplicate = users.find(u => u.email.toLowerCase() === emailLower && u.id !== editId);
    if (duplicate) {
      showToast('A user with this email already exists', 'error');
      return;
    }
    if (editId) {
      const updates = { name: form.name.trim(), email: emailLower, roleId: form.roleId };
      if (form.password.trim()) updates.password = form.password.trim();
      await updateItemInCollection('users', editId, updates);
      showToast('User updated successfully');
    } else {
      await addItemToCollection('users', {
        id: generateId(),
        name: form.name.trim(),
        email: emailLower,
        password: form.password.trim(),
        roleId: form.roleId,
      });
      showToast('User created successfully');
    }
    setUserModal(null);
    refresh();
  }, [users, addItemToCollection, updateItemInCollection, showToast, refresh]);

  const handleDeleteUser = useCallback(async (id) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    await deleteItemFromCollection('users', id);
    showToast('User deleted successfully');
    refresh();
  }, [deleteItemFromCollection, showToast, refresh]);

  const handleSaveRole = useCallback(async (form, editId) => {
    if (!form.name.trim()) {
      showToast('Please enter a role name', 'error');
      return;
    }
    const nameLower = form.name.trim().toLowerCase();
    const duplicate = roles.find(r => r.name.toLowerCase() === nameLower && r.id !== editId);
    if (duplicate) {
      showToast('A role with this name already exists', 'error');
      return;
    }
    if (editId) {
      await updateItemInCollection('roles', editId, { name: form.name.trim(), permissions: form.permissions });
      showToast('Role updated successfully');
    } else {
      await addItemToCollection('roles', {
        id: generateId(),
        name: form.name.trim(),
        permissions: form.permissions,
      });
      showToast('Role created successfully');
    }
    setRoleModal(null);
    refresh();
  }, [roles, addItemToCollection, updateItemInCollection, showToast, refresh]);

  const handleDeleteRole = useCallback(async (id) => {
    if (!confirm('Are you sure you want to delete this role?')) return;
    await deleteItemFromCollection('roles', id);
    showToast('Role deleted successfully');
    refresh();
  }, [deleteItemFromCollection, showToast, refresh]);

  const canManageUsers = checkPermission('users_create') || checkPermission('users_edit') || checkPermission('users_delete');
  const canManageRoles = checkPermission('roles_create') || checkPermission('roles_edit') || checkPermission('roles_delete');

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
          <p className="text-white/50 text-sm">Loading users &amp; roles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Users & Roles</h1>
          <p className="text-white/50 text-sm mt-1">Manage system users and their permissions</p>
        </div>
        <input
          className="glass-input w-full sm:w-64"
          placeholder="Search users & roles..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="glass-card p-4 text-center">
          <p className="text-2xl font-bold text-white">{users.length}</p>
          <p className="text-xs text-white/50 mt-1">Total Users</p>
        </div>
        <div className="glass-card p-4 text-center">
          <p className="text-2xl font-bold text-white">{roles.length}</p>
          <p className="text-xs text-white/50 mt-1">Total Roles</p>
        </div>
        <div className="glass-card p-4 text-center col-span-2 sm:col-span-1">
          <p className="text-2xl font-bold text-white">{MODULES.length}</p>
          <p className="text-xs text-white/50 mt-1">Modules</p>
        </div>
      </div>

      <div className="tabs-container w-full sm:w-fit overflow-x-auto">
        <button
          className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          Users ({users.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'roles' ? 'active' : ''}`}
          onClick={() => setActiveTab('roles')}
        >
          Roles ({roles.length})
        </button>
      </div>

      {activeTab === 'users' && (
        <div className="glass-card p-0 overflow-hidden fade-in">
          <div className="flex items-center justify-between p-4 border-b border-white/5">
            <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wider">All Users</h3>
            {canManageUsers && (
              <button className="glass-btn text-sm" onClick={() => setUserModal({ form: { ...EMPTY_USER }, editId: null })}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                Add User
              </button>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="glass-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(u => (
                  <tr key={u.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent to-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {u.name?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <span className="text-white font-medium">{u.name}</span>
                      </div>
                    </td>
                    <td className="text-white/60">{u.email}</td>
                    <td>
                      <span className="badge badge-info">{roleMap[u.roleId]?.name || 'Unknown'}</span>
                    </td>
                    <td>
                      <span className="badge badge-success">Active</span>
                    </td>
                    <td className="text-white/50 text-sm">{formatDate(u.createdAt)}</td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {canManageUsers && (
                          <button
                            className="text-white/40 hover:text-info p-1 transition-colors"
                            title="Edit"
                            onClick={() => setUserModal({ form: { name: u.name, email: u.email, password: '', roleId: u.roleId }, editId: u.id })}
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                          </button>
                        )}
                        {canManageUsers && !u.isSuperAdmin && (
                          <button
                            className="text-white/40 hover:text-danger p-1 transition-colors"
                            title="Delete"
                            onClick={() => handleDeleteUser(u.id)}
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        )}
                        {u.isSuperAdmin && (
                          <span className="badge badge-warning text-xs">Protected</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredUsers.length === 0 && (
                  <tr><td colSpan={6} className="text-center py-12 text-white/30">No users found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'roles' && (
        <div className="glass-card p-0 overflow-hidden fade-in">
          <div className="flex items-center justify-between p-4 border-b border-white/5">
            <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wider">All Roles</h3>
            {canManageRoles && (
              <button className="glass-btn text-sm" onClick={() => setRoleModal({ form: { ...EMPTY_ROLE }, editId: null })}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                Add Role
              </button>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="glass-table">
              <thead>
                <tr>
                  <th>Role Name</th>
                  <th>Permissions</th>
                  <th>Created</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRoles.map(r => (
                  <tr key={r.id}>
                    <td className="text-white font-medium">{r.name}</td>
                    <td>
                      <span className="badge badge-info">{r.permissions?.length || 0} permissions</span>
                    </td>
                    <td className="text-white/50 text-sm">{formatDate(r.createdAt)}</td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {canManageRoles && (
                          <button
                            className="text-white/40 hover:text-info p-1 transition-colors"
                            title="Edit"
                            onClick={() => setRoleModal({ form: { name: r.name, permissions: [...(r.permissions || [])] }, editId: r.id })}
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                          </button>
                        )}
                        {canManageRoles && r.id !== 'role_superadmin' && (
                          <button
                            className="text-white/40 hover:text-danger p-1 transition-colors"
                            title="Delete"
                            onClick={() => handleDeleteRole(r.id)}
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        )}
                        {r.id === 'role_superadmin' && (
                          <span className="badge badge-warning text-xs">Protected</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredRoles.length === 0 && (
                  <tr><td colSpan={4} className="text-center py-12 text-white/30">No roles found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {userModal && (
        <UserModal
          form={userModal.form}
          editId={userModal.editId}
          roles={roles}
          onSave={handleSaveUser}
          onClose={() => setUserModal(null)}
        />
      )}

      {roleModal && (
        <RoleModal
          form={roleModal.form}
          editId={roleModal.editId}
          onSave={handleSaveRole}
          onClose={() => setRoleModal(null)}
        />
      )}

      {toast && (
        <div className={`toast toast-${toast.type}`}>{toast.msg}</div>
      )}
    </div>
  );
}

function UserModal({ form: initialForm, editId, roles, onSave, onClose }) {
  const [form, setForm] = useState(initialForm);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  return (
    <div className="modal-overlay fade-in" onClick={onClose}>
      <div className="modal-content max-sm:w-full max-sm:h-full max-sm:rounded-none max-sm:p-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-white">{editId ? 'Edit User' : 'Add User'}</h3>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-white/60 mb-1">Name *</label>
            <input className="glass-input" placeholder="Full name" value={form.name} onChange={e => set('name', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm text-white/60 mb-1">Email *</label>
            <input className="glass-input" type="email" placeholder="Email address" value={form.email} onChange={e => set('email', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm text-white/60 mb-1">{editId ? 'New Password (leave blank to keep)' : 'Password *'}</label>
            <input className="glass-input" type="password" placeholder={editId ? '••••••••' : 'Password'} value={form.password} onChange={e => set('password', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm text-white/60 mb-1">Role *</label>
            <select className="glass-select" value={form.roleId} onChange={e => set('roleId', e.target.value)}>
              <option value="">Select a role</option>
              {roles.map(r => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-white/5">
          <button className="glass-btn-secondary glass-btn text-sm" onClick={onClose}>Cancel</button>
          <button className="glass-btn text-sm" onClick={() => onSave(form, editId)}>
            {editId ? 'Update' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  );
}

function RoleModal({ form: initialForm, editId, onSave, onClose }) {
  const [form, setForm] = useState(initialForm);

  const togglePerm = (permId) => {
    setForm(f => {
      const perms = f.permissions.includes(permId)
        ? f.permissions.filter(p => p !== permId)
        : [...f.permissions, permId];
      return { ...f, permissions: perms };
    });
  };

  const toggleModule = (module) => {
    setForm(f => {
      const modulePermIds = ALL_PERMISSIONS.filter(p => p.module === module).map(p => p.id);
      const allSelected = modulePermIds.every(id => f.permissions.includes(id));
      let perms;
      if (allSelected) {
        perms = f.permissions.filter(p => !modulePermIds.includes(p));
      } else {
        perms = [...new Set([...f.permissions, ...modulePermIds])];
      }
      return { ...f, permissions: perms };
    });
  };

  const toggleAll = () => {
    setForm(f => {
      const allIds = ALL_PERMISSIONS.map(p => p.id);
      const allSelected = allIds.every(id => f.permissions.includes(id));
      return { ...f, permissions: allSelected ? [] : allIds };
    });
  };

  const allSelected = ALL_PERMISSIONS.every(p => form.permissions.includes(p.id));

  return (
    <div className="modal-overlay fade-in" onClick={onClose}>
      <div className="modal-content max-w-2xl max-sm:w-full max-sm:h-full max-sm:rounded-none max-sm:p-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-white">{editId ? 'Edit Role' : 'Add Role'}</h3>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-white/60 mb-1">Role Name *</label>
            <input className="glass-input" placeholder="e.g. Manager" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm text-white/60">Permissions</label>
              <button
                type="button"
                className={`text-xs px-3 py-1 rounded-lg font-medium transition-colors ${allSelected ? 'bg-accent/20 text-accent-light border border-accent/30' : 'bg-white/5 text-white/50 border border-white/10 hover:bg-white/10'}`}
                onClick={toggleAll}
              >
                {allSelected ? 'Deselect All' : 'Select All'}
              </button>
            </div>
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
              {MODULES.map(module => {
                const modulePerms = ALL_PERMISSIONS.filter(p => p.module === module);
                const selectedCount = modulePerms.filter(p => form.permissions.includes(p.id)).length;
                const allModuleSelected = selectedCount === modulePerms.length;
                return (
                  <div key={module} className="glass-card !rounded-xl p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={allModuleSelected}
                          onChange={() => toggleModule(module)}
                          className="w-4 h-4 accent-[var(--accent)] rounded cursor-pointer"
                        />
                        <span className="text-sm font-semibold text-white">{module}</span>
                      </div>
                      <span className="text-xs text-white/40">{selectedCount}/{modulePerms.length}</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1 pl-6">
                      {modulePerms.map(p => (
                        <label key={p.id} className="flex items-center gap-2 cursor-pointer group py-0.5">
                          <input
                            type="checkbox"
                            checked={form.permissions.includes(p.id)}
                            onChange={() => togglePerm(p.id)}
                            className="w-3.5 h-3.5 accent-[var(--accent)] rounded cursor-pointer"
                          />
                          <span className="text-xs text-white/50 group-hover:text-white/80 transition-colors">{p.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-white/5">
          <button className="glass-btn-secondary glass-btn text-sm" onClick={onClose}>Cancel</button>
          <button className="glass-btn text-sm" onClick={() => onSave(form, editId)}>
            {editId ? 'Update' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  );
}
