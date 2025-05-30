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
        napType: string;
        notes: string;
      };
      activityDetails?: {
        activityCategory: string;
        detail: string;
      };
      foodData?: {
        item: string;
        amount: "All" | "Some" | "None";
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
      napType: string;
      notes: string;
    };
    activityDetails?: {
      activityCategory: string;
      detail: string;
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
  const [needs, setNeeds] = useState<string[]>([]);
  const [otherNeedDetail, setOtherNeedDetail] = useState("");
  const [foodItem, setFoodItem] = useState("");
  const [foodAmount, setFoodAmount] = useState<"All" | "Some" | "None" | "">(
    ""
  );

  // New state for Activity card
  const [activityCategory, setActivityCategory] = useState("");
  const [activityDetail, setActivityDetail] = useState("");

  // Pre-fill fields if editing
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
        setNapType(selectedActivity.napData.napType);
        setNotes(selectedActivity.napData.notes || "");
      }

      if (selectedActivity.activityDetails) {
        setActivityCategory(selectedActivity.activityDetails.activityCategory);
        setActivityDetail(selectedActivity.activityDetails.detail);
      }

      if (selectedActivity?.activityType === "Needs") {
        const needsFromNotes =
          selectedActivity.notes?.split(", ").filter(Boolean) || [];
        setNeeds(needsFromNotes);
        const otherNote = needsFromNotes.find((item) =>
          item.startsWith("Other:")
        );
        if (otherNote) {
          setOtherNeedDetail(otherNote.replace("Other:", "").trim());
        }
        if (selectedActivity?.foodData) {
          setFoodItem(selectedActivity.foodData.item);
          setFoodAmount(selectedActivity.foodData.amount);
        }
      } else {
        setNeeds([]);
        setOtherNeedDetail("");
        setFoodItem("");
        setFoodAmount("");
      }
    } else {
      setTimestamp(base);
      setNotes("");
      setUrinated(false);
      setBm(false);
      setNoVoid(false);
      setNapType("");
      setActivityCategory("");
      setActivityDetail("");
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
          napData: {
            napType,
            notes,
          },
        },
        activityId
      );
    } else if (activityType === "Activity") {
      onSubmit(
        {
          ...baseData,
          activityDetails: {
            activityCategory,
            detail: activityDetail,
          },
        },
        activityId
      );
    } else if (activityType === "Needs") {
      const formattedNeeds = needs.map((need) =>
        need === "Other" && otherNeedDetail ? `Other: ${otherNeedDetail}` : need
      );
      onSubmit(
        {
          ...baseData,
          notes: formattedNeeds.join(", "),
        },
        activityId
      );
    } else if (activityType === "Food") {
      onSubmit(
        {
          ...baseData,
          foodData: {
            item: foodItem,
            amount: foodAmount as "All" | "Some" | "None",
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

        {/* Activity Fields */}
        {activityType === "Activities" && (
          <div className="space-y-4">
            <label className="block text-sm font-medium">
              Choose Activity Type
            </label>
            <select
              value={activityCategory}
              onChange={(e) => setActivityCategory(e.target.value)}
              className="w-full border rounded px-3 py-2 bg-white dark:bg-zinc-800"
            >
              <option value="">Select</option>
              <option value="Toys">Toys</option>
              <option value="Games">Games</option>
              <option value="Other Activity">Other Activity</option>
            </select>

            {activityCategory && (
              <Input
                type="text"
                placeholder="Add Details Here"
                value={activityDetail}
                onChange={(e) => setActivityDetail(e.target.value)}
              />
            )}
          </div>
        )}

        {activityType === "Needs" && (
          <div className="space-y-2">
            {["Diapers", "Wipes", "Extra Clothes", "Snacks", "Other"].map(
              (item) => (
                <label key={item} className="flex items-center space-x-2">
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
              )
            )}

            {needs.includes("Other") && (
              <Input
                type="text"
                placeholder="Please add a description"
                value={otherNeedDetail}
                onChange={(e) => setOtherNeedDetail(e.target.value)}
              />
            )}
          </div>
        )}

        {activityType === "Food" && (
          <div className="space-y-4">
            <label className="block text-sm font-medium">Food Item</label>
            <Input
              type="text"
              placeholder="Enter food item..."
              value={foodItem}
              onChange={(e) => setFoodItem(e.target.value)}
            />

            <label className="block text-sm font-medium">Amount Eaten</label>
            <div className="flex justify-between gap-4">
              {["All", "Some", "None"].map((option) => (
                <label key={option} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={foodAmount === option}
                    onChange={() =>
                      setFoodAmount((prev) =>
                        prev === option ? "" : (option as any)
                      )
                    }
                  />
                  <span>{option}</span>
                </label>
              ))}
            </div>
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
