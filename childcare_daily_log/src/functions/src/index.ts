// functions/src/index.ts

import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";

admin.initializeApp();

type Parent = { email: string; [key: string]: any };

export const inviteNewParents = functions.firestore
  .document("children/{childId}")
  .onWrite(async (change, context) => {
    const afterData = change.after.exists ? change.after.data() : null;
    const beforeData = change.before.exists ? change.before.data() : null;

    if (!afterData) return null;

    const afterParents: Parent[] = afterData.parents || [];
    const beforeParents: Parent[] = beforeData?.parents || [];

    const newParents = afterParents.filter(
      (afterParent: Parent) =>
        !beforeParents.some((beforeParent: Parent) => beforeParent.email === afterParent.email)
    );

    const auth = admin.auth();

    for (const parent of newParents) {
      const email = parent.email;

      try {
        // Check if user already exists
        await auth.getUserByEmail(email);
        console.log(`User already exists for ${email}`);
      } catch (error: unknown) {
        if (
          typeof error === "object" &&
          error !== null &&
          "code" in error &&
          (error as { code?: string }).code === "auth/user-not-found"
        ) {
          // Create user and send email sign-in link
          const userRecord = await auth.createUser({ email });
          await auth.generateSignInWithEmailLink(email, {
            url: "https://your-app-domain.com/welcome", // ← replace with your actual URL
            handleCodeInApp: true,
          });

          console.log(`Invite sent to new parent: ${email}`);
        } else {
          console.error(`Error checking/creating user: ${email}`, error);
        }
      }
    }

    return null;
  });
