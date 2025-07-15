"use client";

import { useEffect, useState } from "react";
// Show notes state for toggling notes display per activity
import { useState as useLocalState } from "react";
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
import BathroomModal from "@/components/ui/activityModals/BathroomModal";
import NapModal from "@/components/ui/activityModals/NapModal";
import ActivitiesModal from "@/components/ui/activityModals/ActivitiesModal";
import NeedsModal from "@/components/ui/activityModals/NeedsModal";
import FoodModal from "@/components/ui/activityModals/FoodModal";
import "react-day-picker/dist/style.css";
import { useCallback } from "react";

const activityTypes = ["Bathroom", "Sleep", "Activities", "Food", "Needs"] as const;

type Child = {
  id: string;
  firstName: string;
  lastName: string;
};

// Type guards for modal props
function getBathroomActivity(activity: any) {
  if (!activity) return undefined;
  return {
    notes: activity.notes ?? "",
    timestamp: activity.timestamp ? new Date(activity.timestamp) : new Date(),
    bathroomData: activity.bathroomData,
  };
}
function getNapActivity(activity: any) {
  if (!activity) return undefined;
  // Support both napData and nap for backward compatibility
  const napData = activity.napData || activity.nap;
  return {
    notes: activity.notes ?? "",
    timestamp: activity.timestamp ? new Date(activity.timestamp) : new Date(),
    napData,
  };
}
function getActivitiesActivity(activity: any) {
  if (!activity) return undefined;
  return {
    notes: activity.notes ?? "",
    timestamp: activity.timestamp ? new Date(activity.timestamp) : new Date(),
    activityDetails: activity.activityDetails,
  };
}
function getNeedsActivity(activity: any) {
  if (!activity) return undefined;
  return {
    notes: activity.notes ?? "",
    timestamp: activity.timestamp ? new Date(activity.timestamp) : new Date(),
    needsData: activity.needsData ?? [],
  };
}
function getFoodActivity(activity: any) {
  if (!activity) return undefined;
  return {
    notes: activity.notes ?? "",
    timestamp: activity.timestamp ? new Date(activity.timestamp) : new Date(),
    foodData: activity.foodData,
  };
}

export default function CaregiverDashboard() {
  const [showNotes, setShowNotes] = useLocalState<{ [id: string]: boolean }>({});
  const toggleShowNotes = (id: string) => setShowNotes((prev) => ({ ...prev, [id]: !prev[id] }));
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
                  {activitiesByType[type].map((activity) => {
                    let summary = null;
                    if (type === "Bathroom" && activity.bathroomData) {
                      const data = activity.bathroomData as { urinated?: boolean; bm?: boolean; noVoid?: boolean };
                      const icons = [];
                      if (data.urinated) icons.push("💦 Urinated");
                      if (data.bm) icons.push("💩 BM");
                      if (data.noVoid) icons.push("🚫 No Void");
                      summary = (
                        <div className="flex gap-2 items-center mb-1">
                          {icons.map((txt, i) => (
                            <span key={i} className="inline-flex items-center px-2 py-0.5 rounded bg-black/30 text-white text-xs font-semibold" style={{textShadow: '0 2px 8px #000, 0 0px 2px #000, 0 1px 0 #000'}}>{txt}</span>
                          ))}
                        </div>
                      );
                    } else if (type === "Sleep" && (activity.napData || activity.nap)) {
                      // Sleep summary icons: Full Moon for full nap, Crescent Moon for partial, Red Circle w/Line for no nap
                      const data = (activity.napData || activity.nap) as { fullNap?: boolean; partialNap?: boolean; noNap?: boolean };
                      const icons = [];
                      if (data.fullNap) icons.push("🌕 Full Nap");
                      if (data.partialNap) icons.push("🌙 Partial Nap");
                      if (data.noNap) icons.push("🚫 No Nap");
                      summary = (
                        <div className="flex gap-2 items-center mb-1">
                          {icons.map((txt, i) => (
                            <span key={i} className="inline-flex items-center px-2 py-0.5 rounded bg-black/30 text-white text-xs font-semibold" style={{textShadow: '0 2px 8px #000, 0 0px 2px #000, 0 1px 0 #000'}}>{txt}</span>
                          ))}
                        </div>
                      );
                    } else if (type === "Activities" && activity.activityDetails) {
                      // Activities summary: emoji + activity type, then detail below
                      const activityEmojis: Record<string, string> = {
                        "Toys": "🧸",
                        "Games": "🎲",
                        "Outdoor Play": "☀️",
                        "Art/Crafts": "🎨",
                        "Music/Singing": "🎵",
                        "Reading/Storytime": "📚",
                        "Other Activity": "✨",
                      };
                      const details = activity.activityDetails as { activityCategory?: string; detail?: string };
                      const emoji = activityEmojis[details.activityCategory || ""] || "✨";
                      summary = (
                        <div className="mb-1">
                          <div className="flex gap-2 items-center mb-1">
                            <span className="inline-flex items-center px-2 py-0.5 rounded bg-black/30 text-white text-xs font-semibold" style={{textShadow: '0 2px 8px #000, 0 0px 2px #000, 0 1px 0 #000'}}>
                              {emoji} {details.activityCategory}
                            </span>
                          </div>
                          {details.detail && (
                            <div className="ml-1 text-xs text-white" style={{textShadow: '0 2px 8px #000, 0 0px 2px #000, 0 1px 0 #000'}}>
                              {details.detail}
                            </div>
                          )}
                        </div>
                      );
                    } else if (type === "Food" && activity.foodData) {
                      // Food summary: show food item and amount eaten
                      const data = activity.foodData as { item?: string; amount?: "All" | "Some" | "None" };
                      summary = (
                        <div className="mb-1">
                          <div className="flex gap-2 items-center mb-1">
                            <span className="inline-flex items-center px-2 py-0.5 rounded bg-black/30 text-white text-xs font-semibold" style={{textShadow: '0 2px 8px #000, 0 0px 2px #000, 0 1px 0 #000'}}>
                              🍽️ {data.item}
                            </span>
                            {data.amount && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded bg-black/20 text-white text-xs font-semibold" style={{textShadow: '0 2px 8px #000, 0 0px 2px #000, 0 1px 0 #000'}}>
                                {data.amount} eaten
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    }
                    if (type === "Needs" && activity.needsData && Array.isArray(activity.needsData)) {
                      // Needs summary: show each selected need as emoji + label in an unordered list
                      const needsEmojis: Record<string, string> = {
                        "Diapers": "🧷",
                        "Wipes": "🧻",
                        "Extra Clothes": "👕",
                        "Snacks": "🍫",
                        "Other": "⭐",
                      };
                      const needsArr = activity.needsData;
                      const needsList = needsArr.map((need: string, i: number) => {
                        let label = need;
                        let emoji = needsEmojis[need] || needsEmojis["Other"];
                        if (need.startsWith("Other:")) {
                          label = need;
                          emoji = needsEmojis["Other"];
                        }
                        return (
                          <li key={i} className="flex items-center gap-2 text-white text-xs mb-1" style={{textShadow: '0 2px 8px #000, 0 0px 2px #000, 0 1px 0 #000'}}>
                            <span>{emoji}</span>
                            <span>{label}</span>
                          </li>
                        );
                      });
                      summary = (
                        <ul className="mb-1 ml-2 list-disc list-inside">
                          {needsList}
                        </ul>
                      );
                    }
                    return (
                      <div
                        key={activity.id}
                        className="border-b p-2 flex-col items-start"
                      >
                        <div className="text-sm text-white mb-2" style={{textShadow: '0 2px 8px #000, 0 0px 2px #000, 0 1px 0 #000'}}>
                          {summary}
                        </div>
                        <div className="flex gap-1 w-full mt-1">
                          <Button
                            className="btn-primary flex-1 min-w-0 min-h-0 h-5 px-1 py-0 text-[11px] leading-none"
                            style={{height: '22px', lineHeight: '1'}}
                            onClick={() => handleEditClick(type, activity)}
                          >
                            Edit
                          </Button>
                          <Button
                            className="btn-primary flex-1 min-w-0 min-h-0 h-5 px-1 py-0 text-[11px] leading-none"
                            style={{height: '22px', lineHeight: '1'}}
                            onClick={() => toggleShowNotes(activity.id)}
                          >
                            {showNotes[activity.id] ? "Hide Notes" : "Show Notes"}
                          </Button>
                        </div>
                        {showNotes[activity.id] && activity.notes && (
                          <div className="mt-1 text-white text-shadow bg-black/30 rounded p-2 text-xs">
                            {activity.notes}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-white text-sm" style={{textShadow: '0 2px 8px #000, 0 0px 2px #000, 0 1px 0 #000'}}>No updates yet.</div>
              )}
            </Card>
          ))}
        </div>
      )}

      {selectedChildId && activeActivityType === "Bathroom" && (
        <BathroomModal
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
            fetchActivities();
          }}
          childId={selectedChildId}
          // activityType prop removed
          selectedDate={selectedDate}
          activityId={selectedActivityId ?? undefined}
          selectedActivity={getBathroomActivity(selectedActivity)}
        />
      )}
      {selectedChildId && activeActivityType === "Sleep" && (
        <NapModal
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
            fetchActivities();
          }}
          childId={selectedChildId}
          // activityType prop removed
          selectedDate={selectedDate}
          activityId={selectedActivityId ?? undefined}
          selectedActivity={getNapActivity(selectedActivity)}
        />
      )}
      {selectedChildId && activeActivityType === "Activities" && (
        <ActivitiesModal
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
            fetchActivities();
          }}
          childId={selectedChildId}
          activityType={activeActivityType}
          selectedDate={selectedDate}
          activityId={selectedActivityId ?? undefined}
          selectedActivity={getActivitiesActivity(selectedActivity)}
        />
      )}
      {selectedChildId && activeActivityType === "Needs" && (
        <NeedsModal
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
            fetchActivities();
          }}
          childId={selectedChildId}
          activityType={activeActivityType}
          selectedDate={selectedDate}
          activityId={selectedActivityId ?? undefined}
          selectedActivity={getNeedsActivity(selectedActivity)}
        />
      )}
      {selectedChildId && activeActivityType === "Food" && (
        <FoodModal
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
            fetchActivities();
          }}
          childId={selectedChildId}
          activityType={activeActivityType}
          selectedDate={selectedDate}
          activityId={selectedActivityId ?? undefined}
          selectedActivity={getFoodActivity(selectedActivity)}
        />
      )}
    </div>
  );
}
