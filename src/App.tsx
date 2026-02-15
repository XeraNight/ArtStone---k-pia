import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/hooks/useTheme";
import { AuthProvider } from "@/contexts/AuthContext";
import { lazy, Suspense } from "react";
import { PageSkeleton } from "@/components/ui/PageSkeleton";
import { ErrorBoundary } from "@/components/error/ErrorBoundary";
import { getErrorMessage, shouldRetry } from "@/utils/errorUtils";
import { toast } from "sonner";

// Lazy load all route components for better code splitting
const Login = lazy(() => import("@/pages/Login"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const Leads = lazy(() => import("@/pages/Leads"));
const Clients = lazy(() => import("@/pages/Clients"));
const Salespeople = lazy(() => import("@/pages/Salespeople"));
const Quotes = lazy(() => import("@/pages/Quotes"));
const Invoices = lazy(() => import("@/pages/Invoices"));
const Inventory = lazy(() => import("@/pages/Inventory"));
const Documents = lazy(() => import("@/pages/Documents"));
const Settings = lazy(() => import("@/pages/Settings"));
const NotFound = lazy(() => import("@/pages/NotFound"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes - keep data fresh longer
      cacheTime: 1000 * 60 * 10, // 10 minutes - keep in cache
      refetchOnWindowFocus: false, // Don't refetch when switching tabs
      retry: (failureCount, error) => {
        // Use smart retry logic from errorUtils
        return shouldRetry(error, failureCount);
      },
      retryDelay: (attemptIndex) => {
        // Exponential backoff: 1s, 2s, 4s
        return Math.min(1000 * 2 ** attemptIndex, 10000);
      },
    },
    mutations: {
      onError: (error) => {
        // Show user-friendly error messages for mutations
        const message = getErrorMessage(error);
        toast.error(message);
      },
    },
  },
});

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Suspense fallback={<PageSkeleton />}>
                <Routes>
                  <Route path="/" element={<Navigate to="/login" replace />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/leads" element={<Leads />} />
                  <Route path="/clients" element={<Clients />} />
                  <Route path="/salespeople" element={<Salespeople />} />
                  <Route path="/quotes" element={<Quotes />} />
                  <Route path="/invoices" element={<Invoices />} />
                  <Route path="/inventory" element={<Inventory />} />
                  <Route path="/documents" element={<Documents />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
