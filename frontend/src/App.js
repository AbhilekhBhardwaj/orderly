import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import * as LayoutModule from '@/components/Layout';
import * as LoginPageModule from '@/pages/LoginPage';
import * as DashboardPageModule from '@/pages/DashboardPage';
import * as CustomersPageModule from '@/pages/CustomersPage';
import * as OrdersPageModule from '@/pages/OrdersPage';
import * as RemindersPageModule from '@/pages/RemindersPage';
import '@/App.css';

function normalizeComponent(moduleValue, label) {
  const candidate = moduleValue?.default ?? moduleValue;
  if (typeof candidate === 'function') return candidate;

  return function InvalidComponent() {
    return (
      <div className="p-6 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg" data-testid={`invalid-component-${label}`}>
        Invalid component export for <strong>{label}</strong>. Check default/named export in that file.
      </div>
    );
  };
}

const Layout = normalizeComponent(LayoutModule, 'Layout');
const LoginPage = normalizeComponent(LoginPageModule, 'LoginPage');
const DashboardPage = normalizeComponent(DashboardPageModule, 'DashboardPage');
const CustomersPage = normalizeComponent(CustomersPageModule, 'CustomersPage');
const OrdersPage = normalizeComponent(OrdersPageModule, 'OrdersPage');
const RemindersPage = normalizeComponent(RemindersPageModule, 'RemindersPage');

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
      <div className="w-8 h-8 border-2 border-[#0A2540] border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  return <Layout>{children}</Layout>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/customers" element={<ProtectedRoute><CustomersPage /></ProtectedRoute>} />
      <Route path="/orders" element={<ProtectedRoute><OrdersPage /></ProtectedRoute>} />
      <Route path="/reminders" element={<ProtectedRoute><RemindersPage /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
