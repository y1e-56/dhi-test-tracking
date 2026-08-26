import { createBrowserRouter, Navigate } from 'react-router';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { ProjetsPage } from './pages/ProjetsPage';
import { ProduitsPage } from './pages/ProduitsPage';
import { ProduitDetailPage } from './pages/ProduitDetailPage';
import { ProjetDetailPage } from './pages/ProjetDetailPage';
import { FeatureDetailPage } from './pages/FeatureDetailPage';
import { CouverturePage } from './pages/CouverturePage';
import { DetteQualitePage } from './pages/DetteQualitePage';
import { GoNogoPage } from './pages/GoNogoPage';
import { RapportsPage } from './pages/RapportsPage';
import { AlertesPage } from './pages/AlertesPage';
import { AuditTrailPage } from './pages/AuditTrailPage';
import { NotificationsConfigPage } from './pages/NotificationsConfigPage';
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
      { path: '/produits', element: <ProduitsPage /> },
  { path: '/produits/:produitId', element: <ProduitDetailPage /> },
      { path: '/projets', element: <ProjetsPage /> },
      { path: '/projets/:projetId', element: <ProjetDetailPage /> },
      { path: '/fonctionnalites/:featureId', element: <FeatureDetailPage /> },
      { path: '/couverture', element: <CouverturePage /> },
      { path: '/dette-qualite', element: <DetteQualitePage /> },
      { path: '/go-nogo', element: <GoNogoPage /> },
      { path: '/rapports', element: <RapportsPage /> },
      { path: '/alertes', element: <AlertesPage /> },
      { path: '/audit-trail', element: <AuditTrailPage /> },
      { path: '/notifications-config', element: <NotificationsConfigPage /> },
      { path: '/campagnes', element: <CampagnesPage /> },
      { path: '/campagnes/:campagneId', element: <CampagneDetailPage /> },
      { path: '/admin/utilisateurs', element: <AdminUtilisateursPage /> },
      { path: '/admin/history', element: <AdminHistoryPage /> },
      { path: '/admin/anomalies', element: <AdminAllAnomaliesPage /> },
      { path: '/admin/assignations', element: <AdminAssignationPage /> },
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
