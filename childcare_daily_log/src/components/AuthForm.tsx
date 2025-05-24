'use client';

import { useState } from 'react';
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

async function registerUser(email: string, password: string) {
  const userCred = await createUserWithEmailAndPassword(auth, email, password);
  const { user } = userCred;

  const inviteSnap = await getDoc(doc(db, 'roleInvites', email));
  let role: 'admin' | 'caregiver' | 'parent' = 'parent';

  if (inviteSnap.exists()) {
    role = inviteSnap.data().role;
    await deleteDoc(inviteSnap.ref);
  } else {
    throw new Error('Registration is restricted. Please contact an administrator.');
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
  const [confirmEmail, setConfirmEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const validatePassword = (pwd: string) => {
    return {
      length: pwd.length >= 8,
      uppercase: /[A-Z]/.test(pwd),
      lowercase: /[a-z]/.test(pwd),
      number: /[0-9]/.test(pwd),
      special: /[!@#$%^&*()_+{}\[\]:;<>,.?~\\/-]/.test(pwd),
    };
  };

  const passwordChecks = validatePassword(password);
  const isPasswordValid = Object.values(passwordChecks).every(Boolean);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isLogin) {
      if (email !== confirmEmail) return setError('Emails do not match.');
      if (password !== confirmPassword) return setError('Passwords do not match.');
      if (!isPasswordValid) return setError('Password does not meet requirements.');
    }

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
        alert('Logged in!');
      } else {
        await registerUser(email, password);
        alert('Account created! Check your inbox to verify your email.');
        setIsLogin(true);
      }
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
      else setError('An unknown error occurred.');
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
        {!isLogin && (
          <input
            type="email"
            value={confirmEmail}
            onChange={e => setConfirmEmail(e.target.value)}
            placeholder="Confirm Email"
            className="p-2 border rounded"
            required
          />
        )}
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Password"
          className="p-2 border rounded"
          required
        />
        {!isLogin && (
          <>
            <input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Confirm Password"
              className="p-2 border rounded"
              required
            />
            <div className="text-sm text-gray-700 space-y-1">
              <p className={passwordChecks.length ? 'text-green-600' : 'text-red-500'}>
                • At least 8 characters
              </p>
              <p className={passwordChecks.uppercase ? 'text-green-600' : 'text-red-500'}>
                • At least 1 uppercase letter
              </p>
              <p className={passwordChecks.lowercase ? 'text-green-600' : 'text-red-500'}>
                • At least 1 lowercase letter
              </p>
              <p className={passwordChecks.number ? 'text-green-600' : 'text-red-500'}>
                • At least 1 number
              </p>
              <p className={passwordChecks.special ? 'text-green-600' : 'text-red-500'}>
                • At least 1 special character
              </p>
            </div>
          </>
        )}
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button type="submit" className="bg-blue-500 text-white py-2 rounded">
          {isLogin ? 'Login' : 'Register'}
        </button>
      </form>
      <button
        onClick={() => {
          setIsLogin(!isLogin);
          setError('');
        }}
        className="mt-4 text-sm text-gray-600 underline"
      >
        {isLogin ? 'Need an account? Register' : 'Already have an account? Login'}
      </button>
    </div>
  );
}
