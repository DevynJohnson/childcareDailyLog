"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { Dialog } from "@headlessui/react";
import { X, Plus, Edit2, Trash2 } from "lucide-react";
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
import { Card } from "@/components/ui/card";
import type { CaregiverInfo } from "@/types/caregiver";

export default function CaregiverManagementPage() {
  const router = useRouter();
  const [caregivers, setCaregivers] = useState<CaregiverInfo[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCaregiver, setEditingCaregiver] = useState<CaregiverInfo | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
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
      // Sort by last name, then first name
      results.sort((a, b) => {
        const lastNameCompare = a.lastName.localeCompare(b.lastName, undefined, { sensitivity: 'base' });
        if (lastNameCompare !== 0) return lastNameCompare;
        return a.firstName.localeCompare(b.firstName, undefined, { sensitivity: 'base' });
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
  }, [router]);

  const handleCreate = () => {
    setEditingCaregiver(null);
    setIsModalOpen(true);
  };

  const handleEdit = (caregiver: CaregiverInfo) => {
    setEditingCaregiver(caregiver);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, "caregivers", id));
      showSuccess("Caregiver deleted successfully");
      setDeleteConfirmId(null);
      fetchCaregivers();
    } catch (error) {
      showError("Failed to delete caregiver");
      console.error("Error deleting caregiver:", error);
    }
  };

  // Removed handleToggleActive and all isActive logic

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
        <h1 className="text-2xl font-bold text-center text-indigo-900 drop-shadow-lg" style={{ textShadow: '0 2px 8px #a5b4fc, 0 1px 0 #312e81' }}>Manage Caregivers</h1>
      <div className="flex justify-between items-center">
        <button
          onClick={handleCreate}
          className="rounded-full px-6 py-3 font-medium transition-colors text-white text-center bg-gradient-to-r from-[var(--abc-green)] to-[#7ed957] hover:from-green-700 hover:to-green-400 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 shadow flex items-center gap-2"
          type="button"
        >
          <Plus className="w-4 h-4" />
          Add Caregiver
        </button>
      </div>

      <table
        className="min-w-full bg-white text-center font-semibold border-2 mb-8"
        style={{ color: 'var(--dark-indigo)', textShadow: 'none', borderColor: 'var(--dark-indigo)' }}
      >
        <thead>
          <tr
            className="bg-dark-100"
            style={{ borderBottom: '4px solid var(--dark-indigo)' }}
          >
            <th className="p-2 border text-center" style={{ borderColor: 'var(--dark-indigo)' }}>Name</th>
            <th className="p-2 border text-center" style={{ borderColor: 'var(--dark-indigo)' }}>Email Address</th>
            <th className="p-2 border text-center" style={{ borderColor: 'var(--dark-indigo)' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {caregivers.map((caregiver) => (
            <tr key={caregiver.id} className="border-t" style={{ borderColor: 'var(--dark-indigo)' }}>
              <td className="p-2 border" style={{ borderColor: 'var(--dark-indigo)' }}>{caregiver.firstName} {caregiver.lastName}</td>
              <td className="p-2 border" style={{ borderColor: 'var(--dark-indigo)' }}>{caregiver.email}</td>
              <td className="p-2 border" style={{ borderColor: 'var(--dark-indigo)' }}>
                <div className="flex flex-row gap-2 items-center justify-center min-w-[160px]">
                  <button
                    onClick={() => handleEdit(caregiver)}
                    className="px-4 py-2 rounded font-medium transition-colors text-white bg-gradient-to-r from-[var(--dark-indigo)] to-indigo-500 hover:from-indigo-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 flex items-center gap-1"
                    style={{ minWidth: 70 }}
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => caregiver.id != null ? setDeleteConfirmId(String(caregiver.id)) : undefined}
                    className="px-4 py-2 rounded bg-red-600 text-white font-medium hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 flex items-center gap-1"
                    style={{ minWidth: 70 }}
                    disabled={caregiver.id == null}
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-auto">
          {/* No background overlay, just the modal */}
          <div className="relative bg-white rounded-lg shadow-lg p-6 w-full max-w-xs flex flex-col items-center border-2 border-red-200">
            <p className="mb-4 text-center text-lg text-gray-900 font-semibold drop-shadow">Are you sure you want to delete this caregiver?</p>
            <div className="flex gap-4">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 rounded bg-gray-300 text-gray-800 font-medium hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="px-4 py-2 rounded bg-red-600 text-white font-medium hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

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
