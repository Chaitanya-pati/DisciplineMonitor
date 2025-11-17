import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { ChecklistItem } from '@shared/schema';

interface ChecklistItemInputProps {
  item: ChecklistItem;
  value: boolean | number | string;
  onChange: (value: boolean | number | string) => void;
}

export function ChecklistItemInput({ item, value, onChange }: ChecklistItemInputProps) {
  switch (item.inputType) {
    case 'yesno':
      return (
        <Switch
          checked={value as boolean}
          onCheckedChange={onChange}
          data-testid={`input-${item.id}`}
        />
      );
    
    case 'number':
      return (
        <Input
          type="number"
          value={value as number}
          onChange={e => onChange(e.target.valueAsNumber)}
          className="w-24"
          data-testid={`input-${item.id}`}
        />
      );
    
    case 'slider':
      return (
        <div className="flex items-center gap-4 w-full">
          <Slider
            value={[value as number]}
            onValueChange={([v]) => onChange(v)}
            max={item.targetValue ?? 100}
            step={1}
            className="flex-1"
            data-testid={`input-${item.id}`}
          />
          <span className="text-sm font-medium w-12 text-right">
            {value}/{item.targetValue}
          </span>
        </div>
      );
    
    case 'dropdown':
      return (
        <Select value={value as string} onValueChange={onChange}>
          <SelectTrigger className="w-40" data-testid={`input-${item.id}`}>
            <SelectValue placeholder="Select" />
          </SelectTrigger>
          <SelectContent>
            {item.dropdownOptions?.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    
    case 'timer':
      return (
        <Input
          type="number"
          value={value as number}
          onChange={e => onChange(e.target.valueAsNumber)}
          placeholder="Minutes"
          className="w-24"
          data-testid={`input-${item.id}`}
        />
      );
    
    default:
      return null;
  }
}
