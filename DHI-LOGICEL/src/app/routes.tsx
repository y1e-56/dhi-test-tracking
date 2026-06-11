import { createBrowserRouter, Navigate } from 'react-router';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { ProjetsPage } from './pages/ProjetsPage';
import { CampagnesPage } from './pages/CampagnesPage';
import { AdminUtilisateursPage } from './pages/AdminUtilisateursPage';
import { AdminHistoryPage } from './pages/AdminHistoryPage';
import { AdminAllAnomaliesPage } from './pages/AdminAllAnomaliesPage';
import { AdminAssignationPage } from './pages/AdminAssignationPage';
import { CampagneDetailPage } from './pages/CampagneDetailPage';
import { TesteurTachesPage } from './pages/TesteurTachesPage';
import { DeveloppeurAnomaliesPage } from './pages/DeveloppeurAnomaliesPage';
import { AnomalieDetailPage } from './pages/AnomalieDetailPage';
import { ReportingPage } from './pages/ReportingPage';
import { Layout } from './components/Layout';
import { ErrorBoundary } from './components/ErrorBoundary';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const currentUser = localStorage.getItem('currentUser');
  
  if (!currentUser) {
    return <Navigate to="/" replace />;
  }
  
  return (
    <Layout>
      <ErrorBoundary>{children}</ErrorBoundary>
    </Layout>
  );
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <LoginPage />
  },
  {
    path: '/dashboard',
    element: (
      <ProtectedRoute>
        <DashboardPage />
      </ProtectedRoute>
    )
  },
  {
    path: '/projets',
    element: (
      <ProtectedRoute>
        <ProjetsPage />
      </ProtectedRoute>
    )
  },
  {
    path: '/campagnes',
    element: (
      <ProtectedRoute>
        <CampagnesPage />
      </ProtectedRoute>
    )
  },
  {
    path: '/campagnes/:campagneId',
    element: (
      <ProtectedRoute>
        <CampagneDetailPage />
      </ProtectedRoute>
    )
  },
  {
    path: '/admin/utilisateurs',
    element: (
      <ProtectedRoute>
        <AdminUtilisateursPage />
      </ProtectedRoute>
    )
  },
  {
    path: '/admin/history',
    element: (
      <ProtectedRoute>
        <AdminHistoryPage />
      </ProtectedRoute>
    )
  },
  {
    path: '/admin/anomalies',
    element: (
      <ProtectedRoute>
        <AdminAllAnomaliesPage />
      </ProtectedRoute>
    )
  },
  {
    path: '/admin/assignation',
    element: (
      <ProtectedRoute>
        <AdminAssignationPage />
      </ProtectedRoute>
    )
  },
  {
    path: '/testeur/taches',
    element: (
      <ProtectedRoute>
        <TesteurTachesPage />
      </ProtectedRoute>
    )
  },
  {
    path: '/developpeur/anomalies',
    element: (
      <ProtectedRoute>
        <DeveloppeurAnomaliesPage />
      </ProtectedRoute>
    )
  },
  {
    path: '/anomalies/:anomalieId',
    element: (
      <ProtectedRoute>
        <AnomalieDetailPage />
      </ProtectedRoute>
    )
  },
  {
    path: '/reporting',
    element: (
      <ProtectedRoute>
        <ReportingPage />
      </ProtectedRoute>
    )
  },
  {
    path: '*',
    element: <Navigate to="/" replace />
  }
]);
