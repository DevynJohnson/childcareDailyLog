import { useEffect, useState } from "react";
import { generateInitials, type CaregiverInfo } from "@/types/caregiver";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface CaregiverFormProps {
  initialData?: CaregiverInfo | null;
  onSave: (caregiver: CaregiverInfo) => void;
  onCancel: () => void;
}

export default function CaregiverForm({ initialData, onSave, onCancel }: CaregiverFormProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  // Removed preferredName and title fields
  const [email, setEmail] = useState("");
  // Removed phone field
  // Removed hireDate field
  // Removed isActive state

  // Pre-fill form fields when editing
  useEffect(() => {
    if (initialData) {
      setFirstName(initialData.firstName || "");
      setLastName(initialData.lastName || "");
      // Removed preferredName and title from initialData
      setEmail(initialData.email || "");
      // Removed phone from initialData
      // Removed hireDate from initialData
      // Removed isActive logic
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const caregiverData: CaregiverInfo = {
      ...initialData, // preserves ID if editing
      firstName,
      lastName,
      email,
      // hireDate removed
      // removed isActive
      initials: generateInitials(firstName, lastName),
      updatedAt: new Date(),
    };

    if (!initialData) {
      caregiverData.createdAt = new Date();
    }

    onSave(caregiverData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">First Name *</label>
          <Input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
            placeholder="First name"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Last Name *</label>
          <Input
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
            placeholder="Last name"
          />
        </div>
      </div>

      {/* Title field removed */}

      <div>
        <label className="block text-sm font-medium mb-1">Email *</label>
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="email@example.com"
        />
      </div>

      {/* Phone Number field removed */}

      {/* Removed Active Employee checkbox */}

      {firstName && lastName && (
        <div className="bg-muted p-3 rounded">
          <p className="text-sm text-muted-foreground">
            Initials: <span className="font-bold">{generateInitials(firstName, lastName)}</span>
          </p>
        </div>
      )}

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          {initialData ? "Update" : "Create"} Caregiver
        </Button>
      </div>
    </form>
  );
}
