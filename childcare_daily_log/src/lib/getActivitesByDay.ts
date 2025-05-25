import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

type Activity = {
  time: string;
  description: string;
  // Add other relevant fields as needed
};

export async function getActivitiesByDay(
  childId: string,
  date: Date
): Promise<{
  Bathroom: Activity[];
  "Sleep": Activity[];
  Activities: Activity[];
  Needs: Activity[];
}> {
  const dateKey = date.toISOString().split("T")[0]; // "2025-05-25"
  const dayDocRef = doc(db, `children/${childId}/activityDays/${dateKey}`);
  const snapshot = await getDoc(dayDocRef);

  if (snapshot.exists()) {
    const data = snapshot.data();
    return {
      Bathroom: data.Bathroom || [],
      "Sleep": data["Sleep"] || [],
      Activities: data.Activities || [],
      Needs: data.Needs || [],
    };
  } else {
    return {
      Bathroom: [],
      "Sleep": [],
      Activities: [],
      Needs: [],
    };
  }
}
