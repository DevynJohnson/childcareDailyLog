"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatTimestamp } from "@/lib/dateUtils";
import { Calendar, User, Edit, Trash2, Plus } from "lucide-react";

type AuditEntry = {
  id: string;
  childId: string;
  childName?: string;
  activityType: string;
  editType: "create" | "update" | "delete";
  timestamp: Date;
  editedBy?: string;
  createdBy?: string;
  deletedBy?: string;
  notes?: string;
  [key: string]: unknown;
};

type Child = {
  id: string;
  firstName: string;
  lastName: string;
};

export default function ActivityAuditPage() {
  const [auditEntries, setAuditEntries] = useState<AuditEntry[]>([]);
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string>("all");
  const [selectedEditType, setSelectedEditType] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  const fetchChildren = async () => {
    const snapshot = await getDocs(collection(db, "children"));
    const results = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Child[];
    setChildren(results);
  };

  const fetchAuditEntries = async () => {
    try {
      const allEntries: AuditEntry[] = [];

      // Get children to filter by if needed
      const childrenToQuery =
        selectedChildId === "all"
          ? children
          : children.filter((c) => c.id === selectedChildId);

      for (const child of childrenToQuery) {
        const activityTypes = [
          "Bathroom",
          "Sleep",
          "Activities",
          "Food",
          "Needs",
        ];

        for (const activityType of activityTypes) {
          // Get recent activity documents
          const activitiesRef = collection(
            db,
            `children/${child.id}/activities`
          );
          const activitiesSnapshot = await getDocs(activitiesRef);

          for (const activityDoc of activitiesSnapshot.docs) {
            if (activityDoc.id.includes(activityType)) {
              // Get items and their edit history
              const itemsRef = collection(
                db,
                `children/${child.id}/activities/${activityDoc.id}/items`
              );
              const itemsSnapshot = await getDocs(itemsRef);

              for (const itemDoc of itemsSnapshot.docs) {
                const itemData = itemDoc.data();

                // Add creation entry
                if (itemData.createdAt) {
                  allEntries.push({
                    id: `create-${itemDoc.id}`,
                    childId: child.id,
                    childName: `${child.firstName} ${child.lastName}`,
                    activityType,
                    editType: "create",
                    timestamp: itemData.createdAt.toDate(),
                    createdBy:
                      itemData.createdBy ||
                      itemData.lastModifiedBy ||
                      "Unknown",
                    notes: itemData.notes,
                    ...itemData,
                  });
                }

                // Get edit history
                const historyRef = collection(
                  db,
                  `children/${child.id}/activities/${activityDoc.id}/items/${itemDoc.id}/editHistory`
                );
                const historyQuery = query(
                  historyRef,
                  orderBy("editedAt", "desc"),
                  limit(50)
                );
                const historySnapshot = await getDocs(historyQuery);

                historySnapshot.docs.forEach((historyDoc) => {
                  const historyData = historyDoc.data();
                  allEntries.push({
                    id: historyDoc.id,
                    childId: child.id,
                    childName: `${child.firstName} ${child.lastName}`,
                    activityType,
                    editType:
                      historyData.editType ||
                      (historyData.deletedAt ? "delete" : "update"),
                    timestamp:
                      (
                        historyData.editedAt ||
                        historyData.deletedAt ||
                        historyData.updatedAt
                      )?.toDate() || new Date(),
                    editedBy:
                      historyData.editedBy ||
                      historyData.deletedBy ||
                      "Unknown",
                    notes: historyData.notes,
                    ...historyData,
                  });
                });
              }
            }
          }
        }
      }

      // Sort by timestamp descending
      allEntries.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      // Filter by edit type if specified
      const filteredEntries =
        selectedEditType === "all"
          ? allEntries
          : allEntries.filter((entry) => entry.editType === selectedEditType);

      setAuditEntries(filteredEntries.slice(0, 100)); // Limit to 100 most recent
    } catch (error) {
      console.error("Error fetching audit entries:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChildren();
  }, []);

  useEffect(() => {
    if (children.length > 0) {
      fetchAuditEntries();
    }
  }, [children, selectedChildId, selectedEditType]);

  const getEditIcon = (editType: string) => {
    switch (editType) {
      case "create":
        return <Plus className="w-4 h-4 text-green-600" />;
      case "update":
        return <Edit className="w-4 h-4 text-blue-600" />;
      case "delete":
        return <Trash2 className="w-4 h-4 text-red-600" />;
      default:
        return <Edit className="w-4 h-4" />;
    }
  };

  const getEditColor = (editType: string) => {
    switch (editType) {
      case "create":
        return "bg-green-100 text-green-800";
      case "update":
        return "bg-blue-100 text-blue-800";
      case "delete":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return <div className="p-6">Loading audit log...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Activity Audit Log</h1>
        <div className="flex gap-4">
          <Select value={selectedChildId} onValueChange={setSelectedChildId}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by child" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Children</SelectItem>
              {children.map((child) => (
                <SelectItem key={child.id} value={child.id}>
                  {child.firstName} {child.lastName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedEditType} onValueChange={setSelectedEditType}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by action" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              <SelectItem value="create">Created</SelectItem>
              <SelectItem value="update">Updated</SelectItem>
              <SelectItem value="delete">Deleted</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-3">
        {auditEntries.map((entry) => (
          <Card key={entry.id} className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                {getEditIcon(entry.editType)}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">{entry.childName}</span>
                    <Badge variant="outline">{entry.activityType}</Badge>
                    <Badge className={getEditColor(entry.editType)}>
                      {entry.editType}
                    </Badge>
                  </div>

                  {entry.notes && (
                    <p className="text-sm text-muted-foreground mb-2">
                      &ldquo;{entry.notes}&rdquo;
                    </p>
                  )}

                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {entry.editedBy ||
                        entry.createdBy ||
                        entry.deletedBy ||
                        "Unknown"}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatTimestamp(entry.timestamp)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {auditEntries.length === 0 && (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">
            No audit entries found for the selected filters.
          </p>
        </Card>
      )}
    </div>
  );
}
