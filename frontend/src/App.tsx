// ABOUTME: Main application component with routing
// ABOUTME: Provides React Query and Toast notification context

import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toaster } from '@/components/ui/toaster';
import ComparisonBasket from '@/components/ComparisonBasket';
import Footer from '@/components/Footer';
import { ComparisonProvider } from '@/contexts/ComparisonContext';
import { useComparisonSchools } from '@/hooks/useComparisonSchools';
import Home from './routes/Home';
import SearchResults from './routes/SearchResults';
import SchoolDetail from './routes/SchoolDetail';
import Compare from './routes/Compare';
import TopScores from './routes/TopScores';
import NotFound from './routes/NotFound';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function AppRoutes() {
  const comparisonSchools = useComparisonSchools();

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-background pb-24 flex flex-col">
        <header className="border-b">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:py-6 sm:px-6 lg:px-8">
            <Link to="/" className="font-bold tracking-tight hover:text-primary">
              {/* Mobile: Short title */}
              <span className="text-xl sm:hidden">IL Schools</span>
              {/* Desktop: Full title */}
              <span className="hidden sm:inline text-3xl">Illinois School Explorer</span>
            </Link>
            <nav className="flex items-center gap-4 sm:gap-6 text-sm font-medium">
              <Link
                to="/top-scores"
                className="text-muted-foreground hover:text-primary whitespace-nowrap"
              >
                Top Scores
              </Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/search" element={<SearchResults />} />
            <Route path="/school/:rcdts" element={<SchoolDetail />} />
            <Route path="/compare" element={<Compare />} />
            <Route path="/top-scores" element={<TopScores />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <Footer />
      </div>
      <ComparisonBasket schools={comparisonSchools} />
      <Toaster />
    </BrowserRouter>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ComparisonProvider>
        <AppRoutes />
      </ComparisonProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

export default App;
