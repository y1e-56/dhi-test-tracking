import { Projet, Campagne, Fonctionnalite, Anomalie, User, Notification, HistoriqueAction, TestCase, Produit, ReleaseProduit, EnvironnementProduit } from '../types';

export const DEMO_STORAGE_KEYS = {
  projets: 'dhi_demo_projets',
  campagnes: 'dhi_demo_campagnes',
  fonctionnalites: 'dhi_demo_fonctionnalites',
  anomalies: 'dhi_demo_anomalies',
  utilisateurs: 'dhi_demo_utilisateurs',
  testCases: 'dhi_demo_testcases',
  produits: 'dhi_demo_produits',
  releases: 'dhi_demo_releases',
  environnements: 'dhi_demo_environnements',
};

const KEYS = DEMO_STORAGE_KEYS;

const today = (offset = 0) => new Date(Date.now() + offset * 86400000).toISOString();

export const demoDataService = {
  seedInitialisé(): boolean {
    return localStorage.getItem('dhi_demo_seeded') === '1';
  },

  seedTout(): void {
    if (this.seedInitialisé()) return;

    const chefs = [
      { id: 'id_chef_1', nom: 'Martin', prenom: 'Claire', email: 'claire.martin@dhi.com', role: 'chef_testeur' as const },
      { id: 'id_chef_2', nom: 'Nguyen', prenom: 'Karim', email: 'karim.nguyen@dhi.com', role: 'chef_testeur' as const },
    ];
    const testeurs = [
      { id: 'id_dev_1', nom: 'Dubois', prenom: 'Léa', email: 'lea.dubois@dhi.com', role: 'testeur' as const },
      { id: 'id_dev_2', nom: 'Diallo', prenom: 'Omar', email: 'omar.diallo@dhi.com', role: 'testeur' as const },
    ];

    const projets: Projet[] = [
      { id: 'id_p1', nom: 'Refonte Portal Client', description: 'Modernisation du portail client bancaire', dateDebut: today(-40), dateFin: today(20), statut: 'actif', creePar: 'id_admin', dateCreation: today(-45), chefTesteurIds: ['id_chef_1'], produitId: 'id_prod_1' },
      { id: 'id_p2', nom: 'Application Mobile Paiement', description: 'Nouvelle app mobile de paiement instantané', dateDebut: today(-30), dateFin: today(35), statut: 'actif', creePar: 'id_admin', dateCreation: today(-35), chefTesteurIds: ['id_chef_2'] },
    ];

    const campagnes: Campagne[] = [
      { id: 'id_c1', nom: 'Campagne Recette V1.2', projetId: 'id_p1', description: 'Recette de la version 1.2 du portail', objectif: 'Valider les fonctionnalités de connexion et virement', modeOrganisation: 'fonctionnalites', dateDebut: today(-20), dateFin: today(5), statut: 'en_cours', equipeTesteurs: ['id_dev_1'], equipeDeveloppeurs: [], chefTesteurIds: ['id_chef_1'], dateCreation: today(-21) },
      { id: 'id_c2', nom: 'Campagne de Non-Régression', projetId: 'id_p2', description: 'Tests de non-régression mobile', objectif: 'Fiabiliser les paiements mobiles', modeOrganisation: 'modules', dateDebut: today(-10), dateFin: today(15), statut: 'en_preparation', equipeTesteurs: ['id_dev_2'], equipeDeveloppeurs: [], chefTesteurIds: ['id_chef_2'], dateCreation: today(-11) },
    ];

    const fonctionnalites: Fonctionnalite[] = [
      { id: 'id_f1', campagneId: 'id_c1', nom: 'Connexion utilisateur', description: 'Authentification avec MFA', module: 'Authentification', testeurAssigneId: 'id_dev_1', statut: 'conforme', priorite: 'haute', dateAssignation: today(-15), dateTest: today(-2) },
      { id: 'id_f2', campagneId: 'id_c1', nom: 'Virement SEPA', description: 'Virement SEPA simple et permanent', module: 'Paiement', testeurAssigneId: 'id_dev_1', statut: 'en_cours', priorite: 'critique', dateAssignation: today(-15) },
      { id: 'id_f3', campagneId: 'id_c2', nom: 'Paiement par QR code', description: 'Scan QR pour paiement', module: 'Paiement', testeurAssigneId: 'id_dev_2', statut: 'non_testee', priorite: 'moyenne', dateAssignation: today(-8) },
    ];

    const anomalies: Anomalie[] = [
      { id: 'id_a1', testCaseId: 'id_tc1', fonctionnaliteId: 'id_f2', campagneId: 'id_c1', titre: 'Échec virement SEPA au-delà de 5000€', description: 'Le virement échoue avec une erreur 500 pour les montants > 5000€', testeurId: 'id_dev_1', developpeurId: 'id_chef_1', statut: 'nouvelle', priorite: 'critique', dateCreation: today(-3) },
      { id: 'id_a2', testCaseId: 'id_tc2', fonctionnaliteId: 'id_f1', campagneId: 'id_c1', titre: 'Le bouton MFA ne s\'affiche pas sur mobile', description: 'Sur iOS, la double authentification ne se déclenche pas', testeurId: 'id_dev_1', developpeurId: 'id_chef_1', statut: 'en_cours', priorite: 'haute', dateCreation: today(-5) },
    ];

    const testCases: TestCase[] = [
      { id: 'id_tc1', featureId: 'id_f2', nom: 'Virement SEPA de 10000€', steps: 'Se connecter, saisir montant > 5000€, valider', expectedResult: 'Virement exécuté avec succès', status: 'echoue', priority: 'critique' },
      { id: 'id_tc2', featureId: 'id_f1', nom: 'Connexion avec MFA', steps: 'Se connecter, saisir le code MFA', expectedResult: 'Connexion réussie après code MFA', status: 'passe', priority: 'haute' },
    ];

    localStorage.setItem(KEYS.projets, JSON.stringify(projets));
    localStorage.setItem(KEYS.campagnes, JSON.stringify(campagnes));
    localStorage.setItem(KEYS.fonctionnalites, JSON.stringify(fonctionnalites));
    localStorage.setItem(KEYS.anomalies, JSON.stringify(anomalies));
    localStorage.setItem(KEYS.testCases, JSON.stringify(testCases));

    const produits: Produit[] = [
      { id: 'id_prod_1', nom: 'Portail Client', description: 'Portail bancaire client', estArchive: false, dateCreation: today(-50), dateModification: today(-1), nbProjets: 1, nbVersions: 2, nbEnvironnements: 3 },
      { id: 'id_prod_2', nom: 'App Mobile Paiement', description: 'Application mobile de paiement', estArchive: false, dateCreation: today(-40), dateModification: today(-2), nbProjets: 1, nbVersions: 1, nbEnvironnements: 2 },
    ];
    localStorage.setItem(KEYS.produits, JSON.stringify(produits));

    const releases: ReleaseProduit[] = [
      { id: 'id_rel_1', produitId: 'id_prod_1', version: '1.0', description: 'Version initiale du portail', statut: 'released', datePrevue: today(-60), livreeLe: today(-55), dateCreation: today(-62) },
      { id: 'id_rel_2', produitId: 'id_prod_1', version: '1.2', description: 'Refonte connexion et virements', statut: 'in_progress', datePrevue: today(10), livreeLe: null, dateCreation: today(-25) },
      { id: 'id_rel_3', produitId: 'id_prod_2', version: '2.0', description: 'Première version de l\'app mobile', statut: 'planned', datePrevue: today(30), livreeLe: null, dateCreation: today(-20) },
    ];
    localStorage.setItem(KEYS.releases, JSON.stringify(releases));

    const environnements: EnvironnementProduit[] = [
      { id: 'id_env_1', produitId: 'id_prod_1', nom: 'Dev Web', type: 'development', description: 'Environnement de développement', actif: true, dateCreation: today(-50) },
      { id: 'id_env_2', produitId: 'id_prod_1', nom: 'Recette Web', type: 'staging', description: 'Environnement de recette', actif: true, dateCreation: today(-49) },
      { id: 'id_env_3', produitId: 'id_prod_1', nom: 'Production', type: 'production', description: 'Environnement de production', actif: true, dateCreation: today(-48) },
      { id: 'id_env_4', produitId: 'id_prod_2', nom: 'Dev Mobile', type: 'development', description: 'Environnement de développement mobile', actif: false, dateCreation: today(-39) },
      { id: 'id_env_5', produitId: 'id_prod_2', nom: 'Recette Mobile', type: 'staging', description: 'Environnement de recette mobile', actif: true, dateCreation: today(-38) },
    ];
    localStorage.setItem(KEYS.environnements, JSON.stringify(environnements));

    const utilisateurs: User[] = (() => {
      const storage = JSON.parse(localStorage.getItem('dhi_users') || '[]');
      if (storage.length > 0) return storage;
      return [];
    })();
    localStorage.setItem(KEYS.utilisateurs, JSON.stringify(utilisateurs));

    localStorage.setItem('dhi_demo_seeded', '1');
  },

  getProjets(): Projet[] { return JSON.parse(localStorage.getItem(KEYS.projets) || '[]'); },
  setProjets(d: Projet[]): void { localStorage.setItem(KEYS.projets, JSON.stringify(d)); },
  getCampagnes(): Campagne[] { return JSON.parse(localStorage.getItem(KEYS.campagnes) || '[]'); },
  setCampagnes(d: Campagne[]): void { localStorage.setItem(KEYS.campagnes, JSON.stringify(d)); },
  getFonctionnalites(): Fonctionnalite[] { return JSON.parse(localStorage.getItem(KEYS.fonctionnalites) || '[]'); },
  setFonctionnalites(d: Fonctionnalite[]): void { localStorage.setItem(KEYS.fonctionnalites, JSON.stringify(d)); },
  getAnomalies(): Anomalie[] { return JSON.parse(localStorage.getItem(KEYS.anomalies) || '[]'); },
  setAnomalies(d: Anomalie[]): void { localStorage.setItem(KEYS.anomalies, JSON.stringify(d)); },
  getTestCases(): TestCase[] { return JSON.parse(localStorage.getItem(KEYS.testCases) || '[]'); },
  getProduits(): Produit[] { return JSON.parse(localStorage.getItem(KEYS.produits) || '[]'); },
  setProduits(d: Produit[]): void { localStorage.setItem(KEYS.produits, JSON.stringify(d)); },
  getReleases(): ReleaseProduit[] { return JSON.parse(localStorage.getItem(KEYS.releases) || '[]'); },
  setReleases(d: ReleaseProduit[]): void { localStorage.setItem(KEYS.releases, JSON.stringify(d)); },
  getEnvironnements(): EnvironnementProduit[] { return JSON.parse(localStorage.getItem(KEYS.environnements) || '[]'); },
  setEnvironnements(d: EnvironnementProduit[]): void { localStorage.setItem(KEYS.environnements, JSON.stringify(d)); },
};