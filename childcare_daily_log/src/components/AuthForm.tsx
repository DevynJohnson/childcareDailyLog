// src/components/AuthForm.tsx
'use client';

import { useState } from 'react';
import { auth } from '@/lib/firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword, sendEmailVerification,
} from 'firebase/auth';
import { db } from '@/lib/firebase';
import { setDoc, doc } from 'firebase/firestore';

export default function AuthForm() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'caregiver' | 'parent'>('caregiver');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
        alert('Logged in!');
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Save user role to Firestore
        await setDoc(doc(db, 'users', user.uid), {
          email: user.email,
          role: role,
        });

      // Send verification email
      await sendEmailVerification(user, {
        url: `${window.location.origin}/auth?verified=true`,
      });

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
        {!isLogin && (
          <select
            value={role}
            onChange={e => setRole(e.target.value as 'caregiver' | 'parent')}
            className="p-2 border rounded"
          >
            <option value="caregiver">Caregiver</option>
            <option value="parent">Parent</option>
            <option value="admin">Admin</option>
          </select>
        )}
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
