'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import type { CaregiverInfo } from '@/types/caregiver';

type Role = 'admin' | 'caregiver' | 'parent';

interface AuthContextType {
  user: FirebaseUser | null;
  role: Role | null;
  loading: boolean;
  isSuperuser: boolean;
  caregiverInfo: CaregiverInfo | null;
  setRoleOverride: (newRole: Role) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  loading: true,
  isSuperuser: false,
  caregiverInfo: null,
  setRoleOverride: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  if (typeof window !== 'undefined') {
    console.log('[AuthProvider] mounted');
  }
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [isSuperuser, setIsSuperuser] = useState(false);
  const [loading, setLoading] = useState(true);
  const [roleOverride, setRoleOverrideState] = useState<Role | null>(null);
  const [caregiverInfo, setCaregiverInfo] = useState<CaregiverInfo | null>(null);

  // 🔁 Load role override from localStorage on mount
  useEffect(() => {
    const savedOverride = localStorage.getItem('roleOverride');
    if (savedOverride === 'admin' || savedOverride === 'caregiver' || savedOverride === 'parent') {
      setRoleOverrideState(savedOverride);
    }
  }, []);

  // 🧠 Track auth state
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('[AuthContext] onAuthStateChanged called. firebaseUser:', firebaseUser);
      setUser(firebaseUser);

      if (firebaseUser) {
        console.log('[AuthContext] Fetching Firestore user doc for UID:', firebaseUser.uid);
        const snap = await getDoc(doc(db, 'users', firebaseUser.uid));
        console.log('[AuthContext] Firestore user doc exists:', snap.exists(), 'data:', snap.data(), 'user:', firebaseUser.email);
        if (snap.exists()) {
          const data = snap.data();
          setRole(data.role);
          setIsSuperuser(!!data.isSuperuser);
          console.log('[AuthContext] Set role:', data.role, 'isSuperuser:', !!data.isSuperuser, 'user:', firebaseUser.email);
          // Only require email verification for caregivers and parents
          if ((data.role === 'caregiver' || data.role === 'parent') && !firebaseUser.emailVerified) {
            setRole(null);
            setIsSuperuser(false);
            setCaregiverInfo(null);
            return;
          }
          // If user is a caregiver, fetch their profile info
          if (data.role === 'caregiver') {
            const caregiverSnap = await getDoc(doc(db, 'caregivers', firebaseUser.uid));
            if (caregiverSnap.exists()) {
              setCaregiverInfo(caregiverSnap.data() as CaregiverInfo);
            }
          } else {
            setCaregiverInfo(null);
          }
        } else {
          setRole(null);
          setIsSuperuser(false);
          setCaregiverInfo(null);
        }
      } else {
        setRole(null);
        setIsSuperuser(false);
        setCaregiverInfo(null);
      }

      setLoading(false);
    });

    return () => unsubscribeAuth();
  }, []);

  // 🎯 Define override setter that updates state and localStorage
  const setRoleOverride = (newRole: Role) => {
    setRoleOverrideState(newRole);
    localStorage.setItem('roleOverride', newRole);
  };

  const effectiveRole = isSuperuser && roleOverride ? roleOverride : role;

  return (
    <AuthContext.Provider
      value={{
        user,
        role: effectiveRole,
        loading,
        isSuperuser,
        caregiverInfo,
        setRoleOverride,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
