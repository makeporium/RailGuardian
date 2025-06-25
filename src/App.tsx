import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "@/components/ProtectedRoute";

// Core Page Imports
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import DashboardRedirector from "./pages/Dashboard";
import WorkerDashboardPage from "./pages/WorkerDashboard";

// Admin Page Imports
import AdminDashboardPage from "./pages/AdminDashboard";
import SupervisorDashboardPage from "./pages/SupervisorDashboard";
import AdminOverviewPage from "./pages/admin/index";
import AdminManagePage from "./pages/admin/manage";
import AdminTrainsPage from "./pages/admin/trains";
import AdminStaffPage from "./pages/admin/staff";
import AdminAlertsPage from "./pages/admin/alerts";
import AdminSettingsPage from "./pages/admin/settings";
import PassengerComplaintPage from "./pages/Complaint";
import HygieneMap from "./pages/HygieneMap";

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/complaint" element={<PassengerComplaintPage />} />

            {/* Protected Routes */}
            <Route path="/dashboard" element={<ProtectedRoute><DashboardRedirector /></ProtectedRoute>} />
            <Route path="/dashboard/worker" element={<ProtectedRoute requireRole="laborer"><WorkerDashboardPage /></ProtectedRoute>} />

            {/* Admin Routes */}
            <Route 
              path="/dashboard/admin" 
              element={<ProtectedRoute requireRole={['admin']}><AdminDashboardPage /></ProtectedRoute>}
            >
              <Route index element={<AdminOverviewPage />} />
              <Route path="hygiene-map" element={<HygieneMap />} />
              <Route path="hygiene-map/:trainId" element={<HygieneMap />} />
              <Route path="manage" element={<AdminManagePage />} />
              <Route path="trains" element={<AdminTrainsPage />} />
              <Route path="staff" element={<AdminStaffPage />} />
              <Route path="alerts" element={<AdminAlertsPage />} />
              <Route path="settings" element={<AdminSettingsPage />} />
            </Route>

            {/* Supervisor Routes */}
            <Route 
              path="/dashboard/supervisor" 
              element={<ProtectedRoute requireRole={['supervisor']}><SupervisorDashboardPage /></ProtectedRoute>}
            >
              <Route index element={<AdminOverviewPage />} />
              <Route path="manage" element={<AdminManagePage />} />
              <Route path="trains" element={<AdminTrainsPage />} />
              <Route path="staff" element={<AdminStaffPage />} />
              <Route path="alerts" element={<AdminAlertsPage />} />
              <Route path="settings" element={<AdminSettingsPage />} />
            </Route>

            {/* 404 Not Found */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
