// src/components/NavBar.tsx
"use client";

import { useAuth } from "@/context/AuthContext";
import UnauthenticatedNavBar from "./navbars/UnauthenticatedNavbar";
import AdminNavBar from "./navbars/AdminNavbar";
import CaregiverNavBar from "./navbars/CaregiverNavbar";
import ParentNavBar from "./navbars/ParentNavbar";

export default function NavBar() {
  const { user, role, loading } = useAuth();
  console.log('NavBar render - user:', !!user, 'role:', role, 'loading:', loading);

  // Show loading state or nothing while auth is being determined
  if (loading) {
    return null; // or a loading skeleton
  }

  // Render appropriate navbar based on authentication and role
  if (!user) {
    return <UnauthenticatedNavBar />;
  }

  switch (role) {
    case "admin":
      return <AdminNavBar />;
    case "caregiver":
      return <CaregiverNavBar />;
    case "parent":
      return <ParentNavBar />;
    default:
      return <UnauthenticatedNavBar />;
  }
}