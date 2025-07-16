import { db } from './firebase';
import { collection, doc, getDoc, setDoc, updateDoc, getDocs } from 'firebase/firestore';
import { Invite } from '../types/invite';

// Create a new invite
export async function createInvite(invite: Omit<Invite, 'createdAt' | 'used' | 'registeredUserId'>) {
  const email = invite.email.toLowerCase();
  const inviteRef = doc(db, 'invites', email);
  await setDoc(inviteRef, {
    ...invite,
    email,
    createdAt: new Date().toISOString(),
    used: false,
  });
}

// Get all invites
export async function getAllInvites() {
  const invitesSnap = await getDocs(collection(db, 'invites'));
  return invitesSnap.docs.map(doc => doc.data() as Invite);
}

// Mark invite as used
export async function markInviteUsed(email: string, userId: string) {
  const inviteRef = doc(db, 'invites', email.toLowerCase());
  await updateDoc(inviteRef, { used: true, registeredUserId: userId });
}

// Get invite by email
export async function getInviteByEmail(email: string): Promise<Invite | null> {
  const inviteRef = doc(db, 'invites', email.toLowerCase());
  const snap = await getDoc(inviteRef);
  return snap.exists() ? (snap.data() as Invite) : null;
}

// Export createInvite as named

