import { Dialog } from "@headlessui/react";
import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { formatLocalDateTime } from "@/lib/timestamp";
import { Button } from "../../ui/button";
import { Textarea } from "../../ui/textarea";
import { Input } from "../../ui/input";
import { Checkbox } from "../../ui/checkbox";

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
        <div className="space-y-2">
          <label className="flex items-center space-x-2">
            <Checkbox
              checked={fullNap}
              disabled={partialNap || noNap}
              onCheckedChange={(v) => {
                setFullNap(!!v);
                if (!!v) {
                  setPartialNap(false);
                  setNoNap(false);
                }
              }}
            />
            <span className={fullNap ? "text-muted-foreground" : ""}>Full Nap</span>
          </label>
          <label className="flex items-center space-x-2">
            <Checkbox
              checked={partialNap}
              disabled={fullNap || noNap}
              onCheckedChange={(v) => {
                setPartialNap(!!v);
                if (!!v) {
                  setFullNap(false);
                  setNoNap(false);
                }
              }}
            />
            <span className={partialNap ? "text-muted-foreground" : ""}>Partial Nap</span>
          </label>
          <label className="flex items-center space-x-2">
            <Checkbox
              checked={noNap}
              disabled={fullNap || partialNap}
              onCheckedChange={(v) => {
                setNoNap(!!v);
                if (!!v) {
                  setFullNap(false);
                  setPartialNap(false);
                }
              }}
            />
            <span className={noNap ? "text-muted-foreground" : ""}>No Nap</span>
          </label>
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