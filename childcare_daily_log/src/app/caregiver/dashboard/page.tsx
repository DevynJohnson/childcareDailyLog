'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import ActivityModal from '@/components/ActivityModal';

const activityTypes = ['Bathroom', 'Nap/Rest', 'Activities', 'Needs'] as const;

type Child = {
  id: string;
  firstName: string;
  lastName: string;
};

export default function CaregiverDashboard() {
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [children, setChildren] = useState<Child[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeActivityType, setActiveActivityType] = useState<string | null>(null);

  const handleAddClick = (type: string) => {
    setActiveActivityType(type);
    setIsModalOpen(true);
  };

  const handleActivitySubmit = async ({
    childId,
    activityType,
    notes,
    timestamp,
  }: {
    childId: string;
    activityType: string;
    notes: string;
    timestamp: Date;
  }) => {
    const dateKey = timestamp.toISOString().split('T')[0]; // yyyy-mm-dd
    const activityRef = collection(
      db,
      `children/${childId}/activities/${dateKey}/${activityType}`
    );
    await addDoc(activityRef, {
      notes,
      timestamp: timestamp.toISOString(),
    });
  };

  useEffect(() => {
    const fetchChildren = async () => {
      const snapshot = await getDocs(collection(db, 'children'));
      const results = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Child[];
      setChildren(results);
    };

    fetchChildren();
  }, []);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Caregiver Dashboard</h1>

      <div className="max-w-sm">
        <Select onValueChange={(value) => setSelectedChildId(value)}>
          <SelectTrigger>
            <SelectValue placeholder="Select a child" />
          </SelectTrigger>
          <SelectContent>
            {children.map((child) => (
              <SelectItem key={child.id} value={child.id}>
                {child.firstName} {child.lastName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedChildId && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {activityTypes.map((type) => (
            <Card key={type} className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">{type}</h2>
                <Button size="sm" onClick={() => handleAddClick(type)}>
                  + Add
                </Button>
              </div>
              <div className="text-muted-foreground text-sm">
                No updates yet.
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal Rendered Here */}
      {selectedChildId && activeActivityType && (
        <ActivityModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleActivitySubmit}
          childId={selectedChildId}
          activityType={activeActivityType}
        />
      )}
    </div>
  );
}
