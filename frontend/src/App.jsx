import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import DashboardLayout from './components/layout/DashboardLayout';
import Dashboard from './pages/Dashboard';
import Vehicles from './pages/Vehicles';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import ComingSoon from './pages/ComingSoon';

const Spinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-paper">
    <svg className="animate-spin h-8 w-8 text-sage-500" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  </div>
);

const ProtectedRoute = ({ children }) => {
  const { operator, loading } = useAuth();
  if (loading) return <Spinner />;
  if (!operator) return <Navigate to="/signin" replace />;
  return children;
};

const AppRoutes = () => {
  const { operator, loading } = useAuth();
  if (loading) return <Spinner />;

  return (
    <Routes>
      <Route path="/signin" element={operator ? <Navigate to="/dashboard" replace /> : <SignIn />} />
      <Route path="/signup" element={operator ? <Navigate to="/dashboard" replace /> : <SignUp />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="vehicles" element={<Vehicles />} />
        <Route path="parents" element={<ComingSoon title="Parents" />} />
        <Route path="payments" element={<ComingSoon title="Payments" />} />
        <Route path="compliance" element={<ComingSoon title="Compliance" />} />
        <Route path="settings" element={<ComingSoon title="Settings" />} />
      </Route>

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  </BrowserRouter>
);

export default App;
