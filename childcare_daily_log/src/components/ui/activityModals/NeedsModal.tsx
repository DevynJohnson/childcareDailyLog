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
      needsData: string[];
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
  };
};

const NEEDS_OPTIONS = ["Diapers", "Wipes", "Extra Clothes", "Snacks", "Other"];

export default function NeedsModal({
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
  const [needs, setNeeds] = useState<string[]>([]);
  const [otherNeedDetail, setOtherNeedDetail] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    const base = new Date(selectedDate);
    const now = new Date();
    base.setHours(now.getHours(), now.getMinutes(), 0, 0);
    if (selectedActivity) {
      setTimestamp(new Date(selectedActivity.timestamp));
      setNotes(selectedActivity.notes || "");
      const needsFromNotes = selectedActivity.notes?.split(", ").filter(Boolean) || [];
      setNeeds(needsFromNotes);
      const otherNote = needsFromNotes.find((item) => item.startsWith("Other:"));
      if (otherNote) {
        setOtherNeedDetail(otherNote.replace("Other:", "").trim());
      } else {
        setOtherNeedDetail("");
      }
    } else {
      setTimestamp(base);
      setNeeds([]);
      setOtherNeedDetail("");
      setNotes("");
    }
  }, [isOpen, selectedDate, selectedActivity]);

  const handleSubmit = () => {
    // Save selected needs as a separate field (needsData)
    const formattedNeeds = needs.map((need) =>
      need === "Other" && otherNeedDetail ? `Other: ${otherNeedDetail}` : need
    );
    onSubmit(
      {
        childId,
        activityType,
        notes,
        timestamp,
        needsData: formattedNeeds,
      },
      activityId
    );
    onClose();
  };

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      className="fixed z-50 inset-0 flex items-center justify-center p-4"
    >
      <Dialog.Panel className="bg-white dark:bg-zinc-900 p-6 rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto shadow-lg space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Needs Entry</h2>
          <button onClick={onClose}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-wrap gap-2 mb-2">
          {NEEDS_OPTIONS.map((item) => (
            <button
              key={item}
              type="button"
              className={`rounded-full px-4 py-2 font-medium transition-colors
                ${needs.includes(item)
                  ? "bg-gradient-to-r from-[var(--dark-indigo)] to-indigo-500 text-white"
                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200"}
                hover:bg-indigo-100 dark:hover:bg-indigo-900
              `}
              onClick={() => {
                if (needs.includes(item)) {
                  setNeeds((prev) => prev.filter((n) => n !== item));
                  if (item === "Other") setOtherNeedDetail("");
                } else {
                  setNeeds((prev) => [...prev, item]);
                }
              }}
              aria-pressed={needs.includes(item)}
            >
              {item}
            </button>
          ))}
        </div>

        {needs.includes("Other") && (
          <Input
            type="text"
            placeholder="Please add a description"
            value={otherNeedDetail}
            onChange={(e) => setOtherNeedDetail(e.target.value)}
            className="mb-2"
          />
        )}

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
