import { Dialog } from "@headlessui/react";
import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { formatLocalDateTime } from "@/lib/timestamp";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Textarea } from "../../ui/textarea";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (
    data: {
      childId: string;
      activityType: string;
      notes: string;
      timestamp: Date;
      activityDetails: {
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
  };
};

export default function ActivitiesModal({
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
  const [activityDetail, setActivityDetail] = useState("");

  useEffect(() => {
    const base = new Date(selectedDate);
    const now = new Date();
    base.setHours(now.getHours(), now.getMinutes(), 0, 0);
    if (selectedActivity) {
      setTimestamp(new Date(selectedActivity.timestamp));
      setNotes(selectedActivity.notes || "");
      if (selectedActivity.activityDetails) {
        setActivityCategory(selectedActivity.activityDetails.activityCategory);
        setActivityDetail(selectedActivity.activityDetails.detail);
      } else {
        setActivityCategory("");
        setActivityDetail("");
      }
    } else {
      setTimestamp(base);
      setNotes("");
      setActivityCategory("");
      setActivityDetail("");
    }
  }, [isOpen, selectedDate, selectedActivity]);

  const handleSubmit = () => {
    onSubmit(
      {
        childId,
        activityType,
        notes,
        timestamp,
        activityDetails: {
          activityCategory,
          detail: activityDetail,
        },
      },
      activityId
    );
    onClose();
  };

  // Emoji mapping for activity types
  const activityEmojis: Record<string, string> = {
    "Toys": "🧸",
    "Games": "🎲",
    "Outdoor Play": "☀️",
    "Art/Crafts": "🎨",
    "Music/Singing": "🎵",
    "Reading/Storytime": "📚",
    "Other Activity": "✨",
  };

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      className="fixed z-50 inset-0 flex items-center justify-center p-4"
    >
      <Dialog.Panel className="bg-white dark:bg-zinc-900 p-6 rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto shadow-lg space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Activity Entry</h2>
          <button onClick={onClose}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <label className="block text-sm font-medium mb-1">
            Choose Activity Type
          </label>
          <div className="flex flex-wrap gap-2 mb-2">
            {[
              "Toys",
              "Games",
              "Outdoor Play",
              "Art/Crafts",
              "Music/Singing",
              "Books",
              "Other Activity"
            ].map((option) => (
              <button
                key={option}
                type="button"
                className={`rounded-full px-4 py-2 font-medium transition-colors
                  ${activityCategory === option
                    ? "bg-gradient-to-r from-[var(--dark-indigo)] to-indigo-500 text-white"
                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200"}
                  hover:bg-indigo-100 dark:hover:bg-indigo-900
                `}
                onClick={() => setActivityCategory(option)}
                aria-pressed={activityCategory === option}
              >
                {activityEmojis[option] || "✨"} {option}
              </button>
            ))}
          </div>

          {activityCategory && (
            <div className="flex items-center gap-2">
              <span className="text-2xl">
                {activityEmojis[activityCategory] || "✨"}
              </span>
              <Input
                type="text"
                placeholder="Add Details Here"
                value={activityDetail}
                onChange={(e) => setActivityDetail(e.target.value)}
              />
            </div>
          )}
        </div>

        <Textarea
          placeholder="Add any notes..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        <Input
          type="datetime-local"
          value={(() => {
            if (timestamp instanceof Date && !isNaN(timestamp.getTime())) {
              return formatLocalDateTime(timestamp);
            } else {
              const now = new Date();
              setTimestamp(now);
              return formatLocalDateTime(now);
            }
          })()}
          onChange={(e) => setTimestamp(new Date(e.target.value))}
        />

        <Button onClick={handleSubmit} className="w-full btn-primary">
          Save
        </Button>

        {activityId && onDelete && (
          <Button
            variant="destructive"
            onClick={() => {
              onDelete(activityId);
              onClose();
            }}
            className="w-full"
          >
            Delete
          </Button>
        )}
      </Dialog.Panel>
    </Dialog>
  );
}
