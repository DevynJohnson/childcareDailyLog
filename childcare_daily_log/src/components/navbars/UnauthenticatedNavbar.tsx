// src/components/navbars/UnauthenticatedNavBar.tsx
"use client";

import { useRouter } from "next/navigation";
import BaseNavBar from "./BaseNavbar";
import styles from "../NavBar.module.css";

export default function UnauthenticatedNavBar() {
  const router = useRouter();

  const loginButton = (
    <button
      type="button"
      onClick={() => router.push("/auth")}
      className={styles.navLoginButton}
    >
      Login
    </button>
  );

  return (
    <BaseNavBar
      dashboardHref="/"
      authButton={loginButton}
    />
  );
}