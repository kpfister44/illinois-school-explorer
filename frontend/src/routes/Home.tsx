// ABOUTME: Home page component
// ABOUTME: Landing page with search instructions

import { Button } from '@/components/ui/button';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="max-w-2xl text-center">
        <h2 className="text-4xl font-bold tracking-tight mb-4">
          Search for Illinois Schools
        </h2>
        <p className="text-lg text-muted-foreground mb-8">
          Enter a school name or city to view enrollment, test scores, and demographics.
          Compare multiple schools side-by-side.
        </p>
        <Button size="lg">Get Started</Button>
      </div>
    </div>
  );
}
