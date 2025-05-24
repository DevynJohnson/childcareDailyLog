'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

interface Child {
  id: string;
  name: string;
  notes?: string;
  allergies?: string;
  parentEmails: string[];
}

export default function CaregiverChildrenPage() {
  const { user, role, loading } = useAuth();
  const router = useRouter();
  const [children, setChildren] = useState<Child[]>([]);

  useEffect(() => {
    if (!loading && role !== 'caregiver' && role !== 'admin') {
      router.replace('/');
    }
  }, [loading, role, router]);

  useEffect(() => {
    if (loading || (!user || (role !== 'caregiver' && role !== 'admin'))) return;
    (async () => {
      const snap = await getDocs(collection(db, 'children'));
      setChildren(
        snap.docs.map(d => ({ ...(d.data() as Child), id: d.id }))
      );
    })();
  }, [user, role, loading]);

  if (loading) return <p>Loading…</p>;

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">All Children</h1>
      <ul className="space-y-4">
        {children.map(c => (
          <li key={c.id} className="border p-4 rounded">
            <h2 className="text-lg font-semibold">{c.name}</h2>
            <p><strong>Notes:</strong> {c.notes}</p>
            <p><strong>Allergies:</strong> {c.allergies}</p>
            <p><strong>Parents:</strong> {c.parentEmails.join(', ')}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
