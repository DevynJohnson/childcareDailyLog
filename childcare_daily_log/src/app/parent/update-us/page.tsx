"use client";

import { useEffect, useState } from "react";
import { useAuth } from '@/context/AuthContext';
import { db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import { Button } from "@/components/ui/button";

// Types
import type { Child } from "@/types/child";

// Types
interface UpdatePost {
  id?: string;
  childId: string;
  parentEmail: string;
  content: string;
  createdAt: Date;
  childName: string;
}


export default function ParentUpdateUsPage() {
  const { user, role, loading } = useAuth();
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string>("");
  const [content, setContent] = useState("");
  const [posts, setPosts] = useState<UpdatePost[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Fetch children for this parent
  useEffect(() => {
    if (!user?.email) return;
    const fetchChildren = async () => {
      const snapshot = await getDocs(collection(db, "children"));
      const myChildren = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as Child))
        .filter(child => Array.isArray(child.parents) && child.parents.some((p) => p.email === user.email));
      setChildren(myChildren);
      if (myChildren.length > 0 && myChildren[0].id) setSelectedChildId(myChildren[0].id!);
    };
    fetchChildren();
  }, [user]);

  // Fetch posts for this parent
  useEffect(() => {
    if (!user?.email) return;
    const fetchPosts = async () => {
      const q = query(
        collection(db, "parentUpdates"),
        where("parentEmail", "==", user.email),
        orderBy("createdAt", "desc")
      );
      const snapshot = await getDocs(q);
      const postsList = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          childId: data.childId,
          parentEmail: data.parentEmail,
          content: data.content,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
          childName: data.childName || "",
        };
      });
      setPosts(postsList);
    };
    fetchPosts();
  }, [user, success]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");
    try {
      if (!selectedChildId || !content.trim()) {
        setError("Please select a child and enter an update.");
        setSubmitting(false);
        return;
      }
      const child = children.find(c => c.id === selectedChildId);
      await addDoc(collection(db, "parentUpdates"), {
        childId: selectedChildId,
        parentEmail: user?.email ?? "",
        content: content.trim(),
        createdAt: Timestamp.now(),
        childName: child ? `${child.firstName} ${child.lastName}` : "",
      });
      setContent("");
      setSuccess("Update posted!");
    } catch {
      setError("Failed to post update.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;
  if (role !== "parent") return <div className="p-6 text-red-600">You do not have permission to access this page.</div>;

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-center text-indigo-900 drop-shadow-lg mb-8" style={{ textShadow: '0 2px 8px #a5b4fc, 0 1px 0 #312e81' }}>Share a Weekend or Home Update</h1>
      <p className="mb-6 text-center text-white">Let your child&apos;s caregivers know what you did over the weekend or any special news. This helps them engage your child in conversation!</p>
      <form onSubmit={handleSubmit} className="mb-8 card-gradient p-6 rounded-3xl shadow-lg flex flex-col gap-4">
        <label className="font-semibold">Select Child:</label>
        <select
          className="rounded border px-3 py-2"
          value={selectedChildId}
          onChange={e => setSelectedChildId(e.target.value)}
        >
          {children.map(child => (
            <option key={child.id} value={child.id}>
              {child.firstName} {child.lastName}
            </option>
          ))}
        </select>
        <label className="font-semibold mt-2">Update:</label>
        <textarea
          className="rounded border px-3 py-2 min-h-[100px]"
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="Share what you did this weekend, special news, or anything you&apos;d like caregivers to know!"
        />
        {error && <div className="text-red-600">{error}</div>}
        {success && <div className="text-green-600">{success}</div>}
        <Button type="submit" disabled={submitting}>
          {submitting ? "Posting..." : "Post Update"}
        </Button>
      </form>
      <div className="mb-8">
        <h2 className="text-lg font-bold mb-4">Your Updates</h2>
        {posts.length === 0 ? (
          <div className="text-gray-500">No updates posted yet.</div>
        ) : (
          <ul className="space-y-4">
            {posts.map(post => (
              <li key={post.id} className="bg-white rounded-lg shadow p-4">
                <div className="text-sm text-gray-700 mb-2 font-semibold">{post.childName}</div>
                <div className="text-gray-900 mb-2">{post.content}</div>
                <div className="text-xs text-gray-500">{post.createdAt.toLocaleString()}</div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
