// src/app/parent/dashboard/page.tsx
'use client';
import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

export default function ParentDashboardPage() {
const { user, role, loading } = useAuth();
const router = useRouter();

useEffect(() => {
if (!loading && role !== 'parent' && role !== 'admin') router.replace('/auth');
}, \[loading, role, router]);

if (loading || (role !== 'parent' && role !== 'admin')) return <p>Loading...</p>;

return ( <div className="p-6"> <h1 className="text-2xl font-bold mb-4">Parent Dashboard</h1> <ul className="space-y-2"> <li><a href="/parent/children" className="text-blue-600 hover:underline">My Children</a></li> <li><a href="/parent/needs" className="text-blue-600 hover:underline">My Child's Needs</a></li> </ul> </div>
);
}
