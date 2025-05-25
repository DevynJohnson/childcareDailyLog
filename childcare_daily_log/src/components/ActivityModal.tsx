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
      bathroomData?: {
        urinated: boolean;
        bm: boolean;
        noVoid: boolean;
      };
      napData?: {
        startTime: string;
        endTime: string;
        napType: string;
        notes: string;
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
    bathroomData?: {
      urinated: boolean;
      bm: boolean;
      noVoid: boolean;
    };
    napData?: {
      startTime: string;
      endTime: string;
      napType: string;
      notes: string;
    };
  };
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
  const [urinated, setUrinated] = useState(false);
  const [bm, setBm] = useState(false);
  const [noVoid, setNoVoid] = useState(false);
  const [napType, setNapType] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  // Pre-fill fields if editing an existing activity
  useEffect(() => {
    const base = new Date(selectedDate);
    const now = new Date();
    base.setHours(now.getHours(), now.getMinutes(), 0, 0);

    if (selectedActivity) {
      setTimestamp(new Date(selectedActivity.timestamp));
      setNotes(selectedActivity.notes || "");

      if (selectedActivity.bathroomData) {
        setUrinated(selectedActivity.bathroomData.urinated);
        setBm(selectedActivity.bathroomData.bm);
        setNoVoid(selectedActivity.bathroomData.noVoid);
      }

      if (selectedActivity.napData) {
        setStartTime(selectedActivity.napData.startTime);
        setEndTime(selectedActivity.napData.endTime);
        setNapType(selectedActivity.napData.napType);
        setNotes(selectedActivity.napData.notes || "");
      }
    } else {
      setTimestamp(base);
      setNotes("");
      setUrinated(false);
      setBm(false);
      setNoVoid(false);
      setNapType("");
      setStartTime(formatLocalDateTime(base));
      setEndTime(formatLocalDateTime(base));
    }
  }, [isOpen, selectedDate, selectedActivity]);

  const handleSubmit = () => {
    const baseData = {
      childId,
      activityType,
      notes,
      timestamp,
    };

    if (activityType === "Bathroom") {
      onSubmit(
        {
          ...baseData,
          bathroomData: {
            urinated,
            bm,
            noVoid,
          },
        },
        activityId
      );
    } else if (activityType === "Sleep") {
      onSubmit(
        {
          ...baseData,
          timestamp: new Date(startTime || Date.now()),
          napData: {
            startTime,
            endTime,
            napType,
            notes,
          },
        },
        activityId
      );
    } else {
      onSubmit(baseData, activityId);
    }

    onClose();
  };

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      className="fixed z-50 inset-0 flex items-center justify-center p-4"
    >
      <Dialog.Panel className="bg-white dark:bg-zinc-900 p-6 rounded-lg w-full max-w-md shadow-lg space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">{activityType} Entry</h2>
          <button onClick={onClose}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Bathroom Fields */}
        {activityType === "Bathroom" && (
          <div className="space-y-2">
            <label className="flex items-center space-x-2">
              <Checkbox
                checked={urinated}
                disabled={noVoid}
                onCheckedChange={(v) => setUrinated(!!v)}
              />
              <span className={noVoid ? "text-muted-foreground" : ""}>
                Urinated
              </span>
            </label>
            <label className="flex items-center space-x-2">
              <Checkbox
                checked={bm}
                disabled={noVoid}
                onCheckedChange={(v) => setBm(!!v)}
              />
              <span className={noVoid ? "text-muted-foreground" : ""}>BM</span>
            </label>
            <label className="flex items-center space-x-2">
              <Checkbox
                checked={noVoid}
                disabled={urinated || bm}
                onCheckedChange={(v) => setNoVoid(!!v)}
              />
              <span className={urinated || bm ? "text-muted-foreground" : ""}>
                No Void
              </span>
            </label>
          </div>
        )}

        {/* Nap Fields */}
        {activityType === "Sleep" && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Start Time
              </label>
              <input
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full border rounded px-2 py-1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">End Time</label>
              <input
                type="datetime-local"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full border rounded px-2 py-1"
              />
            </div>

            <fieldset>
              <legend className="block text-sm font-medium mb-1">
                Nap Type
              </legend>
              <div className="flex flex-col gap-1">
                {["No Nap", "Partial Nap", "Full Nap"].map((option) => (
                  <label
                    key={option}
                    className="inline-flex items-center gap-2"
                  >
                    <input
                      type="radio"
                      name="napType"
                      value={option}
                      checked={napType === option}
                      onChange={() => setNapType(option)}
                    />
                    {option}
                  </label>
                ))}
              </div>
            </fieldset>
          </div>
        )}

        {/* Notes */}
        <Textarea
          placeholder="Add any notes..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        {/* Timestamp */}
        <Input
          type="datetime-local"
          value={formatLocalDateTime(timestamp)}
          onChange={(e) => setTimestamp(new Date(e.target.value))}
        />

        <Button onClick={handleSubmit} className="w-full">
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
