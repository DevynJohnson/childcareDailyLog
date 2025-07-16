'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner'; // ✅ Import toast

export default function EditChildProfilePage() {
  const { role, loading } = useAuth();
  const router = useRouter();
  const { childId } = useParams<{ childId: string }>();

  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const [allergies, setAllergies] = useState('');
  const [parentEmails, setParentEmails] = useState('');

  // Redirect non-admins
  useEffect(() => {
    if (!loading && role !== 'admin') {
      router.replace('/');
    }
  }, [loading, role, router]);

  // Load the child doc
  useEffect(() => {
    if (!childId) return;
    (async () => {
      try {
        const docRef = doc(db, 'children', childId);
        const snap = await getDoc(docRef);
        if (!snap.exists()) {
          toast.error('Child not found');
          return router.push('/admin/children');
        }
        const data = snap.data() as any;
        setName(data.name);
        setNotes(data.notes);
        setAllergies(data.allergies);
        setParentEmails((data.parentEmails as string[]).join(', '));
      } catch (err) {
        console.error(err);
        toast.error('Failed to load child profile');
      }
    })();
  }, [childId, router]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const emails = parentEmails
        .split(',')
        .map(e => e.trim())
        .filter(Boolean);
      const docRef = doc(db, 'children', childId);
      await updateDoc(docRef, {
        name,
        notes,
        allergies,
        parentEmails: emails,
        updatedAt: new Date(),
      });
      toast.success('Child profile updated');
      router.push('/admin/children');
    } catch (err) {
      console.error('Error updating profile:', err);
      toast.error('Failed to update profile');
    }
  };

  if (loading) return <p>Loading…</p>;

  return (
    <div className="max-w-lg mx-auto mt-10 p-6 border rounded shadow">
      <h1 className="text-2xl font-bold mb-4">Edit Child Profile</h1>
      <form onSubmit={handleSave} className="flex flex-col gap-4">
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Child's Name"
          className="p-2 border rounded"
          required
        />
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Notes"
          className="p-2 border rounded"
        />
        <textarea
          value={allergies}
          onChange={e => setAllergies(e.target.value)}
          placeholder="Allergies"
          className="p-2 border rounded"
        />
        <input
          value={parentEmails}
          onChange={e => setParentEmails(e.target.value)}
          placeholder="Parent Emails (comma separated)"
          className="p-2 border rounded"
        />
        <div className="flex gap-2">
          <button type="submit" className="bg-green-600 text-white py-2 px-4 rounded">
            Save
          </button>
          <button
            type="button"
            onClick={() => router.push('/admin/children')}
            className="bg-gray-300 text-gray-800 py-2 px-4 rounded"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
