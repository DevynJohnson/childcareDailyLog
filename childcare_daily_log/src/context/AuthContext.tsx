'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '@/lib/firebase';
import {
  onAuthStateChanged,
  type User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

type Role = 'admin' | 'caregiver' | 'parent';

interface AuthContextType {
  user: FirebaseUser | null;
  role: Role | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  loading: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen for auth state changes
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        if(!firebaseUser.emailVerified) {
        // fetch the role from /users/{uid}
        const snap = await getDoc(doc(db, 'users', firebaseUser.uid));
        setRole(snap.exists() ? (snap.data().role as Role) : null);
      } else {
        setRole(null);
      }
      setLoading(false);
    };
    });
    return () => unsubscribeAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ user, role, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook for convenience
export function useAuth() {
  return useContext(AuthContext);
}
