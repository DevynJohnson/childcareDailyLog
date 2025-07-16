import { useState } from 'react';
import { getInviteByEmail, markInviteUsed } from '@/lib/inviteService';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { createUserProfile } from '@/lib/userService';
import { addParentEmailToChildren } from '@/lib/childService';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [invite, setInvite] = useState<any>(null);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'email' | 'register' | 'done'>('email');

  // Simulate registration (replace with real auth logic)
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');

  const handleCheckInvite = async () => {
    setError('');
    const inv = await getInviteByEmail(email.trim().toLowerCase());
    if (!inv || inv.used) {
      setError('No valid invite found for this email.');
      return;
    }
    setInvite(inv);
    setStep('register');
  };

  const handleRegister = async () => {
    try {
      // 1. Create user in Firebase Auth
      const userCred = await createUserWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
      const uid = userCred.user.uid;
      // 2. Create user profile in Firestore
      await createUserProfile({
        uid,
        email: email.trim().toLowerCase(),
        role: invite.role,
        name,
      });
      // 3. If parent, add email to child(ren)
      if (invite.role === 'parent' && Array.isArray(invite.childIds)) {
        await addParentEmailToChildren(invite.childIds, email.trim().toLowerCase());
      }
      // 4. Mark invite as used
      await markInviteUsed(email.trim().toLowerCase(), uid);
      setStep('done');
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
    }
  };

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Register</h1>
      {step === 'email' && (
        <div className="space-y-2">
          <Input
            placeholder="Enter your invite email"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
          <Button onClick={handleCheckInvite} disabled={!email}>
            Check Invite
          </Button>
          {error && <div className="text-red-600">{error}</div>}
        </div>
      )}
      {step === 'register' && invite && (
        <div className="space-y-2">
          <div>Invite found for <b>{invite.role}</b>{invite.childIds ? ` (Child IDs: ${invite.childIds.join(', ')})` : ''}</div>
          <Input
            placeholder="Name"
            value={name}
            onChange={e => setName(e.target.value)}
          />
          <Input
            placeholder="Password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
          <Button onClick={handleRegister} disabled={!name || !password}>
            Register
          </Button>
        </div>
      )}
      {step === 'done' && (
        <div className="text-green-600 font-semibold">Registration complete! You may now log in.</div>
      )}
    </div>
  );
}
