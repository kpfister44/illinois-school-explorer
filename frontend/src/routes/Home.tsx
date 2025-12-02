// ABOUTME: Home page component
// ABOUTME: Landing page with search functionality

import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import SearchBar from '@/components/SearchBar';
import SchoolCount from '@/components/SchoolCount';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center py-6 min-h-[calc(100vh+4rem)]">
      <div className="max-w-2xl text-center">
        <h2 className="text-4xl font-bold tracking-tight mb-4">
          Search for Illinois Schools
        </h2>
        <p className="text-lg text-muted-foreground mb-4">
          Enter a school name or city to view enrollment, test scores, and demographics.
          Compare multiple schools side-by-side.
        </p>
        <div className="mb-8">
          <SchoolCount />
        </div>
        <div className="w-full max-w-xl mx-auto">
          <SearchBar />
        </div>
        <Card className="mt-8 w-full max-w-xl mx-auto text-left">
          <CardHeader>
            <CardTitle className="text-2xl">Explore Top 100 School Scores</CardTitle>
            <p className="text-muted-foreground">
              See the highest-performing Illinois schools ranked by ACT and IAR results.
            </p>
          </CardHeader>
          <CardContent>
            <Button asChild size="lg" className="gap-2">
              <Link to="/top-scores">
                Explore Top 100 Scores
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
