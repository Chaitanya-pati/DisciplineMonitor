import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Pause, RotateCcw, X } from 'lucide-react';
import { CircularProgress } from '@/components/CircularProgress';
import type { Task } from '@shared/schema';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { db } from '@/lib/db';
import { format } from 'date-fns';

interface PomodoroTimerProps {
  tasks: Task[];
  onClose: () => void;
}

export function PomodoroTimer({ tasks, onClose }: PomodoroTimerProps) {
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [duration, setDuration] = useState(25); // minutes
  const [timeLeft, setTimeLeft] = useState(duration * 60); // seconds
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      handleComplete();
    }

    return () => clearInterval(interval);
  }, [isRunning, timeLeft]);

  const handleComplete = async () => {
    setIsRunning(false);
    
    // Save session to database
    await db.pomodoroSessions.add({
      id: crypto.randomUUID(),
      taskId: selectedTaskId ?? undefined,
      duration,
      completedAt: Date.now(),
      date: format(new Date(), 'yyyy-MM-dd'),
    });

    // Update task time spent
    if (selectedTaskId) {
      const task = await db.tasks.get(selectedTaskId);
      if (task) {
        await db.tasks.update(selectedTaskId, {
          totalTimeSpent: (task.totalTimeSpent ?? 0) + duration,
        });
      }
    }

    // Reset timer
    setTimeLeft(duration * 60);
  };

  const handleReset = () => {
    setIsRunning(false);
    setTimeLeft(duration * 60);
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const progress = ((duration * 60 - timeLeft) / (duration * 60)) * 100;

  return (
    <Card className="p-6 relative">
      <Button
        size="icon"
        variant="ghost"
        className="absolute top-2 right-2"
        onClick={onClose}
        data-testid="button-close-pomodoro"
      >
        <X className="w-4 h-4" />
      </Button>

      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-4">Pomodoro Timer</h3>
          
          <div className="flex justify-center mb-6">
            <CircularProgress value={progress} size={200} strokeWidth={12}>
              <div className="text-center">
                <div className="text-5xl font-bold" data-testid="timer-display">
                  {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                </div>
              </div>
            </CircularProgress>
          </div>

          <div className="flex items-center justify-center gap-4 mb-6">
            <Button
              size="icon"
              variant="outline"
              onClick={() => setIsRunning(!isRunning)}
              data-testid="button-toggle-timer"
            >
              {isRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            </Button>
            <Button
              size="icon"
              variant="outline"
              onClick={handleReset}
              data-testid="button-reset-timer"
            >
              <RotateCcw className="w-5 h-5" />
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Task (Optional)</label>
            <Select value={selectedTaskId ?? undefined} onValueChange={setSelectedTaskId}>
              <SelectTrigger data-testid="select-pomodoro-task">
                <SelectValue placeholder="Select a task" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No task</SelectItem>
                {tasks.map((task) => (
                  <SelectItem key={task.id} value={task.id}>
                    {task.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Duration</label>
            <div className="flex gap-2">
              {[15, 25, 45].map((min) => (
                <Button
                  key={min}
                  variant={duration === min ? 'default' : 'outline'}
                  onClick={() => {
                    setDuration(min);
                    setTimeLeft(min * 60);
                    setIsRunning(false);
                  }}
                  className="flex-1"
                  data-testid={`button-duration-${min}`}
                >
                  {min}m
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
