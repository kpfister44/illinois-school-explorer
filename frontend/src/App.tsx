// ABOUTME: Main application component with routing, site header, and phone tab bar
// ABOUTME: Provides React Query and Toast notification context

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import BottomTabBar from '@/components/BottomTabBar';
import ComparisonBasket from '@/components/ComparisonBasket';
import Footer from '@/components/Footer';
import SiteHeader from '@/components/SiteHeader';
import { ComparisonProvider } from '@/contexts/ComparisonContext';
import { useComparisonSchools } from '@/hooks/useComparisonSchools';
import Home from './routes/Home';
import SearchResults from './routes/SearchResults';
import SchoolDetail from './routes/SchoolDetail';
import Compare from './routes/Compare';
import TopScores from './routes/TopScores';
import HowThisWorks from './routes/HowThisWorks';
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
        <SiteHeader />
        <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/search" element={<SearchResults />} />
            <Route path="/school/:rcdts" element={<SchoolDetail />} />
            <Route path="/compare" element={<Compare />} />
            <Route path="/top-scores" element={<TopScores />} />
            <Route path="/how-this-works" element={<HowThisWorks />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <Footer />
      </div>
      <ComparisonBasket schools={comparisonSchools} />
      <BottomTabBar />
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
    </QueryClientProvider>
  );
}

export default App;
