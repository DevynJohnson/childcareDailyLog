export type UserRole = 'admin' | 'caregiver' | 'parent';

export type User = {
  uid: string;
  email: string;
  role: UserRole;
  name: string;
  createdAt: string;
};
