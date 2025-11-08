// ABOUTME: 404 Not Found page component
// ABOUTME: Displayed when user navigates to invalid route

import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center py-12">
      <h2 className="text-4xl font-bold mb-4">404 - Page Not Found</h2>
      <p className="text-muted-foreground mb-8">
        The page you're looking for doesn't exist.
      </p>
      <Button onClick={() => navigate('/')}>Go Home</Button>
    </div>
  );
}
