// src/components/navbars/BaseNavBar.tsx
"use client";

import Link from "next/link";
import { useState, ReactNode } from "react";
import { Menu, X } from "lucide-react";
import styles from "../NavBar.module.css";

interface BaseNavBarProps {
  dashboardHref: string;
  navLinks?: ReactNode;
  authButton: ReactNode;
}

export default function BaseNavBar({ 
  dashboardHref, 
  navLinks, 
  authButton 
}: BaseNavBarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className={styles.navBarContainer}>
      <div className={styles.navHeader}>
        <Link href={dashboardHref} className={styles.navHeader}>
          Childcare Daily Log
        </Link>
      </div>

      {/* Navigation Links - hidden on mobile, shown on desktop */}
      <div className={styles.navLinksGroup}>
        {navLinks}
      </div>

      {/* Auth Button - always visible */}
      <div className={styles.authButtonContainer}>
        {authButton}
      </div>

      {/* Mobile Menu Toggle - only visible on mobile */}
      <button
        className={styles.mobileMenuToggle}
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        aria-label="Toggle mobile menu"
        aria-expanded={mobileMenuOpen}
      >
        {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Mobile Menu - conditionally shown based on state and CSS */}
      <div className={`${styles.mobileMenu} ${mobileMenuOpen ? styles.mobileMenuOpen : ''}`}>
        <div className={styles.mobileNavLinks}>
          {navLinks}
        </div>
        <div className={styles.mobileAuthButton}>
          <div onClick={() => setMobileMenuOpen(false)}>
            {authButton}
          </div>
        </div>
      </div>

      {/* Overlay for mobile menu */}
      {mobileMenuOpen && (
        <div 
          className={styles.mobileMenuOverlay}
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
    </nav>
  );
}