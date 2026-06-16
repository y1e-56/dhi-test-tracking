import { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { User } from '../types';
import { authService } from '../services/authService';
import { userService } from '../services/userService';
import { getErrorMessage } from '../services/api';

interface AuthContextType {
  currentUser: User | null;
  users: User[];
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  isAuthenticated: boolean;
  bloquerUtilisateur: (id: string) => Promise<void>;
  debloquerUtilisateur: (id: string) => Promise<void>;
  creerUtilisateur: (user: Omit<User, 'id' | 'tentativesEchouees'> & { password: string }) => Promise<void>;
  supprimerUtilisateur: (id: string) => Promise<void>;
  restaurerUtilisateur: (id: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [usersLoaded, setUsersLoaded] = useState(false);

  const uniqueById = useCallback((arr: User[]) => Array.from(new Map(arr.map(u => [u.id, u])).values()), []);

  // Charger les utilisateurs depuis l'API
  const refreshUsers = useCallback(async () => {
    try {
      console.log('[AuthContext] Chargement des utilisateurs...');
      const data = await userService.getAll();
      console.log('[AuthContext] Utilisateurs chargés:', data);
      const unique = uniqueById(data);
      console.log('[AuthContext] Utilisateurs uniques:', unique);
      setUsers(unique);
    } catch (e) {
      console.error('[AuthContext] Erreur refreshUsers:', e);
      toast.error('Erreur refreshUsers : ' + getErrorMessage(e as any));
    }
  }, [uniqueById]);

  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      // Ancienne nomenclature — forcer la reconnexion
      if (parsed.role === 'test_lead') {
        localStorage.removeItem('currentUser');
      } else {
        setCurrentUser(parsed);
      }
    }
    
    // Charger les utilisateurs une seule fois au montage
    if (!usersLoaded) {
      refreshUsers();
      setUsersLoaded(true);
    }
  }, []);

  // Si l'utilisateur courant est chef testeur ou admin, on s'assure d'avoir la liste des utilisateurs
  useEffect(() => {
    if (!currentUser) return;
    if (currentUser.role === 'admin' || currentUser.role === 'chef_testeur') {
      refreshUsers();
    }
  }, [currentUser?.id, currentUser?.role, refreshUsers]);

  const login = async (email: string, password: string) => {
    try {
      const { user } = await authService.login(email, password);
      setCurrentUser(user);
      localStorage.setItem('currentUser', JSON.stringify(user));
      return { success: true };
    } catch (e: any) {
      const message = e?.response?.data?.message || 'Email ou mot de passe incorrect';
      return { success: false, message };
    }
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
  };

  const bloquerUtilisateur = async (id: string) => {
    try {
      await userService.block(id);
      await refreshUsers();
      toast.success('Utilisateur bloqué');
    } catch (e) {
      toast.error('Erreur lors du blocage : ' + getErrorMessage(e as any));
    }
  };

  const debloquerUtilisateur = async (id: string) => {
    try {
      await userService.unblock(id);
      await refreshUsers();
      toast.success('Utilisateur débloqué');
    } catch (e) {
      toast.error('Erreur lors du déblocage : ' + getErrorMessage(e as any));
    }
  };

  const creerUtilisateur = async (user: Omit<User, 'id' | 'tentativesEchouees'> & { password: string }) => {
    try {
      const newUser = await userService.create({
        ...user,
        tentativesEchouees: 0
      });
      setUsers(prev => uniqueById([...prev, newUser]));
      toast.success('Utilisateur créé avec succès');
    } catch (e) {
      toast.error('Erreur lors de la création : ' + getErrorMessage(e as any));
    }
  };

  const supprimerUtilisateur = async (id: string) => {
    try {
      const user = users.find(u => u.id === id);
      await userService.softDelete(id);
      setUsers(prev => prev.map(u => 
        u.id === id ? { ...u, dateSuppression: new Date().toISOString() } : u
      ));
      toast.success(t('admin.users.deleted_toast'));
    } catch (e) {
      console.error('Erreur supprimerUtilisateur:', e);
      toast.error('Erreur lors de la suppression');
    }
  };

  const restaurerUtilisateur = async (id: string) => {
    try {
      await userService.restore(id);
      setUsers(prev => prev.map(u => 
        u.id === id ? { ...u, dateSuppression: undefined } : u
      ));
      toast.success(t('admin.users.restored'));
    } catch (e) {
      console.error('Erreur restaurerUtilisateur:', e);
      toast.error('Erreur lors de la restauration');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        users,
        login,
        logout,
        isAuthenticated: !!currentUser,
        bloquerUtilisateur,
        debloquerUtilisateur,
        creerUtilisateur,
        supprimerUtilisateur,
        restaurerUtilisateur,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
