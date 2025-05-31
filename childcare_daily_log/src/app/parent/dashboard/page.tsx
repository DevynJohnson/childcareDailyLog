"use client";

import { useEffect, useState, useCallback } from "react";
import {
  collection,
  getDocs,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { db, auth } from "@/lib/firebase";
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
import "react-day-picker/dist/style.css";

const activityTypes = ["Bathroom", "Sleep", "Activities", "Food", "Needs"] as const;

type Child = {
  id: string;
  firstName: string;
  lastName: string;
  parentEmails: string[];
};

type Activity = {
  id: string;
  notes?: string;
  [key: string]: unknown;
};

export default function ParentDashboard() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [activitiesByType, setActivitiesByType] = useState<Record<string, Activity[]>>({});

  const dateKey = selectedDate.toISOString().split("T")[0];

  // Fetch Firebase Auth user email
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUserEmail(user?.email ?? null);
    });
    return unsubscribe;
  }, []);

  // Fetch children for the parent user
  useEffect(() => {
    const fetchChildren = async () => {
      if (!userEmail) return;

      const snapshot = await getDocs(collection(db, "children"));
      const allChildren = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Child[];

      const filtered = allChildren.filter((child) =>
        child.parentEmails.includes(userEmail)
      );

      setChildren(filtered);

      if (filtered.length === 1) {
        setSelectedChildId(filtered[0].id);
      }
    };

    fetchChildren();
  }, [userEmail]);

  const fetchActivities = useCallback(async () => {
    if (!selectedChildId) return;

    const newActivities: Record<string, Activity[]> = {};

    await Promise.all(
      activityTypes.map(async (type) => {
        const ref = collection(db, `children/${selectedChildId}/activities/${dateKey}_${type}/items`);
        const snapshot = await getDocs(ref);
        newActivities[type] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
      })
    );

    setActivitiesByType(newActivities);
  }, [selectedChildId, dateKey]);

  useEffect(() => {
    fetchActivities();
  }, [selectedChildId, selectedDate, fetchActivities]);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">
        Parent/Guardian Dashboard
        {selectedChildId && (
          <>
            {" for "}
            {
              children.find((c) => c.id === selectedChildId)?.firstName
            }
          </>
        )}
      </h1>

      {userEmail && children.length > 1 && (
        <div className="max-w-sm">
          <Select onValueChange={(value) => setSelectedChildId(value)} value={selectedChildId || ""}>
            <SelectTrigger>
              <SelectValue placeholder="Select your child" />
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
      )}

      {children.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No child profiles found for this account.
        </p>
      )}

      <div className="relative inline-block">
        <Button
          variant="outline"
          onClick={() => setShowDatePicker(!showDatePicker)}
          className="text-sm"
        >
          📅{" "}
          {selectedDate.toLocaleDateString(undefined, {
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
            <Card key={type} className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">{type}</h2>
              </div>

              {activitiesByType[type]?.length > 0 ? (
                <div className="space-y-2">
                  {activitiesByType[type].map((activity) => (
                    <div
                      key={activity.id}
                      className="border p-2 rounded text-sm bg-muted"
                    >
                      {activity.notes || "(no notes)"}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-muted-foreground text-sm">
                  No updates yet.
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
