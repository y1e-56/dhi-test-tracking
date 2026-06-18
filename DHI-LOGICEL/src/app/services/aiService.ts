import api from './api';
import { Priorite, Anomalie, User, Fonctionnalite, Campagne } from '../types';

/**
 * Service IA pour les suggestions intelligentes
 * Fonctionnalité A : Suggestion automatique de priorité
 * Fonctionnalité B : Suggestion du développeur à assigner
 * Fonctionnalité C : Génération de cas de test
 * Fonctionnalité D : Résumé automatique d'anomalies
 * Fonctionnalité E : Prédiction de temps de résolution
 * Fonctionnalité F : Analyse de tendances
 * Fonctionnalité G : Rapport IA de campagne
 */

// Mots-clés pour déterminer la priorité
const PRIORITE_KEYWORDS = {
  critique: [
    'crash', 'plantage', 'bloque', 'bloquant', 'impossible', 'ne fonctionne pas',
    'erreur fatale', 'fatal', 'critical', 'sécurité', 'security', 'perte de données',
    'data loss', 'corruption', 'corrompu', 'inaccessible', 'accès refusé',
    'down', 'indisponible', 'unavailable', 'urgence', 'urgent', 'production',
    'prod', 'client', 'payant', 'paiement', 'payment', 'connexion', 'login',
    'authentification', 'auth', 'inscription', 'signup', 'mot de passe', 'password'
  ],
  haute: [
    'bug', 'erreur', 'error', 'problème', 'problem', 'défaillance', 'failure',
    'lent', 'slow', 'performance', 'timeout', 'délai', 'latence',
    'affichage', 'display', 'interface', 'ui', 'ux', 'expérience utilisateur',
    'confusion', 'compliqué', 'difficile', 'frustrant', 'mauvais', 'wrong',
    'incorrect', 'faux', 'manque', 'missing', 'absent', 'requis', 'required'
  ],
  moyenne: [
    'amélioration', 'improvement', 'optimisation', 'optimization', 'refactor',
    'code', 'style', 'format', 'cosmétique', 'cosmetic', 'design', 'layout',
    'typo', 'typographie', 'orthographe', 'spelling', 'grammaire', 'grammar',
    'traduction', 'translation', 'langue', 'language', 'texte', 'text',
    'suggestion', 'idea', 'idée', 'wishlist', 'feature', 'fonctionnalité'
  ],
  basse: [
    'optionnel', 'optional', 'nice to have', 'amélioration mineure', 'minor',
    'cosmétique', 'polish', 'detail', 'détail', 'mineur', 'trivial',
    'futur', 'future', 'plus tard', 'later', 'quand possible', 'when possible',
    'low priority', 'basse priorité', 'non urgent', 'not urgent'
  ]
};

/**
 * Fonctionnalité A : Suggestion automatique de priorité
 * Analyse la description et le titre pour suggérer une priorité
 */
export function suggerePriorite(titre: string, description: string): Priorite {
  const texteComplet = `${titre} ${description}`.toLowerCase();
  
  let scores = {
    critique: 0,
    haute: 0,
    moyenne: 0,
    basse: 0
  };

  // Calculer les scores pour chaque niveau de priorité
  for (const [priorite, keywords] of Object.entries(PRIORITE_KEYWORDS)) {
    for (const keyword of keywords) {
      if (texteComplet.includes(keyword.toLowerCase())) {
        scores[priorite as Priorite] += 1;
      }
    }
  }

  // Trouver la priorité avec le score le plus élevé
  let prioriteSuggeree: Priorite = 'moyenne'; // Valeur par défaut
  let maxScore = 0;

  for (const [priorite, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      prioriteSuggeree = priorite as Priorite;
    }
  }

  // Si aucun mot-clé n'est trouvé, retourner 'moyenne' par défaut
  if (maxScore === 0) {
    return 'moyenne';
  }

  return prioriteSuggeree;
}

/**
 * Fonctionnalité B : Suggestion du développeur à assigner
 * Basée sur l'historique : quel développeur résout le plus ce type d'anomalies
 */
export function suggereDeveloppeur(
  anomalie: { titre: string; description: string; module?: string },
  anomaliesExistantes: Anomalie[],
  developpeurs: User[]
): string | null {
  // Filtrer les anomalies résolues (cloturées ou validées)
  const anomaliesResolues = anomaliesExistantes.filter(
    a => a.statut === 'cloturee' || a.statut === 'validee'
  );

  if (anomaliesResolues.length === 0 || developpeurs.length === 0) {
    return null;
  }

  // Extraire les mots-clés de la nouvelle anomalie
  const motsClesNouvelle = extraireMotsCles(
    `${anomalie.titre} ${anomalie.description} ${anomalie.module || ''}`
  );

  if (motsClesNouvelle.length === 0) {
    // Si aucun mot-clé, suggérer le développeur avec le plus de résolutions
    return getDeveloppeurPlusActif(anomaliesResolues, developpeurs);
  }

  // Calculer le score de chaque développeur basé sur la similarité
  const scoresDeveloppeurs = new Map<string, number>();

  for (const developpeur of developpeurs) {
    scoresDeveloppeurs.set(developpeur.id, 0);
  }

  for (const anomalieResolue of anomaliesResolues) {
    const developpeurId = anomalieResolue.developpeurId;
    if (!developpeurId) continue;

    // Extraire les mots-clés de l'anomalie résolue
    const fonctionnaliteId = anomalieResolue.fonctionnaliteId;
    const motsClesResolue = extraireMotsCles(
      `${anomalieResolue.titre} ${anomalieResolue.description}`
    );

    // Calculer la similarité (Jaccard index simplifié)
    const similarite = calculerSimilarite(motsClesNouvelle, motsClesResolue);

    if (similarite > 0) {
      const scoreActuel = scoresDeveloppeurs.get(developpeurId) || 0;
      scoresDeveloppeurs.set(developpeurId, scoreActuel + similarite);
    }
  }

  // Trouver le développeur avec le score le plus élevé
  let meilleurDeveloppeurId: string | null = null;
  let maxScore = 0;

  for (const [devId, score] of scoresDeveloppeurs.entries()) {
    if (score > maxScore) {
      maxScore = score;
      meilleurDeveloppeurId = devId;
    }
  }

  // Si aucun score significatif, retourner le développeur le plus actif
  if (maxScore === 0 || !meilleurDeveloppeurId) {
    return getDeveloppeurPlusActif(anomaliesResolues, developpeurs);
  }

  return meilleurDeveloppeurId;
}

/**
 * Fonction utilitaire : extraire les mots-clés d'un texte
 */
function extraireMotsCles(texte: string): string[] {
  // Normaliser le texte
  const texteNormalise = texte
    .toLowerCase()
    .replace(/[^\w\sàáâãäåæçèéêëìíîïðñòóôõöøùúûüýÿ]/g, ' ')
    .split(/\s+/)
    .filter(mot => mot.length > 3); // Garder seulement les mots de plus de 3 caractères

  // Supprimer les mots courants (stop words français)
  const stopWords = new Set([
    'le', 'la', 'les', 'un', 'une', 'des', 'du', 'de', 'pour', 'avec',
    'sur', 'dans', 'par', 'est', 'son', 'sa', 'ses', 'ce', 'cet', 'cette',
    'mais', 'ou', 'et', 'donc', 'or', 'ni', 'car', 'que', 'qui', 'quoi',
    'dont', 'où', 'lorsque', 'si', 'comme', 'alors', 'ainsi', 'ensuite',
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'with', 'by', 'from', 'this', 'that', 'these', 'those', 'is', 'are',
    'was', 'were', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did'
  ]);

  return texteNormalise.filter(mot => !stopWords.has(mot));
}

/**
 * Fonction utilitaire : calculer la similarité entre deux listes de mots-clés
 * Utilise une version simplifiée de l'index de Jaccard
 */
function calculerSimilarite(mots1: string[], mots2: string[]): number {
  if (mots1.length === 0 || mots2.length === 0) return 0;

  const intersection = mots1.filter(mot => mots2.includes(mot));
  const union = [...new Set([...mots1, ...mots2])];

  return intersection.length / union.length;
}

/**
 * Fonction utilitaire : obtenir le développeur le plus actif
 * Basé sur le nombre d'anomalies résolues
 */
function getDeveloppeurPlusActif(anomaliesResolues: Anomalie[], developpeurs: User[]): string | null {
  const counts = new Map<string, number>();

  // Compter les résolutions par développeur
  for (const anomalie of anomaliesResolues) {
    const devId = anomalie.developpeurId;
    if (devId) {
      counts.set(devId, (counts.get(devId) || 0) + 1);
    }
  }

  // Trouver le développeur avec le plus de résolutions
  let maxCount = 0;
  let meilleurDevId: string | null = null;

  for (const [devId, count] of counts.entries()) {
    if (count > maxCount) {
      maxCount = count;
      meilleurDevId = devId;
    }
  }

  // Vérifier que le développeur existe toujours
  if (meilleurDevId && developpeurs.find(d => d.id === meilleurDevId)) {
    return meilleurDevId;
  }

  // Sinon, retourner le premier développeur disponible
  return developpeurs.length > 0 ? developpeurs[0].id : null;
}

/**
 * Version améliorée avec apprentissage par module
 * Suggère un développeur basé sur le module/functionalité
 */
export function suggereDeveloppeurParModule(
  module: string,
  anomaliesExistantes: Anomalie[],
  developpeurs: User[]
): string | null {
  if (!module || anomaliesExistantes.length === 0 || developpeurs.length === 0) {
    return null;
  }

  // Filtrer les anomalies résolues
  const anomaliesResolues = anomaliesExistantes.filter(
    a => a.statut === 'cloturee' || a.statut === 'validee'
  );

  // Regrouper par développeur et compter les résolutions
  const scoresDeveloppeurs = new Map<string, number>();

  for (const anomalie of anomaliesResolues) {
    // Vérifier si l'anomalie est liée au même module
    // (Note: nécessiterait d'accéder aux fonctionnalités pour le module)
    const devId = anomalie.developpeurId;
    if (devId) {
      scoresDeveloppeurs.set(devId, (scoresDeveloppeurs.get(devId) || 0) + 1);
    }
  }

  // Trouver le meilleur développeur
  let maxScore = 0;
  let meilleurDevId: string | null = null;

  for (const [devId, score] of scoresDeveloppeurs.entries()) {
    if (score > maxScore) {
      maxScore = score;
      meilleurDevId = devId;
    }
  }

  return meilleurDevId;
}

//
// ─── FONCTIONNALITÉ C : GÉNÉRATION PROFESSIONNELLE DE CAS DE TEST ───────────────
//

interface CasDeTest {
  id: string;
  titre: string;
  objectif: string;
  prerequis: string[];
  etapes: string[];
  resultatAttendu: string;
}

const MODULES_DE_TEST: Record<string, { generer: (desc: string) => CasDeTest[] }> = {
  authentification: {
    generer: (desc: string) => [
      {
        id: 'AUTH-001',
        titre: 'Connexion avec identifiants valides',
        objectif: 'Vérifier que la connexion aboutit avec des identifiants corrects',
        prerequis: ['Disposer d\'un compte utilisateur actif', 'Être sur la page de connexion'],
        etapes: [
          'Saisir un identifiant valide dans le champ prévu',
          'Saisir le mot de passe correspondant',
          'Cliquer sur le bouton de connexion',
          'Observer la redirection post-connexion',
        ],
        resultatAttendu: 'L\'utilisateur est redirigé vers la page d\'accueil de l\'application. Aucun message d\'erreur ne s\'affiche.',
      },
      {
        id: 'AUTH-002',
        titre: 'Connexion avec identifiant invalide',
        objectif: 'Vérifier le comportement du système face à un identifiant erroné',
        prerequis: ['Être sur la page de connexion'],
        etapes: [
          'Saisir un identifiant inexistant',
          'Saisir un mot de passe quelconque',
          'Cliquer sur le bouton de connexion',
          'Noter le message affiché',
        ],
        resultatAttendu: 'Un message d\'erreur explicite s\'affiche : "Identifiant ou mot de passe incorrect". Aucune information sur l\'existence du compte n\'est divulguée.',
      },
      {
        id: 'AUTH-003',
        titre: 'Connexion avec mot de passe invalide',
        objectif: 'Vérifier la validation du mot de passe',
        prerequis: ['Connaître un identifiant valide', 'Être sur la page de connexion'],
        etapes: [
          'Saisir un identifiant valide',
          'Saisir un mot de passe incorrect',
          'Cliquer sur le bouton de connexion',
          'Vérifier le message d\'erreur',
        ],
        resultatAttendu: 'Un message d\'erreur indique que le mot de passe est incorrect. Le champ mot de passe doit être réinitialisé.',
      },
      {
        id: 'AUTH-004',
        titre: 'Connexion avec champs vides',
        objectif: 'Vérifier la validation des champs obligatoires',
        prerequis: ['Être sur la page de connexion'],
        etapes: [
          'Laisser le champ identifiant vide',
          'Laisser le champ mot de passe vide',
          'Tenter de cliquer sur le bouton de connexion',
          'Observer le comportement',
        ],
        resultatAttendu: 'Le bouton de connexion est désactivé ou une validation en temps réel indique que les champs sont requis. Aucun appel réseau n\'est effectué.',
      },
      {
        id: 'AUTH-005',
        titre: 'Verrouillage du compte après échecs répétés',
        objectif: 'Vérifier la politique de verrouillage pour prévenir les attaques par force brute',
        prerequis: ['Connaître un identifiant valide', 'Être sur la page de connexion'],
        etapes: [
          'Tenter de se connecter avec un mot de passe incorrect',
          'Répéter l\'opération 5 fois',
          'Observer le message après le 5ᵉ échec',
          'Tenter une connexion avec le bon mot de passe',
        ],
        resultatAttendu: 'Après un certain nombre d\'échecs consécutifs, le compte est temporairement verrouillé. Un message informe l\'utilisateur de la durée d\'attente avant une nouvelle tentative.',
      },
    ].filter(() => desc.toLowerCase().includes('connexion') || desc.toLowerCase().includes('login') || desc.toLowerCase().includes('auth')),
  },
  formulaire: {
    generer: (desc: string) => [
      {
        id: 'FORM-001',
        titre: 'Soumission avec données valides',
        objectif: 'Vérifier que le formulaire accepte et traite des données correctes',
        prerequis: ['Accéder au formulaire', 'Disposer de données valides pour tous les champs'],
        etapes: [
          'Remplir l\'ensemble des champs avec des données valides',
          'Cocher les cases obligatoires si présentes',
          'Cliquer sur le bouton de soumission',
          'Vérifier le message de confirmation',
        ],
        resultatAttendu: 'Le formulaire est soumis avec succès. Un message de confirmation s\'affiche et les données sont persistées.',
      },
      {
        id: 'FORM-002',
        titre: 'Validation des champs obligatoires',
        objectif: 'Vérifier que les champs requis sont correctement validés',
        prerequis: ['Accéder au formulaire'],
        etapes: [
          'Ne pas remplir les champs marqués comme obligatoires',
          'Cliquer sur le bouton de soumission',
          'Observer les indications d\'erreur',
        ],
        resultatAttendu: 'Les champs obligatoires vides sont mis en évidence (bordure rouge, icône d\'erreur). Un message indique que ces champs sont requis. Le formulaire n\'est pas soumis.',
      },
      {
        id: 'FORM-003',
        titre: 'Validation des formats de données',
        objectif: 'Vérifier que les champs typés (email, téléphone, nombre) rejettent les formats invalides',
        prerequis: ['Accéder au formulaire'],
        etapes: [
          'Saisir une valeur non conforme dans un champ email (ex: "abc")',
          'Saisir une valeur non conforme dans un champ téléphone (ex: "abc")',
          'Tenter de soumettre le formulaire',
          'Vérifier les messages d\'erreur par champ',
        ],
        resultatAttendu: 'Chaque champ affiche un message d\'erreur spécifique indiquant le format attendu. Les champs valides ne sont pas impactés.',
      },
      {
        id: 'FORM-004',
        titre: 'Réinitialisation du formulaire',
        objectif: 'Vérifier le bon fonctionnement du bouton d\'annulation ou de réinitialisation',
        prerequis: ['Accéder au formulaire', 'Avoir saisi des données dans les champs'],
        etapes: [
          'Remplir plusieurs champs avec des données',
          'Cliquer sur le bouton Annuler / Réinitialiser',
          'Vérifier l\'état des champs',
        ],
        resultatAttendu: 'Tous les champs sont réinitialisés à leur valeur par défaut. Les données saisies sont effacées.',
      },
      {
        id: 'FORM-005',
        titre: 'Protection contre la double soumission',
        objectif: 'Vérifier que le formulaire ne peut pas être soumis plusieurs fois',
        prerequis: ['Accéder au formulaire', 'Disposer de données valides'],
        etapes: [
          'Soumettre le formulaire une première fois',
          'Cliquer à nouveau sur le bouton de soumission immédiatement',
          'Observer le comportement du bouton',
        ],
        resultatAttendu: 'Le bouton de soumission est désactivé après le premier clic. Une seule requête est envoyée au serveur.',
      },
    ],
  },
  liste: {
    generer: (desc: string) => [
      {
        id: 'LIST-001',
        titre: 'Affichage des éléments',
        objectif: 'Vérifier que la liste affiche correctement l\'ensemble des données',
        prerequis: ['La liste contient au moins un élément'],
        etapes: [
          'Accéder à la page contenant la liste',
          'Vérifier que les données sont chargées',
          'Contrôler l\'affichage de chaque colonne',
          'Vérifier que les libellés correspondent aux en-têtes',
        ],
        resultatAttendu: 'Tous les éléments sont affichés avec leurs données correctes dans les colonnes appropriées.',
      },
      {
        id: 'LIST-002',
        titre: 'Pagination',
        objectif: 'Vérifier le fonctionnement de la pagination',
        prerequis: ['La liste contient plus d\'éléments que le nombre par page'],
        etapes: [
          'Observer le nombre d\'éléments affichés par page',
          'Cliquer sur le bouton page suivante',
          'Vérifier que les nouveaux éléments sont chargés',
          'Cliquer sur le bouton page précédente',
          'Vérifier le retour aux premiers éléments',
        ],
        resultatAttendu: 'La navigation entre les pages fonctionne correctement. Le nombre d\'éléments par page est respecté. Les informations de pagination (page X sur Y) sont à jour.',
      },
      {
        id: 'LIST-003',
        titre: 'Recherche et filtrage',
        objectif: 'Vérifier que les fonctions de recherche et filtrage renvoient les résultats attendus',
        prerequis: ['La liste contient des données variées'],
        etapes: [
          'Saisir un terme de recherche pertinent dans la barre de recherche',
          'Vérifier que les résultats correspondent au critère saisi',
          'Effacer la recherche',
          'Vérifier le retour à la liste complète',
          'Saisir un terme sans résultat attendu',
          'Vérifier l\'affichage du message "Aucun résultat"',
        ],
        resultatAttendu: 'La recherche filtre correctement les éléments. Un message approprié s\'affiche en l\'absence de résultats.',
      },
      {
        id: 'LIST-004',
        titre: 'Tri des colonnes',
        objectif: 'Vérifier le tri ascendant et descendant des colonnes',
        prerequis: ['La liste contient au moins 2 éléments avec des valeurs différentes dans chaque colonne'],
        etapes: [
          'Cliquer sur l\'en-tête d\'une colonne triable',
          'Vérifier le tri ascendant',
          'Re-cliquer sur le même en-tête',
          'Vérifier le tri descendant',
          'Vérifier l\'icône de tri mise à jour',
        ],
        resultatAttendu: 'Le tri alterne entre ascendant et descendant à chaque clic. L\'icône de tri reflète l\'état actuel.',
      },
      {
        id: 'LIST-005',
        titre: 'Liste vide',
        objectif: 'Vérifier l\'affichage lorsque la liste ne contient aucun élément',
        prerequis: ['La liste est vide ou filtrée pour n\'afficher aucun résultat'],
        etapes: [
          'Accéder à la page alors que la liste est vide',
          'Observer le message affiché',
          'Vérifier qu\'aucun tableau vide n\'est affiché',
        ],
        resultatAttendu: 'Un message clair indique l\'absence de données. Une illustration ou un state vide est présenté. Aucun élément d\'interface cassé.',
      },
    ],
  },
  notification: {
    generer: (desc: string) => [
      {
        id: 'NOTIF-001',
        titre: 'Réception d\'une notification',
        objectif: 'Vérifier qu\'une notification est émise lors d\'un événement déclencheur',
        prerequis: ['Être connecté avec un compte actif', 'Disposer d\'un événement déclencheur'],
        etapes: [
          'Déclencher une action générant une notification (assignation, anomalie, etc.)',
          'Vérifier l\'apparition de l\'icône de notification',
          'Ouvrir le panneau des notifications',
          'Vérifier que la notification apparaît dans la liste',
        ],
        resultatAttendu: 'La notification s\'affiche en temps réel dans le panneau. Le compteur de notifications non lues est incrémenté.',
      },
      {
        id: 'NOTIF-002',
        titre: 'Marquage comme lu',
        objectif: 'Vérifier qu\'une notification peut être marquée comme lue',
        prerequis: ['Disposer d\'au moins une notification non lue'],
        etapes: [
          'Ouvrir le panneau des notifications',
          'Cliquer sur une notification non lue',
          'Vérifier le changement de style (gras → normal)',
          'Vérifier la mise à jour du compteur',
        ],
        resultatAttendu: 'La notification passe en état "lu". Le style s\'allège et le compteur global diminue.',
      },
      {
        id: 'NOTIF-003',
        titre: 'Redirection depuis une notification',
        objectif: 'Vérifier que le clic sur une notification redirige vers la ressource concernée',
        prerequis: ['Disposer d\'une notification avec un lien'],
        etapes: [
          'Ouvrir le panneau des notifications',
          'Cliquer sur une notification',
          'Vérifier la redirection',
        ],
        resultatAttendu: 'Le clic redirige vers la page appropriée (anomalie, campagne, fonctionnalité). La notification est marquée comme lue.',
      },
    ],
  },
  export: {
    generer: (desc: string) => [
      {
        id: 'EXPORT-001',
        titre: 'Export PDF des données',
        objectif: 'Vérifier la génération correcte d\'un fichier PDF',
        prerequis: ['Disposer de données à exporter'],
        etapes: [
          'Sélectionner le périmètre des données à exporter',
          'Choisir le format PDF',
          'Cliquer sur le bouton d\'export',
          'Attendre la génération du fichier',
          'Ouvrir le fichier téléchargé',
        ],
        resultatAttendu: 'Le fichier PDF est généré et téléchargé. Il contient l\'intégralité des données sélectionnées avec une mise en page correcte.',
      },
      {
        id: 'EXPORT-002',
        titre: 'Export Excel des données',
        objectif: 'Vérifier la génération correcte d\'un fichier Excel',
        prerequis: ['Disposer de données à exporter'],
        etapes: [
          'Sélectionner le périmètre des données à exporter',
          'Choisir le format Excel',
          'Cliquer sur le bouton d\'export',
          'Attendre la génération du fichier',
          'Ouvrir le fichier téléchargé',
        ],
        resultatAttendu: 'Le fichier Excel est généré avec des onglets organisés par thématique. Les données sont exploitables dans un tableur.',
      },
    ],
  },
  recherche: {
    generer: (desc: string) => [
      {
        id: 'RECH-001',
        titre: 'Recherche par mot-clé',
        objectif: 'Vérifier que la recherche retourne les résultats pertinents',
        prerequis: ['Des données existent dans la base'],
        etapes: [
          'Saisir un mot-clé présent dans les données',
          'Lancer la recherche',
          'Vérifier que les résultats contiennent le mot-clé',
          'Vérifier le nombre de résultats',
        ],
        resultatAttendu: 'La recherche retourne tous les éléments contenant le mot-clé, triés par pertinence.',
      },
      {
        id: 'RECH-002',
        titre: 'Recherche sans résultat',
        objectif: 'Vérifier le comportement lorsqu\'aucun résultat n\'est trouvé',
        prerequis: ['Aucune donnée ne correspond au terme recherché'],
        etapes: [
          'Saisir un terme qui n\'existe dans aucune donnée',
          'Lancer la recherche',
          'Observer l\'affichage',
        ],
        resultatAttendu: 'Un message "Aucun résultat trouvé" s\'affiche. La liste reste vide mais l\'interface reste fonctionnelle.',
      },
    ],
  },
};

/**
 * Analyse la description d'une fonctionnalité pour générer des cas de test structurés
 */
export function genererCasDeTest(description: string): CasDeTest[] {
  const descLower = description.toLowerCase();
  const resultats: CasDeTest[] = [];
  const modulesActives = new Set<string>();

  for (const [motCle, module] of Object.entries({
    connexion: 'authentification', login: 'authentification', auth: 'authentification',
    'mot de passe': 'authentification', identifiant: 'authentification', déconnexion: 'authentification',
    formulaire: 'formulaire', saisie: 'formulaire', champ: 'formulaire', 'ajouter un': 'formulaire',
    éditer: 'formulaire', modifier: 'formulaire', créer: 'formulaire',
    liste: 'liste', tableau: 'liste', grille: 'liste', 'data grid': 'liste',
    notification: 'notification', alerte: 'notification',
    export: 'export', pdf: 'export', excel: 'export', téléchargement: 'export', imprimer: 'export',
    recherche: 'recherche', filtre: 'recherche', chercher: 'recherche', rechercher: 'recherche',
  })) {
    if (descLower.includes(motCle)) modulesActives.add(module);
  }

  if (modulesActives.size === 0) {
    return [{
      id: 'GEN-001',
      titre: 'Validation fonctionnelle de base',
      objectif: 'Vérifier le comportement nominal de la fonctionnalité décrite',
      prerequis: ['Accéder à la fonctionnalité décrite', 'Disposer des droits nécessaires'],
      etapes: [
        'Accéder à l\'écran ou au composant concerné',
        'Effectuer l\'action principale décrite dans les spécifications',
        'Vérifier que le résultat correspond au comportement attendu',
        'Tester les cas limites et les erreurs potentielles',
        'Valider l\'intégrité des données après l\'opération',
      ],
      resultatAttendu: 'La fonctionnalité se comporte conformément à la description. Aucun effet de bord inattendu.',
    }];
  }

  for (const module of modulesActives) {
    const generateur = MODULES_DE_TEST[module];
    if (generateur) {
      const cas = generateur.generer(description);
      resultats.push(...cas);
    }
  }

  return resultats;
}

//
// ─── FONCTIONNALITÉ D : RAPPORT DE SYNTHÈSE D'ANOMALIES ────────────────────────
//

interface IndicateurQualite {
  nom: string;
  valeur: string;
  seuil: 'critique' | 'alerte' | 'normal' | 'excellent';
}

export function genererResumeAnomalies(anomalies: Anomalie[]): string {
  if (anomalies.length === 0) {
    return 'Aucune anomalie enregistrée dans le périmètre actuel. La qualité est conforme aux attentes.';
  }

  const total = anomalies.length;
  const parPriorite = { critique: 0, haute: 0, moyenne: 0, basse: 0 };
  const parStatut = { nouvelle: 0, en_cours: 0, resolution_signalee: 0, validee: 0, cloturee: 0 };

  for (const a of anomalies) {
    if (parPriorite[a.priorite] !== undefined) parPriorite[a.priorite]++;
    if (parStatut[a.statut] !== undefined) parStatut[a.statut]++;
  }

  const prioritesActives = (Object.entries(parPriorite) as [Priorite, number][])
    .filter(([, count]) => count > 0)
    .sort(([, a], [, b]) => b - a);

  const ouvertes = parStatut.nouvelle + parStatut.en_cours;
  const resolues = parStatut.resolution_signalee + parStatut.validee + parStatut.cloturee;

  const rapports: string[] = [];
  rapports.push(`RAPPORT DE SYNTHÈSE — ${total} anomalie${total > 1 ? 's' : ''} recensée${total > 1 ? 's' : ''}`);
  rapports.push('');

  const prioriteStr = prioritesActives
    .map(([p, c]) => {
      const label = { critique: 'critique', haute: 'haute', moyenne: 'moyenne', basse: 'basse' }[p];
      return `${c} ${label}${c > 1 ? 's' : ''}`;
    })
    .join(' | ');
  rapports.push(`  • Répartition par priorité : ${prioriteStr}`);
  rapports.push(`  • Anomalies ouvertes : ${ouvertes} — Anomalies résolues : ${resolues}`);
  rapports.push(`  • Taux de résolution : ${total > 0 ? Math.round((resolues / total) * 100) : 0}%`);

  const critiquesOuvertes = parPriorite.critique - (anomalies.filter(a => a.priorite === 'critique' && (a.statut === 'cloturee' || a.statut === 'validee')).length);
  if (critiquesOuvertes > 0) {
    rapports.push('');

    if (critiquesOuvertes === 1) {
      rapports.push('  ⚠ ALERTE : 1 anomalie critique non résolue nécessite une attention immédiate.');
    } else {
      rapports.push(`  ⚠ ALERTE : ${critiquesOuvertes} anomalies critiques non résolues nécessitent une attention prioritaire.`);
    }
  }

  if (ouvertes === 0 && total > 0) {
    rapports.push('');
    rapports.push('  ✓ Toutes les anomalies ont été traitées. Aucune action en attente.');
  }

  rapports.push('');
  rapports.push('── Indicateurs de qualité ──');
  const tauxResolution = total > 0 ? Math.round((resolues / total) * 100) : 100;
  const ratioCritique = total > 0 ? Math.round((parPriorite.critique / total) * 100) : 0;

  const indicateurs: IndicateurQualite[] = [
    {
      nom: 'Taux de résolution',
      valeur: `${tauxResolution}%`,
      seuil: tauxResolution >= 80 ? 'excellent' : tauxResolution >= 60 ? 'normal' : tauxResolution >= 30 ? 'alerte' : 'critique',
    },
    {
      nom: 'Anomalies critiques',
      valeur: `${parPriorite.critique}`,
      seuil: ratioCritique > 30 ? 'critique' : ratioCritique > 15 ? 'alerte' : ratioCritique > 0 ? 'normal' : 'excellent',
    },
    {
      nom: 'Charge ouverte',
      valeur: `${ouvertes}`,
      seuil: ouvertes > total * 0.5 ? 'critique' : ouvertes > total * 0.3 ? 'alerte' : ouvertes > 0 ? 'normal' : 'excellent',
    },
  ];

  for (const ind of indicateurs) {
    const icone = ind.seuil === 'excellent' ? '✓' : ind.seuil === 'normal' ? '•' : ind.seuil === 'alerte' ? '◷' : '✗';
    rapports.push(`  ${icone} ${ind.nom} : ${ind.valeur} [${ind.seuil}]`);
  }

  return rapports.join('\n');
}

//
// ─── FONCTIONNALITÉ E : PRÉDICTION DE TEMPS DE RÉSOLUTION ─────────────────────
//

const REFERENCE_RESOLUTION: Record<Priorite, { joursMin: number; joursMax: number; desc: string }> = {
  critique: { joursMin: 0.5, joursMax: 2, desc: 'intervention immédiate requise (24 à 48h)' },
  haute: { joursMin: 1, joursMax: 4, desc: 'prise en charge rapide (1 à 4 jours)' },
  moyenne: { joursMin: 3, joursMax: 10, desc: 'résolution standard (3 à 10 jours)' },
  basse: { joursMin: 5, joursMax: 21, desc: 'traitement non urgent (5 à 21 jours)' },
};

export function predireTempsResolution(
  anomalie: { titre: string; description: string; priorite: Priorite },
  historique: Anomalie[]
): { estimation: string; joursEstimes: number; intervalle: [number, number]; confiance: number } {
  const ref = REFERENCE_RESOLUTION[anomalie.priorite];
  const motsClesAnomalie = extraireMotsCles(`${anomalie.titre} ${anomalie.description}`);
  const anomaliesResolues = historique.filter(
    a => (a.statut === 'cloturee' || a.statut === 'validee') && a.dateResolution
  );

  const durees: number[] = [];
  let chargeEnCours = 0;

  for (const a of historique) {
    if (a.statut === 'nouvelle' || a.statut === 'en_cours') {
      chargeEnCours++;
    }
    if ((a.statut === 'cloturee' || a.statut === 'validee') && a.dateResolution) {
      const motsClesHist = extraireMotsCles(`${a.titre} ${a.description}`);
      if (calculerSimilarite(motsClesAnomalie, motsClesHist) > 0) {
        const creation = new Date(a.dateCreation).getTime();
        const resolution = new Date(a.dateResolution).getTime();
        durees.push((resolution - creation) / (1000 * 60 * 60 * 24));
      }
    }
  }

  let joursEstimes: number;
  let confiance: number;

  if (durees.length > 0) {
    const moyenne = durees.reduce((a, b) => a + b, 0) / durees.length;
    const penaliteCharge = 1 + (chargeEnCours * 0.15);
    joursEstimes = Math.round(moyenne * penaliteCharge * 10) / 10;
    confiance = Math.min(85, 35 + durees.length * 8 + (moyenne > 0 ? 10 : 0));
  } else if (chargeEnCours > 0) {
    joursEstimes = Math.round((ref.joursMin + ref.joursMax) / 2 * (1 + chargeEnCours * 0.1) * 10) / 10;
    confiance = 25;
  } else {
    joursEstimes = Math.round((ref.joursMin + ref.joursMax) / 2 * 10) / 10;
    confiance = 20;
  }

  const intervalle: [number, number] = [
    Math.round(Math.max(0.5, joursEstimes * 0.7) * 10) / 10,
    Math.round(joursEstimes * 1.3 * 10) / 10,
  ];

  const niveauConfiance = confiance >= 70 ? 'élevée' : confiance >= 45 ? 'moyenne' : 'faible';

  return {
    estimation: [
      `Prédiction de résolution pour l'anomalie "${anomalie.titre}"`,
      `  • Priorité : ${anomalie.priorite} (${ref.desc})`,
      `  • Estimation : ${joursEstimes} jour${joursEstimes > 1 ? 's' : ''} ouvrés`,
      `  • Intervalle probable : ${intervalle[0]} à ${intervalle[1]} jours`,
      `  • Charge actuelle : ${chargeEnCours} anomalie${chargeEnCours > 1 ? 's' : ''} en attente`,
      `  • Confiance : ${niveauConfiance} (${confiance}%)`,
      durees.length > 0 ? `  • Basé sur ${durees.length} anomalie${durees.length > 1 ? 's' : ''} similaire${durees.length > 1 ? 's' : ''} résolue${durees.length > 1 ? 's' : ''}` : '  • Aucune donnée historique similaire disponible',
    ].join('\n'),
    joursEstimes,
    intervalle,
    confiance,
  };
}

//
// ─── FONCTIONNALITÉ F : ANALYSE DE TENDANCES ──────────────────────────────────
//

interface Tendances {
  titre: string;
  description: string;
  type: 'positif' | 'negatif' | 'neutre' | 'critique';
  valeur: string;
  priorite: number;
}

export function analyserTendances(anomalies: Anomalie[], fonctionnalites: Fonctionnalite[]): Tendances[] {
  const resultats: Tendances[] = [];

  if (anomalies.length === 0 && fonctionnalites.length === 0) {
    return [{
      titre: 'Aucune donnée disponible',
      description: 'Les données sont insuffisantes pour produire une analyse fiable.',
      type: 'neutre',
      valeur: '—',
      priorite: 0,
    }];
  }

  // 1. Qualité générale : taux de fonctionnalités conformes
  if (fonctionnalites.length > 0) {
    const conformes = fonctionnalites.filter(f => f.statut === 'conforme').length;
    const nonTestees = fonctionnalites.filter(f => f.statut === 'non_testee').length;
    const conformite = Math.round((conformes / fonctionnalites.length) * 100);

    resultats.push({
      titre: 'Conformité générale',
      description: `${conformes} fonctionnalité${conformes > 1 ? 's' : ''} conforme${conformes > 1 ? 's' : ''} sur ${fonctionnalites.length} (${conformite}%)`,
      type: conformite >= 80 ? 'positif' : conformite >= 50 ? 'neutre' : 'negatif',
      valeur: `${conformite}%`,
      priorite: 5,
    });

    if (nonTestees > 0) {
      const couverture = Math.round(((fonctionnalites.length - nonTestees) / fonctionnalites.length) * 100);
      resultats.push({
        titre: 'Couverture des tests',
        description: `${couverture}% des fonctionnalités ont été testées (${fonctionnalites.length - nonTestees}/${fonctionnalites.length})`,
        type: couverture >= 80 ? 'positif' : couverture >= 50 ? 'neutre' : 'critique',
        valeur: `${couverture}%`,
        priorite: 4,
      });
    }
  }

  // 2. Gravité du backlog anomalies
  if (anomalies.length > 0) {
    const critiques = anomalies.filter(a => a.priorite === 'critique' && a.statut !== 'cloturee' && a.statut !== 'validee').length;
    const hautes = anomalies.filter(a => a.priorite === 'haute' && a.statut !== 'cloturee' && a.statut !== 'validee').length;
    const totalOuvertes = anomalies.filter(a => a.statut !== 'cloturee' && a.statut !== 'validee').length;
    const scoreGravite = critiques * 10 + hautes * 4;

    if (critiques > 0) {
      resultats.push({
        titre: 'Anomalies critiques',
        description: `${critiques} anomalie${critiques > 1 ? 's' : ''} critique${critiques > 1 ? 's' : ''} non résolue${critiques > 1 ? 's' : ''} — action requise immédiatement`,
        type: 'critique',
        valeur: `${critiques}`,
        priorite: 10,
      });
    }

    resultats.push({
      titre: 'Indice de gravité',
      description: `Score basé sur ${totalOuvertes} anomalie${totalOuvertes > 1 ? 's' : ''} ouverte${totalOuvertes > 1 ? 's' : ''} (pondération : critique=10, haute=4)`,
      type: scoreGravite > 20 ? 'critique' : scoreGravite > 10 ? 'negatif' : scoreGravite > 0 ? 'neutre' : 'positif',
      valeur: `${scoreGravite}`,
      priorite: 8,
    });

    const cloturees = anomalies.filter(a => a.statut === 'cloturee' || a.statut === 'validee').length;
    const tauxResolution = Math.round((cloturees / anomalies.length) * 100);
    resultats.push({
      titre: 'Taux de résolution',
      description: `${tauxResolution}% des anomalies ont été traitées (${cloturees}/${anomalies.length})`,
      type: tauxResolution >= 80 ? 'positif' : tauxResolution >= 50 ? 'neutre' : 'negatif',
      valeur: `${tauxResolution}%`,
      priorite: 6,
    });
  }

  // 3. Répartition fonctionnalités avec anomalies
  const avecAnomalies = fonctionnalites.filter(f => f.statut === 'anomalie').length;
  if (avecAnomalies > 0 && fonctionnalites.length > 0) {
    const ratio = Math.round((avecAnomalies / fonctionnalites.length) * 100);
    resultats.push({
      titre: 'Fonctionnalités à anomalies',
      description: `${avecAnomalies} fonctionnalité${avecAnomalies > 1 ? 's' : ''} impactée${avecAnomalies > 1 ? 's' : ''} par des anomalies (${ratio}% du périmètre)`,
      type: ratio > 40 ? 'critique' : ratio > 20 ? 'negatif' : 'neutre',
      valeur: `${ratio}%`,
      priorite: 7,
    });
  }

  resultats.sort((a, b) => b.priorite - a.priorite);
  return resultats;
}

//
// ─── FONCTIONNALITÉ G : RAPPORT IA DE CAMPAGNE ────────────────────────────────
//

export function genererRapportIA(
  campagne: Campagne,
  anomalies: Anomalie[],
  fonctionnalites: Fonctionnalite[]
): string {
  const sections: string[] = [];
  const dateNow = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  const totalFoncts = fonctionnalites.length;
  const conformes = fonctionnalites.filter(f => f.statut === 'conforme').length;
  const avecAnomalies = fonctionnalites.filter(f => f.statut === 'anomalie').length;
  const nonTestees = fonctionnalites.filter(f => f.statut === 'non_testee').length;
  const avancement = totalFoncts > 0 ? Math.round(((conformes + avecAnomalies) / totalFoncts) * 100) : 0;
  const totalAnomalies = anomalies.length;
  const cloturees = anomalies.filter(a => a.statut === 'cloturee' || a.statut === 'validee').length;
  const tauxResolution = totalAnomalies > 0 ? Math.round((cloturees / totalAnomalies) * 100) : 0;

  // En-tête
  sections.push('┌─────────────────────────────────────────────────────────────┐');
  sections.push('│             RAPPORT D\'ANALYSE INTELLIGENTE IA              │');
  sections.push('└─────────────────────────────────────────────────────────────┘');
  sections.push('');
  sections.push(`  Campagne : ${campagne.nom}`);
  sections.push(`  Période   : ${new Date(campagne.dateDebut).toLocaleDateString('fr-FR')} → ${new Date(campagne.dateFin).toLocaleDateString('fr-FR')}`);
  sections.push(`  Statut    : ${campagne.statut.replace('_', ' ')}`);
  sections.push(`  Généré le : ${dateNow}`);
  sections.push('');

  // 1. Synthèse exécutive
  sections.push('╔═══════════════════════════════════════════════════════════════╗');
  sections.push('║                    1. SYNTHÈSE EXÉCUTIVE                    ║');
  sections.push('╚═══════════════════════════════════════════════════════════════╝');
  sections.push('');

  if (totalFoncts === 0 && totalAnomalies === 0) {
    sections.push('  Aucune donnée n\'est disponible pour cette campagne. Il est');
    sections.push('  recommandé de configurer le périmètre de test avant de');
    sections.push('  générer un rapport d\'analyse.');
    sections.push('');
    return sections.join('\n');
  }

  sections.push(`  Cette campagne a couvert ${totalFoncts} fonctionnalité${totalFoncts > 1 ? 's' : ''} avec un taux`);
  sections.push(`  d'avancement de ${avancement}%.`);
  sections.push('');

  if (avancement < 100) {
    sections.push(`  ● ${nonTestees} fonctionnalité${nonTestees > 1 ? 's' : ''} n'ont pas encore été testée${nonTestees > 1 ? 's' : ''}.`);
  }
  sections.push(`  ● ${conformes} fonctionnalité${conformes > 1 ? 's' : ''} conforme${conformes > 1 ? 's' : ''} — ${totalFoncts > 0 ? Math.round((conformes / totalFoncts) * 100) : 0}% du périmètre.`);
  if (avecAnomalies > 0) {
    sections.push(`  ● ${avecAnomalies} fonctionnalité${avecAnomalies > 1 ? 's' : ''} présentent des anomalies.`);
  }
  if (totalAnomalies > 0) {
    sections.push(`  ● ${totalAnomalies} anomalie${totalAnomalies > 1 ? 's' : ''} détectée${totalAnomalies > 1 ? 's' : ''}, dont ${cloturees} résolue${cloturees > 1 ? 's' : ''} (${tauxResolution}%).`);
  }
  sections.push('');

  // 2. Indicateurs clés de performance (KPI)
  sections.push('╔═══════════════════════════════════════════════════════════════╗');
  sections.push('║              2. INDICATEURS CLÉS DE PERFORMANCE             ║');
  sections.push('╚═══════════════════════════════════════════════════════════════╝');
  sections.push('');

  const avancementSeuil = avancement >= 90 ? 'excellent' : avancement >= 70 ? 'satisfaisant' : avancement >= 50 ? 'moyen' : 'insuffisant';
  const conformiteSeuil = totalFoncts > 0 ? (conformes / totalFoncts >= 0.8 ? 'excellent' : conformes / totalFoncts >= 0.5 ? 'moyen' : 'insuffisant') : '—';

  const lignesKpi = [
    ['Indicateur', 'Valeur', 'Appréciation'],
    ['─────────────────────────────────────────────', '───────', '────────────'],
    ['Avancement', `${avancement}%`, avancementSeuil],
    ['Conformité', totalFoncts > 0 ? `${Math.round((conformes / totalFoncts) * 100)}%` : '—', conformiteSeuil],
    ['Couverture', totalFoncts > 0 ? `${Math.round(((totalFoncts - nonTestees) / totalFoncts) * 100)}%` : '—', totalFoncts > 0 ? (nonTestees === 0 ? 'totale' : nonTestees > totalFoncts / 2 ? 'insuffisante' : 'partielle') : '—'],
    ['Résolution anomalies', totalAnomalies > 0 ? `${tauxResolution}%` : '—', tauxResolution >= 80 ? 'excellent' : tauxResolution >= 50 ? 'moyen' : 'insuffisant'],
  ];

  for (const ligne of lignesKpi) {
    sections.push(`  ${ligne[0].padEnd(45)} ${ligne[1].toString().padEnd(8)} ${ligne[2]}`);
  }
  sections.push('');

  // 3. Analyse détaillée des anomalies
  if (totalAnomalies > 0) {
    sections.push('╔═══════════════════════════════════════════════════════════════╗');
    sections.push('║              3. ANALYSE DÉTAILLÉE DES ANOMALIES             ║');
    sections.push('╚═══════════════════════════════════════════════════════════════╝');
    sections.push('');

    const parPriorite = { critique: 0, haute: 0, moyenne: 0, basse: 0 };
    const parStatut = { nouvelle: 0, en_cours: 0, resolution_signalee: 0, validee: 0, cloturee: 0 };
    for (const a of anomalies) {
      if (parPriorite[a.priorite] !== undefined) parPriorite[a.priorite]++;
      if (parStatut[a.statut] !== undefined) parStatut[a.statut]++;
    }

    sections.push('  Répartition par priorité :');
    sections.push(`    Critique : ${parPriorite.critique}`);
    sections.push(`    Haute     : ${parPriorite.haute}`);
    sections.push(`    Moyenne   : ${parPriorite.moyenne}`);
    sections.push(`    Basse     : ${parPriorite.basse}`);
    sections.push('');

    sections.push('  Répartition par statut :');
    sections.push(`    Nouvelles          : ${parStatut.nouvelle}`);
    sections.push(`    En cours           : ${parStatut.en_cours}`);
    sections.push(`    Résolution signalée: ${parStatut.resolution_signalee}`);
    sections.push(`    Validées           : ${parStatut.validee}`);
    sections.push(`    Clôturées          : ${parStatut.cloturee}`);
    sections.push('');

    const critiquesOuvertes = anomalies.filter(a => a.priorite === 'critique' && a.statut !== 'cloturee' && a.statut !== 'validee').length;
    if (critiquesOuvertes > 0) {
      sections.push(`  ⚠ ALERTE QUALITÉ : ${critiquesOuvertes} anomalie${critiquesOuvertes > 1 ? 's' : ''} critique${critiquesOuvertes > 1 ? 's' : ''} non résolue${critiquesOuvertes > 1 ? 's' : ''}.`);
      sections.push('  Ces anomalies doivent être traitées en priorité absolue.');
      sections.push('');
    }
  }

  // 4. Recommandations
  sections.push('╔═══════════════════════════════════════════════════════════════╗');
  sections.push('║                  4. RECOMMANDATIONS STRATÉGIQUES            ║');
  sections.push('╚═══════════════════════════════════════════════════════════════╝');
  sections.push('');

  const recommandations: string[] = [];

  if (nonTestees > 0) {
    recommandations.push(`  → Planifier les tests des ${nonTestees} fonctionnalité${nonTestees > 1 ? 's' : ''} non testée${nonTestees > 1 ? 's' : ''} pour atteindre une couverture complète.`);
  }
  if (critiquesOuvertes > 0) {
    recommandations.push(`  → Mettre en place un plan d'action immédiat pour les ${critiquesOuvertes} anomalies critiques non résolues.`);
  }
  if (totalAnomalies > 0 && tauxResolution < 70) {
    recommandations.push('  → Renforcer le processus de résolution pour améliorer le taux de traitement des anomalies.');
  }
  if (avecAnomalies > conformes && avecAnomalies > 0) {
    recommandations.push('  → Réviser les procédures de validation ; plus de la moitié des fonctionnalités testées présentent des anomalies.');
  }
  if (avancement < 100) {
    recommandations.push('  → Accélérer la cadence des tests pour finaliser la couverture avant la date de fin de campagne.');
  }
  if (totalAnomalies > 0) {
    recommandations.push('  → Documenter systématiquement les résolutions pour enrichir la base de connaissance et accélérer les diagnostics futurs.');
  }

  if (recommandations.length === 0) {
    sections.push('  Aucune recommandation spécifique. La campagne se déroule conformément');
    sections.push('  aux objectifs de qualité définis.');
  } else {
    for (const rec of recommandations) {
      sections.push(rec);
    }
  }
  sections.push('');
  sections.push('── Fin du rapport généré par l\'assistant IA ──');

  return sections.join('\n');
}

export async function envoyerMessageIA(
  message: string,
  campaignId?: string
): Promise<{ reply: string; source: 'ollama' | 'fallback' | 'offline' }> {
  const response = await api.post('/chat', {
    message,
    campaignId: campaignId ? Number(campaignId) : undefined,
  });
  return response.data;
}
