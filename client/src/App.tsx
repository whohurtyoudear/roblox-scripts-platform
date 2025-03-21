import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import AuthPage from "@/pages/auth-page";
import { useState } from "react";
import { Script } from "@shared/schema";
import ScriptDetailModal from "./components/ScriptDetailModal";
import Notification from "./components/Notification";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";

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

  return (
    <>
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
        <Route path="/auth" component={AuthPage} />
        <Route component={NotFound} />
      </Switch>
      
      {isModalOpen && selectedScript && (
        <ScriptDetailModal 
          script={selectedScript} 
          onClose={closeScriptDetail} 
          showNotification={showNotification}
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
