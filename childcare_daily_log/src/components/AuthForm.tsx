'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
} from 'firebase/auth';
  const handleForgotPassword = async () => {
    if (!email) {
      showError("Please enter your email address first.");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      showSuccess("Password reset email sent! Check your inbox.");
    } catch (err) {
      showError("Failed to send password reset email. Please check the email address.");
    }
  };
import { db } from '@/lib/firebase';
import {
  setDoc,
  doc,
  getDoc,
  deleteDoc,
} from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';
import { Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react';
import { showSuccess, showError } from '@/lib/toastUtils';

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
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [passwordValidations, setPasswordValidations] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    specialChar: false,
  });

  const router = useRouter();
  const { user, role, loading } = useAuth();

  useEffect(() => {
    if (user && role) {
      if (role === 'admin') router.push('/admin/dashboard');
      else if (role === 'caregiver') router.push('/caregiver/dashboard');
      else if (role === 'parent') router.push('/parent/dashboard');
    }
  }, [user, role, router]);

  useEffect(() => {
    setPasswordValidations({
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      specialChar: /[^A-Za-z0-9]/.test(password),
    });
  }, [password]);

  const isPasswordValid = Object.values(passwordValidations).every(Boolean);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!isLogin && !isPasswordValid) {
        showError('Password must meet all the listed requirements.');
        return;
      }

      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
        showSuccess('Logged in!');
      } else {
        await registerUser(email, password);
        showSuccess('Account created! Check your inbox to verify your email.');
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        // Handle Firebase auth errors for user-friendly messages
        const msg = err.message;
        if (
          msg.includes('auth/invalid-credential') ||
          msg.includes('auth/wrong-password') ||
          msg.includes('auth/user-not-found')
        ) {
          showError('Your username or password is incorrect. Please try again.');
        } else if (
          msg.includes('auth/too-many-requests')
        ) {
          showError('Too many login attempts. Please wait a moment and try again.');
        } else if (
          msg.includes('auth/email-already-in-use')
        ) {
          showError('This email is already registered. Please log in or use a different email.');
        } else if (
          msg.includes('auth/invalid-email')
        ) {
          showError('Please enter a valid email address.');
        } else if (
          msg.includes('Registration is restricted')
        ) {
          showError('Registration is restricted. Please contact an administrator for access.');
        } else {
          showError('Oops! Something went wrong, please try again.');
        }
      } else {
        showError('Oops! Something went wrong, please try again.');
      }
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      showError("Please enter your email address first.");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      showSuccess("Password reset email sent! Check your inbox.");
    } catch {
      showError("Failed to send password reset email. Please check the email address.");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-blue-500"></div>
      </div>
    );
  }

  const getIcon = (condition: boolean) =>
    condition ? <CheckCircle className="text-green-600 w-4 h-4" /> : <XCircle className="text-red-600 w-4 h-4" />;

  return (
    <div className="max-w-md mx-auto mt-10 p-6 border rounded shadow-md bg-white">
      <h2 className="text-xl text-center font-bold mb-4">{isLogin ? 'Log In' : 'Register'}</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="Email"
          className="p-2 border rounded"
          required
        />

        <div className="relative">
          <input
            type={passwordVisible ? 'text' : 'password'}
            value={password}
            onChange={e => {
              setPassword(e.target.value);
              setPasswordTouched(true);
            }}
            placeholder="Password"
            className="p-2 border rounded w-full pr-10"
            required
          />
          <button
            type="button"
            onClick={() => setPasswordVisible(!passwordVisible)}
            className="absolute right-2 top-2 text-gray-500"
            aria-label="Toggle password visibility"
          >
            {passwordVisible ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>

        {!isLogin && passwordTouched && (
          <div className="text-sm bg-gray-50 p-3 rounded-md border space-y-1">
            <div className="flex items-center gap-2">
              {getIcon(passwordValidations.length)}
              <span>At least 8 characters</span>
            </div>
            <div className="flex items-center gap-2">
              {getIcon(passwordValidations.uppercase)}
              <span>At least 1 uppercase letter</span>
            </div>
            <div className="flex items-center gap-2">
              {getIcon(passwordValidations.lowercase)}
              <span>At least 1 lowercase letter</span>
            </div>
            <div className="flex items-center gap-2">
              {getIcon(passwordValidations.specialChar)}
              <span>At least 1 special character</span>
            </div>
          </div>
        )}

        <button
          type="submit"
          className="rounded-full px-6 py-3 font-medium transition-colors text-white text-center bg-gradient-to-r from-[#479132] to-[#6fcf97] hover:from-green-700 hover:to-green-500 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 shadow mt-2 w-full"
        >
          {isLogin ? 'Login' : 'Register'}
        </button>
      </form>
      <button
        type="button"
        onClick={handleForgotPassword}
        className="rounded-full px-6 py-3 font-medium transition-colors text-white text-center bg-gradient-to-r from-[var(--dark-indigo)] to-indigo-500 hover:from-indigo-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 shadow mt-2 w-full"
      >
        Forgot Password?
      </button>
      <div className="mt-4 text-sm text-gray-600 text-center">
        This platform is available by invite only. Please contact the administrator to request access.
      </div>
    </div>
  );
}
