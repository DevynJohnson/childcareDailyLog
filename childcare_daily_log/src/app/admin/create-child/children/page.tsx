// src/app/admin/children/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

type Child = {
  id: string;
  name: string;
  notes: string;
  allergies: string;
  parentEmails: string[];
};

export default function ChildrenAdminPage() {
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const [allergies, setAllergies] = useState('');
  const [parentEmails, setParentEmails] = useState('');
  const [children, setChildren] = useState<Child[]>([]);
  const [user] = useAuthState(auth);
  const router = useRouter();

  const fetchChildren = async () => {
    const snapshot = await getDocs(collection(db, 'children'));
    setChildren(
      snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name || '',
          notes: data.notes || '',
          allergies: data.allergies || '',
          parentEmails: Array.isArray(data.parentEmails) ? data.parentEmails : [],
        };
      })
    );
  };

  useEffect(() => {
    if (!user) return router.push('/'); // Redirect if not logged in
    fetchChildren();
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newChild = {
      name,
      notes,
      allergies,
      parentEmails: parentEmails.split(',').map(email => email.trim()),
    };
    await addDoc(collection(db, 'children'), newChild);
    setName('');
    setNotes('');
    setAllergies('');
    setParentEmails('');
    fetchChildren();
  };

  const handleDelete = async (id: string) => {
    await deleteDoc(doc(db, 'children', id));
    fetchChildren();
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Admin: Manage Children</h1>

      <form onSubmit={handleSubmit} className="space-y-4 mb-8">
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Child Name" className="p-2 border rounded w-full" required />
        <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notes" className="p-2 border rounded w-full" />
        <textarea value={allergies} onChange={e => setAllergies(e.target.value)} placeholder="Allergies" className="p-2 border rounded w-full" />
        <input value={parentEmails} onChange={e => setParentEmails(e.target.value)} placeholder="Parent Emails (comma separated)" className="p-2 border rounded w-full" />
        <button type="submit" className="bg-blue-600 text-white py-2 px-4 rounded">Add Child</button>
      </form>

      <h2 className="text-xl font-semibold mb-2">All Children</h2>
      <ul className="space-y-2">
        {children.map(child => (
          <li key={child.id} className="border p-4 rounded flex justify-between items-start">
            <div>
              <p><strong>Name:</strong> {child.name}</p>
              <p><strong>Notes:</strong> {child.notes}</p>
              <p><strong>Allergies:</strong> {child.allergies}</p>
              <p><strong>Parents:</strong> {child.parentEmails.join(', ')}</p>
            </div>
            <button onClick={() => handleDelete(child.id)} className="text-red-500 hover:underline">Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
