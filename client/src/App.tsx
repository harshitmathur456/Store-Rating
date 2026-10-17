import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';

import { AuthProvider, useAuth } from './app/AuthContext';
import { AppLayout } from './app/AppLayout';
import { ProtectedRoute, PublicRoute } from './app/RouteGuards';

import LoginPage from './features/auth/LoginPage';
import SignupPage from './features/auth/SignupPage';
import AdminDashboard from './features/admin/AdminDashboard';
import UsersPage from './features/admin/UsersPage';
import StoresPage from './features/admin/StoresPage';
import UserStoresPage from './features/stores/UserStoresPage';
import OwnerDashboard from './features/owner/OwnerDashboard';
import SettingsPage from './features/settings/SettingsPage';
import ForbiddenPage from './components/ForbiddenPage';
import NotFoundPage from './components/NotFoundPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 60 * 1000,
      retry: 1,
    },
  },
});

function RootRedirect() {
  const { user, isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-50">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-zinc-300 border-t-accent" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  const roleRedirectMap: Record<string, string> = {
    ADMIN: '/admin',
    USER: '/stores',
    OWNER: '/owner',
  };

  return <Navigate to={roleRedirectMap[user.role] || '/login'} replace />;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Toaster richColors position="top-right" closeButton />
        <BrowserRouter>
          <Routes>
            {/* Root redirect */}
            <Route path="/" element={<RootRedirect />} />

            {/* Public Auth Routes */}
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <LoginPage />
                </PublicRoute>
              }
            />
            <Route
              path="/signup"
              element={
                <PublicRoute>
                  <SignupPage />
                </PublicRoute>
              }
            />

            {/* Protected Authenticated Routes with AppLayout */}
            <Route
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              {/* Admin Portal */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute roles={['ADMIN']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/users"
                element={
                  <ProtectedRoute roles={['ADMIN']}>
                    <UsersPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/stores"
                element={
                  <ProtectedRoute roles={['ADMIN']}>
                    <StoresPage />
                  </ProtectedRoute>
                }
              />

              {/* Normal User Portal */}
              <Route
                path="/stores"
                element={
                  <ProtectedRoute roles={['USER']}>
                    <UserStoresPage />
                  </ProtectedRoute>
                }
              />

              {/* Store Owner Portal */}
              <Route
                path="/owner"
                element={
                  <ProtectedRoute roles={['OWNER']}>
                    <OwnerDashboard />
                  </ProtectedRoute>
                }
              />

              {/* General Account Settings (All authenticated roles) */}
              <Route path="/settings" element={<SettingsPage />} />
            </Route>

            {/* 403 Forbidden Page */}
            <Route path="/403" element={<ForbiddenPage />} />

            {/* Catch-all 404 Page */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
