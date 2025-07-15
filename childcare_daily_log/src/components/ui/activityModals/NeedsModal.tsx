import { Dialog } from "@headlessui/react";
import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { formatLocalDateTime } from "@/lib/timestamp";
import { Button } from "../../ui/button";
import { Checkbox } from "../../ui/checkbox";
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
    const formattedNeeds = needs.map((need) =>
      need === "Other" && otherNeedDetail ? `Other: ${otherNeedDetail}` : need
    );
    onSubmit(
      {
        childId,
        activityType,
        notes: formattedNeeds.join(", "),
        timestamp,
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
      <Dialog.Panel className="bg-green-700 border border-black p-6 rounded-lg w-full max-w-md shadow-lg space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-white drop-shadow">Needs Entry</h2>
          <button onClick={onClose}>
            <X className="w-5 h-5 text-white drop-shadow" />
          </button>
        </div>

        <div className="space-y-2">
          {NEEDS_OPTIONS.map((item) => (
            <label key={item} className="flex items-center space-x-2 text-white drop-shadow">
              <Checkbox
                checked={needs.includes(item)}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setNeeds((prev) => [...prev, item]);
                  } else {
                    setNeeds((prev) => prev.filter((n) => n !== item));
                    if (item === "Other") setOtherNeedDetail("");
                  }
                }}
              />
              <span>{item}</span>
            </label>
          ))}

          {needs.includes("Other") && (
            <Input
              type="text"
              placeholder="Please add a description"
              value={otherNeedDetail}
              onChange={(e) => setOtherNeedDetail(e.target.value)}
            />
          )}
        </div>

        <Textarea
          placeholder="Add any notes..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="text-white drop-shadow"
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

        <Button onClick={handleSubmit} className="w-full btn-primary bg-indigo-900">
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
