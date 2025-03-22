import { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';

interface BackButtonProps {
  defaultPath?: string;
  className?: string;
}

export default function BackButton({ defaultPath = '/', className = '' }: BackButtonProps) {
  const [_, navigate] = useLocation();
  const [canGoBack, setCanGoBack] = useState(false);

  useEffect(() => {
    // Check if we can go back in history
    setCanGoBack(window.history.length > 1);
  }, []);

  const handleBack = () => {
    if (canGoBack) {
      window.history.back();
    } else {
      navigate(defaultPath);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleBack}
      className={`flex items-center ${className}`}
    >
      <ArrowLeft className="h-4 w-4 mr-1" />
      Back
    </Button>
  );
}