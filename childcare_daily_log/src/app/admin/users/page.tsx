"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/firebase"; // Ensure auth is imported for user context

type UserRow = {
  email: string;
  name: string;
  role: 'parent' | 'caregiver';
  registered: boolean;
};

export default function UsersDashboard() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        // Fetch registered users to check registration status
        const userSnap = await getDocs(collection(db, "users"));
        const registeredUsers = userSnap.docs.map(doc => doc.data() as { email: string; role: string });
        
        // Fetch all caregivers from caregivers collection
        const caregiverSnap = await getDocs(collection(db, "caregivers"));
        const caregiversList = caregiverSnap.docs.map(doc => doc.data() as { email: string; firstName?: string; lastName?: string; name?: string });
        
        
        const caregivers = caregiversList.map(u => ({
          email: u.email,
          name: u.firstName && u.lastName 
            ? `${u.firstName} ${u.lastName}`.trim()
            : u.name?.trim() || u.email,
          role: 'caregiver' as const,
          registered: registeredUsers.some(regUser => regUser.email === u.email && regUser.role === 'caregiver'),
        }));

        // Fetch all parents from children collection
        const childSnap = await getDocs(collection(db, "children"));
        const allParents: { email: string; name: string }[] = [];
        
        childSnap.docs.forEach(doc => {
          const data = doc.data();
          if (Array.isArray(data.parents)) {
            data.parents.forEach((parent: { email: string; firstName: string; lastName: string }) => {
              if (parent.email && parent.firstName && parent.lastName) {
                allParents.push({
                  email: parent.email,
                  name: `${parent.firstName} ${parent.lastName}`,
                });
              }
            });
          }
        });
        
        // Deduplicate parents by email
        const uniqueParents = Array.from(new Map(allParents.map(p => [p.email, p])).values());
        
        const parents: UserRow[] = uniqueParents.map(parent => ({
          email: parent.email,
          name: parent.name,
          role: 'parent',
          registered: registeredUsers.some(regUser => regUser.email === parent.email && regUser.role === 'parent'),
        }));

        setUsers([...caregivers, ...parents]);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load users.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [success]);

  const handleSendInvite = async (email: string, role: 'parent' | 'caregiver') => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const inviteRef = doc(db, "invites", email);
      await setDoc(inviteRef, {
        email,
        role,
        timestamp: new Date().toISOString(),
        status: "pending",
      });
      setSuccess(`Invite sent to ${email}`);
    } catch (err) {
      console.error('Error sending invite:', err);
      setError("Failed to send invite.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-center">Users & Registration</h1>
      {error && <div className="text-red-600 mb-2 p-2 bg-red-50 rounded">{error}</div>}
      {success && <div className="text-green-600 mb-2 p-2 bg-green-50 rounded">{success}</div>}
      <div className="card-gradient p-8 rounded-3xl shadow-lg">
        <table className="w-full border text-sm">
          <thead>
            <tr>
              <th className="border px-2 py-1">Name</th>
              <th className="border px-2 py-1">Email</th>
              <th className="border px-2 py-1">Role</th>
              <th className="border px-2 py-1">Registration Status</th>
              <th className="border px-2 py-1">Invite</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.email + user.role}>
                <td className="border px-2 py-1">{user.name}</td>
                <td className="border px-2 py-1">{user.email}</td>
                <td className="border px-2 py-1 capitalize">{user.role}</td>
                <td className="border px-2 py-1">
                  {user.registered ? <span className="text-green-600">Registered</span> : <span className="text-yellow-600">Not Registered</span>}
                </td>
                <td className="border px-2 py-1">
                  {!user.registered && (
                    <Button size="sm" onClick={() => handleSendInvite(user.email, user.role)} disabled={loading}>
                      Send Invite
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}