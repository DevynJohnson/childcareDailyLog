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
      napData: {
        fullNap: boolean;
        partialNap: boolean;
        noNap: boolean;
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
    napData?: {
      fullNap?: boolean;
      partialNap?: boolean;
      noNap?: boolean;
    };
  };
};

export default function NapModal({
  isOpen,
  onClose,
  onSubmit,
  onDelete,
  childId,
  selectedDate,
  activityId,
  selectedActivity,
}: Props) {
  const [timestamp, setTimestamp] = useState<Date>(() => new Date());
  const [notes, setNotes] = useState("");
  const [fullNap, setFullNap] = useState(false);
  const [partialNap, setPartialNap] = useState(false);
  const [noNap, setNoNap] = useState(false);

  useEffect(() => {
    if (selectedActivity) {
      setTimestamp(new Date(selectedActivity.timestamp));
      setNotes(selectedActivity.notes || "");
      if (selectedActivity.napData) {
        setFullNap(!!selectedActivity.napData.fullNap);
        setPartialNap(!!selectedActivity.napData.partialNap);
        setNoNap(!!selectedActivity.napData.noNap);
      } else {
        setFullNap(false);
        setPartialNap(false);
        setNoNap(false);
      }
    } else {
      setTimestamp(new Date());
      setNotes("");
      setFullNap(false);
      setPartialNap(false);
      setNoNap(false);
    }
  }, [isOpen, selectedDate, selectedActivity]);

  const handleSubmit = () => {
    onSubmit(
      {
        childId,
        activityType: "Sleep",
        notes,
        timestamp,
        napData: {
          fullNap,
          partialNap,
          noNap,
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
          <h2 className="text-xl font-semibold">Today's Nap:</h2>
          <button onClick={onClose}>
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex gap-2 mb-2">
          <button
            type="button"
            className={`rounded-full px-4 py-2 font-medium transition-colors
              ${fullNap
                ? "bg-gradient-to-r from-[var(--dark-indigo)] to-indigo-500 text-white"
                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200"}
              hover:bg-indigo-100 dark:hover:bg-indigo-900
            `}
            onClick={() => {
              setFullNap(true);
              setPartialNap(false);
              setNoNap(false);
            }}
            aria-pressed={fullNap}
          >
            Full Nap
          </button>
          <button
            type="button"
            className={`rounded-full px-4 py-2 font-medium transition-colors
              ${partialNap
                ? "bg-gradient-to-r from-[var(--dark-indigo)] to-indigo-500 text-white"
                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200"}
              hover:bg-indigo-100 dark:hover:bg-indigo-900
            `}
            onClick={() => {
              setFullNap(false);
              setPartialNap(true);
              setNoNap(false);
            }}
            aria-pressed={partialNap}
          >
            Partial Nap
          </button>
          <button
            type="button"
            className={`rounded-full px-4 py-2 font-medium transition-colors
              ${noNap
                ? "bg-gradient-to-r from-[var(--dark-indigo)] to-indigo-500 text-white"
                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200"}
              hover:bg-indigo-100 dark:hover:bg-indigo-900
            `}
            onClick={() => {
              setFullNap(false);
              setPartialNap(false);
              setNoNap(true);
            }}
            aria-pressed={noNap}
          >
            No Nap
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