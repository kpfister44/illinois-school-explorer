// ABOUTME: Main application component
// ABOUTME: Root component that will contain routing and layout

import { Button } from '@/components/ui/button';

function App() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold tracking-tight">
            Illinois School Explorer
          </h1>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <p className="text-muted-foreground mb-4">Frontend foundation setup complete</p>
        <Button>Get Started</Button>
      </main>
    </div>
  );
}

export default App;
