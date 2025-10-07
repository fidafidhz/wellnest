
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { PrivateRoute } from "@/components/auth/PrivateRoute";
import { ElderlyProfileProvider } from "@/contexts/ElderlyProfileContext";

// Pages
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage";
import ResetPasswordPage from "./pages/auth/ResetPasswordPage";
import Dashboard from "./pages/Dashboard";
import ElderlyProfilePage from "./pages/ElderlyProfilePage";

// Elderly Profile Pages
import ElderlyProfileLayout from "./components/elderly/ElderlyProfileLayout";
import ElderlyProfileIndex from "./pages/elderly/ElderlyProfileIndex";
import PersonalInfoPage from "./pages/elderly/PersonalInfoPage";
import MedicalInfoPage from "./pages/elderly/MedicalInfoPage";
import NotesPage from "./pages/elderly/NotesPage";
import AppointmentsPage from "./pages/elderly/AppointmentsPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            
            {/* Protected Routes */}
            <Route element={<PrivateRoute />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/elderly-profile" element={<ElderlyProfilePage />} />
              
              {/* New nested elderly profile routes */}
              <Route path="/elderly-profile" element={
                <ElderlyProfileProvider>
                  <ElderlyProfileLayout />
                </ElderlyProfileProvider>
              }>
                <Route index element={<ElderlyProfileIndex />} />
                <Route path="personal" element={<PersonalInfoPage />} />
                <Route path="medical" element={<MedicalInfoPage />} />
                <Route path="notes" element={<NotesPage />} />
                <Route path="appointments" element={<AppointmentsPage />} />
              </Route>
            </Route>
            
            {/* Catch-all route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
