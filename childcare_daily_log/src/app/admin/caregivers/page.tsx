"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { Dialog } from "@headlessui/react";
import { X, Plus, Edit2, Trash2, UserCheck, UserX } from "lucide-react";
import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  setDoc,
} from "firebase/firestore";
import { showSuccess, showError } from "@/lib/toastUtils";
import CaregiverForm from "@/components/CaregiverForm";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { CaregiverInfo } from "@/types/caregiver";

export default function CaregiverManagementPage() {
  const router = useRouter();
  const [caregivers, setCaregivers] = useState<CaregiverInfo[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCaregiver, setEditingCaregiver] = useState<CaregiverInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCaregivers = async () => {
    try {
      const snapshot = await getDocs(collection(db, "caregivers"));
      const results = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      })) as CaregiverInfo[];
      
      // Sort by active status first, then by hire date
      results.sort((a, b) => {
        if (a.isActive !== b.isActive) {
          return a.isActive ? -1 : 1;
        }
      });
      
      setCaregivers(results);
    } catch (error) {
      showError("Failed to load caregivers");
      console.error("Error fetching caregivers:", error);
    } finally {
      setLoading(false);
    }
  };

  // Secure: Only allow admins
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.replace('/auth');
        return;
      }
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (!userDoc.exists() || userDoc.data().role !== 'admin') {
        router.replace('/');
      } else {
        fetchCaregivers();
      }
    });
    return () => unsubscribe();
  }, []);

  const handleCreate = () => {
    setEditingCaregiver(null);
    setIsModalOpen(true);
  };

  const handleEdit = (caregiver: CaregiverInfo) => {
    setEditingCaregiver(caregiver);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this caregiver? This action cannot be undone.")) {
      return;
    }
    
    try {
      await deleteDoc(doc(db, "caregivers", id));
      showSuccess("Caregiver deleted successfully");
      fetchCaregivers();
    } catch (error) {
      showError("Failed to delete caregiver");
      console.error("Error deleting caregiver:", error);
    }
  };

  const handleToggleActive = async (caregiver: CaregiverInfo) => {
    if (!caregiver.id) return;
    
    try {
      await updateDoc(doc(db, "caregivers", caregiver.id), {
        isActive: !caregiver.isActive,
        updatedAt: new Date(),
      });
      
      showSuccess(`Caregiver ${caregiver.isActive ? 'deactivated' : 'activated'} successfully`);
      fetchCaregivers();
    } catch (error) {
      showError("Failed to update caregiver status");
      console.error("Error updating caregiver:", error);
    }
  };

  const handleSave = async (caregiverData: CaregiverInfo) => {
    try {
      if (editingCaregiver && editingCaregiver.id) {
        // Update existing caregiver
        const docRef = doc(db, "caregivers", editingCaregiver.id);
        await updateDoc(docRef, caregiverData);
        
        // Also create a role invite for this caregiver's email
        await setDoc(doc(db, "roleInvites", caregiverData.email), {
          email: caregiverData.email,
          role: "caregiver",
          createdAt: new Date(),
        });
        
        showSuccess("Caregiver updated successfully");
      } else {
        // Create new caregiver
        await addDoc(collection(db, "caregivers"), caregiverData);
        
        // Create role invite for new caregiver
        await setDoc(doc(db, "roleInvites", caregiverData.email), {
          email: caregiverData.email,
          role: "caregiver",
          createdAt: new Date(),
        });
        
        showSuccess("Caregiver created successfully! They can now register with their email.");
      }
      
      setIsModalOpen(false);
      fetchCaregivers();
    } catch (error) {
      showError("Failed to save caregiver");
      console.error("Error saving caregiver:", error);
    }
  };

  if (loading) {
    return <div className="p-6">Loading caregivers...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Manage Caregivers</h1>
        <Button onClick={handleCreate} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Caregiver
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {caregivers.map((caregiver) => (
          <Card key={caregiver.id} className="p-4">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-semibold text-lg">
                  {caregiver.firstName} {caregiver.lastName}
                </h3>
                <p className="text-sm text-muted-foreground">{caregiver.title}</p>
                <p className="text-xs font-mono bg-muted px-1 rounded mt-1">
                  {caregiver.initials}
                </p>
              </div>
              <div className="flex items-center gap-1">
                {caregiver.isActive ? (
                  <UserCheck className="w-4 h-4 text-green-600" />
                ) : (
                  <UserX className="w-4 h-4 text-red-600" />
                )}
              </div>
            </div>
            
            <div className="space-y-1 text-sm text-muted-foreground mb-3">
              <p>{caregiver.email}</p>
              {caregiver.phone && <p>{caregiver.phone}</p>}
            </div>
            
            <div className="flex justify-between">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleEdit(caregiver)}
                className="flex items-center gap-1"
              >
                <Edit2 className="w-3 h-3" />
                Edit
              </Button>
              
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant={caregiver.isActive ? "outline" : "default"}
                  onClick={() => handleToggleActive(caregiver)}
                  className="text-xs"
                >
                  {caregiver.isActive ? "Deactivate" : "Activate"}
                </Button>
                
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => caregiver.id && handleDelete(caregiver.id)}
                  className="text-red-600 hover:text-red-800"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {caregivers.length === 0 && (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">No caregivers found. Add one to get started!</p>
        </Card>
      )}

      <Dialog
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        className="fixed inset-0 z-50 overflow-y-auto"
      >
        <div className="flex items-center justify-center min-h-screen p-4">
          <Dialog.Panel className="bg-white text-gray-900 rounded p-6 w-full max-w-lg shadow-lg relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-3 right-3"
            >
              <X className="w-5 h-5" />
            </button>
            
            <h2 className="text-xl font-semibold mb-4">
              {editingCaregiver ? 'Edit' : 'Create'} Caregiver
            </h2>
            
            <CaregiverForm
              initialData={editingCaregiver}
              onSave={handleSave}
              onCancel={() => setIsModalOpen(false)}
            />
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
}
