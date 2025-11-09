// ABOUTME: SchoolCard component for displaying school in search results
// ABOUTME: Shows basic info and links to detail view

import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { School } from '@/lib/api/types';

interface SchoolCardProps {
  school: School;
}

export default function SchoolCard({ school }: SchoolCardProps) {
  return (
    <Link to={`/school/${school.rcdts}`} className="block">
      <Card className="hover:bg-accent transition-colors cursor-pointer">
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <CardTitle className="text-xl mb-2">{school.school_name}</CardTitle>
              <CardDescription>
                {school.city}
                {school.district && ` • ${school.district}`}
              </CardDescription>
            </div>
            {school.school_type && (
              <Badge variant="secondary">{school.school_type}</Badge>
            )}
          </div>
        </CardHeader>
      </Card>
    </Link>
  );
}
