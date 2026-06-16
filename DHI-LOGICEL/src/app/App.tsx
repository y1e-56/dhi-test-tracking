import './i18n/i18n';
import { RouterProvider } from 'react-router';
import { AuthProvider } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketProvider';
import { ProjetProvider } from './contexts/ProjetContext';
import { CampagneProvider } from './contexts/CampagneContext';
import { FonctionnaliteProvider } from './contexts/FonctionnaliteContext';
import { AnomalieProvider } from './contexts/AnomalieContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { HistoriqueProvider } from './contexts/HistoriqueContext';
import { DataProvider } from './contexts/DataContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { Toaster } from './components/ui/sonner';
import { router } from './routes';

export default function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <ProjetProvider>
          <CampagneProvider>
            <FonctionnaliteProvider>
              <AnomalieProvider>
                <NotificationProvider>
                  <HistoriqueProvider>
                    <DataProvider>
                      <LanguageProvider>
                        <RouterProvider router={router} />
                        <Toaster position="top-right" />
                      </LanguageProvider>
                    </DataProvider>
                  </HistoriqueProvider>
                </NotificationProvider>
              </AnomalieProvider>
            </FonctionnaliteProvider>
          </CampagneProvider>
        </ProjetProvider>
      </SocketProvider>
    </AuthProvider>
  );
}
