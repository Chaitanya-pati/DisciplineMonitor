import { useState } from 'react';
import { db } from '@/lib/db';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AlertCircle } from 'lucide-react';
import type { InsertProcrastinationDelay } from '@shared/schema';

interface ProcrastinationDialogProps {
  taskId: string;
  onClose: () => void;
}

const reasons = [
  { value: 'tired', label: 'Feeling Tired', action: 'Take a 10-minute break, then start with just 5 minutes' },
  { value: 'later', label: 'I\'ll do it later', action: 'Set a specific time right now - add it to your calendar' },
  { value: 'boring', label: 'It\'s Boring', action: 'Start with the easiest part first to build momentum' },
  { value: 'not_urgent', label: 'Not Urgent', action: 'Break it into 2 smaller tasks to make progress' },
  { value: 'overwhelmed', label: 'Feeling Overwhelmed', action: 'Reduce scope: what\'s the minimum viable version?' },
  { value: 'distracted', label: 'Too Distracted', action: 'Close all tabs, turn off phone, try 5-minute focus sprint' },
  { value: 'other', label: 'Other Reason', action: 'Try the 2-minute rule: if it takes less than 2 minutes, do it now' },
] as const;

export function ProcrastinationDialog({ taskId, onClose }: ProcrastinationDialogProps) {
  const [selectedReason, setSelectedReason] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!selectedReason) return;

    const reason = reasons.find(r => r.value === selectedReason);
    
    const delay: Omit<InsertProcrastinationDelay, 'delayedAt'> = {
      taskId,
      reason: selectedReason as any,
      microAction: reason?.action,
    };

    await db.procrastinationDelays.add({
      ...delay,
      id: crypto.randomUUID(),
      delayedAt: Date.now(),
    });

    onClose();
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-yellow-500" />
            Why are you postponing this task?
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          {reasons.map((reason) => (
            <button
              key={reason.value}
              onClick={() => setSelectedReason(reason.value)}
              className={`w-full p-4 text-left rounded-lg border-2 transition-all hover-elevate ${
                selectedReason === reason.value
                  ? 'border-primary bg-primary/5'
                  : 'border-border'
              }`}
              data-testid={`button-reason-${reason.value}`}
            >
              <div className="font-medium mb-1">{reason.label}</div>
              <div className="text-sm text-muted-foreground">{reason.action}</div>
            </button>
          ))}
        </div>

        <div className="flex gap-2 pt-4">
          <Button variant="outline" onClick={onClose} className="flex-1" data-testid="button-cancel">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!selectedReason}
            className="flex-1"
            data-testid="button-submit-reason"
          >
            Log & Continue
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
