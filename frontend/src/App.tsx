// ABOUTME: Main application component with routing
// ABOUTME: Provides React Query and Toast notification context

import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toaster } from '@/components/ui/toaster';
import Home from './routes/Home';
import SearchResults from './routes/SearchResults';
import SchoolDetail from './routes/SchoolDetail';
import Compare from './routes/Compare';
import NotFound from './routes/NotFound';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <div className="min-h-screen bg-background">
          <header className="border-b">
            <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
              <Link to="/" className="text-3xl font-bold tracking-tight hover:text-primary">
                Illinois School Explorer
              </Link>
            </div>
          </header>
          <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/search" element={<SearchResults />} />
              <Route path="/school/:rcdts" element={<SchoolDetail />} />
              <Route path="/compare" element={<Compare />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
        </div>
        <Toaster />
      </BrowserRouter>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

export default App;
