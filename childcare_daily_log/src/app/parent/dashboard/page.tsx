'use client';
import { db } from '@/lib/firebase';
// src/app/parent/dashboard/page.tsx
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useRealTimeActivities } from '@/hooks/useRealTimeActivities';

export default function ParentDashboardPage() {
  const { role, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && role !== 'parent') router.replace('/auth');
  }, [loading, role, router]);

  if (loading || role !== 'parent') return <p>Loading...</p>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-center text-indigo-900 drop-shadow-lg mb-8" style={{ textShadow: '0 2px 8px #a5b4fc, 0 1px 0 #312e81' }}>Parent Dashboard</h1>
      <div className="flex flex-col gap-8 max-w-5xl mx-auto">
        <div className="card-gradient p-8 rounded-3xl shadow-lg flex flex-col w-full">
          <h2 className="mb-4 text-center"></h2>
          <div className="flex flex-wrap justify-center gap-6">
            <a
              href="/parent/activity-view"
              className="rounded-full px-6 py-3 font-medium transition-colors text-white text-center bg-gradient-to-r from-[var(--dark-indigo)] to-indigo-500 hover:from-indigo-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 shadow"
            >
              Activity Log
            </a>
            <a
              href="/parent/update-us"
              className="rounded-full px-6 py-3 font-medium transition-colors text-white text-center bg-gradient-to-r from-[var(--dark-indigo)] to-indigo-500 hover:from-indigo-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 shadow"
            >
              Update Us
            </a>
          </div>
          {/* Needs from yesterday - now inside the card, below the buttons */}
          <NeedsFromYesterday />
        </div>
      </div>
    </div>
  );
}

// --- NeedsFromYesterday component ---
type ParentInfo = {
  firstName: string;
  lastName: string;
  email: string;
};
type Child = {
  id: string;
  firstName: string;
  lastName: string;
  parents?: ParentInfo[];
};
//

function NeedsFromYesterday() {
  const { user } = useAuth();
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [children, setChildren] = useState<Child[]>([]); // intentionally unused, but needed for child selection

  // Get yesterday's dateKey
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const dateKey = yesterday.toLocaleDateString('en-CA');

  // Fetch children for this parent
  useEffect(() => {
    if (!user?.email) return;
    import('firebase/firestore').then(({ collection, getDocs }) => {
      getDocs(collection(db, 'children')).then(snapshot => {
        const myChildren = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() } as Child))
          .filter(child => Array.isArray(child.parents) && child.parents.some((p) => p.email === user.email));
        setChildren(myChildren);
        if (myChildren.length > 0) setSelectedChildId(myChildren[0].id);
      });
    });
  }, [user]);

  // Get activities for yesterday
  const { activitiesByType } = useRealTimeActivities(selectedChildId, dateKey);
  type Activity = { id?: string; needsData?: string[] };
  const needsActivities = (activitiesByType['Needs'] || []).filter((a: Activity) => Array.isArray(a.needsData) && a.needsData.length > 0);
  const needsList: string[] = needsActivities.flatMap((a) => (a.needsData as string[]));

  if (!selectedChildId) return null;

  return (
    <div className="mt-8 flex flex-col items-center justify-center">
      <h3 className="text-lg font-bold mb-2 text-white text-center">Supplies we need as of {yesterday.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}:</h3>
      {needsList.length === 0 ? (
        <div className="text-white text-sm text-center opacity-70">No supplies needed as of yesterday.</div>
      ) : (
        <ul className="list-disc list-inside text-white text-center">
          {needsList.map((need, i) => (
            <li key={i}>{need}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
