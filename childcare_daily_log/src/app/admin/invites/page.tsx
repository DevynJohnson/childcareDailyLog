'use client';

import { useEffect, useState } from 'react';
import { createInvite, getAllInvites } from '@/lib/inviteService';
import { getUsersByRole } from '@/lib/userQueryService';
import { collection, getDocs } from 'firebase/firestore';
import { Invite } from '@/types/invite';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { getDoc, doc } from 'firebase/firestore';

type UserRow = {
  email: string;
  name: string;
  registered: boolean;
};

export default function InvitesPage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [parents, setParents] = useState<UserRow[]>([]);
  const [caregivers, setCaregivers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'parent' | 'caregiver'>('parent');
  const [childIds, setChildIds] = useState('');
  const [currentUser, setCurrentUser] = useState(null);

  const router = useRouter();

  // Authentication and authorization check
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('Auth state changed:', user ? 'User logged in' : 'No user');
      
      if (!user) {
        console.log('No user, redirecting to auth');
        router.replace('/auth');
        setAuthChecked(true);
        return;
      }

      setCurrentUser(user);
      
      try {
        console.log('Checking user role for:', user.uid);
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        
        if (!userDoc.exists()) {
          console.log('User document does not exist');
          setError('User profile not found. Please contact support.');
          router.replace('/');
          setAuthChecked(true);
          return;
        }

        const userData = userDoc.data();
        console.log('User data:', userData);
        
        if (userData.role !== 'admin') {
          console.log('User is not admin, role:', userData.role);
          setError('Access denied. Admin privileges required.');
          router.replace('/');
          setAuthChecked(true);
          return;
        }

        console.log('User is admin, setting permissions');
        setIsAdmin(true);
        setAuthChecked(true);
      } catch (error) {
        console.error('Error checking user role:', error);
        setError('Error verifying permissions. Please try again.');
        setAuthChecked(true);
      }
    });

    return () => unsubscribe();
  }, [router]);

  // Load data when admin is confirmed
  useEffect(() => {
    if (!isAdmin || !authChecked || !currentUser) {
      return;
    }

    const loadData = async () => {
      try {
        console.log('Loading invites and users data');
        
        // Load invites
        const invitesData = await getAllInvites();
        setInvites(invitesData);
        
        // Load caregivers
        const caregiversData = await getUsersByRole('caregiver');
        setCaregivers(caregiversData.map(u => ({ 
          email: u.email, 
          name: u.name, 
          registered: true 
        })));

        // Load parents from children collection
        const snapshot = await getDocs(collection(db, 'children'));
        const allParents: { email: string; name: string }[] = [];
        
        snapshot.docs.forEach(docSnap => {
          const data = docSnap.data();
          if (Array.isArray(data.parents)) {
            data.parents.forEach((parent: any) => {
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

        // Check registration status
        const registeredParents = await getUsersByRole('parent');
        setParents(
          uniqueParents.map(parent => ({
            email: parent.email,
            name: parent.name,
            registered: registeredParents.some(u => u.email === parent.email),
          }))
        );

      } catch (error) {
        console.error('Error loading data:', error);
        setError('Failed to load data. Please refresh the page.');
      }
    };

    loadData();
  }, [isAdmin, authChecked, currentUser, success]);

  const handleInvite = async () => {
    if (!currentUser) {
      setError('Not authenticated');
      return;
    }

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
    } catch (error) {
      console.error('Error sending invite:', error);
      setError('Failed to send invite. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const findInvite = (email: string, role: 'parent' | 'caregiver') => 
    invites.find(i => i.email === email && i.role === role);

  const handleSendInvite = async (email: string, role: 'parent' | 'caregiver') => {
    if (!currentUser) {
      setError('Not authenticated');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      await createInvite({ email, role });
      setSuccess('Invite sent!');
    } catch (error) {
      console.error('Error sending invite:', error);
      setError('Failed to send invite. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!authChecked) {
    return (
      <div className="p-6 text-center">
        <div>Checking admin permissions...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="p-6 text-center">
        <div className="text-red-600 mb-4">
          {error || 'Access denied. Admin privileges required.'}
        </div>
        <Button onClick={() => router.push('/')}>
          Return to Home
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-center text-indigo-900 drop-shadow-lg mb-8" 
          style={{ textShadow: '0 2px 8px #a5b4fc, 0 1px 0 #312e81' }}>
        User Registration & Invites
      </h1>
      
      {error && <div className="text-red-600 mb-2 p-2 bg-red-50 rounded">{error}</div>}
      {success && <div className="text-green-600 mb-2 p-2 bg-green-50 rounded">{success}</div>}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-20">
        {/* Caregivers Table */}
        <div className="card-gradient p-8 rounded-lg shadow-md min-w-[480px]">
          <h2 className="text-2xl font-bold text-center text-indigo-900 drop-shadow-lg mb-6" 
              style={{ textShadow: '0 2px 8px #a5b4fc, 0 1px 0 #312e81' }}>
            Caregivers
          </h2>
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
          <h2 className="text-2xl font-bold text-center text-indigo-900 drop-shadow-lg mb-6" 
              style={{ textShadow: '0 2px 8px #a5b4fc, 0 1px 0 #312e81' }}>
            Parents
          </h2>
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