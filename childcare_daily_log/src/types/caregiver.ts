export type CaregiverInfo = {
  id?: string;
  firstName: string;
  lastName: string;
  email: string;
  initials: string; // Auto-generated from first/last name
  createdAt?: Date;
  updatedAt?: Date;
};

// Helper function to generate initials
export function generateInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}
