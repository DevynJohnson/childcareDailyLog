"use client";

import { useEffect, useState } from "react";
import { Dialog } from "@headlessui/react";
import { X } from "lucide-react";
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

type ParentInfo = {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
};

type Child = {
  id?: string;
  firstName: string;
  lastName: string;
  birthDate?: Date | null;
  allergies?: string;
  notes?: string;
  parents?: ParentInfo[];
};

export default function ChildManagementPage() {
  const [children, setChildren] = useState<Child[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingChild, setEditingChild] = useState<Child | null>(null);

  const fetchChildren = async () => {
    const snapshot = await getDocs(collection(db, "children"));
    const results = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Child[];
    setChildren(results);
  };

  useEffect(() => {
    fetchChildren();
  }, []);

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
    fetchChildren();
  };

 const handleSave = async (child: Child) => {
  const payload = {
    firstName: child.firstName,
    lastName: child.lastName,
    birthDate: child.birthDate || "",
    allergies: child.allergies || "",
    notes: child.notes || "",
    parents: child.parents || [],
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


  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Manage Children</h1>
      <button
        onClick={handleCreate}
        className="bg-blue-600 text-white px-4 py-2 rounded mb-4"
      >
        Add Child
      </button>
      <table className="min-w-full border">
        <thead>
          <tr className="bg-dark-100 text-left">
            <th className="p-2 border">First Name</th>
            <th className="p-2 border">Last Name</th>
            <th className="p-2 border">Birthday</th>
            <th className="p-2 border">Age</th>
            <th className="p-2 border">Parent/Guardians</th>
            <th className="p-2 border">Allergies</th>
            <th className="p-2 border">Notes</th>
            <th className="p-2 border">Actions</th>
          </tr>
        </thead>
        <tbody>
          {children.map((child) => (
            <tr key={child.id} className="border-t">
              <td className="p-2 border">{child.firstName}</td>
              <td className="p-2 border">{child.lastName}</td>
              <td className="p-2 border">
                {child.birthDate
                  ? new Date(child.birthDate).toLocaleDateString()
                  : "N/A"}
              </td>
              <td className="p-2 border">
                {child.birthDate
                  ? Math.floor(
                      (new Date().getTime() -
                        new Date(child.birthDate).getTime()) /
                        (1000 * 60 * 60 * 24 * 365.25)
                    )
                  : "N/A"}
              </td>
              <td className="p-2 border">
                {child.parents
                  ? child.parents.map((parent) => (
                      <div key={parent.email}>
                        {parent.firstName} {parent.lastName} ({parent.email})
                      </div>
                    ))
                  : "N/A"}
              </td>
              <td className="p-2 border">{child.allergies}</td>
              <td className="p-2 border">{child.notes}</td>
              <td className="p-2 border space-x-2">
                <button
                  onClick={() => handleEdit(child)}
                  className="text-blue-600"
                >
                  Edit
                </button>
                <button
                  onClick={() =>
                    child.id != null
                      ? handleDelete(String(child.id))
                      : undefined
                  }
                  className="text-red-600"
                  disabled={child.id == null}
                >
                  Delete
                </button>
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
