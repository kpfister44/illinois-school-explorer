// ABOUTME: Back button shown at the top of a page
// ABOUTME: Returns to the previous page, or Home when the visitor landed directly on this one

import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

const FIRST_PAGE_OF_VISIT = 'default';

export default function BackButton() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleBack = () => {
    if (location.key === FIRST_PAGE_OF_VISIT) {
      navigate('/');
    } else {
      navigate(-1);
    }
  };

  return (
    <Button
      variant="ghost"
      onClick={handleBack}
      className="gap-2 px-0 text-base hover:bg-transparent"
    >
      <ArrowLeft className="h-5 w-5" />
      Back
    </Button>
  );
}
