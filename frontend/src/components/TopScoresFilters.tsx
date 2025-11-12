// ABOUTME: Filter tabs for Top Scores page
// ABOUTME: Provides assessment/level selection UI

import { useEffect, useRef } from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
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

  return (
    <Tabs value={value} onValueChange={notifyChange} className="w-full">
      <TabsList className="flex flex-wrap gap-2">
        {options.map((option) => (
          <TabsTrigger
            key={option.id}
            value={option.id}
            className="flex-1 min-w-[200px] text-sm"
            onMouseEnter={() => onHoverOption?.(option)}
          >
            {option.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
