import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import AuthPage from "@/pages/auth-page";
import ProfilePage from "@/pages/profile-page";
import UploadScriptPage from "@/pages/upload-script-page";
import { useState } from "react";
import { Script } from "@shared/schema";
import ScriptDetailModal from "./components/ScriptDetailModal";
import Notification from "./components/Notification";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import AdBanner, { adBannerData } from "./components/AdBanner";

function Router() {
  const [selectedScript, setSelectedScript] = useState<Script | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [notification, setNotification] = useState({
    show: false,
    message: ""
  });

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

  return (
    <>
      {/* Ad Banners at the top of every page except auth page */}
      <Route path="/:rest*">
        {(params) => {
          // Don't show ad banners on the auth page
          const path = window.location.pathname;
          if (path.includes("/auth")) return null;
          
          return (
            <div className="container mx-auto px-4 pt-4">
              <div className="grid gap-4 md:grid-cols-2">
                <AdBanner 
                  imageUrl={adBannerData[0].imageUrl}
                  linkUrl={adBannerData[0].linkUrl}
                  altText={adBannerData[0].altText}
                />
                <AdBanner 
                  imageUrl={adBannerData[1].imageUrl}
                  linkUrl={adBannerData[1].linkUrl}
                  altText={adBannerData[1].altText}
                />
              </div>
            </div>
          );
        }}
      </Route>
      
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
        <Route path="/auth" component={AuthPage} />
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
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
