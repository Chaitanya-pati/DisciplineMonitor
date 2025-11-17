
import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Plus, Check, Trash2, GripVertical } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ChecklistItemForm } from '@/components/ChecklistItemForm';
import { ChecklistItemInput } from '@/components/ChecklistItemInput';
import { db, type ChecklistItem, type DailyChecklistLog } from '@/lib/db';
import { useLiveQuery } from 'dexie-react-hooks';
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
  logValue: boolean | number | string;
  hasLog: boolean;
  onChange: (value: boolean | number | string) => void;
  onDelete: () => void;
}

function SortableItem({ item, logValue, hasLog, onChange, onDelete }: SortableItemProps) {
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

  // Get default value based on input type
  const getDefaultValue = () => {
    switch (item.inputType) {
      case 'yesno':
        return false;
      case 'number':
      case 'slider':
      case 'timer':
        return 0;
      case 'dropdown':
        return item.dropdownOptions?.[0] || '';
      default:
        return false;
    }
  };

  const currentValue = hasLog ? logValue : getDefaultValue();

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 p-3 bg-card rounded-lg border"
    >
      <div
        className="cursor-grab active:cursor-grabbing touch-none"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-5 w-5 text-muted-foreground" />
      </div>

      <span className={`flex-1 ${hasLog && item.inputType === 'yesno' && currentValue ? 'line-through text-muted-foreground' : ''}`}>
        {item.title}
        {item.unit && ` (${item.unit})`}
      </span>

      <div className="flex-shrink-0 min-w-[120px]" onClick={(e) => e.stopPropagation()}>
        <ChecklistItemInput
          item={item}
          value={currentValue}
          onChange={onChange}
        />
      </div>

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
  const [selectedDate] = useState(new Date());
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<ChecklistItem | null>(null);

  // Get today's date string for querying
  const todayString = format(selectedDate, 'yyyy-MM-dd');

  const checklistItems = useLiveQuery(
    () => db.checklistItems.orderBy('order').toArray(),
    []
  );

  const todayLogs = useLiveQuery(
    () => db.dailyChecklistLogs.where('date').equals(todayString).toArray(),
    [todayString]
  );

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleItemValueChange = async (itemId: string, value: boolean | number | string) => {
    const existingLog = todayLogs?.find(log => log.checklistItemId === itemId);

    if (existingLog) {
      await db.dailyChecklistLogs.update(existingLog.id, {
        value,
        completedAt: Date.now(),
      });
    } else {
      await db.dailyChecklistLogs.add({
        id: crypto.randomUUID(),
        checklistItemId: itemId,
        date: todayString,
        value,
        completedAt: Date.now(),
      });
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    await db.checklistItems.update(itemId, { isActive: false });
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id && checklistItems) {
      const oldIndex = checklistItems.findIndex((item) => item.id === active.id);
      const newIndex = checklistItems.findIndex((item) => item.id === over.id);

      const newItems = arrayMove(checklistItems, oldIndex, newIndex);
      
      // Update order in database
      for (let i = 0; i < newItems.length; i++) {
        await db.checklistItems.update(newItems[i].id, { order: i });
      }
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingItem(null);
  };

  const completedCount = todayLogs?.filter(log => checklistItems?.some(item => item.id === log.checklistItemId)).length || 0;
  const totalCount = checklistItems?.filter(item => item.isActive).length || 0;
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
          <Button onClick={() => { setEditingItem(null); setShowForm(true); }} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Item
          </Button>
        </div>

        <div className="space-y-2">
          {!checklistItems || checklistItems.length === 0 ? (
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
                {checklistItems.filter(item => item.isActive).map((item) => {
                  const log = todayLogs?.find(log => log.checklistItemId === item.id);
                  return (
                    <SortableItem
                      key={item.id}
                      item={item}
                      logValue={log?.value || false}
                      hasLog={!!log}
                      onChange={(value) => handleItemValueChange(item.id, value)}
                      onDelete={() => handleDeleteItem(item.id)}
                    />
                  );
                })}
              </SortableContext>
            </DndContext>
          )}
        </div>
      </Card>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Edit Habit' : 'Add Habit'}</DialogTitle>
          </DialogHeader>
          <ChecklistItemForm onSuccess={handleFormSuccess} itemToEdit={editingItem} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
