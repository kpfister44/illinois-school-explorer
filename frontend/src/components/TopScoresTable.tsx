// ABOUTME: Leaderboard table for Top Scores page
// ABOUTME: Renders ranked school rows with score details

import { Link } from 'react-router-dom';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { TopScoreEntry } from '@/lib/api/types';

interface TopScoresTableProps {
  entries: TopScoreEntry[];
}

export default function TopScoresTable({ entries }: TopScoresTableProps) {
  if (!entries.length) {
    return <p className="py-8 text-center text-muted-foreground">No ranked schools available.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-16">Rank</TableHead>
            <TableHead>School</TableHead>
            <TableHead className="hidden md:table-cell">District</TableHead>
            <TableHead className="hidden lg:table-cell">Enrollment</TableHead>
            <TableHead className="text-right">Score</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((entry) => (
            <TableRow key={entry.rcdts} className="hover:bg-muted/40">
              <TableCell>
                <Badge variant={entry.rank <= 3 ? 'default' : 'secondary'}>{entry.rank}</Badge>
              </TableCell>
              <TableCell>
                <div className="font-semibold">{entry.school_name}</div>
                <p className="text-sm text-muted-foreground">{entry.city}</p>
              </TableCell>
              <TableCell className="hidden md:table-cell">{entry.district ?? '—'}</TableCell>
              <TableCell className="hidden lg:table-cell">
                {entry.enrollment ? entry.enrollment.toLocaleString() : '—'}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2">
                  <span className="text-lg font-semibold">{entry.score.toFixed(1)}</span>
                  <Button asChild size="sm" variant="ghost">
                    <Link to={`/school/${entry.rcdts}`}>Details</Link>
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
