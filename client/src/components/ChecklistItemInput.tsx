
import React from 'react';
import { type ChecklistItem } from '@/lib/db';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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
        />
      );

    case 'number':
      return (
        <Input
          type="number"
          value={value as number}
          onChange={(e) => onChange(Number(e.target.value) || 0)}
          className="w-24"
        />
      );

    case 'slider':
      return (
        <div className="flex items-center gap-2 w-full">
          <Slider
            value={[value as number]}
            onValueChange={(vals) => onChange(vals[0])}
            min={0}
            max={item.targetValue || 100}
            step={1}
            className="flex-1"
          />
          <span className="text-sm font-medium w-16 text-right">
            {value}/{item.targetValue || 100}
          </span>
        </div>
      );

    case 'dropdown':
      return (
        <Select
          value={value as string}
          onValueChange={onChange}
        >
          <SelectTrigger className="w-32">
            <SelectValue />
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
        <div className="text-sm font-medium">
          {Math.floor((value as number) / 60)}:{String((value as number) % 60).padStart(2, '0')}
        </div>
      );

    default:
      return null;
  }
}
