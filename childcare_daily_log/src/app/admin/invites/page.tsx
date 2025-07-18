'use client';

import { useEffect, useState } from 'react';
import { createInvite, getAllInvites } from '@/lib/inviteService';
import { getUsersByRole } from '@/lib/userQueryService';
import { collection, getDocs } from 'firebase/firestore';
import { Invite } from '@/types/invite';
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

  // Add missing state for email, role, and childIds
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'parent' | 'caregiver'>('parent');
  const [childIds, setChildIds] = useState('');

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
      // Fetch all caregivers (registered users)
      getUsersByRole('caregiver').then(users => setCaregivers(users.map(u => ({ email: u.email, name: u.name, registered: true }))));

      // Fetch all parents from children collection
      (async () => {
        const snapshot = await getDocs(collection(db, 'children'));
        const allParents: { email: string; name: string }[] = [];
        type Parent = { email: string; firstName: string; lastName: string };
        snapshot.docs.forEach(docSnap => {
          const data = docSnap.data();
          if (Array.isArray(data.parents)) {
            data.parents.forEach((parent: Parent) => {
              if (parent.email && parent.firstName && parent.lastName) {
                allParents.push({
                  email: parent.email,
                  name: `${parent.firstName} ${parent.lastName}`,
                });
              }
            });
          }
        });
        // Deduplicate by email
        const uniqueParents = Array.from(
          new Map(allParents.map(p => [p.email, p])).values()
        );
        // Check registration status by cross-referencing with users
        const registeredUsers = await getUsersByRole('parent');
        setParents(
          uniqueParents.map(parent => ({
            email: parent.email,
            name: parent.name,
            registered: registeredUsers.some(u => u.email === parent.email),
          }))
        );
      })();
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
    } catch {
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
      <h1 className="text-2xl font-bold text-center text-indigo-900 drop-shadow-lg mb-8" style={{ textShadow: '0 2px 8px #a5b4fc, 0 1px 0 #312e81' }}>User Registration & Invites</h1>
      {error && <div className="text-red-600 mb-2">{error}</div>}
      {success && <div className="text-green-600 mb-2">{success}</div>}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-20">
        {/* Caregivers Table */}
        <div className="card-gradient p-8 rounded-lg shadow-md min-w-[480px]">
          <h2 className="text-2xl font-bold text-center text-indigo-900 drop-shadow-lg mb-6" style={{ textShadow: '0 2px 8px #a5b4fc, 0 1px 0 #312e81' }}>Caregivers</h2>
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
        <div className="card-gradient p-8 rounded-lg shadow-md min-w-[480px]">
          <h2 className="text-2xl font-bold text-center text-indigo-900 drop-shadow-lg mb-6" style={{ textShadow: '0 2px 8px #a5b4fc, 0 1px 0 #312e81' }}>Parents</h2>
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
