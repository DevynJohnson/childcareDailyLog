
export interface ParentInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
}

export interface Child {
  id?: string;
  firstName: string;
  lastName: string;
  birthDate?: string | Date | null;
  notes?: string;
  allergies?: string;
  parents: ParentInfo[];
  parentEmails: string[];
}
