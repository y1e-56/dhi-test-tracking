// ============================================================
// Bibliothèque de scénarios pour la génération automatique
// de cas de test, basée sur le module / le nom / la description
// de la fonctionnalité. Fonctionne hors-ligne, sans IA.
// ============================================================

const etapes = (lignes) => lignes.join('\n');

// Cas de base toujours générés pour toute fonctionnalité
const BASELINE = [
  {
    name: 'Affichage de la fonctionnalité',
    steps: etapes([
      '1. Ouvrir la fonctionnalité « {feature} ».',
      '2. Vérifier que tous les éléments s\'affichent correctement (intitulés, boutons, champs).',
      '3. Vérifier qu\'aucune erreur technique n\'apparaît.',
    ]),
    expected: 'L\'écran de la fonctionnalité s\'affiche correctement, sans erreur technique.',
    priority: 'medium',
  },
  {
    name: 'Parcours nominal avec des données valides',
    steps: etapes([
      '1. Ouvrir la fonctionnalité « {feature} ».',
      '2. Exécuter le scénario principal avec des données valides.',
      '3. Valider l\'action.',
    ]),
    expected: 'L\'action se déroule sans erreur et le résultat attendu est obtenu.',
    priority: 'high',
  },
  {
    name: 'Soumission sans données (cas négatif)',
    steps: etapes([
      '1. Ouvrir la fonctionnalité « {feature} ».',
      '2. Ne saisir aucune donnée.',
      '3. Tenter de valider.',
    ]),
    expected: 'Un message d\'erreur clair est affiché et aucune donnée n\'est enregistrée.',
    priority: 'medium',
  },
];

const SCENARIOS = [
  {
    id: 'authentification',
    keywords: ['connexion', 'connecter', 'login', 'log in', 'authentification', 'authentifier', 'mot de passe', 'password', 'session', 'compte', 'inscription', 'register', 's\'inscrire', 'déconnexion', 'logout', 'identifiant', 'email', 'e-mail', 'oauth', 'sso', 'token', 'jwt'],
    cases: [
      {
        name: 'Connexion avec des identifiants valides',
        steps: etapes([
          '1. Ouvrir l\'écran de connexion.',
          '2. Saisir un identifiant et un mot de passe valides.',
          '3. Cliquer sur « Se connecter ».',
        ]),
        expected: 'L\'utilisateur est connecté et redirigé vers son espace.',
        priority: 'critical',
      },
      {
        name: 'Connexion avec un mot de passe incorrect',
        steps: etapes([
          '1. Saisir un identifiant valide et un mot de passe incorrect.',
          '2. Cliquer sur « Se connecter ».',
        ]),
        expected: 'Un message d\'erreur explicite est affiché et l\'accès est refusé.',
        priority: 'high',
      },
      {
        name: 'Connexion avec des identifiants vides',
        steps: etapes([
          '1. Laisser les champs identifiant et mot de passe vides.',
          '2. Cliquer sur « Se connecter ».',
        ]),
        expected: 'Les champs obligatoires sont signalés et la connexion est refusée.',
        priority: 'medium',
      },
      {
        name: 'Déconnexion',
        steps: etapes([
          '1. Être connecté.',
          '2. Cliquer sur le bouton « Se déconnecter ».',
        ]),
        expected: 'La session est fermée et l\'utilisateur est ramené à l\'écran de connexion.',
        priority: 'medium',
      },
      {
        name: 'Mot de passe oublié',
        steps: etapes([
          '1. Cliquer sur « Mot de passe oublié ».',
          '2. Saisir l\'adresse email du compte.',
          '3. Valider.',
        ]),
        expected: 'Un email de réinitialisation est envoyé et un message de confirmation s\'affiche.',
        priority: 'medium',
      },
    ],
  },
  {
    id: 'crud',
    keywords: ['créer', 'creer', 'ajouter', 'liste', 'lister', 'modifier', 'éditer', 'editer', 'mettre à jour', 'supprimer', 'delete', 'create', 'update', 'enregistrer', 'sauvegarder', 'gestion', 'gérer', 'détail', 'detail', 'crud', 'entité', 'enregistrement'],
    cases: [
      {
        name: 'Création avec des données valides',
        steps: etapes([
          '1. Ouvrir la fonctionnalité « {feature} ».',
          '2. Cliquer sur « Créer / Nouveau ».',
          '3. Renseigner des données valides.',
          '4. Enregistrer.',
        ]),
        expected: 'L\'élément est créé et apparaît dans la liste.',
        priority: 'high',
      },
      {
        name: 'Création avec des données invalides',
        steps: etapes([
          '1. Ouvrir la création d\'un élément.',
          '2. Renseigner des données invalides ou incomplètes.',
          '3. Enregistrer.',
        ]),
        expected: 'Des messages d\'erreur clairs s\'affichent et aucun élément n\'est créé.',
        priority: 'high',
      },
      {
        name: 'Affichage de la liste et du détail',
        steps: etapes([
          '1. Ouvrir la liste des éléments.',
          '2. Ouvrir le détail d\'un élément.',
        ]),
        expected: 'La liste et le détail affichent des données exactes et cohérentes.',
        priority: 'medium',
      },
      {
        name: 'Modification d\'un élément',
        steps: etapes([
          '1. Ouvrir le détail d\'un élément existant.',
          '2. Modifier un champ.',
          '3. Enregistrer les modifications.',
        ]),
        expected: 'Les modifications sont enregistrées et visibles après rechargement.',
        priority: 'high',
      },
      {
        name: 'Suppression avec confirmation',
        steps: etapes([
          '1. Ouvrir le détail d\'un élément.',
          '2. Cliquer sur « Supprimer ».',
          '3. Confirmer la suppression.',
        ]),
        expected: 'Un message de confirmation est demandé puis l\'élément disparaît de la liste.',
        priority: 'medium',
      },
    ],
  },
  {
    id: 'recherche',
    keywords: ['recherche', 'rechercher', 'search', 'filtre', 'filtrer', 'filter', 'tri', 'trier', 'sort', 'filtres'],
    cases: [
      {
        name: 'Recherche par mot-clé',
        steps: etapes([
          '1. Ouvrir la fonctionnalité « {feature} ».',
          '2. Saisir un mot-clé existant.',
          '3. Lancer la recherche.',
        ]),
        expected: 'Les résultats correspondants s\'affichent correctement.',
        priority: 'high',
      },
      {
        name: 'Recherche sans résultat',
        steps: etapes([
          '1. Saisir un mot-clé sans correspondance.',
          '2. Lancer la recherche.',
        ]),
        expected: 'Un message « aucun résultat » clair s\'affiche.',
        priority: 'medium',
      },
      {
        name: 'Recherche avec caractères spéciaux ou espaces',
        steps: etapes([
          '1. Saisir une recherche avec des espaces multiples ou caractères spéciaux.',
          '2. Lancer la recherche.',
        ]),
        expected: 'La recherche ne provoque aucune erreur technique.',
        priority: 'low',
      },
      {
        name: 'Combinaison de filtres',
        steps: etapes([
          '1. Activer plusieurs filtres simultanément.',
          '2. Vérifier la liste des résultats.',
        ]),
        expected: 'Les filtres se combinent correctement et les résultats sont cohérents.',
        priority: 'medium',
      },
    ],
  },
  {
    id: 'formulaire',
    keywords: ['formulaire', 'form', 'champ', 'champs', 'input', 'saisie', 'validation', 'valider', 'envoi', 'soumettre', 'submit', 'questionnaire'],
    cases: [
      {
        name: 'Saisie valide et soumission',
        steps: etapes([
          '1. Ouvrir le formulaire.',
          '2. Renseigner correctement tous les champs.',
          '3. Soumettre.',
        ]),
        expected: 'Le formulaire est soumis et un message de confirmation s\'affiche.',
        priority: 'high',
      },
      {
        name: 'Champs obligatoires manquants',
        steps: etapes([
          '1. Laisser un champ obligatoire vide.',
          '2. Soumettre le formulaire.',
        ]),
        expected: 'Les champs obligatoires sont mis en évidence et l\'envoi est bloqué.',
        priority: 'high',
      },
      {
        name: 'Formats invalides',
        steps: etapes([
          '1. Saisir des valeurs au format invalide (email, téléphone, nombre, date).',
          '2. Soumettre.',
        ]),
        expected: 'Des messages d\'erreur précis indiquent le format attendu.',
        priority: 'medium',
      },
      {
        name: 'Longueur maximale et caractères spéciaux',
        steps: etapes([
          '1. Saisir un texte dépassant la longueur maximale ou contenant des caractères spéciaux.',
          '2. Soumettre.',
        ]),
        expected: 'La saisie est limitée ou signalée sans provoquer d\'erreur technique.',
        priority: 'low',
      },
    ],
  },
  {
    id: 'paiement',
    keywords: ['paiement', 'payer', 'payment', 'panier', 'cart', 'commande', 'order', 'facture', 'facturation', 'billing', 'checkout', 'caisse', 'transaction', 'carte bancaire', 'cb', 'paiement en ligne', 'abonnement'],
    cases: [
      {
        name: 'Paiement réussi',
        steps: etapes([
          '1. Préparer une commande avec des articles valides.',
          '2. Saisir des coordonnées bancaires valides.',
          '3. Confirmer le paiement.',
        ]),
        expected: 'Le paiement aboutit et un reçu / accusé de réception s\'affiche.',
        priority: 'critical',
      },
      {
        name: 'Paiement refusé',
        steps: etapes([
          '1. Préparer une commande.',
          '2. Saisir des coordonnées bancaires invalides ou un montant non autorisé.',
          '3. Confirmer le paiement.',
        ]),
        expected: 'Le paiement est refusé avec un message clair, sans débit.',
        priority: 'critical',
      },
      {
        name: 'Éviter les paiements en double',
        steps: etapes([
          '1. Confirmer le paiement puis cliquer plusieurs fois sur « Payer ».',
        ]),
        expected: 'Une seule transaction est débitée, les clics multiples sont ignorés.',
        priority: 'high',
      },
      {
        name: 'Annulation de la commande',
        steps: etapes([
          '1. Préparer une commande.',
          '2. Annuler avant la confirmation du paiement.',
        ]),
        expected: 'La commande est annulée proprement et aucun débit n\'est effectué.',
        priority: 'medium',
      },
    ],
  },
  {
    id: 'notification',
    keywords: ['notification', 'notifier', 'alerte', 'alert', 'email', 'e-mail', 'message', 'rappel', 'reminder', 'relance', 'signal', 'push'],
    cases: [
      {
        name: 'Envoi de la notification',
        steps: etapes([
          '1. Déclencher l\'événement à l\'origine de la notification.',
          '2. Vérifier la réception de la notification.',
        ]),
        expected: 'La notification est envoyée au bon destinataire avec le bon contenu.',
        priority: 'high',
      },
      {
        name: 'Lecture et marquage de la notification',
        steps: etapes([
          '1. Ouvrir la liste des notifications.',
          '2. Ouvrir une notification.',
        ]),
        expected: 'La notification s\'ouvre, est marquée comme lue et le compteur se met à jour.',
        priority: 'medium',
      },
      {
        name: 'Échec d\'envoi de la notification',
        steps: etapes([
          '1. Simuler une erreur lors de l\'envoi (destinataire invalide, service indisponible).',
        ]),
        expected: 'L\'échec est géré sans bloquer l\'application et sans erreur technique visible.',
        priority: 'medium',
      },
      {
        name: 'Lien depuis la notification',
        steps: etapes([
          '1. Ouvrir une notification contenant un lien.',
          '2. Cliquer sur le lien.',
        ]),
        expected: 'La navigation redirige vers la page concernée.',
        priority: 'low',
      },
    ],
  },
  {
    id: 'fichier',
    keywords: ['fichier', 'file', 'import', 'exporter', 'export', 'télécharger', 'telecharger', 'download', 'upload', 'téléverser', 'pièce jointe', 'piece jointe', 'attachment', 'image', 'photo', 'document', 'csv', 'excel', 'pdf'],
    cases: [
      {
        name: 'Téléversement d\'un fichier valide',
        steps: etapes([
          '1. Ouvrir la zone de téléversement.',
          '2. Choisir un fichier au format autorisé.',
          '3. Valider le téléversement.',
        ]),
        expected: 'Le fichier est téléversé et disponible.',
        priority: 'high',
      },
      {
        name: 'Format de fichier non autorisé',
        steps: etapes([
          '1. Tenter de téléverser un fichier dont le format n\'est pas autorisé.',
        ]),
        expected: 'Un message d\'erreur clair signale le format et le fichier est refusé.',
        priority: 'medium',
      },
      {
        name: 'Fichier trop volumineux',
        steps: etapes([
          '1. Tenter de téléverser un fichier dépassant la taille maximale.',
        ]),
        expected: 'Un message signale la taille limite et le fichier est refusé proprement.',
        priority: 'medium',
      },
      {
        name: 'Export / téléchargement',
        steps: etapes([
          '1. Cliquer sur le bouton d\'export.',
          '2. Vérifier le fichier téléchargé.',
        ]),
        expected: 'Le fichier exporté contient les bonnes données et s\'ouvre correctement.',
        priority: 'high',
      },
    ],
  },
  {
    id: 'api',
    keywords: ['api', 'intégration', 'integration', 'webhook', 'endpoint', 'service externe', 'service tiers', 'synchronisation', 'sync', 'interface de programmation'],
    cases: [
      {
        name: 'Appel API nominal',
        steps: etapes([
          '1. Envoyer une requête valide au service.',
          '2. Vérifier la réponse.',
        ]),
        expected: 'Le service répond avec les données attendues et le bon code de statut.',
        priority: 'high',
      },
      {
        name: 'Erreur API et délai dépassé',
        steps: etapes([
          '1. Simuler une erreur ou un dépassement de délai du service externe.',
        ]),
        expected: 'L\'erreur est gérée proprement avec un message explicite, sans interruption.',
        priority: 'high',
      },
      {
        name: 'Authentification du service',
        steps: etapes([
          '1. Appeler le service sans clé / jeton ou avec une clé invalide.',
        ]),
        expected: 'L\'accès est refusé et l\'erreur d\'authentification est signalée.',
        priority: 'critical',
      },
    ],
  },
  {
    id: 'permissions',
    keywords: ['rôle', 'role', 'roles', 'permission', 'permissions', 'droit', 'droits', 'accès', 'acces', 'access', 'sécurité', 'securite', 'security', 'autorisation', 'autoriser', 'privilege', 'privilège'],
    cases: [
      {
        name: 'Accès autorisé pour le rôle concerné',
        steps: etapes([
          '1. Se connecter avec un utilisateur disposant du rôle requis.',
          '2. Ouvrir la fonctionnalité « {feature} ».',
        ]),
        expected: 'L\'utilisateur accède aux fonctionnalités autorisées pour son rôle.',
        priority: 'critical',
      },
      {
        name: 'Accès refusé sans permission',
        steps: etapes([
          '1. Se connecter avec un utilisateur sans le rôle requis.',
          '2. Tenter d\'accéder à la fonctionnalité « {feature} ».',
        ]),
        expected: 'L\'accès est refusé avec un message approprié.',
        priority: 'critical',
      },
      {
        name: 'Protection des données sensibles',
        steps: etapes([
          '1. Vérifier que les données sensibles ne sont visibles que par les rôles autorisés.',
        ]),
        expected: 'Aucune donnée sensible n\'est exposée à un rôle non autorisé.',
        priority: 'high',
      },
    ],
  },
  {
    id: 'performance',
    keywords: ['performance', 'vitesse', 'rapide', 'rapidité', 'rapidite', 'temps de chargement', 'chargement', 'latence', 'lent', 'slow', 'fluidité', 'fluidite'],
    cases: [
      {
        name: 'Temps de chargement initial',
        steps: etapes([
          '1. Ouvrir la fonctionnalité « {feature} ».',
          '2. Mesurer le temps avant l\'affichage complet.',
        ]),
        expected: 'La page se charge dans un délai acceptable et les indicateurs de chargement s\'affichent.',
        priority: 'high',
      },
      {
        name: 'Comportement avec un grand volume de données',
        steps: etapes([
          '1. Ouvrir la fonctionnalité avec un volume important de données.',
          '2. Parcourir et filtrer les données.',
        ]),
        expected: 'L\'affichage reste fluide et la pagination / virtualisation fonctionne.',
        priority: 'medium',
      },
      {
        name: 'Réactivité des actions',
        steps: etapes([
          '1. Exécuter plusieurs actions successives (navigation, enregistrement).',
        ]),
        expected: 'Chaque action répond sans blocage ni ralentissement perceptible.',
        priority: 'medium',
      },
    ],
  },
  {
    id: 'interface',
    keywords: ['navigation', 'affichage', 'display', 'interface', 'ui', 'ux', 'responsive', 'mobile', 'écran', 'ecran', 'menu', 'layout', 'page', 'fenêtre', 'fenetre', 'titre', 'bouton', 'icône', 'icone'],
    cases: [
      {
        name: 'Navigation dans l\'interface',
        steps: etapes([
          '1. Naviguer entre les différentes sections de la fonctionnalité.',
          '2. Vérifier la cohérence des menus et des boutons.',
        ]),
        expected: 'La navigation est fluide et sans lien mort.',
        priority: 'medium',
      },
      {
        name: 'Affichage responsive',
        steps: etapes([
          '1. Ouvrir la fonctionnalité sur différentes tailles d\'écran (mobile, tablette, ordinateur).',
        ]),
        expected: 'Le contenu s\'adapte correctement à toutes les tailles d\'écran.',
        priority: 'medium',
      },
      {
        name: 'États vide et de chargement',
        steps: etapes([
          '1. Afficher la fonctionnalité sans données.',
          '2. Vérifier l\'état pendant le chargement.',
        ]),
        expected: 'Un état vide et un indicateur de chargement clairs sont affichés.',
        priority: 'low',
      },
      {
        name: 'Retour en arrière',
        steps: etapes([
          '1. Naviguer vers un écran puis revenir en arrière.',
        ]),
        expected: 'Le retour en arrière préserve l\'état et l\'historique de navigation.',
        priority: 'low',
      },
    ],
  },
  {
    id: 'rapport',
    keywords: ['statistique', 'stats', 'rapport', 'report', 'graphique', 'chart', 'tableau de bord', 'dashboard', 'kpi', 'indicateur', 'analyse', 'métrique', 'metrique', 'tendance'],
    cases: [
      {
        name: 'Exactitude des données affichées',
        steps: etapes([
          '1. Ouvrir les statistiques / le rapport.',
          '2. Comparer les chiffres affichés avec les données sources.',
        ]),
        expected: 'Les données affichées sont exactes et à jour.',
        priority: 'high',
      },
      {
        name: 'Filtres de période',
        steps: etapes([
          '1. Appliquer différents filtres de période (jour, semaine, mois, année).',
        ]),
        expected: 'Les résultats et graphiques se mettent à jour selon la période choisie.',
        priority: 'medium',
      },
      {
        name: 'Export du rapport',
        steps: etapes([
          '1. Cliquer sur « Exporter » le rapport.',
          '2. Vérifier le fichier généré.',
        ]),
        expected: 'Le rapport exporté contient les données et graphiques attendus.',
        priority: 'high',
      },
      {
        name: 'Rapport sans données',
        steps: etapes([
          '1. Ouvrir le rapport sur une période sans données.',
        ]),
        expected: 'Un état vide explicite s\'affiche, sans erreur technique.',
        priority: 'low',
      },
    ],
  },
];

const GENERIQUE = {
  id: 'generique',
  cases: [
    {
      name: 'Scénario principal attendu',
      steps: etapes([
        '1. Ouvrir la fonctionnalité « {feature} ».',
        '2. Réaliser le parcours principal décrit.',
      ]),
      expected: 'Le parcours principal fonctionne comme décrit.',
      priority: 'high',
    },
    {
      name: 'Test avec des données limites',
      steps: etapes([
        '1. Tester la fonctionnalité avec des valeurs minimales, maximales et vides.',
      ]),
      expected: 'Les cas limites sont gérés sans erreur technique.',
      priority: 'medium',
    },
    {
      name: 'Vérification des messages d\'erreur',
      steps: etapes([
        '1. Provoquer volontairement des erreurs de saisie.',
        '2. Vérifier les messages affichés.',
      ]),
      expected: 'Des messages d\'erreur clairs et compréhensibles s\'affichent.',
      priority: 'medium',
    },
  ],
};

const MAX_CASES = 12;

/**
 * Génère les cas de test pour une fonctionnalité.
 * @param {{ name: string, description?: string, module?: string }} feature
 * @returns {Array<{ name: string, steps: string, expected_result: string, priority: string }>}
 */
export function generateTestCasesForFeature({ name, description = '', module = '' }) {
  const texte = `${module} ${name} ${description}`.toLowerCase();

  const groupes = [];
  for (const scenario of SCENARIOS) {
    const correspond = scenario.keywords.some(kw => texte.includes(kw));
    if (correspond) {
      groupes.push(scenario);
      if (groupes.length >= 2) break;
    }
  }
  if (groupes.length === 0) {
    groupes.push(GENERIQUE);
  }

  const cases = [];
  const seen = new Set();

  const ajouter = (tc) => {
    if (cases.length >= MAX_CASES) return;
    const libelle = tc.name;
    if (seen.has(libelle)) return;
    seen.add(libelle);
    cases.push({
      name: libelle.replace('{feature}', name),
      steps: tc.steps.replace(/\{feature\}/g, name),
      expected_result: tc.expected.replace('{feature}', name),
      priority: tc.priority,
    });
  };

  for (const tc of BASELINE) ajouter(tc);
  for (const groupe of groupes) {
    for (const tc of groupe.cases) ajouter(tc);
  }

  return cases;
}

export default { generateTestCasesForFeature };
