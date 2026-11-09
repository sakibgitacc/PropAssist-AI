import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { MainLayout } from './components/layout/MainLayout';
import { getDashboardRouteForRole } from './utils/roleRoutes';
import { Sparkles } from 'lucide-react';

// Public & Shared Pages
import { LandingPage } from './pages/LandingPage';
import { Login } from './pages/Login';
import { JitsiCallPage } from './pages/JitsiCallPage';
import { AiChatbotPage } from './pages/AiChatbotPage';
import { ProjectListing } from './pages/ProjectListing';
import { ProjectDetails } from './pages/ProjectDetails';
import { SiteVisitBooking } from './pages/SiteVisitBooking';

// 4 Dedicated Role-Based Dashboards
import { SuperAdminDashboard } from './pages/SuperAdminDashboard';
import { SalesHeadDashboard } from './pages/SalesHeadDashboard';
import { SalesExecutiveDashboard } from './pages/SalesExecutiveDashboard';
import { BuyerDashboard } from './pages/BuyerDashboard';

// Internal Management Operations (Staff Only)
import { LeadManagement } from './pages/LeadManagement';
import { LeadDetails } from './pages/LeadDetails';
import { SalesExecutiveWorkspace } from './pages/SalesExecutiveWorkspace';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { FactSheetEditor } from './pages/FactSheetEditor';
import { VisitSlotManagement } from './pages/VisitSlotManagement';

// Dynamic Role Dashboard Redirector for generic /dashboard route
const RoleDashboardRedirect = () => {
  const { user } = useAuth();
  const target = getDashboardRouteForRole(user?.role);
  return <Navigate to={target} replace />;
};

// Protected Route Component with Strict Role Enforcement
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0D1726] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#C8814F] to-[#15233A] flex items-center justify-center animate-spin">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <p className="text-[#94A3B8] text-xs font-semibold tracking-wider uppercase">Loading PropAssist AI...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`} replace />;
  }

  if (allowedRoles) {
    const userRole = user?.role === 'SUPER_ADMIN' ? 'ADMIN' : user?.role;
    const isAllowed = allowedRoles.some(r => (r === 'SUPER_ADMIN' ? 'ADMIN' : r) === userRole);
    if (!isAllowed) {
      // Strictly bounce unauthorized user to their personal authorized dashboard
      return <Navigate to={getDashboardRouteForRole(user?.role)} replace />;
    }
  }

  return children;
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* ─── PUBLIC WEBSITE (Preserved completely) ─── */}
          <Route path="/" element={<LandingPage />} />

          {/* ─── AUTHENTICATION ─── */}
          <Route path="/login" element={<Login />} />

          {/* ─── STANDALONE SECURE CALL ROOM ─── */}
          <Route path="/call/:token" element={<JitsiCallPage />} />

          {/* ─── AUTHENTICATED APP SHELL (MainLayout with Role-Adaptive Sidebar) ─── */}
          <Route element={<MainLayout />}>

            {/* Generic /dashboard redirects automatically to role-specific dashboard */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <RoleDashboardRedirect />
              </ProtectedRoute>
            } />

            {/* 1. SUPER ADMIN DASHBOARD */}
            <Route path="/admin/dashboard" element={
              <ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}>
                <SuperAdminDashboard />
              </ProtectedRoute>
            } />
            <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />

            {/* 2. SALES HEAD DASHBOARD */}
            <Route path="/sales-head/dashboard" element={
              <ProtectedRoute allowedRoles={['SALES_HEAD', 'ADMIN', 'SUPER_ADMIN']}>
                <SalesHeadDashboard />
              </ProtectedRoute>
            } />

            {/* 3. SALES EXECUTIVE DASHBOARD */}
            <Route path="/executive/dashboard" element={
              <ProtectedRoute allowedRoles={['SALES_EXECUTIVE', 'SALES_HEAD', 'ADMIN', 'SUPER_ADMIN']}>
                <SalesExecutiveDashboard />
              </ProtectedRoute>
            } />

            {/* 4. BUYER DASHBOARD (Strictly Personal) */}
            <Route path="/buyer/dashboard" element={
              <ProtectedRoute allowedRoles={['BUYER']}>
                <BuyerDashboard />
              </ProtectedRoute>
            } />

            {/* ─── INTERNAL OPERATIONS (Staff Only) ─── */}
            <Route path="/leads" element={
              <ProtectedRoute allowedRoles={['SALES_HEAD', 'ADMIN', 'SUPER_ADMIN']}>
                <LeadManagement />
              </ProtectedRoute>
            } />

            <Route path="/leads/:id" element={
              <ProtectedRoute allowedRoles={['SALES_EXECUTIVE', 'SALES_HEAD', 'ADMIN', 'SUPER_ADMIN']}>
                <LeadDetails />
              </ProtectedRoute>
            } />

            <Route path="/workspace" element={
              <ProtectedRoute allowedRoles={['SALES_EXECUTIVE', 'SALES_HEAD', 'ADMIN', 'SUPER_ADMIN']}>
                <SalesExecutiveWorkspace />
              </ProtectedRoute>
            } />

            <Route path="/analytics" element={
              <ProtectedRoute allowedRoles={['SALES_HEAD', 'ADMIN', 'SUPER_ADMIN']}>
                <AnalyticsPage />
              </ProtectedRoute>
            } />

            <Route path="/slots" element={
              <ProtectedRoute allowedRoles={['SALES_HEAD', 'ADMIN', 'SUPER_ADMIN']}>
                <VisitSlotManagement />
              </ProtectedRoute>
            } />

            <Route path="/factsheets" element={
              <ProtectedRoute allowedRoles={['SALES_HEAD', 'ADMIN', 'SUPER_ADMIN']}>
                <FactSheetEditor />
              </ProtectedRoute>
            } />

            {/* ─── SHARED & PORTAL UTILITIES ─── */}
            <Route path="/chat" element={<AiChatbotPage />} />
            <Route path="/projects" element={<ProjectListing />} />
            <Route path="/projects/:id" element={<ProjectDetails />} />
            <Route path="/book-visit" element={
              <ProtectedRoute>
                <SiteVisitBooking />
              </ProtectedRoute>
            } />
          </Route>

          {/* Fallback to landing */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
