import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { insertChecklistItemSchema, type ChecklistItem, type InsertChecklistItem } from '@shared/schema';
import { db } from '@/lib/db';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

interface ChecklistItemFormProps {
  editingItem?: ChecklistItem | null;
  onSuccess: () => void;
}

export function ChecklistItemForm({ editingItem, onSuccess }: ChecklistItemFormProps) {
  const { toast } = useToast();

  const form = useForm<InsertChecklistItem>({
    resolver: zodResolver(insertChecklistItemSchema),
    defaultValues: {
      title: editingItem?.title ?? '',
      inputType: editingItem?.inputType ?? 'yesno',
      targetValue: editingItem?.targetValue,
      unit: editingItem?.unit ?? '',
      dropdownOptions: editingItem?.dropdownOptions ?? [],
      order: editingItem?.order ?? 0,
      reminderTime: editingItem?.reminderTime ?? '',
      isActive: editingItem?.isActive ?? true,
    },
  });

  const inputType = form.watch('inputType');

  const onSubmit = async (data: InsertChecklistItem) => {
    try {
      if (editingItem) {
        await db.checklistItems.update(editingItem.id, data);
        toast({
          title: 'Success',
          description: 'Habit updated successfully!',
        });
      } else {
        const maxOrder = await db.checklistItems.toArray().then(items => 
          items.length > 0 ? Math.max(...items.map(i => i.order)) : -1
        );
        
        await db.checklistItems.add({
          ...data,
          id: crypto.randomUUID(),
          order: maxOrder + 1,
          createdAt: Date.now(),
        });
        
        toast({
          title: 'Success',
          description: 'Habit added successfully!',
        });
      }
      
      onSuccess();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save habit. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Habit Title</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Water Intake, Meditation" {...field} data-testid="input-title" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="inputType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Input Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger data-testid="select-input-type">
                    <SelectValue placeholder="Select input type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="yesno">Yes/No</SelectItem>
                  <SelectItem value="number">Number</SelectItem>
                  <SelectItem value="slider">Slider</SelectItem>
                  <SelectItem value="dropdown">Dropdown</SelectItem>
                  <SelectItem value="timer">Timer</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {(inputType === 'number' || inputType === 'slider' || inputType === 'timer') && (
          <FormField
            control={form.control}
            name="targetValue"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Target Value</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="e.g., 4"
                    {...field}
                    onChange={e => field.onChange(e.target.valueAsNumber)}
                    data-testid="input-target-value"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {(inputType === 'number' || inputType === 'slider') && (
          <FormField
            control={form.control}
            name="unit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Unit (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., litres, mins, steps" {...field} data-testid="input-unit" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <div className="flex gap-2 pt-4">
          <Button type="submit" className="flex-1" data-testid="button-save">
            {editingItem ? 'Update Habit' : 'Add Habit'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
