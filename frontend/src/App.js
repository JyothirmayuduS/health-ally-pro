// Medora — auth-gated multi-role portal (Lab / Doctor / Reception / Admin)
// REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
import "@/App.css";
import {
  BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate,
} from "react-router-dom";
import { useEffect } from "react";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider, useAuth, landingFor } from "@/lab/auth";
import { LabProvider } from "@/lab/store";

import AuthCallback from "@/lab/pages/AuthCallback";
import Login from "@/lab/pages/Login";
import AppShell from "@/lab/LabShell";

import Dashboard from "@/lab/pages/Dashboard";
import Orders from "@/lab/pages/Orders";
import Collection from "@/lab/pages/Collection";
import Processing from "@/lab/pages/Processing";
import Validation from "@/lab/pages/Validation";
import Catalog from "@/lab/pages/Catalog";
import Samples from "@/lab/pages/Samples";
import Reports from "@/lab/pages/Reports";
import Settings from "@/lab/pages/Settings";

import DoctorHome from "@/lab/pages/DoctorHome";
import DoctorNewOrder from "@/lab/pages/DoctorNewOrder";

import ReceptionHome from "@/lab/pages/ReceptionHome";
import ReceptionWalkin from "@/lab/pages/ReceptionWalkin";

import AdminUsers from "@/lab/pages/AdminUsers";

function FullPageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--paper)]">
      <div className="text-center">
        <div className="h-3 w-3 rounded-full bg-[var(--sage-700)] animate-pulse mx-auto" />
        <div className="text-xs font-mono uppercase tracking-[0.2em] text-stone-500 mt-4">Medora Lab</div>
      </div>
    </div>
  );
}

function Protected({ children, allow }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <FullPageLoader />;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  if (allow && !allow.includes(user.role)) {
    return <Navigate to={landingFor(user)} replace />;
  }
  return children;
}

function RootRedirect() {
  const { user, loading } = useAuth();
  if (loading) return <FullPageLoader />;
  return <Navigate to={user ? landingFor(user) : "/login"} replace />;
}

function AppRouter() {
  // Detect Emergent Auth fragment on any route — process synchronously before normal routing
  const location = useLocation();
  if (location.hash?.includes("session_id=")) {
    return <AuthCallback />;
  }
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/auth/callback" element={<AuthCallback />} />

      <Route path="/" element={<RootRedirect />} />

      {/* Lab */}
      <Route
        path="/lab"
        element={
          <Protected allow={["lab_supervisor", "lab_technician"]}>
            <AppShell />
          </Protected>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="orders" element={<Orders />} />
        <Route path="collection" element={<Collection />} />
        <Route path="processing" element={<Processing />} />
        <Route path="validation" element={<Validation />} />
        <Route path="catalog" element={<Catalog />} />
        <Route path="samples" element={<Samples />} />
        <Route path="reports" element={<Reports />} />
        <Route path="settings" element={<Settings />} />
      </Route>

      {/* Doctor */}
      <Route
        path="/doctor"
        element={
          <Protected allow={["doctor", "lab_supervisor"]}>
            <AppShell />
          </Protected>
        }
      >
        <Route index element={<DoctorHome />} />
        <Route path="new-order" element={<DoctorNewOrder />} />
        <Route path="results" element={<DoctorHome />} />
      </Route>

      {/* Reception */}
      <Route
        path="/reception"
        element={
          <Protected allow={["receptionist", "lab_supervisor"]}>
            <AppShell />
          </Protected>
        }
      >
        <Route index element={<ReceptionHome />} />
        <Route path="walkin" element={<ReceptionWalkin />} />
      </Route>

      {/* Admin (supervisor only) */}
      <Route
        path="/admin"
        element={
          <Protected allow={["lab_supervisor"]}>
            <AppShell />
          </Protected>
        }
      >
        <Route path="users" element={<AdminUsers />} />
      </Route>

      <Route path="*" element={<RootRedirect />} />
    </Routes>
  );
}

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <AuthProvider>
          <LabProvider>
            <AppRouter />
          </LabProvider>
        </AuthProvider>
      </BrowserRouter>
      <Toaster position="top-right" richColors closeButton />
    </div>
  );
}

export default App;
