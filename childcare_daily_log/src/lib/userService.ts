import { db } from './firebase';
import { doc, setDoc } from 'firebase/firestore';
import { User, UserRole } from '../types/user';

export async function createUserProfile({ uid, email, role, name }: { uid: string; email: string; role: UserRole; name: string }) {
  await setDoc(doc(db, 'users', uid), {
    uid,
    email: email.toLowerCase(),
    role,
    name,
    createdAt: new Date().toISOString(),
  });
}
