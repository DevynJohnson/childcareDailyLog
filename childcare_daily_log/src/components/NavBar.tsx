// src/components/NavBar.tsx
"use client";


import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Menu, X } from "lucide-react";

import styles from "./NavBar.module.css";



export default function NavBar() {
  const { user, role, loading } = useAuth();
  console.log('NavBar render - user:', !!user, 'role:', role, 'loading:', loading);
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  


  // Navigation links
  // Modal state for admin grouped links (always declare hooks)

  // Non-admin nav links

  let navLinks = null;
  if (user && role === "admin") {
    navLinks = (
      <Link href="/admin/dashboard" className={styles.navLink}>
        Admin Dashboard
      </Link>
    );
  } else if (user && role === "caregiver") {
    navLinks = (
      <Link href="/caregiver/dashboard" className={styles.navLink}>
        Caregiver Dashboard
      </Link>
    );
  } else if (user && role === "parent") {
    navLinks = (
      <>
        <Link href="/parent/dashboard" className={styles.navLink}>
          Dashboard
        </Link>
        <Link href="/parent/activity-view" className={styles.navLink}>
          Activity Log
        </Link>
        <Link href="/parent/update-us" className={styles.navLink}>
          Update Us
        </Link>
      </>
    );
  }

  // Determine dashboard link based on role
  let dashboardHref = "/";
  if (role === "admin") dashboardHref = "/admin/dashboard";
  else if (role === "caregiver") dashboardHref = "/caregiver/dashboard";
  else if (role === "parent") dashboardHref = "/parent/dashboard";

  return (
    <nav className={styles.navBarContainer}>
      <div className={styles.navHeader}>
        <Link href={dashboardHref} className={styles.navHeader}>
          Childcare Daily Log
        </Link>
      </div>

      {/* Desktop links */}
      <div className={styles.desktopLinks}>
        <div className={styles.navLinksGroup}>
          {navLinks}
        </div>
        <div className={styles.logoutContainer}>
          {user ? (
            <button
              onClick={async () => {
                localStorage.removeItem("roleOverride");
                await signOut(auth);
                router.push("/auth");
              }}
              className={styles.logoutButton}
            >
              Logout
            </button>
          ) : (
            <button
              type="button"
              onClick={() => router.push("/auth")}
              className={styles.navLoginButton}
            >
              Login
            </button>
          )}
        </div>
      </div>

      {/* Hamburger menu for mobile */}
      <div className={`${styles.mobileMenuButton} ${styles.mobileOnly}`}>
        <button
          className="p-2 rounded focus:outline-none focus:ring-2 focus:ring-indigo-400"
          onClick={() => setMenuOpen((open) => !open)}
          aria-label="Open menu"
        >
          {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
        {menuOpen && (
          <div className={styles.mobileMenu}>
            {navLinks}
            <div style={{ textShadow: '0 0 1px #000' }} className="flex flex-col items-end text-right text-indigo-900">
              {user ? (
                <button
                  onClick={async () => {
                    setMenuOpen(false);
                    localStorage.removeItem("roleOverride");
                    await signOut(auth);
                    router.push("/auth");
                  }}
                  className={styles.logoutButton}
                >
                  Logout
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => { setMenuOpen(false); router.push("/auth"); }}
                  className={styles.navLoginButton}
                >
                  Login
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
