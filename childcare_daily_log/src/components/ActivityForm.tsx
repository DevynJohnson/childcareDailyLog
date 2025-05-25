'use client';

import { useState } from 'react';

interface ActivityFormProps {
  activityType: string;
  childId: string;
  onSubmit: (data: {
    childId: string;
    activityType: string;
    notes: string;
    timestamp: Date;
  }) => void;
  onCancel: () => void;
}

export default function ActivityForm({ activityType, childId, onSubmit, onCancel }: ActivityFormProps) {
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      childId,
      activityType,
      notes,
      timestamp: new Date(),
    });
    setNotes('');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Notes</label>
        <textarea
          className="w-full border border-input rounded-md p-2 text-sm"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          placeholder={`Enter details for ${activityType.toLowerCase()}...`}
        />
      </div>
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="text-sm px-3 py-1.5 border rounded-md">
          Cancel
        </button>
        <button type="submit" className="text-sm px-3 py-1.5 bg-primary text-white rounded-md">
          Save
        </button>
      </div>
    </form>
  );
}
