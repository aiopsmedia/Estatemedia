import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

const ALL_PERMISSIONS = [
  'dashboard_view','users_view','users_create','users_edit','users_delete',
  'roles_view','roles_create','roles_edit','roles_delete',
  'employees_view','employees_create','employees_edit','employees_delete','employees_attendance','employees_leave','employees_punch',
  'leads_view','leads_create','leads_edit','leads_delete','leads_convert','leads_transfer',
  'clients_view','clients_create','clients_edit','clients_delete','clients_payments','clients_documents',
  'followups_view','followups_create','followups_edit','followups_delete',
  'properties_view','properties_create','properties_edit','properties_delete','properties_keys',
  'interior_view','interior_create','interior_edit','interior_delete','interior_dashboard',
  'vendors_view','vendors_create','vendors_edit','vendors_delete',
  'finance_view','finance_manage',
  'commissions_view','commissions_approve','commissions_request',
];

const DEFAULT_ROLES = [
  {
    _id: 'role_superadmin',
    name: 'Super Admin',
    permissions: ALL_PERMISSIONS,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    _id: 'role_manager',
    name: 'Manager',
    permissions: [
      'dashboard_view','leads_view','leads_create','leads_edit','leads_convert','leads_transfer',
      'clients_view','clients_create','clients_edit','clients_payments','clients_documents',
      'followups_view','followups_create','followups_edit',
      'properties_view','properties_create','properties_edit','properties_keys',
      'interior_view','interior_create','interior_edit','interior_dashboard',
      'vendors_view','vendors_create','vendors_edit',
      'finance_view','finance_manage','employees_view','employees_punch',
      'commissions_view','commissions_request',
    ],
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    _id: 'role_executive',
    name: 'Executive',
    permissions: [
      'dashboard_view','leads_view','leads_create','leads_edit',
      'clients_view','clients_create','clients_edit',
      'followups_view','followups_create','followups_edit',
      'properties_view','interior_view','employees_punch',
      'commissions_view','commissions_request',
    ],
    createdAt: '2026-01-01T00:00:00.000Z',
  },
];

const SUPER_ADMIN = {
  _id: 'sa_001',
  id: 'sa_001',
  name: 'Super Admin',
  email: 'estate@aiopsmedia.com',
  password: 'Admin@321',
  roleId: 'role_superadmin',
  isSuperAdmin: true,
  createdAt: '2026-01-01T00:00:00.000Z',
};

const COLLECTIONS = [
  'roles','users','employees','leads','clients','followups','properties',
  'interiorProjects','interiorExpenses','interiorPayments','vendors','estimates',
  'invoices','payments','commissions','attendance','leaveRequests','keyHistory',
  'documents','financeTransactions',
];

export async function POST(request) {
  try {
    const db = await getDb();
    const url = new URL(request.url);
    const force = url.searchParams.get('force') === 'true';

    if (!force) {
    const existingAdmin = await db.collection('users').findOne({ email: 'estate@aiopsmedia.com' });
    if (existingAdmin) {
      const roleExists = await db.collection('roles').findOne({ _id: existingAdmin.roleId });
      if (roleExists) {
        return NextResponse.json({ message: 'Database already initialized' });
      }
    }
    }

    for (const col of COLLECTIONS) {
      await db.collection(col).drop().catch(() => {});
    }

    await db.collection('roles').insertMany(DEFAULT_ROLES);

    await db.collection('users').insertOne(SUPER_ADMIN);

    return NextResponse.json({ message: 'Database seeded successfully with Super Admin' });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
