import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import { useState } from "react";
import { Script } from "@shared/schema";
import ScriptDetailModal from "./components/ScriptDetailModal";
import Notification from "./components/Notification";

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
        <Route path="/">
          <Home 
            onScriptDetail={openScriptDetail} 
            showNotification={showNotification}
          />
        </Route>
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
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
