import { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { useNavigate } from 'react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Loader2, Plus, Archive, Edit, FolderKanban, Trash2, Calendar, UserCog, Search } from 'lucide-react';
import { Checkbox } from '../components/ui/checkbox';
import { Projet } from '../types';
import { projectService } from '../services/projectService';
import { useDebounce } from '../hooks/useDebounce';
import { Pagination } from '../components/ui/Pagination';
import { toast } from 'sonner';

export function ProjetsPage() {
  const { t } = useTranslation();
  const { currentUser, users } = useAuth();
  const { ajouterProjet, modifierProjet, archiverProjet, supprimerProjet } = useData();
  const navigate = useNavigate();

  const [paginatedProjets, setPaginatedProjets] = useState<Projet[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);
  const [filter, setFilter] = useState<'tous' | 'actif' | 'archive'>('actif');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProjet, setEditingProjet] = useState<Projet | null>(null);

  const chefsDisponibles = users.filter(u => u.role === 'chef_testeur');

  const [formData, setFormData] = useState({
    nom: '',
    description: '',
    dateDebut: '',
    dateFin: '',
    chefTesteurIds: [] as string[]
  });
  const [errors, setErrors] = useState({
    nom: '',
    dateDebut: '',
    dateFin: ''
  });

  const fetchProjets = useCallback(async () => {
    setLoading(true);
    try {
      const result = await projectService.listPaginated({
        page,
        limit,
        recherche: debouncedSearch || undefined,
        statut: filter === 'tous' ? undefined : filter,
      });
      setPaginatedProjets(result.data);
      setTotal(result.pagination.total);
      setTotalPages(result.pagination.totalPages);
    } finally {
      setLoading(false);
    }
  }, [page, limit, debouncedSearch, filter]);

  useEffect(() => { fetchProjets(); }, [fetchProjets]);
  useEffect(() => { setPage(1); }, [debouncedSearch, filter]);

  const toggleChef = (userId: string) => {
    setFormData(prev => ({
      ...prev,
      chefTesteurIds: prev.chefTesteurIds.includes(userId)
        ? prev.chefTesteurIds.filter(id => id !== userId)
        : [...prev.chefTesteurIds, userId]
    }));
  };

  if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'chef_testeur')) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Accès non autorisé</p>
      </div>
    );
  }

  const isAdmin = currentUser.role === 'admin';

  const handleOpenDialog = (projet?: Projet) => {
    if (projet) {
      setEditingProjet(projet);
      setFormData({
        nom: projet.nom,
        description: projet.description,
        dateDebut: projet.dateDebut,
        dateFin: projet.dateFin,
        chefTesteurIds: [...projet.chefTesteurIds]
      });
    } else {
      setEditingProjet(null);
      setFormData({
        nom: '',
        description: '',
        dateDebut: '',
        dateFin: '',
        chefTesteurIds: []
      });
    }
    setErrors({ nom: '', dateDebut: '', dateFin: '' });
    setDialogOpen(true);
  };

  const validateForm = () => {
    const newErrors = {
      nom: '',
      dateDebut: '',
      dateFin: ''
    };

    if (!formData.nom.trim()) {
      newErrors.nom = 'Le nom du projet est requis';
    }
    if (!formData.dateDebut) {
      newErrors.dateDebut = 'La date de début est requise';
    }
    if (!formData.dateFin) {
      newErrors.dateFin = 'La date de fin est requise';
    } else if (formData.dateDebut && formData.dateFin < formData.dateDebut) {
      newErrors.dateFin = 'La date de fin doit être après la date de début';
    }

    setErrors(newErrors);
    return !newErrors.nom && !newErrors.dateDebut && !newErrors.dateFin;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      if (editingProjet) {
        await modifierProjet(editingProjet.id, formData);
      } else {
        await ajouterProjet({
          ...formData,
          statut: 'actif' as const
        });
      }

      setDialogOpen(false);
      setFormData({ nom: '', description: '', dateDebut: '', dateFin: '', chefTesteurIds: [] });
      fetchProjets();
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de la sauvegarde du projet');
    }
    setErrors({ nom: '', dateDebut: '', dateFin: '' });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold mb-1">Gestion des projets</h2>
          <p className="text-gray-500">Créer et gérer les projets de test</p>
        </div>
        {isAdmin && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="w-4 h-4 mr-2" />
                Nouveau projet
              </Button>
            </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingProjet ? 'Modifier le projet' : 'Créer un nouveau projet'}
              </DialogTitle>
              <DialogDescription>
                Remplissez les informations du projet
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="nom">Nom du projet *</Label>
                <Input
                  id="nom"
                  value={formData.nom}
                  onChange={(e) => {
                    setFormData({ ...formData, nom: e.target.value });
                    if (errors.nom) setErrors({ ...errors, nom: '' });
                  }}
                  placeholder="Ex: Application E-Commerce"
                  className={errors.nom ? 'border-red-500 focus:border-red-500' : ''}
                />
                {errors.nom && <p className="text-sm text-red-500">{errors.nom}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Description du projet..."
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dateDebut">Date de début *</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="dateDebut"
                      type="date"
                      value={formData.dateDebut}
                      onChange={(e) => {
                        setFormData({ ...formData, dateDebut: e.target.value });
                        if (errors.dateDebut) setErrors({ ...errors, dateDebut: '' });
                      }}
                      className={`pl-10 ${errors.dateDebut ? 'border-red-500 focus:border-red-500' : 'border-indigo-200 focus:border-indigo-400'}`}
                    />
                  </div>
                  {errors.dateDebut && <p className="text-sm text-red-500">{errors.dateDebut}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dateFin">Date de fin *</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="dateFin"
                      type="date"
                      value={formData.dateFin}
                      onChange={(e) => {
                        setFormData({ ...formData, dateFin: e.target.value });
                        if (errors.dateFin) setErrors({ ...errors, dateFin: '' });
                      }}
                      className={`pl-10 ${errors.dateFin ? 'border-red-500 focus:border-red-500' : 'border-indigo-200 focus:border-indigo-400'}`}
                    />
                  </div>
                  {errors.dateFin && <p className="text-sm text-red-500">{errors.dateFin}</p>}
                </div>
              </div>
              <div className="space-y-3">
                <Label>Chefs testeurs <span className="text-xs text-gray-400 font-normal">(assignés au projet)</span></Label>
                <div className="border rounded-lg p-3 space-y-2 max-h-40 overflow-y-auto">
                  {chefsDisponibles.length === 0 && (
                    <p className="text-sm text-gray-400">Aucun chef testeur disponible</p>
                  )}
                  {chefsDisponibles.map(chef => (
                    <div key={chef.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`chef-${chef.id}`}
                        checked={formData.chefTesteurIds.includes(chef.id)}
                        onCheckedChange={() => toggleChef(chef.id)}
                      />
                      <label
                        htmlFor={`chef-${chef.id}`}
                        className="text-sm cursor-pointer flex-1"
                      >
                        {chef.prenom} {chef.nom}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Annuler
              </Button>
              <Button onClick={handleSubmit}>
                {editingProjet ? 'Modifier' : 'Créer'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Rechercher un projet..."
            className="pl-9 bg-white border-slate-200 h-9"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={filter === 'actif' ? 'default' : 'outline'}
            onClick={() => setFilter('actif')}
            size="sm"
          >
            Actifs
          </Button>
          <Button
            variant={filter === 'archive' ? 'default' : 'outline'}
            onClick={() => setFilter('archive')}
            size="sm"
          >
            Archivés
          </Button>
          <Button
            variant={filter === 'tous' ? 'default' : 'outline'}
            onClick={() => setFilter('tous')}
            size="sm"
          >
            Tous
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
          <span className="ml-2 text-slate-500">Chargement...</span>
        </div>
      ) : paginatedProjets.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FolderKanban className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Aucun projet {filter !== 'tous' ? filter : ''}</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginatedProjets.map((projet) => (
              <Card key={projet.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate(`/campagnes?projetId=${projet.id}`)}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <FolderKanban className="w-5 h-5 text-blue-600" />
                        <CardTitle className="text-lg">{projet.nom}</CardTitle>
                      </div>
                      <Badge variant={projet.statut === 'actif' ? 'default' : 'secondary'}>
                        {projet.statut === 'actif' ? 'Actif' : 'Archivé'}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <CardDescription className="min-h-[3rem]">
                    {projet.description}
                  </CardDescription>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>
                      <span className="font-medium">Début :</span>{' '}
                      {new Date(projet.dateDebut).toLocaleDateString('fr-FR')}
                    </p>
                    <p>
                      <span className="font-medium">Fin :</span>{' '}
                      {new Date(projet.dateFin).toLocaleDateString('fr-FR')}
                    </p>
                    {projet.chefTesteurIds.length > 0 && (
                      <p className="flex items-center gap-1 text-xs text-indigo-600">
                        <UserCog className="w-3 h-3" />
                        {projet.chefTesteurIds.length} chef(s) testeur(s) assigné(s)
                      </p>
                    )}
                  </div>
                  {isAdmin && (
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleOpenDialog(projet)}
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Modifier
                    </Button>
                    {projet.statut === 'actif' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => { await archiverProjet(projet.id); fetchProjets(); }}
                      >
                        <Archive className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (confirm(`Êtes-vous sûr de vouloir supprimer le projet "${projet.nom}" ?`)) {
                          supprimerProjet(projet.id);
                          fetchProjets();
                        }
                      }}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
          <Pagination
            page={page}
            totalPages={totalPages}
            total={total}
            limit={limit}
            onPageChange={setPage}
            onLimitChange={(newLimit) => { setLimit(newLimit); setPage(1); }}
          />
        </>
      )}
    </div>
  );
}
