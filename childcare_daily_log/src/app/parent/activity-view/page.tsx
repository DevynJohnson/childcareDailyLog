"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { db, auth } from "@/lib/firebase";
import { useAuth } from '@/context/AuthContext';
import { DayPicker } from "react-day-picker";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
// ...existing code...
import "react-day-picker/dist/style.css";
import { useRealTimeActivities } from "@/hooks/useRealTimeActivities";
import { formatTimestamp } from "@/lib/dateUtils";

type ParentInfo = {
  firstName: string;
  lastName: string;
  email: string;
};

type Child = {
  id: string;
  firstName: string;
  lastName: string;
  birthDate?: string;
  allergies?: string;
  notes?: string;
  parents?: ParentInfo[];
};

export default function ParentDashboard() {
  const { role, loading: authLoading } = useAuth();
  const isAdmin = role === 'admin';
  
  // Show notes state for toggling notes display per activity
  const [showNotes, setShowNotes] = useState<{ [id: string]: boolean }>({});
  const toggleShowNotes = (id: string) => setShowNotes((prev) => ({ ...prev, [id]: !prev[id] }));
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [parentName, setParentName] = useState<string | null>(null);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Use local time for dateKey (YYYY-MM-DD) for grouping, but preserve event timestamps
  const dateKey = selectedDate.toLocaleDateString('en-CA');

  // Fetch Firebase Auth user email
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUserEmail(user?.email ?? null);
    });
    return unsubscribe;
  }, []);

  // Fetch children for the parent user or all children if admin
  useEffect(() => {
    const fetchChildren = async () => {
  if (!userEmail || authLoading) return;

  console.log('🔍 Debug Info:');
  console.log('User Email:', userEmail);
  console.log('Is Admin:', isAdmin);
  console.log('Auth Loading:', authLoading);

  try {
    const snapshot = await import("firebase/firestore").then(({ collection, getDocs }) => getDocs(collection(db, "children")));
    const allChildren = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Child[];

    console.log('📊 All Children from Firestore:', allChildren);
    console.log('Total children found:', allChildren.length);

    // Log each child's parent structure
    allChildren.forEach((child, index) => {
      console.log(`Child ${index + 1} (${child.firstName} ${child.lastName}):`);
      console.log('  - ID:', child.id);
      console.log('  - Parents:', child.parents);
      console.log('  - Parents is Array:', Array.isArray(child.parents));
      
      if (Array.isArray(child.parents)) {
        child.parents.forEach((parent, pIndex) => {
          console.log(`  - Parent ${pIndex + 1}:`, parent);
          console.log(`    - Email: "${parent.email}"`);
          console.log(`    - Email matches user: ${parent.email === userEmail}`);
          console.log(`    - Email type: ${typeof parent.email}`);
          console.log(`    - User email type: ${typeof userEmail}`);
        });
      }
    });

    let filteredChildren: Child[];
    
    if (isAdmin) {
      filteredChildren = allChildren;
      setParentName("Admin");
      console.log('✅ Admin mode - showing all children');
    } else {
      // Regular parent can only see their own children
      filteredChildren = allChildren.filter((child: Child) => {
        const hasParents = Array.isArray(child.parents);
        console.log(`Checking child ${child.firstName}: hasParents = ${hasParents}`);
        
        if (!hasParents) return false;
        
        const matchingParent = child.parents.some((parent: ParentInfo) => {
          const emailMatch = parent.email === userEmail;
          console.log(`  - Parent email "${parent.email}" matches "${userEmail}": ${emailMatch}`);
          return emailMatch;
        });
        
        console.log(`  - Child ${child.firstName} has matching parent: ${matchingParent}`);
        return matchingParent;
      });

      console.log('🎯 Filtered Children:', filteredChildren);
      console.log('Filtered children count:', filteredChildren.length);

      // Set parent name for regular parents
      if (filteredChildren.length > 0) {
        const matchingParent = filteredChildren[0].parents?.find(
          (parent: ParentInfo) => parent.email === userEmail
        );
        if (matchingParent) {
          setParentName(`${matchingParent.firstName}`);
          console.log('👤 Parent name set to:', matchingParent.firstName);
        }
      }
    }

    setChildren(filteredChildren);

    if (filteredChildren.length > 0) {
      setSelectedChildId(filteredChildren[0].id);
      console.log('🎯 Selected child ID set to:', filteredChildren[0].id);
    } else {
      console.log('❌ No children found for this parent');
    }

  } catch (error) {
    console.error('🚨 Error fetching children:', error);
  }
};

    fetchChildren();
  }, [userEmail, isAdmin, authLoading]);

  // Real-time activities
  const { activitiesByType, loading, error } = useRealTimeActivities(selectedChildId, dateKey);

  // Enhanced timestamp extraction function
  type Activity = {
  id?: string;  // Keep as optional since some activities might not have id initially
  activityType?: string;  // Keep as optional to match your original structure
  timestamp?: Date | { toDate: () => Date } | string | number;
  createdAt?: Date | { toDate: () => Date } | string | number;
  caregiverInitials?: string;
  caregiver?: string;
  notes?: string;
  
  // Bathroom activity data
  bathroomData?: {
    urinated?: boolean;
    bm?: boolean;
    noVoid?: boolean;
  };
  
  // Sleep/Nap activity data
  napData?: {
    fullNap?: boolean;
    partialNap?: boolean;
    noNap?: boolean;
  };
  nap?: {
    fullNap?: boolean;
    partialNap?: boolean;
    noNap?: boolean;
  };
  
  // Activities data
  activityDetails?: {
    activityCategory?: string;
    detail?: string;
  };
  
  // Food data
  foodData?: {
    item?: string;
    amount?: "All" | "Some" | "None";
  };
  
  // Needs data
  needsData?: string[];
};

  const getTimestamp = (activity: Activity): number => {
    if (!activity) return 0;
    
    // Try timestamp first
    if (activity.timestamp) {
      if (activity.timestamp instanceof Date) {
        return activity.timestamp.getTime();
      }
      if (typeof activity.timestamp === "object" && typeof activity.timestamp.toDate === "function") {
        return activity.timestamp.toDate().getTime();
      }
      if (typeof activity.timestamp === "string" && /^\d+$/.test(activity.timestamp)) {
        return Number(activity.timestamp);
      }
      if (typeof activity.timestamp === "string" || typeof activity.timestamp === "number") {
        const date = new Date(activity.timestamp);
        if (!isNaN(date.getTime())) return date.getTime();
      }
    }
    
    // Fallback to createdAt
    if (activity.createdAt) {
      if (activity.createdAt instanceof Date) {
        return activity.createdAt.getTime();
      }
      if (typeof activity.createdAt === "object" && typeof activity.createdAt.toDate === "function") {
        return activity.createdAt.toDate().getTime();
      }
      if (typeof activity.createdAt === "string" || typeof activity.createdAt === "number") {
        const date = new Date(activity.createdAt);
        if (!isNaN(date.getTime())) return date.getTime();
      }
    }
    
    return 0;
  };

  // Collect all activities from all types and sort strictly by timestamp (earliest to latest)
  const allActivities = Object.values(activitiesByType)
    .flat()
    .sort((a: Activity, b: Activity) => {
      const timestampA = getTimestamp(a);
      const timestampB = getTimestamp(b);
      
      // Primary sort by timestamp
      if (timestampA !== timestampB) {
        return timestampA - timestampB;
      }
      
      // Secondary sort by document ID for consistent ordering when timestamps are equal
      const idA = a.id || '';
      const idB = b.id || '';
      return idA.localeCompare(idB);
    });

  // Show loading state while auth is loading
  if (authLoading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-center text-indigo-900 drop-shadow-lg" style={{ textShadow: '0 2px 8px #a5b4fc, 0 1px 0 #312e81' }}>
        Welcome{parentName ? ` ${parentName}` : ""}!
      </h1>
      <h2 className="text-white text-center">
        {isAdmin 
          ? "Admin Dashboard - View any child's activities for the selected date!"
          : "This is your parent dashboard. Below you can see a list of your child's activities for the date selected!"
        }
      </h2>
      
      {/* Child selection dropdown and date picker side by side */}
      <div className="flex flex-wrap justify-center items-center gap-4 mb-4">
        {userEmail && (children.length > 1 || isAdmin) && (
          <div className="w-80">
            <select
              className="rounded border px-2 w-full bg-white text-slate-900 text-base"
              style={{ height: '48px', minHeight: '48px', lineHeight: '2.25rem' }}
              value={selectedChildId || ''}
              onChange={e => setSelectedChildId(e.target.value)}
            >
              <option value="" disabled>{isAdmin ? 'Select a child' : 'Select your child'}</option>
              {children.map(child => (
                <option key={child.id} value={child.id}>
                  {child.firstName} {child.lastName}
                  {isAdmin && child.parents && child.parents.length > 0
                    ? ` (Parent: ${child.parents[0].firstName} ${child.parents[0].lastName})`
                    : ''}
                </option>
              ))}
            </select>
          </div>
        )}
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
            <div className="absolute z-10 mt-2 bg-white border rounded shadow-lg w-full">
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
      </div>

      {children.length === 0 && (
        <p className="text-sm text-muted-foreground">
          {isAdmin ? "No children found in the system." : "No child profiles found for this account."}
        </p>
      )}
      
      {selectedChildId && (
        <div className="max-w-7xl mx-auto">
          <Card className="card-gradient p-8">
            <h2 className="text-lg font-semibold text-center mb-4">
              Here is a look at {(children.find((c) => c.id === selectedChildId)?.firstName || "your child")}&apos;s day on {selectedDate.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}!
            </h2>
            {loading ? (
              <div className="text-muted-foreground text-sm">Loading...</div>
            ) : error ? (
              <div className="text-red-500 text-sm">{error}</div>
            ) : allActivities.length === 0 ? (
              <div className="text-white text-sm" style={{textShadow: '0 2px 8px #000, 0 0px 2px #000, 0 1px 0 #000'}}>No updates yet.</div>
            ) : (
              <ol className="space-y-4">
                {allActivities.map((activityRaw) => {

                  const activity = activityRaw as Activity;
                  // --- Summary/emoji UI copied from Caregiver Dashboard ---
                  let summary = null;
                  // Format timestamp and initials
                  let metaInfo = null;
                  // Robust timestamp handling: use timestamp if Date, else convert Firestore Timestamp, else fallback to createdAt
                  let date: Date | null = null;
                  if (activity.timestamp instanceof Date) {
                    date = activity.timestamp;
                  } else if (
                    activity.timestamp &&
                    typeof activity.timestamp === "object" &&
                    typeof activity.timestamp.toDate === "function"
                  ) {
                    date = activity.timestamp.toDate();
                  } else if (
                    activity.createdAt &&
                    typeof activity.createdAt === "object" &&
                    !(activity.createdAt instanceof Date) &&
                    typeof (activity.createdAt as { toDate?: () => Date }).toDate === "function"
                  ) {
                    date = (activity.createdAt as { toDate: () => Date }).toDate();
                  }
                  const timeString = date && !isNaN(date.getTime()) ? formatTimestamp(date) : "No timestamp";
                  // Caregiver initials fallback (optional for parent view)
                  let initials = "?";
                  if (activity.caregiverInitials && typeof activity.caregiverInitials === "string") {
                    initials = activity.caregiverInitials;
                  } else if (activity.caregiver && typeof activity.caregiver === "string") {
                    initials = activity.caregiver;
                  }
                  metaInfo = (
                    <span className="flex items-center gap-2 text-xs text-white" style={{textShadow: '0 2px 8px #000, 0 0px 2px #000, 0 1px 0 #000'}}>
                      <span className="bg-black/20 px-2 py-0.5 rounded font-mono text-white">{timeString}</span>
                      <span className="bg-black/20 px-2 py-0.5 rounded font-bold text-white">{initials}</span>
                    </span>
                  );
                  // For summary rows, use flex justify-between to push metaInfo to the far right
                  const type = activity.activityType;
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
                    <li key={activity.id} className="border-b p-2 flex-col items-start">
                      <div className="text-sm text-white mb-2" style={{textShadow: '0 2px 8px #000, 0 0px 2px #000, 0 1px 0 #000'}}>
                        {summary}
                      </div>
                      <div className="flex gap-1 w-full mt-1">
                        {activity.notes && activity.notes.trim() ? (
                          <Button
                            className="btn-primary flex-1 min-w-0 min-h-0 h-5 px-1 py-0 text-[11px] leading-none"
                            style={{height: '22px', lineHeight: '1'}}
                            onClick={() => activity.id && toggleShowNotes(activity.id)}
                          >
                            {activity.id && showNotes[activity.id] ? "Hide Notes" : "Show Notes"}
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
                      {activity.id && showNotes[activity.id] && activity.notes && (
                        <div className="mt-1 text-white text-shadow bg-black/30 rounded p-2 text-xs">
                          {activity.notes}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ol>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}