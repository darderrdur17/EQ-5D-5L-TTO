import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { OfflineBanner, InstallPrompt } from "@/components/pwa/OfflineIndicator";

import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Install from "./pages/Install";
import InterviewerDashboard from "./pages/InterviewerDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import Interview from "./pages/Interview";
import SessionHistory from "./pages/SessionHistory";
import SessionDetail from "./pages/SessionDetail";
import AdminQualityReview from "./pages/AdminQualityReview";
import AdminUserManagement from "./pages/AdminUserManagement";
import InterviewerPerformance from "./pages/InterviewerPerformance";
import UserGuide from "./pages/UserGuide";
import PublicSurvey from "./pages/PublicSurvey";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <OfflineBanner />
        <InstallPrompt />
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/install" element={<Install />} />
            <Route path="/survey" element={<PublicSurvey />} />
            
            {/* Protected routes - Interviewer */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute allowedRoles={['interviewer']}>
                  <InterviewerDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/interview" 
              element={
                <ProtectedRoute allowedRoles={['interviewer']}>
                  <Interview />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/sessions" 
              element={
                <ProtectedRoute allowedRoles={['interviewer']}>
                  <SessionHistory />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/sessions/:sessionId" 
              element={
                <ProtectedRoute allowedRoles={['interviewer', 'admin']}>
                  <SessionDetail />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/guide" 
              element={
                <ProtectedRoute allowedRoles={['interviewer', 'admin']}>
                  <UserGuide />
                </ProtectedRoute>
              } 
            />
            
            {/* Protected routes - Admin */}
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/quality-review" 
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminQualityReview />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/users" 
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminUserManagement />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/performance" 
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <InterviewerPerformance />
                </ProtectedRoute>
              } 
            />
            
            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
