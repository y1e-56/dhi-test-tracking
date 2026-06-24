import { createBrowserRouter, Navigate } from 'react-router';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { ProjetsPage } from './pages/ProjetsPage';
import { CampagnesPage } from './pages/CampagnesPage';
import { AdminUtilisateursPage } from './pages/AdminUtilisateursPage';
import { AdminHistoryPage } from './pages/AdminHistoryPage';
import { AdminAllAnomaliesPage } from './pages/AdminAllAnomaliesPage';
import { CampagneDetailPage } from './pages/CampagneDetailPage';
import { TesteurTachesPage } from './pages/TesteurTachesPage';
import { DeveloppeurAnomaliesPage } from './pages/DeveloppeurAnomaliesPage';
import { AnomalieDetailPage } from './pages/AnomalieDetailPage';
import { ReportingPage } from './pages/ReportingPage';
import { Layout } from './components/Layout';

function ProtectedLayout() {
  const currentUser = localStorage.getItem('currentUser');

  if (!currentUser) {
    return <Navigate to="/" replace />;
  }

  return <Layout />;
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <LoginPage />
  },
  {
    element: <ProtectedLayout />,
    children: [
      { path: '/dashboard', element: <DashboardPage /> },
      { path: '/projets', element: <ProjetsPage /> },
      { path: '/campagnes', element: <CampagnesPage /> },
      { path: '/campagnes/:campagneId', element: <CampagneDetailPage /> },
      { path: '/admin/utilisateurs', element: <AdminUtilisateursPage /> },
      { path: '/admin/history', element: <AdminHistoryPage /> },
      { path: '/admin/anomalies', element: <AdminAllAnomaliesPage /> },
      { path: '/testeur/taches', element: <TesteurTachesPage /> },
      { path: '/developpeur/anomalies', element: <DeveloppeurAnomaliesPage /> },
      { path: '/anomalies/:anomalieId', element: <AnomalieDetailPage /> },
      { path: '/reporting', element: <ReportingPage /> },
    ]
  },
  {
    path: '*',
    element: <Navigate to="/" replace />
  }
]);
