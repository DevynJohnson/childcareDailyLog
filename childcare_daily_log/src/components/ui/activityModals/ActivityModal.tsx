import { Dialog } from "@headlessui/react";
import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { formatLocalDateTime } from "@/lib/timestamp";
import "react-day-picker/dist/style.css";
import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";
import { Textarea } from "./ui/textarea";
import { Input } from "./ui/input";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (
    data: {
      childId: string;
      activityType: string;
      notes: string;
      timestamp: Date;
activityDetails?: {
        activityCategory: string;
        detail: string;
      };
       },
    activityId?: string
  ) => void;
  onDelete?: (activityId: string) => void;
  childId: string;
  activityType: string;
  selectedDate: Date;
  activityId?: string;
  selectedActivity?: {
    notes: string;
    timestamp: Date;
    activityDetails?: {
      activityCategory: string;
      detail: string;
    };

    export default function ActivityModal({
      isOpen,
      onClose,
      onSubmit,
      onDelete,
      childId,
      activityType,
      selectedDate,
      activityId,
      selectedActivity,
    }: Props) {
      const [timestamp, setTimestamp] = useState<Date>(() => {
        const base = new Date(selectedDate);
        const now = new Date();
        base.setHours(now.getHours(), now.getMinutes(), 0, 0);
        return base;
      });

       const [notes, setNotes] = useState("");
       const [activityCategory, setActivityCategory] = useState("");
       const [detail, setDetail] = useState("");