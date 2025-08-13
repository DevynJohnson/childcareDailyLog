// src/components/navbars/ParentNavBar.tsx
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import BaseNavBar from "./BaseNavbar";
import styles from "../NavBar.module.css";

export default function ParentNavBar() {
  const router = useRouter();

  const navLinks = (
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
      dashboardHref="/parent/dashboard"
      navLinks={navLinks}
      authButton={logoutButton}
    />
  );
}