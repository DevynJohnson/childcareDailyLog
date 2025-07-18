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
import { formatTimestamp, formatTimeAgo } from "@/lib/dateUtils";
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
import "@/app/globals.css";

const activityTypes = ["Bathroom", "Sleep", "Activities", "Food", "Needs"] as const;

type Child = {
  id: string;
  firstName: string;
  lastName: string;
};

// Type guards for modal props
interface BathroomActivity {
  notes?: string;
  timestamp?: string | number | { toDate?: () => Date };
  bathroomData?: {
    urinated?: boolean;
    bm?: boolean;
    noVoid?: boolean;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

function getBathroomActivity(activity: BathroomActivity | undefined) {
  if (!activity) return undefined;
  let bathroomData: { urinated: boolean; bm: boolean; noVoid: boolean } | undefined = undefined;
  if (activity.bathroomData) {
    bathroomData = {
      urinated: activity.bathroomData.urinated ?? false,
      bm: activity.bathroomData.bm ?? false,
      noVoid: activity.bathroomData.noVoid ?? false,
    };
  }
  return {
    notes: activity.notes ?? "",
    timestamp: activity.timestamp
      ? new Date(
          typeof activity.timestamp === "object" &&
          activity.timestamp !== null &&
          typeof (activity.timestamp as { toDate?: () => Date }).toDate === "function"
            ? (activity.timestamp as { toDate: () => Date }).toDate()
            : (activity.timestamp as string | number)
        )
      : new Date(),
    bathroomData,
  };
}
type NapActivity = {
  notes?: string;
  timestamp?: string | number | { toDate?: () => Date };
  napData?: {
    fullNap?: boolean;
    partialNap?: boolean;
    noNap?: boolean;
    [key: string]: unknown;
  };
  nap?: {
    fullNap?: boolean;
    partialNap?: boolean;
    noNap?: boolean;
    [key: string]: unknown;
  };
  [key: string]: unknown;
};

function getNapActivity(activity: NapActivity | undefined) {
  if (!activity) return undefined;
  // Support both napData and nap for backward compatibility
  const napData = activity.napData || activity.nap;
  return {
    notes: activity.notes ?? "",
    timestamp: activity.timestamp
      ? new Date(
          typeof activity.timestamp === "object" &&
          activity.timestamp !== null &&
          typeof (activity.timestamp as { toDate?: () => Date }).toDate === "function"
            ? (activity.timestamp as { toDate: () => Date }).toDate()
            : (activity.timestamp as string | number)
        )
      : new Date(),
    napData,
  };
}
type ActivitiesActivity = {
  notes?: string;
  timestamp?: string | number | { toDate?: () => Date };
  activityDetails?: {
    activityCategory?: string;
    detail?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
};

function getActivitiesActivity(activity: ActivitiesActivity | undefined) {
  if (!activity) return undefined;
  let activityDetails: { activityCategory: string; detail: string } | undefined = undefined;
  if (
    activity.activityDetails &&
    typeof activity.activityDetails === "object" &&
    typeof activity.activityDetails.activityCategory === "string" &&
    typeof activity.activityDetails.detail === "string"
  ) {
    activityDetails = {
      activityCategory: activity.activityDetails.activityCategory,
      detail: activity.activityDetails.detail,
    };
  }
  return {
    notes: activity.notes ?? "",
    timestamp: activity.timestamp
      ? new Date(
          typeof activity.timestamp === "object" &&
          activity.timestamp !== null &&
          typeof (activity.timestamp as { toDate?: () => Date }).toDate === "function"
            ? (activity.timestamp as { toDate: () => Date }).toDate()
            : (activity.timestamp as string | number)
        )
      : new Date(),
    activityDetails,
  };
}
type NeedsActivity = {
  notes?: string;
  timestamp?: string | number | { toDate?: () => Date };
  needsData?: string[];
  [key: string]: unknown;
};

function getNeedsActivity(activity: NeedsActivity | undefined) {
  if (!activity) return undefined;
  return {
    notes: activity.notes ?? "",
    timestamp: activity.timestamp
      ? new Date(
          typeof activity.timestamp === "object" &&
          activity.timestamp !== null &&
          typeof (activity.timestamp as { toDate?: () => Date }).toDate === "function"
            ? (activity.timestamp as { toDate: () => Date }).toDate()
            : (activity.timestamp as string | number)
        )
      : new Date(),
    needsData: activity.needsData ?? [],
  };
}
type FoodActivity = {
  notes?: string;
  timestamp?: string | number | { toDate?: () => Date };
  foodData?: {
    item?: string;
    amount?: "All" | "Some" | "None";
    [key: string]: unknown;
  };
  [key: string]: unknown;
};

function getFoodActivity(activity: FoodActivity | undefined) {
  if (!activity) return undefined;
  let foodData: { item: string; amount: "All" | "Some" | "None" } | undefined = undefined;
  if (activity.foodData) {
    foodData = {
      item: activity.foodData.item ?? "",
      amount: activity.foodData.amount ?? "All",
    };
  }
  return {
    notes: activity.notes ?? "",
    timestamp: activity.timestamp
      ? new Date(
          typeof activity.timestamp === "object" &&
          activity.timestamp !== null &&
          typeof (activity.timestamp as { toDate?: () => Date }).toDate === "function"
            ? (activity.timestamp as { toDate: () => Date }).toDate()
            : (activity.timestamp as string | number)
        )
      : new Date(),
    foodData,
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

  // Use local time for dateKey, matching parent dashboard
  const dateKey = selectedDate.toLocaleDateString('en-CA');

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
    // Use local time for dateKey, matching parent dashboard
    const dateKey = selectedDate.toLocaleDateString('en-CA');
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
  }, [selectedChildId, selectedDate, fetchActivities]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);


  return (
    <div className="p-6 space-y-6 min-h-screen">
      <h1 className="text-2xl font-bold text-center text-indigo-900 drop-shadow-lg" style={{ textShadow: '0 2px 8px #a5b4fc, 0 1px 0 #312e81' }}>
        Caregiver Dashboard
      </h1>

      <div className="flex flex-col md:flex-row justify-center items-center gap-6 mb-2">
        <div className="w-80">
          <Select onValueChange={(value) => setSelectedChildId(value)}>
            <SelectTrigger className="h-12 text-base w-full bg-white border border-gray-300 shadow-sm">
              <SelectValue placeholder="Select a child" className="text-gray-800" />
            </SelectTrigger>
            <SelectContent className="bg-white">
              {children.map((child) => (
                <SelectItem key={child.id} value={child.id}>
                  {child.firstName} {child.lastName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="relative rdp inline-block w-80">
          <Button
            variant="outline"
            onClick={() => setShowDatePicker(!showDatePicker)}
            className="text-base h-12 w-full"
          >
            📅 {selectedDate.toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </Button>

          {showDatePicker && (
            <div
              className="absolute z-10 mt-2 border rounded shadow-lg w-full"
              
            >
              <DayPicker
                className="rdp"
                mode="single"
                selected={selectedDate}
                onSelect={(date) => {
                  if (date) {
                    setSelectedDate(date);
                    setShowDatePicker(false);
                  }
                }}
                style={{ borderRadius: 8, padding: 8 }}
              />
            </div>
          )}
        </div>
      </div>

      {selectedChildId && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {activityTypes.map((type) => (
            <Card key={type} className="card-gradient p-4 space-y-2">
              <div className="relative flex items-center justify-between">
                <h2 className="text-2xl font-bold underline absolute left-1/2 transform -translate-x-1/2 w-full text-center pointer-events-none select-none">
                  {type}
                </h2>
                <Button
                  size="sm"
                  className="btn-primary ml-auto z-10"
                  onClick={() => handleAddClick(type)}
                  style={{ transition: 'background 0.2s, color 0.2s' }}
                >
                  + Add
                </Button>
              </div>
              {activitiesByType[type]?.length > 0 ? (
                <div className="space-y-2">
                  {activitiesByType[type].map((activity) => {
                    let summary = null;
                    // Format timestamp and initials
                    let metaInfo = null;
                    // Robust timestamp handling (Firestore Timestamp, string, number)
                    let date: Date | null = null;
                    if (activity.timestamp) {
                      if (
                        typeof activity.timestamp === "object" &&
                        activity.timestamp !== null &&
                        typeof (activity.timestamp as { toDate?: unknown }).toDate === "function"
                      ) {
                        // Firestore Timestamp object
                        date = (activity.timestamp as { toDate: () => Date }).toDate();
                      } else if (typeof activity.timestamp === "string" || typeof activity.timestamp === "number") {
                        date = new Date(activity.timestamp);
                      }
                    }
                    const timeString = date ? formatTimestamp(date) : "--";
                    const timeAgo = date ? formatTimeAgo(date) : "";
                    // Caregiver initials fallback
                    let initials = "?";
                    if (activity.caregiverInitials && typeof activity.caregiverInitials === "string") {
                      initials = activity.caregiverInitials;
                    } else if (activity.caregiver && typeof activity.caregiver === "string") {
                      initials = activity.caregiver;
                    }
                    metaInfo = (
                      <span className="flex items-center gap-2 text-xs text-white/80" style={{textShadow: '0 2px 8px #000, 0 0px 2px #000, 0 1px 0 #000'}}>
                        <span
                          className="bg-black/20 px-2 py-0.5 rounded font-mono"
                          title={timeAgo}
                        >
                          {timeString}
                        </span>
                        <span className="bg-black/20 px-2 py-0.5 rounded font-bold">{initials}</span>
                      </span>
                    );
                    // For summary rows, use flex justify-between to push metaInfo to the far right
                    if (type === "Bathroom" && activity.bathroomData) {
                      const data = activity.bathroomData as { urinated?: boolean; bm?: boolean; noVoid?: boolean };
                      const icons = [];
                      if (data.urinated) icons.push("💦 Urinated");
                      if (data.bm) icons.push("💩 BM");
                      if (data.noVoid) icons.push("🚫 No Void");
                      summary = (
                        <div className="flex items-center justify-between mb-1 w-full">
                          <div className="flex gap-2 items-center">
                            {icons.map((txt, i) => (
                              <span key={i} className="inline-flex items-center px-2 py-0.5 rounded bg-black/30 text-white text-xs font-semibold" style={{textShadow: '0 2px 8px #000, 0 0px 2px #000, 0 1px 0 #000'}}>{txt}</span>
                            ))}
                          </div>
                          {metaInfo}
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
                        <div className="flex items-center justify-between mb-1 w-full">
                          <div className="flex gap-2 items-center">
                            {icons.map((txt, i) => (
                              <span key={i} className="inline-flex items-center px-2 py-0.5 rounded bg-black/30 text-white text-xs font-semibold" style={{textShadow: '0 2px 8px #000, 0 0px 2px #000, 0 1px 0 #000'}}>{txt}</span>
                            ))}
                          </div>
                          {metaInfo}
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
                        "Books": "📚",
                        "Other Activity": "✨",
                      };
                      const details = activity.activityDetails as { activityCategory?: string; detail?: string };
                      const emoji = activityEmojis[details.activityCategory || ""] || "✨";
                      summary = (
                        <div className="mb-1">
                          <div className="flex items-center justify-between mb-1 w-full">
                            <span className="inline-flex items-center px-2 py-0.5 rounded bg-black/30 text-white text-xs font-semibold" style={{textShadow: '0 2px 8px #000, 0 0px 2px #000, 0 1px 0 #000'}}>
                              {emoji} {details.activityCategory}
                            </span>
                            {metaInfo}
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
                          <div className="flex items-center justify-between mb-1 w-full">
                            <span className="inline-flex items-center px-2 py-0.5 rounded bg-black/30 text-white text-xs font-semibold" style={{textShadow: '0 2px 8px #000, 0 0px 2px #000, 0 1px 0 #000'}}>
                              🍽️ {data.item}
                            </span>
                            <span className="flex gap-2 items-center">
                              {data.amount && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded bg-black/20 text-white text-xs font-semibold" style={{textShadow: '0 2px 8px #000, 0 0px 2px #000, 0 1px 0 #000'}}>
                                  {data.amount} eaten
                                </span>
                              )}
                              {metaInfo}
                            </span>
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
                        <div className="flex items-center mb-1">
                          <ul className="mb-1 ml-2 list-disc list-inside flex-1">
                            {needsList}
                          </ul>
                          {metaInfo}
                        </div>
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
                          {activity.notes && activity.notes.trim() ? (
                            <Button
                              className="btn-primary flex-1 min-w-0 min-h-0 h-5 px-1 py-0 text-[11px] leading-none"
                              style={{height: '22px', lineHeight: '1'}}
                              onClick={() => toggleShowNotes(activity.id)}
                            >
                              {showNotes[activity.id] ? "Hide Notes" : "Show Notes"}
                            </Button>
                          ) : (
                            <Button
                              className="btn-primary flex-1 min-w-0 min-h-0 h-5 px-1 py-0 text-[11px] leading-none opacity-50 cursor-not-allowed"
                              style={{height: '22px', lineHeight: '1'}}
                              disabled
                            >
                              No Notes
                            </Button>
                          )}
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
        if (!selectedChildId || !selectedActivityId || !activeActivityType || !selectedActivity) return;
        // Use the activity's timestamp to determine the correct dateKey
        let activityDate: Date | null = null;
        if (selectedActivity.timestamp) {
          if (
            typeof selectedActivity.timestamp === "object" &&
            selectedActivity.timestamp !== null &&
            typeof (selectedActivity.timestamp as { toDate?: unknown }).toDate === "function"
          ) {
            activityDate = (selectedActivity.timestamp as { toDate: () => Date }).toDate();
          } else if (typeof selectedActivity.timestamp === "string" || typeof selectedActivity.timestamp === "number") {
            activityDate = new Date(selectedActivity.timestamp);
          }
        }
        const dateKey = activityDate ? activityDate.toLocaleDateString('en-CA') : selectedDate.toLocaleDateString('en-CA');
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
          selectedActivity={getBathroomActivity(selectedActivity ?? undefined)}
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
        if (!selectedChildId || !selectedActivityId || !activeActivityType || !selectedActivity) return;
        let activityDate: Date | null = null;
        if (selectedActivity.timestamp) {
          if (
            typeof selectedActivity.timestamp === "object" &&
            selectedActivity.timestamp !== null &&
            typeof (selectedActivity.timestamp as { toDate?: unknown }).toDate === "function"
          ) {
            activityDate = (selectedActivity.timestamp as { toDate: () => Date }).toDate();
          } else if (typeof selectedActivity.timestamp === "string" || typeof selectedActivity.timestamp === "number") {
            activityDate = new Date(selectedActivity.timestamp);
          }
        }
        const dateKey = activityDate ? activityDate.toLocaleDateString('en-CA') : selectedDate.toLocaleDateString('en-CA');
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
          selectedActivity={getNapActivity(selectedActivity ?? undefined)}
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
        if (!selectedChildId || !selectedActivityId || !activeActivityType || !selectedActivity) return;
        let activityDate: Date | null = null;
        if (selectedActivity.timestamp) {
          if (
            typeof selectedActivity.timestamp === "object" &&
            selectedActivity.timestamp !== null &&
            typeof (selectedActivity.timestamp as { toDate?: unknown }).toDate === "function"
          ) {
            activityDate = (selectedActivity.timestamp as { toDate: () => Date }).toDate();
          } else if (typeof selectedActivity.timestamp === "string" || typeof selectedActivity.timestamp === "number") {
            activityDate = new Date(selectedActivity.timestamp);
          }
        }
        const dateKey = activityDate ? activityDate.toLocaleDateString('en-CA') : selectedDate.toLocaleDateString('en-CA');
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
          selectedActivity={getActivitiesActivity(selectedActivity ?? undefined)}
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
        if (!selectedChildId || !selectedActivityId || !activeActivityType || !selectedActivity) return;
        let activityDate: Date | null = null;
        if (selectedActivity.timestamp) {
          if (
            typeof selectedActivity.timestamp === "object" &&
            selectedActivity.timestamp !== null &&
            typeof (selectedActivity.timestamp as { toDate?: unknown }).toDate === "function"
          ) {
            activityDate = (selectedActivity.timestamp as { toDate: () => Date }).toDate();
          } else if (typeof selectedActivity.timestamp === "string" || typeof selectedActivity.timestamp === "number") {
            activityDate = new Date(selectedActivity.timestamp);
          }
        }
        const dateKey = activityDate ? activityDate.toLocaleDateString('en-CA') : selectedDate.toLocaleDateString('en-CA');
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
          selectedActivity={getNeedsActivity(selectedActivity ?? undefined)}
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
          selectedActivity={getFoodActivity(selectedActivity ?? undefined)}
        />
      )}
    </div>
  );
}
