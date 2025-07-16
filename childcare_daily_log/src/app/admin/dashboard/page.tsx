// src/app/admin/dashboard/page.tsx
'use client';
import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

export default function AdminDashboardPage() {
const { user, role, loading } = useAuth();
const router = useRouter();

useEffect(() => {
if (!loading && role !== 'admin') router.replace('/auth');
}, [loading, role, router]);

if (loading || role !== 'admin') return <p>Loading...</p>;

return ( <div className="p-6"> <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1> <ul className="space-y-2"> <li><a href="/admin/children" className="text-blue-600 hover:underline">Manage Child Profiles</a></li> <li><a href="/admin/caregivers" className="text-blue-600 hover:underline">Manage Caregivers</a></li> <li><a href="/admin/audit" className="text-blue-600 hover:underline">Activity Audit Log</a></li> <li><a href="/admin/invites" className="text-blue-600 hover:underline">Manage Invites</a></li> <li><a href="/admin/users" className="text-blue-600 hover:underline">Manage Users</a></li> </ul> </div>
);
}