import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';

type Activity = {
  id: string;
  notes?: string;
  timestamp: Date;
  [key: string]: unknown;
};

const activityTypes = ["Bathroom", "Sleep", "Activities", "Food", "Needs"] as const;

export function useRealTimeActivities(childId: string | null, dateKey: string) {
  const [activitiesByType, setActivitiesByType] = useState<Record<string, Activity[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!childId) {
      setActivitiesByType({});
      setLoading(false);
      return;
    }

    const unsubscribes: (() => void)[] = [];
    const newActivities: Record<string, Activity[]> = {};

    activityTypes.forEach((type) => {
      const ref = collection(db, `children/${childId}/activities/${dateKey}_${type}/items`);
      const q = query(ref, orderBy('timestamp', 'desc'));
      
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          newActivities[type] = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            timestamp: doc.data().timestamp?.toDate() || new Date(),
          })) as Activity[];
          
          setActivitiesByType({ ...newActivities });
          setLoading(false);
          setError(null);
        },
        (err) => {
          console.error('Error fetching activities:', err);
          setError('Failed to load activities');
          setLoading(false);
        }
      );

      unsubscribes.push(unsubscribe);
    });

    return () => {
      unsubscribes.forEach((unsubscribe) => unsubscribe());
    };
  }, [childId, dateKey]);

  return { activitiesByType, loading, error };
}
