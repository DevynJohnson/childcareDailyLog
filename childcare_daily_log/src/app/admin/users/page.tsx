"use client";
import { useEffect, useState } from "react";
import { collection, getDocs, doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { showSuccess, showError } from "@/lib/toastUtils";


type User = {
  email: string;
  role: string;
};

type ParentInfo = {
  firstName: string;
  lastName: string;
  email: string;
};

type ParentInfoWithStatus = ParentInfo & {
  registered: boolean;
};

export default function UsersDashboard() {
  const [users, setUsers] = useState<User[]>([]);
  const [parentEmails, setParentEmails] = useState<ParentInfoWithStatus[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      // Fetch all registered users
      const userSnap = await getDocs(collection(db, "users"));
      const usersList = userSnap.docs.map(doc => doc.data() as User);
      setUsers(usersList);

      // Fetch all parents from children
      const childSnap = await getDocs(collection(db, "children"));
      const allParents: ParentInfo[] = [];

      childSnap.docs.forEach(doc => {
        const data = doc.data();
        if (Array.isArray(data.parents)) {
          data.parents.forEach((parent: ParentInfo) => {
            if (!allParents.some(p => p.email === parent.email)) {
              allParents.push(parent);
            }
          });
        }
      });

      // Determine if parent is registered
      const parentsWithStatus: ParentInfoWithStatus[] = allParents.map(parent => ({
        ...parent,
        registered: usersList.some(user => user.email === parent.email),
      }));

      setParentEmails(parentsWithStatus);
    };

    fetchData();
  }, []);

const handleSendInvite = async (email: string) => {
  try {
    const inviteRef = doc(db, "invites", email);
    await setDoc(inviteRef, {
      email,
      timestamp: new Date().toISOString(),
      status: "pending",
    });
    showSuccess(`Invite sent to ${email}`);
  } catch (err) {
    console.error("Error sending invite:", err);
    showError("Failed to send invite.");
  }
};

  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Users Dashboard</h1>

      <section>
        <h2 className="text-xl font-semibold mb-2">Registered Users</h2>
        <ul className="space-y-1">
          {users.map(user => (
            <li key={user.email} className="text-sm">
              <span className="font-medium">{user.email}</span> — {user.role}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-semibold mt-6 mb-2">Parent/Guardian Emails</h2>
        <ul className="space-y-2">
          {parentEmails.map(parent => (
            <li key={parent.email} className="text-sm flex items-center justify-between">
              <div>
                {parent.firstName} {parent.lastName} — {parent.email}
              </div>
              {parent.registered ? (
                <span className="text-green-600">Registered</span>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSendInvite(parent.email)}
                >
                  Send Invite
                </Button>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
