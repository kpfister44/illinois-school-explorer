// ABOUTME: The schools selected for comparison, each with a button to remove it
// ABOUTME: Shown in the desktop comparison bar and on the Compare page while one school is selected

import { X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { School } from '@/lib/api/types';

interface SelectedSchoolListProps {
  schools: School[];
  onRemove: (rcdts: string) => void;
}

export default function SelectedSchoolList({ schools, onRemove }: SelectedSchoolListProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {schools.map((school) => {
        const isPlaceholder = school.id < 0;
        const displayName = isPlaceholder
          ? `${school.school_name} (${school.rcdts})`
          : school.school_name;

        return (
          <Badge key={school.rcdts} variant="outline" className="max-w-full bg-card py-0 pl-3 pr-0 text-sm">
            <span className={`truncate ${isPlaceholder ? 'text-muted-foreground' : ''}`}>
              {displayName}
            </span>
            <button
              type="button"
              onClick={() => onRemove(school.rcdts)}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label={`Remove ${displayName}`}
            >
              <X className="h-4 w-4" />
            </button>
          </Badge>
        );
      })}
    </div>
  );
}
