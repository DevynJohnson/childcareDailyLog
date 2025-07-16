import { db } from './firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { User } from '../types/user';

export async function getUsersByRole(role: 'parent' | 'caregiver'): Promise<User[]> {
  const q = query(collection(db, 'users'), where('role', '==', role));
  const snap = await getDocs(q);
  return snap.docs.map(doc => doc.data() as User);
}
