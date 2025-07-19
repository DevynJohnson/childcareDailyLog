// src/app/admin/dashboard/page.tsx
"use client";
import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

export default function AdminDashboardPage() {
  const { role, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && role !== "admin") router.replace("/auth");
  }, [loading, role, router]);

  if (loading || role !== "admin") return <p>Loading...</p>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-center text-indigo-900 drop-shadow-lg mb-8 adminTitle">
        Admin Dashboard
      </h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 max-w-2xl mx-auto">
        <a
          href="/admin/children"
          className="rounded-full px-4 py-2 font-medium transition-colors text-white text-center bg-gradient-to-r from-[var(--abc-green)] to-green-500 hover:from-green-600 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 shadow"
        >
          Manage Child Profiles
        </a>
        <a
          href="/admin/caregivers"
          className="rounded-full px-4 py-2 font-medium transition-colors text-white text-center bg-gradient-to-r from-[var(--abc-green)] to-green-500 hover:from-green-600 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 shadow"
        >
          Manage Caregivers
        </a>
        <a
          href="/admin/audit"
          className="rounded-full px-4 py-2 font-medium transition-colors text-white text-center bg-gradient-to-r from-[var(--abc-green)] to-green-500 hover:from-green-600 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 shadow"
        >
          Activity Audit Log
        </a>
        <a
          href="/admin/users"
          className="rounded-full px-4 py-2 font-medium transition-colors text-white text-center bg-gradient-to-r from-[var(--abc-green)] to-green-500 hover:from-green-600 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 shadow"
        >
          Manage Users
        </a>
      </div>
    </div>
  );
}
