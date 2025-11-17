
import { useEffect, useState } from 'react';
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BottomNavigation } from "@/components/BottomNavigation";
import { initializeDatabase } from "@/lib/db";
import Dashboard from "@/pages/Dashboard";
import Fitness from "@/pages/Fitness";
import Tasks from "@/pages/Tasks";
import Reports from "@/pages/Reports";
import Settings from "@/pages/Settings";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/fitness" component={Fitness} />
      <Route path="/tasks" component={Tasks} />
      <Route path="/reports" component={Reports} />
      <Route path="/settings" component={Settings} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
    // Initialize database with default data
    initializeDatabase()
      .then(() => setDbReady(true))
      .catch((error) => {
        console.error('Database initialization failed:', error);
        setDbReady(true); // Continue anyway
      });
  }, []);

  if (!dbReady) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-background text-foreground">
          <Router />
          <BottomNavigation />
        </div>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
