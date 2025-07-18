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
  caregiverInfo: CaregiverInfo | null;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  loading: true,
  caregiverInfo: null,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  if (typeof window !== 'undefined') {
    console.log('[AuthProvider] mounted');
  }
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);
  const [caregiverInfo, setCaregiverInfo] = useState<CaregiverInfo | null>(null);

  // 🔁 Load role override from localStorage on mount
  // No-op: role override logic removed
  useEffect(() => {}, []);

  // 🧠 Track auth state
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('[AuthContext] onAuthStateChanged called. firebaseUser:', firebaseUser);
      setUser(firebaseUser);

      if (!firebaseUser) {
        setRole(null);
        setCaregiverInfo(null);
        setLoading(false);
        return;
      }

      let resolvedRole: Role | null = null;
      let resolvedCaregiverInfo: CaregiverInfo | null = null;

      console.log('[AuthContext] Fetching Firestore user doc for UID:', firebaseUser.uid);
      const snap = await getDoc(doc(db, 'users', firebaseUser.uid));
      const docData = snap.data();
      console.log('[AuthContext] Firestore user doc exists:', snap.exists(), 'data:', docData, 'user:', firebaseUser.email);
      if (snap.exists() && docData) {
        console.log('[AuthContext] Firestore user doc fields:', Object.keys(docData));
        const data = docData;
        resolvedRole = data.role;
        console.log('[AuthContext] Set role:', data.role, 'user:', firebaseUser.email);

        // Only require email verification for caregivers and parents
        if ((data.role === 'caregiver' || data.role === 'parent') && !firebaseUser.emailVerified) {
          resolvedRole = null;
          resolvedCaregiverInfo = null;
          setRole(null);
          setCaregiverInfo(null);
          return;
        }

        // If user is a caregiver, fetch their profile info
        if (data.role === 'caregiver') {
          const caregiverSnap = await getDoc(doc(db, 'caregivers', firebaseUser.uid));
          if (caregiverSnap.exists()) {
            resolvedCaregiverInfo = caregiverSnap.data() as CaregiverInfo;
          }
        }
      } else if (snap.exists() && !docData) {
        console.error('[AuthContext] Firestore user doc is empty for UID:', firebaseUser.uid);
      }

      setRole(resolvedRole);
      setCaregiverInfo(resolvedCaregiverInfo);
    });

    return () => unsubscribeAuth();
  }, []);

  // Only set loading to false when user is null (logged out) or role is set (logged in and role loaded)
  useEffect(() => {
    if (user === null || role !== null) {
      setLoading(false);
    } else {
      setLoading(true);
    }
  }, [user, role]);

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        loading,
        caregiverInfo,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}