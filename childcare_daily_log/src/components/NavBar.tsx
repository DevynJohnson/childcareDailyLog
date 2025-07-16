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
    <nav className="shadow p-4 flex justify-between items-center" style={{ background: '#479132' }}>
      <div className="flex items-center gap-8 text-indigo-900" style={{ textShadow: '0 2px 8px #a5b4fc, 0 1px 0 #312e81' }}>
        <Link href="/" className="text-xl font-bold">
          ChildCareApp
        </Link>

        {user && (
          <>
            {role === "admin" && (
              <>
                <Link href="/admin/dashboard" className="font-semibold hover:text-white hover:bg-[#312e81] rounded px-2 py-1 transition-colors">
                  Admin Dashboard
                </Link>
              </>
            )}
            {(role === "caregiver" || role === "admin") && (
              <Link href="/caregiver/dashboard" className="font-semibold hover:text-white hover:bg-[#312e81] rounded px-2 py-1 transition-colors">
                Caregiver Dashboard
              </Link>
            )}
            {(role === "parent" || role === "admin") && (
              <Link href="/parent/dashboard" className="font-semibold hover:text-white hover:bg-[#312e81] rounded px-2 py-1 transition-colors">
                Parent/Guardian Dashboard
              </Link>
            )}
          </>
        )}
      </div>

      {/* <div className="flex items-center space-x-4 text-indigo-900" style={{ textShadow: '0 2px 8px #a5b4fc, 0 1px 0 #312e81' }}>
        {isSuperuser && (
          <select
            onChange={handleRoleChange}
            value={role ?? ""}
            className="border rounded px-2 py-1 bg-white text-indigo-900 shadow"
          >
            <option value="admin">View as Admin</option>
            <option value="caregiver">View as Caregiver</option>
            <option value="parent">View as Parent/Guardian</option>
          </select>
        )}
      </div> */}

      <div className="flex flex-col items-end text-right text-indigo-900" style={{ textShadow: '0 2px 8px #a5b4fc, 0 1px 0 #312e81' }}>
        {user ? (
          <>
            <button
              onClick={async () => {
                localStorage.removeItem("roleOverride");
                await signOut(auth);
              }}
              className="text-red-500 hover:text-white hover:bg-red-600 transition-colors rounded px-2 py-1"
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
