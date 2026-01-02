import { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { updateProductivityStreak } from '@/lib/streaks';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Clock, AlertCircle, CheckCircle2, Circle, ChevronRight, Timer, Play, Pause } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { TaskForm } from '@/components/TaskForm';
import { PomodoroTimer } from '@/components/PomodoroTimer';
import { ProcrastinationDialog } from '@/components/ProcrastinationDialog';
import type { Task } from '@shared/schema';
import { format } from 'date-fns';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const priorityColors = {
  low: 'bg-blue-500',
  medium: 'bg-yellow-500',
  high: 'bg-red-500',
};

const priorityLabels = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
};

function SortableTaskCard({ task, onToggleComplete, onEdit, isActiveTimer }: { 
  task: Task; 
  onToggleComplete: (task: Task) => void; 
  onEdit: (task: Task) => void;
  isActiveTimer: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const delayCount = useLiveQuery(
    () => db.procrastinationDelays.where('taskId').equals(task.id).count(),
    [task.id]
  );

  const [localTime, setLocalTime] = useState(task.totalTimeSpent || 0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isActiveTimer) {
      interval = setInterval(() => {
        setLocalTime(prev => prev + 1/60); // add 1 second in minutes
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isActiveTimer]);

  const formatDuration = (mins: number) => {
    const hours = Math.floor(mins / 60);
    const m = Math.floor(mins % 60);
    const s = Math.floor((mins * 60) % 60);
    return `${hours > 0 ? `${hours}h ` : ''}${m}m ${s}s`;
  };

  const handleStartStop = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isActiveTimer) {
      await db.tasks.update(task.id, { 
        totalTimeSpent: localTime
      });
      // In a real app we'd track intervals, here we just toggle a 'isTimerRunning' flag or similar
      // For now we'll use a global state in the parent
    }
  };

  return (
    <Card 
      ref={setNodeRef} 
      style={style} 
      className={`p-4 hover-elevate ${isActiveTimer ? 'border-primary border-2 shadow-md' : ''}`}
    >
      <div className="flex items-start gap-3">
        <div
          className="cursor-grab active:cursor-grabbing touch-none mt-1"
          {...attributes}
          {...listeners}
        >
          <ChevronRight className="h-5 w-5 text-muted-foreground rotate-90" />
        </div>

        <button
          onClick={() => onToggleComplete(task)}
          className="flex-shrink-0 mt-1 hover-elevate active-elevate-2 p-1 rounded"
        >
          {task.status === 'completed' ? (
            <CheckCircle2 className="w-5 h-5 text-primary" />
          ) : (
            <Circle className="w-5 h-5 text-muted-foreground" />
          )}
        </button>

        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-start gap-2">
            <div className={`w-1 h-6 ${priorityColors[task.priority]} rounded-full flex-shrink-0`} />
            <div className="flex-1">
              <h3 className={`font-medium ${task.status === 'completed' ? 'line-through text-muted-foreground' : ''}`}>
                {task.title}
              </h3>
              {task.description && (
                <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {priorityLabels[task.priority]}
            </Badge>
            
            <Badge variant="outline" className={`text-xs capitalize ${task.status === 'live' ? 'text-primary border-primary animate-pulse' : ''}`}>
              {task.status}
            </Badge>

            {task.status === 'live' && (
              <div className="flex items-center gap-2 bg-primary/10 px-2 py-0.5 rounded-full">
                <Timer className="w-3 h-3 text-primary" />
                <span className="text-xs font-mono font-bold text-primary">
                  {formatDuration(localTime)}
                </span>
              </div>
            )}
            
            {task.deadline && (
              <Badge variant="outline" className="text-xs flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {format(new Date(task.deadline), 'MMM d')}
              </Badge>
            )}

            {delayCount && delayCount > 0 && (
              <Badge variant="destructive" className="text-xs flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {delayCount} delays
              </Badge>
            )}
          </div>
        </div>

        <Button
          size="icon"
          variant="ghost"
          onClick={() => onEdit(task)}
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </Card>
  );
}

export default function Tasks() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [showPomodoro, setShowPomodoro] = useState(false);
  const [activeTimerId, setActiveTimerId] = useState<string | null>(null);

  const tasks = useLiveQuery(
    () => db.tasks.toArray(),
    []
  );

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleToggleComplete = async (task: Task) => {
    if (task.status === 'completed') {
      await db.tasks.update(task.id, { 
        status: 'assigned',
        completedAt: undefined,
      });
    } else {
      if (activeTimerId === task.id) {
        setActiveTimerId(null);
      }
      await db.tasks.update(task.id, { 
        status: 'completed',
        completedAt: Date.now(),
      });
      
      const today = format(new Date(), 'yyyy-MM-dd');
      const todayTasks = await db.tasks.toArray();
      const completedToday = todayTasks.filter(t => {
        if (!t.completedAt) return false;
        const taskDate = format(new Date(t.completedAt), 'yyyy-MM-dd');
        return taskDate === today && t.status === 'completed';
      }).length;
      
      await updateProductivityStreak(completedToday);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const taskId = active.id as string;
    const overId = over.id as string;

    // Check if dropping onto a status header or specific task
    let newStatus: Task['status'] | null = null;
    if (overId === 'assigned' || overId === 'live' || overId === 'completed') {
      newStatus = overId as Task['status'];
    }

    if (newStatus && newStatus !== tasks?.find(t => t.id === taskId)?.status) {
      if (newStatus === 'live') {
        setActiveTimerId(taskId);
      } else if (taskId === activeTimerId) {
        setActiveTimerId(null);
      }
      
      await db.tasks.update(taskId, { 
        status: newStatus,
        completedAt: newStatus === 'completed' ? Date.now() : undefined
      });
    }
  };

  const TaskColumn = ({ title, status, items }: { title: string, status: string, items: Task[] }) => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">{title}</h2>
        <Badge variant="secondary">{items.length}</Badge>
      </div>
      <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-3 min-h-[100px] p-2 bg-muted/30 rounded-lg border-2 border-dashed border-muted">
          {items.map(task => (
            <SortableTaskCard 
              key={task.id} 
              task={task} 
              onToggleComplete={handleToggleComplete}
              onEdit={(t) => { setEditingTask(t); setIsDialogOpen(true); }}
              isActiveTimer={activeTimerId === task.id}
            />
          ))}
          {items.length === 0 && (
            <div className="h-full flex items-center justify-center py-8">
              <span className="text-xs text-muted-foreground italic">Drag tasks here</span>
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  );

  const assignedTasks = tasks?.filter(t => t.status === 'assigned') || [];
  const liveTasks = tasks?.filter(t => t.status === 'live') || [];
  const completedTasks = tasks?.filter(t => t.status === 'completed') || [];

  return (
    <div className="p-4 space-y-6 pb-20 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Tasks</h1>
          <p className="text-sm text-muted-foreground">Workflow: Assigned → Live → Completed</p>
        </div>
        <Button
          variant="outline"
          onClick={() => setShowPomodoro(!showPomodoro)}
        >
          <Timer className="w-4 h-4 mr-2" />
          Pomodoro
        </Button>
      </div>

      {showPomodoro && <PomodoroTimer tasks={tasks ?? []} onClose={() => setShowPomodoro(false)} />}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <TaskColumn title="Assigned" status="assigned" items={assignedTasks} />
          <TaskColumn title="Live" status="live" items={liveTasks} />
          <TaskColumn title="Completed" status="completed" items={completedTasks} />
        </div>
      </DndContext>

      <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) setEditingTask(null); }}>
        <DialogTrigger asChild>
          <Button className="fixed bottom-20 right-4 h-14 w-14 rounded-full shadow-lg" size="icon">
            <Plus className="w-6 h-6" />
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editingTask ? 'Edit Task' : 'Add New Task'}</DialogTitle></DialogHeader>
          <TaskForm editingTask={editingTask} onSuccess={() => { setIsDialogOpen(false); setEditingTask(null); }} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
