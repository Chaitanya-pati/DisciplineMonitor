import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Plus, Check, Trash2, GripVertical } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ChecklistItemForm } from '@/components/ChecklistItemForm';
import { db, type ChecklistItem, type ChecklistLog } from '@/lib/db';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SortableItemProps {
  item: ChecklistItem;
  isChecked: boolean;
  onToggle: () => void;
  onDelete: () => void;
}

function SortableItem({ item, isChecked, onToggle, onDelete }: SortableItemProps) {
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
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 p-3 bg-card rounded-lg border"
    >
      <button
        className="cursor-grab active:cursor-grabbing touch-none"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-5 w-5 text-muted-foreground" />
      </button>

      <Checkbox
        checked={isChecked}
        onCheckedChange={onToggle}
        className="flex-shrink-0"
      />

      <span className={`flex-1 ${isChecked ? 'line-through text-muted-foreground' : ''}`}>
        {item.name}
      </span>

      <Button
        variant="ghost"
        size="sm"
        onClick={onDelete}
        className="flex-shrink-0"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

export default function Fitness() {
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
  const [todayLogs, setTodayLogs] = useState<ChecklistLog[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const today = format(new Date(), 'yyyy-MM-dd');

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Load checklist items
  useEffect(() => {
    loadChecklistItems();
  }, []);

  // Load today's logs
  useEffect(() => {
    loadTodayLogs();
  }, [today]);

  const loadChecklistItems = async () => {
    try {
      const items = await db.checklistItems.toArray();
      const activeItems = items
        .filter(item => item.isActive === 1)
        .sort((a, b) => (a.order || 0) - (b.order || 0));
      setChecklistItems(activeItems);
    } catch (error) {
      console.error('Error loading checklist items:', error);
      setChecklistItems([]);
    }
  };

  const loadTodayLogs = async () => {
    try {
      const logs = await db.checklistLogs.toArray();
      const todayLogsFiltered = logs.filter(log => log.date === today);
      setTodayLogs(todayLogsFiltered);
    } catch (error) {
      console.error('Error loading today logs:', error);
      setTodayLogs([]);
    }
  };

  const handleToggleItem = async (itemId: string) => {
    const existingLog = todayLogs.find(log => log.checklistItemId === itemId);

    if (existingLog) {
      await db.checklistLogs.delete(existingLog.id);
    } else {
      await db.checklistLogs.add({
        id: crypto.randomUUID(),
        checklistItemId: itemId,
        date: today,
        completedAt: Date.now(),
      });
    }

    await loadTodayLogs();
  };

  const handleDeleteItem = async (itemId: string) => {
    await db.checklistItems.update(itemId, { isActive: 0 });
    await loadChecklistItems();
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = checklistItems.findIndex((item) => item.id === active.id);
      const newIndex = checklistItems.findIndex((item) => item.id === over.id);

      const newItems = arrayMove(checklistItems, oldIndex, newIndex);
      setChecklistItems(newItems);

      // Update order in database
      for (let i = 0; i < newItems.length; i++) {
        await db.checklistItems.update(newItems[i].id, { order: i });
      }
    }
  };

  const handleAddItem = async (name: string) => {
    const maxOrder = checklistItems.length > 0
      ? Math.max(...checklistItems.map(item => item.order || 0))
      : -1;

    await db.checklistItems.add({
      id: crypto.randomUUID(),
      name,
      order: maxOrder + 1,
      isActive: 1,
      createdAt: Date.now(),
    });

    await loadChecklistItems();
    setShowAddDialog(false);
  };

  const completedCount = todayLogs.length;
  const totalCount = checklistItems.length;
  const progressPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <div className="p-4 space-y-6 pb-20 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-semibold">Fitness Checklist</h1>
        <p className="text-sm text-muted-foreground">Track your daily fitness goals</p>
      </div>

      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-medium">Today's Progress</h2>
              <p className="text-sm text-muted-foreground">
                {completedCount} of {totalCount} completed
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">{Math.round(progressPercentage)}%</div>
            </div>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium">Checklist Items</h2>
          <Button onClick={() => setShowAddDialog(true)} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Item
          </Button>
        </div>

        <div className="space-y-2">
          {checklistItems.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No checklist items yet. Add your first item to get started!
            </p>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={checklistItems.map(item => item.id)}
                strategy={verticalListSortingStrategy}
              >
                {checklistItems.map((item) => (
                  <SortableItem
                    key={item.id}
                    item={item}
                    isChecked={todayLogs.some(log => log.checklistItemId === item.id)}
                    onToggle={() => handleToggleItem(item.id)}
                    onDelete={() => handleDeleteItem(item.id)}
                  />
                ))}
              </SortableContext>
            </DndContext>
          )}
        </div>
      </Card>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Checklist Item</DialogTitle>
          </DialogHeader>
          <ChecklistItemForm
            onSubmit={handleAddItem}
            onCancel={() => setShowAddDialog(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}