import { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Sidebar } from "@/components/layout/Sidebar";
import { supabase } from "@/integrations/supabase/client";
import type { Session } from "@supabase/supabase-js";
import Auth from "@/pages/Auth";
import Dashboard from "@/pages/Dashboard";
import Jobs from "@/pages/Jobs";
import Profile from "@/pages/Profile";
import Tracker from "@/pages/Tracker";
import Interview from "@/pages/Interview";
import Resumes from "@/pages/Resumes";
import Analytics from "@/pages/Analytics";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const AppShell = () => {
  const [session, setSession] = useState<Session | null | undefined>(undefined);

  useEffect(() => {
    // Listen first, then get session
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });
    supabase.auth.getSession().then(({ data: { session: s } }) => setSession(s));
    return () => subscription.unsubscribe();
  }, []);

  // Still loading
  if (session === undefined) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Not logged in
  if (!session) return <Auth />;

  // Logged in
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/jobs" element={<Jobs />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/tracker" element={<Tracker />} />
          <Route path="/interview" element={<Interview />} />
          <Route path="/resumes" element={<Resumes />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </div>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppShell />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
