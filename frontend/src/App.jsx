import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AdminAuthProvider, useAdminAuth } from './contexts/AdminAuthContext';
import DashboardLayout from './components/layout/DashboardLayout';
import AdminLayout from './components/layout/AdminLayout';
import Dashboard from './pages/Dashboard';
import Vehicles from './pages/Vehicles';
import Parents from './pages/Parents';
import Compliance from './pages/Compliance';
import Settings from './pages/Settings';
import Finance from './pages/Finance';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import LandingPage from './pages/LandingPage';
import AdminSignIn from './pages/AdminSignIn';
import AdminDashboard from './pages/AdminDashboard';
import AdminOperatorDetail from './pages/AdminOperatorDetail';

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

const AdminProtectedRoute = ({ children }) => {
  const { admin, loading } = useAdminAuth();
  if (loading) return <Spinner />;
  if (!admin) return <Navigate to="/admin/signin" replace />;
  return children;
};

const AppRoutes = () => {
  const { operator, loading } = useAuth();
  if (loading) return <Spinner />;

  return (
    <Routes>
      {/* Operator routes */}
      <Route path="/signin" element={operator ? <Navigate to="/dashboard" replace /> : <SignIn />} />
      <Route path="/signup" element={operator ? <Navigate to="/dashboard" replace /> : <SignUp />} />

      <Route
        path="/dashboard"
        element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}
      >
        <Route index element={<Dashboard />} />
        <Route path="vehicles" element={<Vehicles />} />
        <Route path="parents" element={<Parents />} />
        <Route path="compliance" element={<Compliance />} />
        <Route path="finance" element={<Finance />} />
        <Route path="settings" element={<Settings />} />
      </Route>

      {/* Admin routes */}
      <Route path="/admin/signin" element={<AdminSignIn />} />
      <Route
        path="/admin"
        element={<AdminProtectedRoute><AdminLayout /></AdminProtectedRoute>}
      >
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="operators/:id" element={<AdminOperatorDetail />} />
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
      </Route>

      <Route path="/" element={<LandingPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <AdminAuthProvider>
        <AppRoutes />
      </AdminAuthProvider>
    </AuthProvider>
  </BrowserRouter>
);

export default App;
