'use client';

import { useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { showSuccess, showError } from '@/lib/toastUtils';

export default function CreateChildProfile() {
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const [allergies, setAllergies] = useState('');
  const [parentEmails, setParentEmails] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  try {
    const emailsArray = parentEmails
      .split(',')
      .map(email => email.trim())
      .filter(email => email);

    await addDoc(collection(db, 'children'), {
      name,
      notes,
      allergies,
      parentEmails: emailsArray,
      createdAt: new Date(),
    });

    showSuccess('Child profile created!');

    setName('');
    setNotes('');
    setAllergies('');
    setParentEmails('');
  } catch (err) {
    console.error('Error creating child profile:', err);
    showError('Something went wrong.', 'Please try again.');
  }
};


  return (
    <div className="max-w-lg mx-auto mt-10 p-6 border rounded shadow">
      <h1 className="text-2xl font-bold mb-4">Create Child Profile</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          type="text"
          placeholder="Child's Name"
          value={name}
          onChange={e => setName(e.target.value)}
          required
          className="p-2 border rounded"
        />
        <textarea
          placeholder="Notes"
          value={notes}
          onChange={e => setNotes(e.target.value)}
          className="p-2 border rounded"
        />
        <textarea
          placeholder="Allergies"
          value={allergies}
          onChange={e => setAllergies(e.target.value)}
          className="p-2 border rounded"
        />
        <input
          type="text"
          placeholder="Parent/Guardian Emails (comma separated)"
          value={parentEmails}
          onChange={e => setParentEmails(e.target.value)}
          className="p-2 border rounded"
        />
        <button type="submit" className="bg-blue-600 text-white py-2 rounded">
          Save Child Profile
        </button>
      </form>
    </div>
  );
}
