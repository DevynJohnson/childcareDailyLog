// src/app/caregiver/dashboard/page.tsx
'use client';
import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

export default function CaregiverDashboardPage() {
const { user, role, loading } = useAuth();
const router = useRouter();

useEffect(() => {
if (!loading && role !== 'caregiver' && role !== 'admin') router.replace('/auth');
}, \[loading, role, router]);

if (loading || (role !== 'caregiver' && role !== 'admin')) return <p>Loading...</p>;

return ( <div className="p-6"> <h1 className="text-2xl font-bold mb-4">Caregiver Dashboard</h1> <ul className="space-y-2"> <li><a href="/caregiver/children" className="text-blue-600 hover:underline">View Children</a></li> <li><a href="/caregiver/sessions" className="text-blue-600 hover:underline">Manage Sessions</a></li> </ul> </div>
);
}