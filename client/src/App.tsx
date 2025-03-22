import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import AuthPage from "@/pages/auth-page";
import ProfilePage from "@/pages/profile-page";
import UploadScriptPage from "@/pages/upload-script-page";
import PrivacyPolicy from "@/pages/privacy-policy";
import AdminDashboard from "@/pages/admin-dashboard";
import { useState, useEffect } from "react";
import { Script } from "@shared/schema";
import ScriptDetailModal from "./components/ScriptDetailModal";
import Notification from "./components/Notification";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import AdBanner from "./components/AdBanner";
import BannerManagement from "./components/BannerManagement";
import CookieConsent from "./components/CookieConsent";
import { useLocation } from "wouter";

function Router() {
  const [selectedScript, setSelectedScript] = useState<Script | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [notification, setNotification] = useState({
    show: false,
    message: ""
  });
  const [location] = useLocation();
  
  // Track page navigation to handle popunder ads
  useEffect(() => {
    // On each navigation, check if we need to show an ad
    // Don't show popunder on auth page
    if (location === "/auth" || location.startsWith("/auth")) {
      return; // Skip loading popunder script on auth page
    }
    
    // This is already handled by our script in index.html, but we call it here
    // to ensure it's checked on each navigation event
    if (typeof window !== 'undefined' && window.loadPopunderScript) {
      window.loadPopunderScript();
    }
  }, [location]);

  const openScriptDetail = (script: Script) => {
    setSelectedScript(script);
    setIsModalOpen(true);
    document.body.style.overflow = "hidden";
  };

  const closeScriptDetail = () => {
    setIsModalOpen(false);
    document.body.style.overflow = "auto";
  };

  const showNotification = (message: string) => {
    setNotification({ show: true, message });
    setTimeout(() => {
      setNotification({ show: false, message: "" });
    }, 2000);
  };

  // Handle script deletion - refreshes scripts list
  const handleScriptDeleted = () => {
    // Script was deleted, we'll automatically close the modal
    // The refresh of the script list will happen via query invalidation
    closeScriptDetail();
  };

  // Create a function to render ad banners
  const renderAdBanners = () => {
    // Don't show ad banners on the auth page or privacy policy page
    const path = window.location.pathname;
    if (path.includes("/auth") || path.includes("/privacy-policy")) return null;
    
    return (
      <div className="container mx-auto px-4 pt-4">
        <div className="grid gap-4 md:grid-cols-2">
          <AdBanner 
            bannerId={1}
          />
          <AdBanner 
            bannerId={2}
          />
        </div>
      </div>
    );
  };
  
  return (
    <>
      {/* Ad Banners added at top level */}
      {renderAdBanners()}
      
      <Switch>
        <ProtectedRoute 
          path="/" 
          component={() => (
            <Home 
              onScriptDetail={openScriptDetail} 
              showNotification={showNotification}
            />
          )} 
        />
        <ProtectedRoute 
          path="/profile" 
          component={ProfilePage} 
        />
        <ProtectedRoute 
          path="/upload" 
          component={UploadScriptPage} 
        />
        <ProtectedRoute 
          path="/admin" 
          component={AdminDashboard} 
        />
        <Route path="/auth" component={AuthPage} />
        <Route path="/privacy-policy" component={PrivacyPolicy} />
        <Route component={NotFound} />
      </Switch>
      
      {isModalOpen && selectedScript && (
        <ScriptDetailModal 
          script={selectedScript} 
          onClose={closeScriptDetail} 
          showNotification={showNotification}
          onDelete={handleScriptDeleted}
        />
      )}
      
      <Notification
        show={notification.show}
        message={notification.message}
      />
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <CookieConsent />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
