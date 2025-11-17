import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { updateProductivityStreak } from '@/lib/streaks';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Clock, AlertCircle, CheckCircle2, Circle, ChevronRight, Timer } from 'lucide-react';
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

export default function Tasks() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [showPomodoro, setShowPomodoro] = useState(false);

  const tasks = useLiveQuery(
    () => db.tasks.where('status').notEqual('completed').reverse().sortBy('createdAt')
  );

  const completedTasks = useLiveQuery(
    () => db.tasks.where('status').equals('completed').reverse().sortBy('completedAt')
  );

  const handleToggleComplete = async (task: Task) => {
    if (task.status === 'completed') {
      await db.tasks.update(task.id, { 
        status: 'pending',
        completedAt: undefined,
      });
    } else {
      await db.tasks.update(task.id, { 
        status: 'completed',
        completedAt: Date.now(),
      });
      
      // Update productivity streak
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

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    await db.tasks.delete(id);
  };

  const TaskCard = ({ task, isCompleted = false }: { task: Task; isCompleted?: boolean }) => {
    const delayCount = useLiveQuery(
      () => db.procrastinationDelays.where('taskId').equals(task.id).count(),
      [task.id]
    );

    return (
      <Card className="p-4 hover-elevate">
        <div className="flex items-start gap-3">
          <button
            onClick={() => handleToggleComplete(task)}
            className="flex-shrink-0 mt-1 hover-elevate active-elevate-2 p-1 rounded"
            data-testid={`toggle-task-${task.id}`}
          >
            {isCompleted ? (
              <CheckCircle2 className="w-5 h-5 text-primary" />
            ) : (
              <Circle className="w-5 h-5 text-muted-foreground" />
            )}
          </button>

          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-start gap-2">
              <div className={`w-1 h-6 ${priorityColors[task.priority]} rounded-full flex-shrink-0`} />
              <div className="flex-1">
                <h3 className={`font-medium ${isCompleted ? 'line-through text-muted-foreground' : ''}`} data-testid={`task-title-${task.id}`}>
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
              
              {task.deadline && (
                <Badge variant="outline" className="text-xs flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {format(new Date(task.deadline), 'MMM d')}
                </Badge>
              )}

              {task.estimatedTime && (
                <Badge variant="outline" className="text-xs flex items-center gap-1">
                  <Timer className="w-3 h-3" />
                  {task.estimatedTime}m
                </Badge>
              )}

              {delayCount && delayCount > 0 && (
                <Badge variant="destructive" className="text-xs flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {delayCount} delays
                </Badge>
              )}

              {task.subtasks && task.subtasks.length > 0 && (
                <Badge variant="outline" className="text-xs">
                  {task.subtasks.filter(s => s.completed).length}/{task.subtasks.length} subtasks
                </Badge>
              )}
            </div>
          </div>

          <Button
            size="icon"
            variant="ghost"
            onClick={() => handleEdit(task)}
            data-testid={`button-edit-task-${task.id}`}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </Card>
    );
  };

  return (
    <div className="p-4 space-y-6 pb-20 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold" data-testid="page-title">Tasks</h1>
          <p className="text-sm text-muted-foreground">Manage your productivity</p>
        </div>
        <Button
          variant="outline"
          onClick={() => setShowPomodoro(!showPomodoro)}
          data-testid="button-toggle-pomodoro"
        >
          <Timer className="w-4 h-4 mr-2" />
          Pomodoro
        </Button>
      </div>

      {/* Pomodoro Timer */}
      {showPomodoro && (
        <PomodoroTimer 
          tasks={tasks ?? []}
          onClose={() => setShowPomodoro(false)}
        />
      )}

      {/* Active Tasks */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Active Tasks</h2>
        {tasks && tasks.length > 0 ? (
          tasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))
        ) : (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground mb-4">No active tasks. Add one to get started!</p>
          </Card>
        )}
      </div>

      {/* Completed Tasks */}
      {completedTasks && completedTasks.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-muted-foreground">Completed</h2>
          {completedTasks.slice(0, 5).map((task) => (
            <TaskCard key={task.id} task={task} isCompleted />
          ))}
        </div>
      )}

      {/* Add Button */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        setIsDialogOpen(open);
        if (!open) setEditingTask(null);
      }}>
        <DialogTrigger asChild>
          <Button
            className="fixed bottom-20 right-4 h-14 w-14 rounded-full shadow-lg"
            size="icon"
            data-testid="button-add-task"
          >
            <Plus className="w-6 h-6" />
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingTask ? 'Edit Task' : 'Add New Task'}</DialogTitle>
          </DialogHeader>
          <TaskForm
            editingTask={editingTask}
            onSuccess={() => {
              setIsDialogOpen(false);
              setEditingTask(null);
            }}
          />
        </DialogContent>
      </Dialog>

      {selectedTaskId && (
        <ProcrastinationDialog
          taskId={selectedTaskId}
          onClose={() => setSelectedTaskId(null)}
        />
      )}
    </div>
  );
}
