// src/components/NavBar.tsx
"use client";


import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import "../app/globals.css";



export default function NavBar() {
  const { user, role, loading } = useAuth();
  const router = useRouter();



  if (loading) return null;



  return (
    <nav
      className="shadow p-4 flex justify-between items-center rounded-3xl"
      style={{
        background: 'linear-gradient(90deg, #479132 0%, #6fcf97 100%)',
        boxShadow: '0 12px 36px 0 rgba(76,175,80,0.45), 0 4px 16px 0 rgba(0,0,0,0.18)',
        zIndex: 10,
        borderRadius: '2rem',
        margin: '1.5rem auto',
        width: 'calc(100% - 1rem)',
        maxWidth: '1500px',
      }}
    >
      <div className="text-indigo-900 flex items-center gap-8" style={{ textShadow: '0 2px 8px #a5b4fc, 0 1px 0 #312e81' }}>
        <Link href="/" className="nav-header text-xl font-bold">
          Childcare Daily Log
        </Link>

        {user && (
          <>
            {role === "admin" && (
              <>
                <Link href="/admin/dashboard" className="font-semibold hover:text-white hover:bg-[#0f005e] rounded px-2 py-1 transition-colors">
                  Admin Dashboard
                </Link>
              </>
            )}
            {(role === "caregiver" || role === "admin") && (
              <Link href="/caregiver/dashboard" className="font-semibold hover:text-white hover:bg-[#0f005e] rounded px-2 py-1 transition-colors">
                Caregiver Dashboard
              </Link>
            )}
            {(role === "parent" || role === "admin") && (
              <Link href="/parent/dashboard" className="font-semibold hover:text-white hover:bg-[#0f005e] rounded px-2 py-1 transition-colors">
                Parent/Guardian Dashboard
              </Link>
            )}
          </>
        )}
      </div>

      {/* Removed superuser role override select */}

      <div className="flex flex-col items-end text-right text-indigo-900" style={{ textShadow: '0 0 1px #000' }}>
        {user ? (
          <>
            <button
              onClick={async () => {
                localStorage.removeItem("roleOverride");
                await signOut(auth);
                router.push("/auth");
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
