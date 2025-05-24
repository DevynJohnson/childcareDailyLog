'use client';

import { useEffect, useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

type Child = {
  id: string;
  name: string;
  notes?: string;
  allergies?: string;
  // Add other fields as needed
};

export default function ParentChildrenPage() {
  const { user, role, loading } = useAuth();
  const router = useRouter();
  const [children, setChildren] = useState<Child[]>([]);

  useEffect(() => {
    if (!loading && role !== 'parent' && role !== 'admin') {
      router.replace('/');
    }
  }, [loading, role, router]);

  useEffect(() => {
    if (loading || !user) return;
    (async () => {
      // Only fetch children where this user's email is in parentEmails
      const q = query(
        collection(db, 'children'),
        where('parentEmails', 'array-contains', user.email)
      );
      const snap = await getDocs(q);
      setChildren(snap.docs.map(d => ({ ...(d.data() as Child), id: d.id })));
    })();
  }, [user, loading]);

  if (loading) return <p>Loading…</p>;

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">My Children</h1>
      {children.length === 0 ? (
        <p>No children assigned to your account.</p>
      ) : (
        <ul className="space-y-4">
          {children.map(c => (
            <li key={c.id} className="border p-4 rounded">
              <h2 className="text-lg font-semibold">{c.name}</h2>
              <p><strong>Notes:</strong> {c.notes}</p>
              <p><strong>Allergies:</strong> {c.allergies}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
