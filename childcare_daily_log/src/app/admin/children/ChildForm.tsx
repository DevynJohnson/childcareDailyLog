
import { useEffect, useState } from "react";
import { formatPhoneNumber } from "@/lib/formatPhoneNumber";
import type { Child, ParentInfo } from "@/types/child";

interface ChildFormProps {
  initialData?: Child | null;
  onSave: (child: Child) => void;
}

export default function ChildForm({ initialData, onSave }: ChildFormProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [notes, setNotes] = useState("");
  const [allergies, setAllergies] = useState("");
  const [parents, setParents] = useState<ParentInfo[]>([]);
  const [newParent, setNewParent] = useState<ParentInfo>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });

  const addParent = () => {
    if (!newParent.firstName || !newParent.lastName || !newParent.email) return;
    setParents([...parents, newParent]);
    setNewParent({ firstName: "", lastName: "", email: "", phone: "" });
  };

  // 👇 Prefill form fields when editing
  useEffect(() => {
    if (initialData) {
      setFirstName(initialData.firstName || "");
      setLastName(initialData.lastName || "");
      setBirthDate(
        initialData.birthDate
          ? new Date(initialData.birthDate).toISOString().split("T")[0]
          : ""
      );
      setNotes(initialData.notes || "");
      setAllergies(initialData.allergies || "");
      setParents(initialData.parents || []);
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...initialData, // preserves ID if editing
      firstName,
      lastName,
      birthDate,
      notes,
      allergies,
      parents,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block">First Name</label>
        <input
          type="text"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          className="w-full border px-2 py-1"
        />
      </div>
      <div>
        <label className="block">Last Name</label>
        <input
          type="text"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          className="w-full border px-2 py-1"
        />
      </div>
      <div>
        <label className="block">Birthdate</label>
        <input
          type="date"
          value={birthDate}
          onChange={(e) => setBirthDate(e.target.value)}
          className="w-full border px-2 py-1"
        />
      </div>
      <div>
        <label className="block">Allergies</label>
        <input
          type="text"
          value={allergies}
          onChange={(e) => setAllergies(e.target.value)}
          className="w-full border px-2 py-1"
        />
      </div>
      <div>
        <label className="block">Notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full border px-2 py-1"
        />
      </div>

      <div className="border-t pt-4 mt-4">
        <h2 className="text-lg font-semibold">Add Parent/Guardian</h2>
        <div className="grid grid-cols-2 gap-2 mt-2">
          <input
            type="text"
            placeholder="First Name"
            value={newParent.firstName}
            onChange={(e) =>
              setNewParent({ ...newParent, firstName: e.target.value })
            }
            className="p-2 border rounded"
          />
          <input
            type="text"
            placeholder="Last Name"
            value={newParent.lastName}
            onChange={(e) =>
              setNewParent({ ...newParent, lastName: e.target.value })
            }
            className="p-2 border rounded"
          />
          <input
            type="email"
            placeholder="Email"
            value={newParent.email}
            onChange={(e) =>
              setNewParent({ ...newParent, email: e.target.value })
            }
            className="p-2 border rounded col-span-2"
          />
          <input
            type="tel"
            value={newParent.phone ?? ""}
            onChange={(e) => {
              const formatted = formatPhoneNumber(e.target.value);
              setNewParent({ ...newParent, phone: formatted });
            }}
            placeholder="Phone Number"
            className="p-2 border rounded"
          />
        </div>
        <button
          type="button"
          onClick={addParent}
          className="mt-2 px-4 py-2 bg-green-600 text-white rounded"
        >
          Add Parent
        </button>

        {parents.length > 0 && (
          <div className="mt-4">
            <h3 className="font-semibold">Added Parents/Guardians:</h3>
            <ul className="list-disc list-inside">
              {parents.map((parent, index) => (
                <div key={index} className="border p-2 my-2">
                  <div>
                    {parent.firstName} {parent.lastName}
                  </div>
                  <div>{parent.email}</div>
                  {parent.phone && <div>{parent.phone}</div>}
                </div>
              ))}
            </ul>
          </div>
        )}
      </div>

      <button
        type="submit"
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        Save
      </button>
    </form>
  );
}
