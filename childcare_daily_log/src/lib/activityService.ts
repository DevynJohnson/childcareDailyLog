import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  serverTimestamp,
  addDoc,
  getDoc,
  limit as firestoreLimit
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { CaregiverInfo } from "@/types/caregiver";

export type ActivityType = "Bathroom" | "Sleep" | "Activities" | "Food" | "Needs";

export interface Activity {
  id: string;
  childId: string;
  activityType: ActivityType;
  date: string; // YYYY-MM-DD format
  timestamp: Date;
  data: Record<string, unknown>;
  notes?: string;
  caregiverInfo?: {
    id: string;
    initials: string;
    name: string;
  };
  createdAt: Date;
  updatedAt?: Date;
  createdBy: string;
  lastModifiedBy: string;
}

export interface ActivityAudit {
  id: string;
  activityId: string;
  childId: string;
  activityType: ActivityType;
  date: string;
  editType: "create" | "update" | "delete";
  previousData?: Record<string, unknown>;
  newData?: Record<string, unknown>;
  editedBy: string;
  editedAt: Date;
}

/**
 * Optimized activity service with single collection structure
 */
export class ActivityService {
  private static ACTIVITIES_COLLECTION = "activities";
  private static AUDIT_COLLECTION = "activityAudit";

  /**
   * Fetch all activities for a child on a specific date (OPTIMIZED: Single query)
   */
  static async getActivitiesByChildAndDate(
    childId: string, 
    date: Date
  ): Promise<Record<ActivityType, Activity[]>> {
    const dateKey = date.toISOString().split("T")[0];
    
    // OPTIMIZED: Single compound query instead of 5 separate queries
    const q = query(
      collection(db, this.ACTIVITIES_COLLECTION),
      where("childId", "==", childId),
      where("date", "==", dateKey),
      orderBy("timestamp", "desc")
    );

    const snapshot = await getDocs(q);
    
    // Group activities by type
    const activitiesByType: Record<string, Activity[]> = {
      Bathroom: [],
      Sleep: [],
      Activities: [],
      Food: [],
      Needs: []
    };

    snapshot.docs.forEach(doc => {
      const data = doc.data();
      const activity: Activity = {
        id: doc.id,
        ...data,
        timestamp: data.timestamp?.toDate() || new Date(),
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate(),
      } as Activity;

      if (activitiesByType[activity.activityType]) {
        activitiesByType[activity.activityType].push(activity);
      }
    });

    return activitiesByType as Record<ActivityType, Activity[]>;
  }

  /**
   * Create a new activity (OPTIMIZED: Single write with audit)
   */
  static async createActivity(
    childId: string,
    activityType: ActivityType,
    timestamp: Date,
    data: Record<string, unknown>,
    caregiverInfo?: CaregiverInfo
  ): Promise<string> {
    const dateKey = timestamp.toISOString().split("T")[0];
    const activityId = crypto.randomUUID();
    
    const activity: Omit<Activity, "id"> = {
      childId,
      activityType,
      date: dateKey,
      timestamp,
      data,
      notes: data.notes as string,
      caregiverInfo: caregiverInfo ? {
        id: caregiverInfo.id || "",
        initials: caregiverInfo.initials,
        name: `${caregiverInfo.firstName} ${caregiverInfo.lastName}`,
      } : undefined,
      createdAt: new Date(),
      createdBy: caregiverInfo?.initials || "Unknown",
      lastModifiedBy: caregiverInfo?.initials || "Unknown",
    };

    // Write activity
    await setDoc(doc(db, this.ACTIVITIES_COLLECTION, activityId), {
      ...activity,
      createdAt: serverTimestamp(),
      timestamp: timestamp,
    });

    // Write audit log
    await this.createAuditLog(
      activityId, 
      { ...activity, id: activityId }, 
      "create", 
      caregiverInfo?.initials || "Unknown"
    );

    return activityId;
  }

  /**
   * Update an existing activity (OPTIMIZED: Single update with audit)
   */
  static async updateActivity(
    activityId: string,
    updateData: Partial<Activity>,
    caregiverInfo?: CaregiverInfo
  ): Promise<void> {
    const activityRef = doc(db, this.ACTIVITIES_COLLECTION, activityId);
    
    // Get current data for audit
    const currentSnapshot = await getDoc(activityRef);
    const previousData = currentSnapshot.data();

    const updates = {
      ...updateData,
      updatedAt: serverTimestamp(),
      lastModifiedBy: caregiverInfo?.initials || "Unknown",
    };

    // Update activity
    await updateDoc(activityRef, updates);

    // Create audit log
    if (previousData) {
      await this.createAuditLog(
        activityId, 
        previousData as Activity, 
        "update", 
        caregiverInfo?.initials || "Unknown",
        updateData
      );
    }
  }

  /**
   * Delete an activity (OPTIMIZED: Single delete with audit)
   */
  static async deleteActivity(
    activityId: string,
    caregiverInfo?: CaregiverInfo
  ): Promise<void> {
    const activityRef = doc(db, this.ACTIVITIES_COLLECTION, activityId);
    
    // Get current data for audit
    const currentSnapshot = await getDoc(activityRef);
    const activityData = currentSnapshot.data();

    if (activityData) {
      // Create audit log before deletion
      await this.createAuditLog(
        activityId, 
        activityData as Activity, 
        "delete", 
        caregiverInfo?.initials || "Unknown"
      );
    }

    // Delete activity
    await deleteDoc(activityRef);
  }

  /**
   * Get activities for date range (OPTIMIZED: Single query with date range)
   */
  static async getActivitiesForDateRange(
    childId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Activity[]> {
    const startDateKey = startDate.toISOString().split("T")[0];
    const endDateKey = endDate.toISOString().split("T")[0];

    const q = query(
      collection(db, this.ACTIVITIES_COLLECTION),
      where("childId", "==", childId),
      where("date", ">=", startDateKey),
      where("date", "<=", endDateKey),
      orderBy("date", "desc"),
      orderBy("timestamp", "desc")
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate() || new Date(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate(),
    })) as Activity[];
  }

  /**
   * Get audit logs for admin review (OPTIMIZED: Dedicated audit collection)
   */
  static async getAuditLogs(
    childId?: string,
    editType?: "create" | "update" | "delete",
    limit?: number
  ): Promise<ActivityAudit[]> {
    let q = query(
      collection(db, this.AUDIT_COLLECTION),
      orderBy("editedAt", "desc")
    );

    if (childId) {
      q = query(q, where("childId", "==", childId));
    }

    if (editType) {
      q = query(q, where("editType", "==", editType));
    }

    if (limit) {
      q = query(q, firestoreLimit(limit));
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      editedAt: doc.data().editedAt?.toDate() || new Date(),
    })) as ActivityAudit[];
  }

  /**
   * Private method to create audit logs
   */
  private static async createAuditLog(
    activityId: string,
    activityData: Activity,
    editType: "create" | "update" | "delete",
    editedBy: string,
    newData?: Record<string, unknown>
  ): Promise<void> {
    const audit: Omit<ActivityAudit, "id"> = {
      activityId,
      childId: activityData.childId,
      activityType: activityData.activityType,
      date: activityData.date,
      editType,
      editedBy,
      editedAt: new Date(),
    };

    if (editType === "update") {
      audit.previousData = activityData as unknown as Record<string, unknown>;
      audit.newData = newData || {};
    } else if (editType === "delete") {
      audit.previousData = activityData as unknown as Record<string, unknown>;
    } else if (editType === "create") {
      audit.newData = activityData as unknown as Record<string, unknown>;
    }

    await addDoc(collection(db, this.AUDIT_COLLECTION), {
      ...audit,
      editedAt: serverTimestamp(),
    });
  }

  /**
   * Migration helper: Convert old structure to new structure
   */
  static async migrateFromOldStructure(
    childId: string,
    date: Date
  ): Promise<void> {
    const dateKey = date.toISOString().split("T")[0];
    const activityTypes: ActivityType[] = ["Bathroom", "Sleep", "Activities", "Food", "Needs"];

    for (const type of activityTypes) {
      try {
        // Read from old structure
        const oldRef = collection(db, `children/${childId}/activities/${dateKey}_${type}/items`);
        const oldSnapshot = await getDocs(oldRef);

        // Migrate each activity
        for (const oldDoc of oldSnapshot.docs) {
          const oldData = oldDoc.data();
          const newActivityId = crypto.randomUUID();

          const migratedActivity: Omit<Activity, "id"> = {
            childId,
            activityType: type,
            date: dateKey,
            timestamp: oldData.timestamp?.toDate() || new Date(),
            data: oldData,
            notes: oldData.notes,
            caregiverInfo: oldData.caregiverInfo,
            createdAt: oldData.createdAt?.toDate() || new Date(),
            updatedAt: oldData.updatedAt?.toDate(),
            createdBy: oldData.createdBy || "Unknown",
            lastModifiedBy: oldData.lastModifiedBy || "Unknown",
          };

          // Write to new structure
          await setDoc(doc(db, this.ACTIVITIES_COLLECTION, newActivityId), {
            ...migratedActivity,
            timestamp: migratedActivity.timestamp,
            createdAt: migratedActivity.createdAt,
            updatedAt: migratedActivity.updatedAt || null,
          });
        }
      } catch (error) {
        console.error(`Migration failed for ${type} on ${dateKey}:`, error);
      }
    }
  }
}
