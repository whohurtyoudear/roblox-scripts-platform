import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';

export default function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);
  const [_, setLocation] = useLocation();

  // Check if user has already accepted cookies
  useEffect(() => {
    const hasAccepted = localStorage.getItem('cookieConsent');
    if (!hasAccepted) {
      // Show cookie banner after a small delay for better UX
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const acceptCookies = () => {
    localStorage.setItem('cookieConsent', 'accepted');
    setIsVisible(false);
  };

  const navigateToPrivacyPolicy = () => {
    setLocation('/privacy-policy');
  };

  // If the banner is not visible, don't render anything
  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-[#1e293b] border-t border-[#334155] p-4 md:p-6 z-50 shadow-lg">
      <div className="container mx-auto max-w-6xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex-1">
          <h3 className="text-lg font-medium text-white mb-2">We value your privacy</h3>
          <p className="text-[#94a3b8] text-sm">
            This site uses cookies and similar technologies to improve your experience and for analytics.
            By clicking "Accept," you consent to the use of cookies. See our{' '}
            <button
              onClick={navigateToPrivacyPolicy}
              className="text-primary hover:underline font-medium"
            >
              Privacy Policy
            </button>{' '}
            for more information.
          </p>
        </div>
        <div className="flex gap-2 items-center">
          <Button 
            variant="outline" 
            onClick={navigateToPrivacyPolicy}
            className="text-sm"
          >
            Privacy Policy
          </Button>
          <Button 
            onClick={acceptCookies}
            className="text-sm bg-primary"
          >
            Accept
          </Button>
        </div>
      </div>
    </div>
  );
}