import { Dialog } from '@headlessui/react';
import { X } from 'lucide-react';
import { useState } from 'react';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';
import { Textarea } from './ui/textarea';
import { Input } from './ui/input';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    childId: string;
    activityType: string;
    notes: string;
    timestamp: Date;
    bathroomData?: {
      urinated: boolean;
      bm: boolean;
      noVoid: boolean;
    };
  }) => void;
  childId: string;
  activityType: string;
};

export default function ActivityModal({
  isOpen,
  onClose,
  onSubmit,
  childId,
  activityType,
}: Props) {
  const [timestamp, setTimestamp] = useState(new Date());
  const [notes, setNotes] = useState('');
  const [urinated, setUrinated] = useState(false);
  const [bm, setBm] = useState(false);
  const [noVoid, setNoVoid] = useState(false);

  const handleSubmit = () => {
    const baseData = {
      childId,
      activityType,
      notes,
      timestamp,
    };

    const data =
      activityType === 'Bathroom'
        ? { ...baseData, bathroomData: { urinated, bm, noVoid } }
        : baseData;

    onSubmit(data);
    onClose();
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="fixed z-50 inset-0 flex items-center justify-center p-4">
      <Dialog.Panel className="bg-white dark:bg-zinc-900 p-6 rounded-lg w-full max-w-md shadow-lg space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">{activityType} Entry</h2>
          <button onClick={onClose}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Conditional Fields */}
        {activityType === 'Bathroom' && (
          <div className="space-y-2">
  <label className="flex items-center space-x-2">
    <Checkbox
      checked={urinated}
      disabled={noVoid}
      onCheckedChange={(v) => setUrinated(!!v)}
    />
    <span className={noVoid ? "text-muted-foreground" : ""}>Urinated</span>
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

        {/* Notes */}
        <Textarea
          placeholder="Add any notes..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        {/* Date/time (you can make this more advanced later) */}
        <Input
          type="datetime-local"
          value={timestamp.toISOString().slice(0, 16)}
          onChange={(e) => setTimestamp(new Date(e.target.value))}
        />

        <Button onClick={handleSubmit} className="w-full">
          Save
        </Button>
      </Dialog.Panel>
    </Dialog>
  );
}
