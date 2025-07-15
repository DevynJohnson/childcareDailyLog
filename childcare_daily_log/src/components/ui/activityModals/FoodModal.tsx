
import { Dialog } from "@headlessui/react";
import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { formatLocalDateTime } from "@/lib/timestamp";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Textarea } from "../../ui/textarea";
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
      foodData: {
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
    foodData?: {
      item: string;
      amount: "All" | "Some" | "None";
    };
  };
};

export default function FoodModal({
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
  const [foodItem, setFoodItem] = useState("");
  const [foodAmount, setFoodAmount] = useState<"All" | "Some" | "None" | "">("");

  useEffect(() => {
    const base = new Date(selectedDate);
    const now = new Date();
    base.setHours(now.getHours(), now.getMinutes(), 0, 0);
    if (selectedActivity) {
      setTimestamp(new Date(selectedActivity.timestamp));
      setNotes(selectedActivity.notes || "");
      if (selectedActivity.foodData) {
        setFoodItem(selectedActivity.foodData.item);
        setFoodAmount(selectedActivity.foodData.amount);
      } else {
        setFoodItem("");
        setFoodAmount("");
      }
    } else {
      setTimestamp(base);
      setNotes("");
      setFoodItem("");
      setFoodAmount("");
    }
  }, [isOpen, selectedDate, selectedActivity]);

  const handleSubmit = () => {
    onSubmit(
      {
        childId,
        activityType,
        notes,
        timestamp,
        foodData: {
          item: foodItem,
          amount: foodAmount as "All" | "Some" | "None",
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
          <h2 className="text-xl font-semibold">Food Entry</h2>
          <button onClick={onClose}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <label className="block text-sm font-medium">Food Item</label>
          <Input
            type="text"
            placeholder="Enter food item..."
            value={foodItem}
            onChange={(e) => setFoodItem(e.target.value)}
          />

          <label className="block text-sm font-medium">Amount Eaten</label>
          <div className="flex gap-4">
            {["All", "Some", "None"].map((option) => (
              <label key={option} className="flex items-center space-x-2 cursor-pointer">
                <Checkbox
                  checked={foodAmount === option}
                  onCheckedChange={() => setFoodAmount((prev) => (prev === option ? "" : option as any))}
                  className="w-5 h-5"
                />
                <span className="text-base">{option}</span>
              </label>
            ))}
          </div>
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