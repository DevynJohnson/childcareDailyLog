"use client";

import { useEffect, useState } from "react";
import { useAuth } from '@/context/AuthContext';
import { Dialog } from "@headlessui/react";
import { X, Plus } from "lucide-react";
import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import ChildForm from "./ChildForm";

import type { Child } from "@/types/child";

function ChildrenAdminPage() {
  const { role, loading } = useAuth();
  const isAdmin = role === 'admin';
  const [children, setChildren] = useState<Child[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingChild, setEditingChild] = useState<Child | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  // Track which parent info is open per child (childId: parentEmail)
  const [openParentInfo, setOpenParentInfo] = useState<{ [childId: string]: string | null }>({});

  const fetchChildren = async () => {
    const snapshot = await getDocs(collection(db, "children"));
    const results = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Child[];
    results.sort((a, b) => {
      const lastA = (a.lastName || '').toLowerCase();
      const lastB = (b.lastName || '').toLowerCase();
      if (lastA < lastB) return -1;
      if (lastA > lastB) return 1;
      const firstA = (a.firstName || '').toLowerCase();
      const firstB = (b.firstName || '').toLowerCase();
      if (firstA < firstB) return -1;
      if (firstA > firstB) return 1;
      return 0;
    });
    setChildren(results);
  };

useEffect(() => {
  if (!loading && isAdmin) {
    fetchChildren();
  }
}, [loading, isAdmin]);

  const handleCreate = () => {
    setEditingChild(null);
    setIsModalOpen(true);
  };

  const handleEdit = (child: Child) => {
    setEditingChild(child);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    await deleteDoc(doc(db, "children", id));
    setDeleteConfirmId(null);
    fetchChildren();
  };

  const handleSave = async (child: Child) => {
    // Extract parent emails from parents array
    const parentEmails = Array.isArray(child.parents)
      ? child.parents.map((p) => p.email).filter(Boolean)
      : [];
    const payload = {
      firstName: child.firstName,
      lastName: child.lastName,
      birthDate: child.birthDate || "",
      allergies: child.allergies || "",
      notes: child.notes || "",
      parents: child.parents || [],
      parentEmails,
    };

    if (editingChild && editingChild.id) {
      const docRef = doc(db, "children", editingChild.id);
      await updateDoc(docRef, payload);
    } else {
      await addDoc(collection(db, "children"), payload);
    }

    setIsModalOpen(false);
    fetchChildren();
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  if (!isAdmin) {
    return <div className="p-6 text-red-600">You do not have permission to access this page.</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-center text-indigo-900 drop-shadow-lg mb-8" style={{ textShadow: '0 2px 8px #a5b4fc, 0 1px 0 #312e81' }}>Manage Children</h1>
      <button
        onClick={handleCreate}
        className="rounded-full px-6 py-3 font-medium transition-colors text-white text-center bg-gradient-to-r from-[var(--abc-green)] to-[#7ed957] hover:from-green-700 hover:to-green-400 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 shadow mt-2 mb-6 flex items-center gap-2"
        type="button"
      >
        <Plus className="w-4 h-4" />
        Add Child
      </button>
      <table
        className="min-w-full bg-white text-center font-semibold border-2 mb-8"
        style={{ color: 'var(--dark-indigo)', textShadow: 'none', borderColor: 'var(--dark-indigo)' }}
      >
        <thead>
          <tr
            className="bg-dark-100"
            style={{ borderBottom: '4px solid var(--dark-indigo)' }}
          >
            <th className="p-2 border text-center w-40" style={{ borderColor: 'var(--dark-indigo)' }}>Name</th>
            {/* Removed Birthday and Age columns */}
            <th className="p-2 border text-center w-40" style={{ borderColor: 'var(--dark-indigo)' }}>Parent/Guardians</th>
            <th className="p-2 border text-center w-32" style={{ borderColor: 'var(--dark-indigo)' }}>Allergies</th>
            <th className="p-2 border text-center w-32" style={{ borderColor: 'var(--dark-indigo)' }}>Notes</th>
            <th className="p-2 border text-center w-40" style={{ borderColor: 'var(--dark-indigo)' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {children.map((child) => (
            <tr key={child.id} className="border-t" style={{ borderColor: 'var(--dark-indigo)' }}>
              <td className="p-2 border" style={{ borderColor: 'var(--dark-indigo)' }}>{child.firstName} {child.lastName}</td>
              {/* Removed Birthday and Age cells */}
              <td className="p-2 border" style={{ borderColor: 'var(--dark-indigo)' }}>
                {child.parents && child.parents.length > 0 ? (
                  <div className="flex flex-col gap-2">
                    {child.parents.map((parent) => {
                      const childKey = String(child.id);
                      const isOpen = openParentInfo[childKey] === parent.email;
                      return (
                        <div key={parent.email} className="relative">
                          <button
                            type="button"
                            className="w-full text-left px-3 py-1 rounded font-medium transition-colors mb-1 shadow-sm text-white bg-gradient-to-r from-[var(--dark-indigo)] to-indigo-500 hover:from-indigo-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2"
                            style={{ minWidth: 0, fontSize: '0.98rem' }}
                            onClick={() => setOpenParentInfo((prev) => ({ ...prev, [childKey]: isOpen ? null : parent.email }))}
                          >
                            {parent.firstName} {parent.lastName}
                          </button>
                          {isOpen && (
                            <div
                              className="absolute z-[100] bg-white border border-indigo-200 rounded shadow-lg p-3 min-w-[180px] text-sm"
                              style={{ minWidth: 180, top: '-8px', right: '-200px' }}
                            >
                              <div className="mb-1"><span className="font-semibold">Email:</span> {parent.email}</div>
                              {parent.phone && (
                                <div><span className="font-semibold">Phone:</span> {parent.phone}</div>
                              )}
                              <button
                                type="button"
                                className="mt-2 px-2 py-1 rounded bg-indigo-200 text-[var(--dark-indigo)] hover:bg-indigo-300 text-xs font-semibold"
                                onClick={() => setOpenParentInfo((prev) => ({ ...prev, [childKey]: null }))}
                              >
                                Close
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  "N/A"
                )}
              </td>
              <td className="p-2 border" style={{ borderColor: 'var(--dark-indigo)' }}>{child.allergies ? child.allergies : "None provided"}</td>
              <td className="p-2 border" style={{ borderColor: 'var(--dark-indigo)' }}>{child.notes}</td>
              <td className="p-2 border" style={{ borderColor: 'var(--dark-indigo)' }}>
                <div className="flex flex-row gap-2 items-center justify-center min-w-[160px]">
                  <button
                    onClick={() => handleEdit(child)}
                    className="px-4 py-2 rounded font-medium transition-colors text-white bg-gradient-to-r from-[var(--dark-indigo)] to-indigo-500 hover:from-indigo-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2"
                    style={{ minWidth: 70 }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => child.id != null ? setDeleteConfirmId(String(child.id)) : undefined}
                    className="px-4 py-2 rounded bg-red-600 text-white font-medium hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2"
                    style={{ minWidth: 70 }}
                    disabled={child.id == null}
                  >
                    Delete
                  </button>
                </div>
                {deleteConfirmId === String(child.id) && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                    <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-xs flex flex-col items-center">
                      <p className="mb-4 text-center text-lg text-gray-900 font-semibold">Are you sure you want to delete this child?</p>
                      <div className="flex gap-4">
                        <button
                          onClick={() => setDeleteConfirmId(null)}
                          className="px-4 py-2 rounded bg-gray-300 text-gray-800 font-medium hover:bg-gray-400 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleDelete(String(child.id))}
                          className="px-4 py-2 rounded bg-red-600 text-white font-medium hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2"
                        >
                          Confirm Delete
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

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
            <ChildForm initialData={editingChild} onSave={handleSave} />
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
}

export default ChildrenAdminPage;