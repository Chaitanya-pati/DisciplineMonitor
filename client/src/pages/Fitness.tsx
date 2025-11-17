import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { updateFitnessStreak } from '@/lib/streaks';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Plus, GripVertical, Edit2, Trash2, CheckCircle2, Circle } from 'lucide-react';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ChecklistItemForm } from '@/components/ChecklistItemForm';
import { ChecklistItemInput } from '@/components/ChecklistItemInput';
import type { ChecklistItem } from '@shared/schema';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { CircularProgress } from '@/components/CircularProgress';

function SortableChecklistItem({ item, onEdit, onDelete, onToggle, isCompleted }: {
  item: ChecklistItem;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: () => void;
  isCompleted: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className="touch-none">
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <button
            className="touch-none cursor-grab active:cursor-grabbing p-1 hover-elevate"
            {...attributes}
            {...listeners}
            data-testid={`drag-handle-${item.id}`}
          >
            <GripVertical className="w-4 h-4 text-muted-foreground" />
          </button>

          <button
            onClick={onToggle}
            className="flex-shrink-0 hover-elevate active-elevate-2 p-1 rounded"
            data-testid={`toggle-${item.id}`}
          >
            {isCompleted ? (
              <CheckCircle2 className="w-5 h-5 text-primary" />
            ) : (
              <Circle className="w-5 h-5 text-muted-foreground" />
            )}
          </button>

          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-sm" data-testid={`item-title-${item.id}`}>{item.title}</h3>
            {item.targetValue && (
              <p className="text-xs text-muted-foreground">
                Target: {item.targetValue} {item.unit || ''}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="icon"
              variant="ghost"
              onClick={onEdit}
              data-testid={`button-edit-${item.id}`}
            >
              <Edit2 className="w-4 h-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={onDelete}
              data-testid={`button-delete-${item.id}`}
            >
              <Trash2 className="w-4 h-4 text-destructive" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default function Fitness() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ChecklistItem | null>(null);
  const today = format(new Date(), 'yyyy-MM-dd');

  const checklistItems = useLiveQuery(
    async () => {
      const items = await db.checklistItems.toArray();
      return items
        .filter(item => item.isActive === 1)
        .sort((a, b) => (a.order || 0) - (b.order || 0));
    },
    []
  );

  const todayLogs = useLiveQuery(
    async () => {
      const logs = await db.dailyChecklistLogs.toArray();
      return logs.filter(log => log.date === today);
    },
    [today]
  );

  const todaySummary = useLiveQuery(
    async () => {
      const summaries = await db.dailySummaries.toArray();
      return summaries.find(s => s.date === today);
    },
    [today]
  );

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id || !checklistItems) return;
    
    const oldIndex = checklistItems.findIndex(item => item.id === active.id);
    const newIndex = checklistItems.findIndex(item => item.id === over.id);
    
    const reordered = arrayMove(checklistItems, oldIndex, newIndex);
    
    // Update order in database
    await Promise.all(
      reordered.map((item, index) => 
        db.checklistItems.update(item.id, { order: index })
      )
    );
  };

  const handleDelete = async (id: string) => {
    await db.checklistItems.update(id, { isActive: false });
  };

  const handleEdit = (item: ChecklistItem) => {
    setEditingItem(item);
    setIsDialogOpen(true);
  };

  const handleToggle = async (item: ChecklistItem) => {
    const log = todayLogs?.find(l => l.checklistItemId === item.id);
    
    if (log) {
      await db.dailyChecklistLogs.delete(log.id);
    } else {
      const newLog = {
        id: crypto.randomUUID(),
        checklistItemId: item.id,
        date: today,
        value: true,
        completedAt: Date.now(),
      };
      await db.dailyChecklistLogs.add(newLog);
    }
    
    // Update daily summary
    await updateDailySummary();
  };

  const updateDailySummary = async () => {
    const allItems = await db.checklistItems.toArray();
    const items = allItems.filter(item => item.isActive === 1);
    const logs = await db.dailyChecklistLogs.where('date').equals(today).toArray();
    
    const totalItems = items.length;
    const completedItems = logs.length;
    const score = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;
    
    const existing = await db.dailySummaries.where('date').equals(today).first();
    
    if (existing) {
      await db.dailySummaries.update(existing.id, {
        fitnessScore: score,
        totalItems,
        completedItems,
      });
    } else {
      await db.dailySummaries.add({
        id: crypto.randomUUID(),
        date: today,
        fitnessScore: score,
        totalItems,
        completedItems,
        isCheatDay: false,
        createdAt: Date.now(),
      });
    }
    
    // Update fitness streak
    await updateFitnessStreak(score, false);
  };

  const score = todaySummary?.fitnessScore ?? 0;
  const completedCount = todayLogs?.length ?? 0;
  const totalCount = checklistItems?.length ?? 0;

  return (
    <div className="p-4 space-y-6 pb-20 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold" data-testid="page-title">Fitness Tracker</h1>
          <p className="text-sm text-muted-foreground">Manage your daily habits</p>
        </div>
      </div>

      {/* Today's Progress */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Today's Progress</p>
            <p className="text-2xl font-bold" data-testid="progress-summary">
              {completedCount} / {totalCount}
            </p>
          </div>
          <CircularProgress value={score} size={80} strokeWidth={8}>
            <span className="text-lg font-bold">{Math.round(score)}%</span>
          </CircularProgress>
        </div>
      </Card>

      {/* Checklist Items */}
      {checklistItems && checklistItems.length > 0 ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={checklistItems.map(item => item.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-3">
              {checklistItems.map((item) => {
                const isCompleted = todayLogs?.some(l => l.checklistItemId === item.id) ?? false;
                return (
                  <SortableChecklistItem
                    key={item.id}
                    item={item}
                    onEdit={() => handleEdit(item)}
                    onDelete={() => handleDelete(item.id)}
                    onToggle={() => handleToggle(item)}
                    isCompleted={isCompleted}
                  />
                );
              })}
            </div>
          </SortableContext>
        </DndContext>
      ) : (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground mb-4">No habits yet. Start tracking your fitness journey!</p>
        </Card>
      )}

      {/* Add Button */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        setIsDialogOpen(open);
        if (!open) setEditingItem(null);
      }}>
        <DialogTrigger asChild>
          <Button
            className="fixed bottom-20 right-4 h-14 w-14 rounded-full shadow-lg"
            size="icon"
            data-testid="button-add-habit"
          >
            <Plus className="w-6 h-6" />
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Edit Habit' : 'Add New Habit'}</DialogTitle>
          </DialogHeader>
          <ChecklistItemForm
            editingItem={editingItem}
            onSuccess={() => {
              setIsDialogOpen(false);
              setEditingItem(null);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
