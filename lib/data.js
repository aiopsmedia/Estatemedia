'use client';

export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}

export function formatDate(date) {
  if (!date) return '-';
  const d = new Date(date);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatDateTime(date) {
  if (!date) return '-';
  const d = new Date(date);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function formatCurrency(amount) {
  if (amount === null || amount === undefined) return '₹0';
  return '₹' + Number(amount).toLocaleString('en-IN');
}

export const ALL_PERMISSIONS = [
  { id: 'dashboard_view', label: 'View Dashboard', module: 'Dashboard' },
  { id: 'users_view', label: 'View Users', module: 'Users' },
  { id: 'users_create', label: 'Create Users', module: 'Users' },
  { id: 'users_edit', label: 'Edit Users', module: 'Users' },
  { id: 'users_delete', label: 'Delete Users', module: 'Users' },
  { id: 'roles_view', label: 'View Roles', module: 'Roles' },
  { id: 'roles_create', label: 'Create Roles', module: 'Roles' },
  { id: 'roles_edit', label: 'Edit Roles', module: 'Roles' },
  { id: 'roles_delete', label: 'Delete Roles', module: 'Roles' },
  { id: 'employees_view', label: 'View Employees', module: 'Employees' },
  { id: 'employees_create', label: 'Create Employees', module: 'Employees' },
  { id: 'employees_edit', label: 'Edit Employees', module: 'Employees' },
  { id: 'employees_delete', label: 'Delete Employees', module: 'Employees' },
  { id: 'employees_attendance', label: 'Manage Attendance', module: 'Employees' },
  { id: 'employees_leave', label: 'Manage Leave', module: 'Employees' },
  { id: 'employees_punch', label: 'Punch In/Out', module: 'Employees' },
  { id: 'leads_view', label: 'View Leads', module: 'Leads' },
  { id: 'leads_create', label: 'Create Leads', module: 'Leads' },
  { id: 'leads_edit', label: 'Edit Leads', module: 'Leads' },
  { id: 'leads_delete', label: 'Delete Leads', module: 'Leads' },
  { id: 'leads_convert', label: 'Convert Leads', module: 'Leads' },
  { id: 'leads_transfer', label: 'Transfer Leads', module: 'Leads' },
  { id: 'clients_view', label: 'View Clients', module: 'Clients' },
  { id: 'clients_create', label: 'Create Clients', module: 'Clients' },
  { id: 'clients_edit', label: 'Edit Clients', module: 'Clients' },
  { id: 'clients_delete', label: 'Delete Clients', module: 'Clients' },
  { id: 'clients_payments', label: 'Manage Client Payments', module: 'Clients' },
  { id: 'clients_documents', label: 'Manage Client Documents', module: 'Clients' },
  { id: 'followups_view', label: 'View Follow-ups', module: 'Follow-ups' },
  { id: 'followups_create', label: 'Create Follow-ups', module: 'Follow-ups' },
  { id: 'followups_edit', label: 'Edit Follow-ups', module: 'Follow-ups' },
  { id: 'followups_delete', label: 'Delete Follow-ups', module: 'Follow-ups' },
  { id: 'properties_view', label: 'View Properties', module: 'Properties' },
  { id: 'properties_create', label: 'Create Properties', module: 'Properties' },
  { id: 'properties_edit', label: 'Edit Properties', module: 'Properties' },
  { id: 'properties_delete', label: 'Delete Properties', module: 'Properties' },
  { id: 'properties_keys', label: 'Manage Keys', module: 'Properties' },
  { id: 'interior_view', label: 'View Interior', module: 'Interior' },
  { id: 'interior_create', label: 'Create Interior Projects', module: 'Interior' },
  { id: 'interior_edit', label: 'Edit Interior Projects', module: 'Interior' },
  { id: 'interior_delete', label: 'Delete Interior Projects', module: 'Interior' },
  { id: 'interior_dashboard', label: 'View Interior Dashboard', module: 'Interior' },
  { id: 'vendors_view', label: 'View Vendors', module: 'Vendors' },
  { id: 'vendors_create', label: 'Create Vendors', module: 'Vendors' },
  { id: 'vendors_edit', label: 'Edit Vendors', module: 'Vendors' },
  { id: 'vendors_delete', label: 'Delete Vendors', module: 'Vendors' },
  { id: 'finance_view', label: 'View Finance', module: 'Finance' },
  { id: 'finance_manage', label: 'Manage Finance', module: 'Finance' },
  { id: 'commissions_view', label: 'View Commissions', module: 'Commissions' },
  { id: 'commissions_approve', label: 'Approve Commissions', module: 'Commissions' },
  { id: 'commissions_request', label: 'Request Commission', module: 'Commissions' },
];

export function hasPermission(user, permissionId) {
  if (!user) return false;
  if (user.isSuperAdmin) return true;
  if (!user.role) return false;
  return user.role.permissions?.includes(permissionId);
}

const API_BASE = '/api';

async function apiFetch(url, options = {}) {
  const res = await fetch(`${API_BASE}${url}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || 'Request failed');
  }
  return res.json();
}

export async function apiGetAll(collection, query = {}) {
  const params = new URLSearchParams(query).toString();
  const url = params ? `/collection/${collection}?${params}` : `/collection/${collection}`;
  return apiFetch(url);
}

export async function apiGetOne(collection, id) {
  return apiFetch(`/collection/${collection}/${id}`);
}

export async function apiCreate(collection, data) {
  return apiFetch(`/collection/${collection}`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function apiCreateMany(collection, items) {
  return apiFetch(`/collection/${collection}`, {
    method: 'POST',
    body: JSON.stringify(items),
  });
}

export async function apiUpdate(collection, id, data) {
  return apiFetch(`/collection/${collection}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function apiDelete(collection, id) {
  return apiFetch(`/collection/${collection}/${id}`, {
    method: 'DELETE',
  });
}

export async function apiLogin(email, password) {
  return apiFetch('/auth', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function apiSeed() {
  return apiFetch('/seed', { method: 'POST' });
}
