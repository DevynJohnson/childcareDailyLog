"use client";

import { useEffect, useState } from "react";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  serverTimestamp,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { DayPicker } from "react-day-picker";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ActivityModal from "@/components/ActivityModal";
import "react-day-picker/dist/style.css";
import { useCallback } from "react";

const activityTypes = ["Bathroom", "Sleep", "Activities", "Food", "Needs"] as const;

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
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  type Activity = {
    id: string;
    notes?: string;
    [key: string]: unknown;
  };
  
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null);
  const [activitiesByType, setActivitiesByType] = useState<Record<string, Activity[]>>({});

  const dateKey = selectedDate.toISOString().split("T")[0];

  const handleAddClick = (type: string) => {
    setActiveActivityType(type);
    setSelectedActivity(null);
    setSelectedActivityId(null);
    setIsModalOpen(true);
  };

  const handleEditClick = (type: string, activity: Activity) => {
    setActiveActivityType(type);
    setSelectedActivity(activity);
    setSelectedActivityId(activity.id);
    setIsModalOpen(true);
  };

  async function handleActivitySubmit({
    childId,
    activityType,
    selectedDate,
    data,
    activityId,
  }: {
    childId: string;
    activityType: string;
    selectedDate: Date;
    data: Record<string, unknown>;
    activityId?: string;
  }) {
    const dateKey = selectedDate.toISOString().split("T")[0];
    const activityRef = doc(
      db,
      `children/${childId}/activities/${dateKey}_${activityType}/items/${activityId || crypto.randomUUID()}`
    );

    if (activityId) {
      const snapshot = await getDoc(activityRef);
      if (snapshot.exists()) {
        const previousData = snapshot.data();
        const historyRef = collection(activityRef, "editHistory");
        await addDoc(historyRef, {
          ...previousData,
          editedAt: serverTimestamp(),
        });
      }
      await updateDoc(activityRef, { ...data, updatedAt: serverTimestamp() });
    } else {
      await setDoc(activityRef, {
        ...data,
        createdAt: serverTimestamp(),
      });
    }
    fetchActivities();
  }

  

  const fetchActivities = useCallback(async () => {
  if (!selectedChildId) return;
  const newActivities: Record<string, Activity[]> = {};

  await Promise.all(
    activityTypes.map(async (type) => {
      const ref = collection(db, `children/${selectedChildId}/activities/${dateKey}_${type}/items`);
      const snapshot = await getDocs(ref);
      newActivities[type] = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    })
  );

  setActivitiesByType(newActivities);
}, [selectedChildId, dateKey]);

  useEffect(() => {
    const fetchChildren = async () => {
      const snapshot = await getDocs(collection(db, "children"));
      const results = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Child[];
      setChildren(results);
    };

    fetchChildren();
    fetchActivities();
  }, [selectedChildId, selectedDate]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

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

      <div className="relative inline-block">
        <Button
          variant="outline"
          onClick={() => setShowDatePicker(!showDatePicker)}
          className="text-sm"
        >
          📅 {selectedDate.toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </Button>

        {showDatePicker && (
          <div className="absolute z-10 mt-2 bg-white border rounded shadow-lg">
            <DayPicker
              mode="single"
              selected={selectedDate}
              onSelect={(date) => {
                if (date) {
                  setSelectedDate(date);
                  setShowDatePicker(false);
                }
              }}
            />
          </div>
        )}
      </div>

      {selectedChildId && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {activityTypes.map((type) => (
            <Card key={type} className="card-gradient p-4 space-y-2">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">{type}</h2>
                <Button size="sm" className="btn-primary" onClick={() => handleAddClick(type)}>
                  + Add
                </Button>
              </div>
              {activitiesByType[type]?.length > 0 ? (
                <div className="space-y-2">
                  {activitiesByType[type].map((activity) => (
                    <div
                      key={activity.id}
                      className="border p-2 rounded flex justify-between items-center"
                    >
                      <div className="text-sm text-white" style={{textShadow: '0 2px 8px #000, 0 0px 2px #000, 0 1px 0 #000'}}>
                        {activity.notes || "(no notes)"}
                      </div>
                      <Button size="sm" className="btn-primary" onClick={() => handleEditClick(type, activity)}>
                        Edit
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-white text-sm" style={{textShadow: '0 2px 8px #000, 0 0px 2px #000, 0 1px 0 #000'}}>No updates yet.</div>
              )}
            </Card>
          ))}
        </div>
      )}

      {selectedChildId && activeActivityType && (
        <ActivityModal
  isOpen={isModalOpen}
  onClose={() => setIsModalOpen(false)}
  onSubmit={async (data) => {
    await handleActivitySubmit({
      childId: data.childId,
      activityType: data.activityType,
      selectedDate: data.timestamp,
      data,
      activityId: selectedActivityId || undefined,
    });
    setIsModalOpen(false);
  }}
  onDelete={async () => {
    if (!selectedChildId || !selectedActivityId || !activeActivityType) return;

    const dateKey = selectedDate.toISOString().split("T")[0];
    const activityRef = doc(
      db,
      `children/${selectedChildId}/activities/${dateKey}_${activeActivityType}/items/${selectedActivityId}`
    );

    await deleteDoc(activityRef);
    setIsModalOpen(false);
    fetchActivities(); // Refresh the activity list
  }}
  childId={selectedChildId}
  activityType={activeActivityType}
  selectedDate={selectedDate}
  activityId={selectedActivityId ?? undefined} // 💥 NEW
/>

      )}
    </div>
  );
}
