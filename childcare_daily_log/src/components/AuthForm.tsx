'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
} from 'firebase/auth';
import { db } from '@/lib/firebase';
import {
  setDoc,
  doc,
  getDoc,
  deleteDoc,
} from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';

async function registerUser(email: string, password: string) {
  const userCred = await createUserWithEmailAndPassword(auth, email, password);
  const { user } = userCred;

  const inviteSnap = await getDoc(doc(db, 'roleInvites', email));
  let role: 'admin' | 'caregiver' | 'parent' = 'parent';

  if (inviteSnap.exists()) {
    role = inviteSnap.data().role;
    await deleteDoc(inviteSnap.ref);
  } else {
    throw new Error('Registration is restricted. Please contact an administrator for access.');
  }

  await setDoc(doc(db, 'users', user.uid), {
    email: user.email,
    role,
  });

  await sendEmailVerification(user, {
    url: `${window.location.origin}/auth?verified=true`,
  });

  return user;
}

export default function AuthForm() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();
  const { user, role, loading } = useAuth();

  useEffect(() => {
    if (user && role) {
      if (role === 'admin') router.push('/admin/dashboard');
      else if (role === 'caregiver') router.push('/caregiver/dashboard');
      else if (role === 'parent') router.push('/parent/dashboard');
    }
  }, [user, role, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
        alert('Logged in!');
      } else {
        await registerUser(email, password);
        alert('Account created! Check your inbox to verify your email.');
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        alert(err.message);
      } else {
        alert('An unknown error occurred.');
      }
    }
  };

  // 🌀 Show spinner while loading auth state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-10 p-6 border rounded">
      <h2 className="text-xl font-bold mb-4">
        {isLogin ? 'Login' : 'Register'}
      </h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="Email"
          className="p-2 border rounded"
          required
        />
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Password"
          className="p-2 border rounded"
          required
        />
        <button type="submit" className="bg-blue-500 text-white py-2 rounded">
          {isLogin ? 'Login' : 'Register'}
        </button>
      </form>
      <button
        onClick={() => setIsLogin(!isLogin)}
        className="mt-4 text-sm text-gray-600 underline"
      >
        {isLogin ? 'Need an account? Register' : 'Already have an account? Login'}
      </button>
    </div>
  );
}
