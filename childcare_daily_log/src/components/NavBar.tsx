// src/components/NavBar.tsx
"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function NavBar() {
  const { user, role, loading, isSuperuser, setRoleOverride } = useAuth();

  if (loading) return null;

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setRoleOverride(e.target.value as "admin" | "caregiver" | "parent");
  };

  return (
    <nav className="bg-dark shadow p-4 flex justify-between items-center">
      <div className="flex items-center space-x-4">
        <Link href="/" className="text-xl font-bold">
          ChildCareApp
        </Link>

        {user && (
          <>
            {role === "admin" && (
              <>
                <Link href="/admin/dashboard" className="hover:underline">
                  Admin Dashboard
                </Link>
                <Link href="/admin/children" className="hover:underline">
                  Manage Children
                </Link>
                <Link href="/admin/invites" className="hover:underline">
                  Invites
                </Link>
              </>
            )}
            {(role === "caregiver" || role === "admin") && (
              <Link href="/caregiver/dashboard" className="hover:underline">
                Caregiver Dashboard
              </Link>
            )}
            {(role === "parent" || role === "admin") && (
              <Link href="/parent/dashboard" className="hover:underline">
                Parent/Guardian Dashboard
              </Link>
            )}
          </>
        )}
      </div>

      <div className="flex items-center space-x-4">
        {isSuperuser && (
          <select
            onChange={handleRoleChange}
            value={role ?? ""}
            className="border rounded px-2 py-1"
          >
            <option value="admin">View as Admin</option>
            <option value="caregiver">View as Caregiver</option>
            <option value="parent">View as Parent/Guardian</option>
          </select>
        )}
      </div>

      <div className="flex flex-col items-end text-right">
        {user ? (
          <>
            <p className="text-sm text-gray-600 mb-1">
              {user.email} signed in as{" "}
              <span className="font-semibold">{role}</span>
            </p>
            <button
              onClick={async () => {
                localStorage.removeItem("roleOverride");
                await signOut(auth);
              }}
              className="text-red-500"
            >
              Logout
            </button>
          </>
        ) : (
          <Link href="/auth" className="hover:underline">
            Login
          </Link>
        )}
      </div>
    </nav>
  );
}
