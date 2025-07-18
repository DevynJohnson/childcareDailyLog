// src/app/admin/dashboard/page.tsx
'use client';
import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

export default function AdminDashboardPage() {
const { role, loading } = useAuth();
const router = useRouter();

useEffect(() => {
if (!loading && role !== 'admin') router.replace('/auth');
}, [loading, role, router]);

if (loading || role !== 'admin') return <p>Loading...</p>;

return (
  <div className="p-6">
    <h1 className="text-2xl font-bold text-center text-indigo-900 drop-shadow-lg mb-8" style={{ textShadow: '0 2px 8px #a5b4fc, 0 1px 0 #312e81' }}>Admin Dashboard</h1>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
      {/* Card 1: Manage Child Profiles, Caregivers */}
      <div className="card-gradient p-8 rounded-3xl shadow-lg flex flex-col w-full">
        <h2 className="mb-4 text-center">Create and Edit Records</h2>
        <div className="flex flex-wrap justify-center gap-6">
          <a
            href="/admin/children"
            className="rounded-full px-6 py-3 font-medium transition-colors text-white text-center bg-gradient-to-r from-[var(--dark-indigo)] to-indigo-500 hover:from-indigo-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 shadow"
          >
            Manage Child Profiles
          </a>
          <a
            href="/admin/caregivers"
            className="rounded-full px-6 py-3 font-medium transition-colors text-white text-center bg-gradient-to-r from-[var(--dark-indigo)] to-indigo-500 hover:from-indigo-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 shadow"
          >
            Manage Caregivers
          </a>
        </div>
      </div>

      {/* Card 2: Manage Users, Audit Log */}
      <div className="card-gradient p-8 rounded-3xl shadow-lg flex flex-col w-full">
        <h2 className="mb-4 text-center">Manage Users & Audit Logs</h2>
        <div className="flex flex-wrap justify-center gap-6">
          <a
            href="/admin/users"
            className="rounded-full px-6 py-3 font-medium transition-colors text-white text-center bg-gradient-to-r from-[var(--dark-indigo)] to-indigo-500 hover:from-indigo-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 shadow"
          >
            Manage Users
          </a>
          <a
            href="/admin/audit"
            className="rounded-full px-6 py-3 font-medium transition-colors text-white text-center bg-gradient-to-r from-[var(--dark-indigo)] to-indigo-500 hover:from-indigo-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 shadow"
          >
            Activity Audit Log
          </a>
        </div>
      </div>

      {/* Card 3: Caregiver Dashboard, Parent Dashboard */}
      <div className="card-gradient p-8 rounded-3xl shadow-lg flex flex-col w-full">
        <h2 className="mb-4 text-center">View Caregiver and Parent Pages</h2>
        <div className="flex flex-wrap justify-center gap-6">
          <a
            href="/caregiver/dashboard"
            className="rounded-full px-6 py-3 font-medium transition-colors text-white text-center bg-gradient-to-r from-[var(--dark-indigo)] to-indigo-500 hover:from-indigo-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 shadow"
          >
            Caregiver View
          </a>
          <a
            href="/parent/activity-view"
            className="rounded-full px-6 py-3 font-medium transition-colors text-white text-center bg-gradient-to-r from-[var(--dark-indigo)] to-indigo-500 hover:from-indigo-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 shadow"
          >
            Parent View
          </a>
        </div>
      </div>
    </div>
  </div>
);
}