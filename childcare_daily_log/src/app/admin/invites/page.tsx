'use client';

import { useEffect, useState } from 'react';
import { createInvite, getAllInvites } from '@/lib/inviteService';
import { getUsersByRole } from '@/lib/userQueryService';
import { Invite } from '@/types/invite';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

import { useRouter } from 'next/navigation';
import { useEffect as useAuthEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { getDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

type UserRow = {
  email: string;
  name: string;
  registered: boolean;
};

export default function InvitesPage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  // Debug logging removed, restored to original state
  const [invites, setInvites] = useState<Invite[]>([]);
  const [parents, setParents] = useState<UserRow[]>([]);
  const [caregivers, setCaregivers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const router = useRouter();
  // Secure: Only allow admins
  useAuthEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.replace('/auth');
        setAuthChecked(true);
        return;
      }
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (!userDoc.exists() || userDoc.data().role !== 'admin') {
        router.replace('/');
        setAuthChecked(true);
        return;
      }
      setIsAdmin(true);
      setAuthChecked(true);
    });
    return () => unsubscribe();
  }, [router]);
  useEffect(() => {
    if (isAdmin && authChecked) {
      getAllInvites().then(setInvites);
      // Fetch all parents and caregivers (registered users)
      getUsersByRole('parent').then(users => setParents(users.map(u => ({ email: u.email, name: u.name, registered: true }))));
      getUsersByRole('caregiver').then(users => setCaregivers(users.map(u => ({ email: u.email, name: u.name, registered: true }))));
    }
  }, [isAdmin, authChecked, success]);

  const handleInvite = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await createInvite({
        email: email.trim().toLowerCase(),
        role,
        childIds: role === 'parent' ? childIds.split(',').map(id => id.trim()).filter(Boolean) : undefined,
      });
      setSuccess('Invite sent!');
      setEmail('');
      setChildIds('');
      setRole('parent');
    } catch (e) {
      setError('Failed to send invite.');
    } finally {
      setLoading(false);
    }
  };

  // Helper to check if an invite exists for a given email/role
  const findInvite = (email: string, role: 'parent' | 'caregiver') => invites.find(i => i.email === email && i.role === role);

  // Send invite for a user
  const handleSendInvite = async (email: string, role: 'parent' | 'caregiver') => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await createInvite({ email, role });
      setSuccess('Invite sent!');
    } catch {
      setError('Failed to send invite.');
    } finally {
      setLoading(false);
    }
  };

  if (!authChecked) {
    return <div className="p-6">Checking admin permissions...</div>;
  }
  if (!isAdmin) {
    return null;
  }
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">User Registration & Invites</h1>
      {error && <div className="text-red-600 mb-2">{error}</div>}
      {success && <div className="text-green-600 mb-2">{success}</div>}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Caregivers Table */}
        <div>
          <h2 className="text-xl font-semibold mb-2">Caregivers</h2>
          <table className="w-full border text-sm">
            <thead>
              <tr>
                <th className="border px-2 py-1">Name</th>
                <th className="border px-2 py-1">Email</th>
                <th className="border px-2 py-1">Registration Status</th>
                <th className="border px-2 py-1">Invite</th>
              </tr>
            </thead>
            <tbody>
              {caregivers.map(user => {
                const invite = findInvite(user.email, 'caregiver');
                return (
                  <tr key={user.email}>
                    <td className="border px-2 py-1">{user.name}</td>
                    <td className="border px-2 py-1">{user.email}</td>
                    <td className="border px-2 py-1">{user.registered ? 'Registered' : 'Pending'}</td>
                    <td className="border px-2 py-1">
                      {!user.registered && !invite && (
                        <Button size="sm" onClick={() => handleSendInvite(user.email, 'caregiver')} disabled={loading}>
                          Send Invite
                        </Button>
                      )}
                      {invite && !invite.used && <span className="text-yellow-600">Invite Sent</span>}
                      {invite && invite.used && <span className="text-green-600">Registered</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {/* Parents Table */}
        <div>
          <h2 className="text-xl font-semibold mb-2">Parents</h2>
          <table className="w-full border text-sm">
            <thead>
              <tr>
                <th className="border px-2 py-1">Name</th>
                <th className="border px-2 py-1">Email</th>
                <th className="border px-2 py-1">Registration Status</th>
                <th className="border px-2 py-1">Invite</th>
              </tr>
            </thead>
            <tbody>
              {parents.map(user => {
                const invite = findInvite(user.email, 'parent');
                return (
                  <tr key={user.email}>
                    <td className="border px-2 py-1">{user.name}</td>
                    <td className="border px-2 py-1">{user.email}</td>
                    <td className="border px-2 py-1">{user.registered ? 'Registered' : 'Pending'}</td>
                    <td className="border px-2 py-1">
                      {!user.registered && !invite && (
                        <Button size="sm" onClick={() => handleSendInvite(user.email, 'parent')} disabled={loading}>
                          Send Invite
                        </Button>
                      )}
                      {invite && !invite.used && <span className="text-yellow-600">Invite Sent</span>}
                      {invite && invite.used && <span className="text-green-600">Registered</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
