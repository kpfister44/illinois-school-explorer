// ABOUTME: Filter tabs for Top Scores page
// ABOUTME: Provides assessment/level selection UI with mobile-optimized dropdown

import { useEffect, useRef } from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Assessment, SchoolLevel } from '@/lib/api/types';

export interface TopScoresFilterOption {
  id: string;
  label: string;
  assessment: Assessment;
  level: SchoolLevel;
}

interface TopScoresFiltersProps {
  value: string;
  options: TopScoresFilterOption[];
  onChange: (id: string) => void;
  onHoverOption?: (option: TopScoresFilterOption) => void;
}

export default function TopScoresFilters({
  value,
  options,
  onChange,
  onHoverOption,
}: TopScoresFiltersProps) {
  const lastValueRef = useRef(value);

  useEffect(() => {
    lastValueRef.current = value;
  }, [value]);

  const notifyChange = (id: string) => {
    if (lastValueRef.current !== id) {
      lastValueRef.current = id;
      onChange(id);
    }
  };

  const selectedOption = options.find((opt) => opt.id === value);

  return (
    <div className="w-full">
      {/* Mobile: Dropdown Select */}
      <div className="md:hidden">
        <Select value={value} onValueChange={notifyChange}>
          <SelectTrigger className="w-full">
            <SelectValue>
              {selectedOption?.label ?? 'Select assessment'}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option.id} value={option.id}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Desktop: Tabs */}
      <div className="hidden md:block">
        <Tabs value={value} onValueChange={notifyChange} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            {options.map((option) => (
              <TabsTrigger
                key={option.id}
                value={option.id}
                onMouseEnter={() => onHoverOption?.(option)}
                onFocus={() => onHoverOption?.(option)}
              >
                {option.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>
    </div>
  );
}
