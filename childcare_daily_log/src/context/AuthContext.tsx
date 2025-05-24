'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

type Role = 'admin' | 'caregiver' | 'parent';

interface AuthContextType {
  user: FirebaseUser | null;
  role: Role | null;
  loading: boolean;
  isSuperuser: boolean;
  setRoleOverride: (newRole: Role) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  loading: true,
  isSuperuser: false,
  setRoleOverride: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [isSuperuser, setIsSuperuser] = useState(false);
  const [loading, setLoading] = useState(true);
  const [roleOverride, setRoleOverrideState] = useState<Role | null>(null);

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
      setUser(firebaseUser);

      if (firebaseUser && firebaseUser.emailVerified) {
        const snap = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (snap.exists()) {
          const data = snap.data();
          setRole(data.role);
          setIsSuperuser(!!data.isSuperuser);
        } else {
          setRole(null);
          setIsSuperuser(false);
        }
      } else {
        setRole(null);
        setIsSuperuser(false);
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
