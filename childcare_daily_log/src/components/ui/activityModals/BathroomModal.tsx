import { Dialog } from "@headlessui/react";
import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { formatLocalDateTime } from "@/lib/timestamp";
import { Button } from "../../ui/button";
import { Textarea } from "../../ui/textarea";
import { Input } from "../../ui/input";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (
    data: {
      childId: string;
      activityType: string;
      notes: string;
      timestamp: Date;
      bathroomData: {
        urinated: boolean;
        bm: boolean;
        noVoid: boolean;
      };
    },
    activityId?: string
  ) => void;
  onDelete?: (activityId: string) => void;
  childId: string;
  selectedDate: Date;
  activityId?: string;
  selectedActivity?: {
    notes: string;
    timestamp: Date;
    bathroomData?: {
      urinated: boolean;
      bm: boolean;
      noVoid: boolean;
    };
  };
};

export default function BathroomModal({
  isOpen,
  onClose,
  onSubmit,
  onDelete,
  childId,
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
  const [urinated, setUrinated] = useState(false);
  const [bm, setBm] = useState(false);
  const [noVoid, setNoVoid] = useState(false);

  useEffect(() => {
    function toDate(val: any): Date {
      if (!val) return new Date(selectedDate);
      if (val instanceof Date) return val;
      // Firestore Timestamp object
      if (val.seconds && val.nanoseconds) {
        return new Date(val.seconds * 1000);
      }
      // ISO string
      if (typeof val === "string") {
        const d = new Date(val);
        if (!isNaN(d.getTime())) return d;
      }
      return new Date(selectedDate);
    }
    if (selectedActivity) {
      setTimestamp(toDate(selectedActivity.timestamp));
      setNotes(selectedActivity.notes || "");
      if (selectedActivity.bathroomData) {
        setUrinated(selectedActivity.bathroomData.urinated);
        setBm(selectedActivity.bathroomData.bm);
        setNoVoid(selectedActivity.bathroomData.noVoid);
      }
    } else {
      setTimestamp(new Date(selectedDate));
      setNotes("");
      setUrinated(false);
      setBm(false);
      setNoVoid(false);
    }
  }, [isOpen, selectedDate, selectedActivity]);

  const handleSubmit = () => {
    onSubmit(
      {
        childId,
        activityType: "Bathroom",
        notes,
        timestamp,
        bathroomData: {
          urinated,
          bm,
          noVoid,
        },
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
          <h2 className="text-xl font-semibold">Bathroom Entry</h2>
          <button onClick={onClose}>
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex gap-2 mb-2">
          <button
            type="button"
            className={`rounded-full px-4 py-2 font-medium transition-colors
              ${urinated
                ? "bg-gradient-to-r from-[var(--dark-indigo)] to-indigo-500 text-white"
                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200"}
              ${noVoid ? "opacity-50 cursor-not-allowed" : "hover:bg-indigo-100 dark:hover:bg-indigo-900"}
            `}
            disabled={noVoid}
            onClick={() => setUrinated((v) => !v)}
            aria-pressed={urinated}
          >
            Urinated
          </button>
          <button
            type="button"
            className={`rounded-full px-4 py-2 font-medium transition-colors
              ${bm
                ? "bg-gradient-to-r from-[var(--dark-indigo)] to-indigo-500 text-white"
                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200"}
              ${noVoid ? "opacity-50 cursor-not-allowed" : "hover:bg-indigo-100 dark:hover:bg-indigo-900"}
            `}
            disabled={noVoid}
            onClick={() => setBm((v) => !v)}
            aria-pressed={bm}
          >
            BM
          </button>
          <button
            type="button"
            className={`rounded-full px-4 py-2 font-medium transition-colors
              ${noVoid
                ? "bg-gradient-to-r from-[var(--dark-indigo)] to-indigo-500 text-white"
                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200"}
              ${(urinated || bm) ? "opacity-50 cursor-not-allowed" : "hover:bg-indigo-100 dark:hover:bg-indigo-900"}
            `}
            disabled={urinated || bm}
            onClick={() => setNoVoid((v) => !v)}
            aria-pressed={noVoid}
          >
            No Void
          </button>
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