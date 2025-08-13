// src/components/navbars/AdminNavBar.tsx
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import BaseNavBar from "./BaseNavbar";
import styles from "../NavBar.module.css";

export default function AdminNavBar() {
  const router = useRouter();

  const navLinks = (
    <Link href="/admin/dashboard" className={styles.navLink}>
      Admin Dashboard
    </Link>
  );

  const logoutButton = (
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
  );

  return (
    <BaseNavBar
      dashboardHref="/admin/dashboard"
      navLinks={navLinks}
      authButton={logoutButton}
    />
  );
}