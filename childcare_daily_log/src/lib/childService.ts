import { db } from './firebase';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';

export async function addParentEmailToChildren(childIds: string[], parentEmail: string) {
  const email = parentEmail.toLowerCase();
  for (const childId of childIds) {
    const childRef = doc(db, 'children', childId);
    await updateDoc(childRef, {
      parentEmails: arrayUnion(email),
    });
  }
}
