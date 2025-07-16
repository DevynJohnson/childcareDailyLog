// Firestore Invite type for onboarding
export type Invite = {
  email: string; // always lowercase
  role: 'parent' | 'caregiver';
  childIds?: string[]; // for parents, can be multiple
  createdAt: string; // ISO string
  used: boolean;
  registeredUserId?: string;
};
