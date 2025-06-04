"use client";
import React, { useEffect, useState } from "react";

export default function UsersDashboard() {
  const [users, setUsers] = useState<User[]>([]);
  const [parentEmails, setParentEmails] = useState<ParentInfoWithStatus[]>([]);

  useEffect(() => {
    // Fetch users from Firestore
    // Fetch all parent emails from children
    // Cross-reference for registration status
  }, []);

  const handleSendInvite = async (email: string) => {
    // Write to Firestore collection (e.g., "invites") or call a backend function to trigger the email
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Users Dashboard</h1>
      <h2 className="text-xl font-semibold mt-8">Registered Users</h2>
      <ul className="mt-2">
        {users.map((user) => (
          <li key={user.email}>
            {user.email} — {user.role}
            {user.isSuperuser && " (Superuser)"}
          </li>
        ))}
      </ul>

      <h2 className="text-xl font-semibold mt-8">Parent/Guardian Emails</h2>
      <ul className="mt-2">
        {parentEmails.map((parent) => (
          <li key={parent.email}>
            {parent.firstName} {parent.lastName} — {parent.email}
            {parent.registered ? (
              <span className="text-green-600 ml-2">Registered</span>
            ) : (
              <button
                className="text-blue-600 ml-2 underline"
                onClick={() => handleSendInvite(parent.email)}
              >
                Send Invite
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
