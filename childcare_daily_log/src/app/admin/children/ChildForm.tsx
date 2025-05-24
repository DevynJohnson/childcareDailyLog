'use client';

import { useState } from 'react';

type Child = {
  id?: string;
  firstName: string;
  lastName: string;
  parentEmails: string[];
  allergies?: string;
  notes?: string;
};

type ChildFormProps = {
  initialData: Child | null;
  onSave: (child: Child) => void;
};

export default function ChildForm({ initialData, onSave }: ChildFormProps) {
  const [firstName, setFirstName] = useState(initialData?.firstName || '');
  const [lastName, setLastName] = useState(initialData?.lastName || '');
  const [parentEmails, setParentEmails] = useState(initialData?.parentEmails?.join(', ') || '');
  const [allergies, setAllergies] = useState(initialData?.allergies || '');
  const [notes, setNotes] = useState(initialData?.notes || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: initialData?.id || null,
      firstName,
      lastName,
      parentEmails: parentEmails.split(',').map(e => e.trim()),
      allergies,
      notes,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <input
        value={firstName}
        onChange={(e) => setFirstName(e.target.value)}
        placeholder="First Name"
        className="p-2 border rounded"
        required
      />
      <input
        value={lastName}
        onChange={(e) => setLastName(e.target.value)}
        placeholder="Last Name"
        className="p-2 border rounded"
        required
      />
      <input
        value={parentEmails}
        onChange={(e) => setParentEmails(e.target.value)}
        placeholder="Parent Emails (comma separated)"
        className="p-2 border rounded"
        required
      />
      <textarea
        value={allergies}
        onChange={(e) => setAllergies(e.target.value)}
        placeholder="Allergies"
        className="p-2 border rounded"
      />
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Notes"
        className="p-2 border rounded"
      />
      <button type="submit" className="bg-green-600 text-white py-2 rounded">
        Save
      </button>
    </form>
  );
}
