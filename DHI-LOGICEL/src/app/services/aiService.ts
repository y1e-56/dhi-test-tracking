import api from './api';
import { Priorite, Anomalie, User } from '../types';

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

export function suggerePriorite(titre: string, description: string): Priorite {
  const texteComplet = `${titre} ${description}`.toLowerCase();

  let scores = { critique: 0, haute: 0, moyenne: 0, basse: 0 };

  for (const [priorite, keywords] of Object.entries(PRIORITE_KEYWORDS)) {
    for (const keyword of keywords) {
      if (texteComplet.includes(keyword.toLowerCase())) {
        scores[priorite as Priorite] += 1;
      }
    }
  }

  let prioriteSuggeree: Priorite = 'moyenne';
  let maxScore = 0;

  for (const [priorite, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      prioriteSuggeree = priorite as Priorite;
    }
  }

  return maxScore === 0 ? 'moyenne' : prioriteSuggeree;
}

function extraireMotsCles(texte: string): string[] {
  const texteNormalise = texte
    .toLowerCase()
    .replace(/[^\w\sàáâãäåæçèéêëìíîïðñòóôõöøùúûüýÿ]/g, ' ')
    .split(/\s+/)
    .filter(mot => mot.length > 3);

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

function calculerSimilarite(mots1: string[], mots2: string[]): number {
  if (mots1.length === 0 || mots2.length === 0) return 0;
  const intersection = mots1.filter(mot => mots2.includes(mot));
  const union = [...new Set([...mots1, ...mots2])];
  return intersection.length / union.length;
}

function getDeveloppeurPlusActif(anomaliesResolues: Anomalie[], developpeurs: User[]): string | null {
  const counts = new Map<string, number>();

  for (const anomalie of anomaliesResolues) {
    const devId = anomalie.developpeurId;
    if (devId) {
      counts.set(devId, (counts.get(devId) || 0) + 1);
    }
  }

  let maxCount = 0;
  let meilleurDevId: string | null = null;

  for (const [devId, count] of counts.entries()) {
    if (count > maxCount) {
      maxCount = count;
      meilleurDevId = devId;
    }
  }

  if (meilleurDevId && developpeurs.find(d => d.id === meilleurDevId)) {
    return meilleurDevId;
  }

  return developpeurs.length > 0 ? developpeurs[0].id : null;
}

export function suggereDeveloppeur(
  anomalie: { titre: string; description: string; module?: string },
  anomaliesExistantes: Anomalie[],
  developpeurs: User[]
): string | null {
  const anomaliesResolues = anomaliesExistantes.filter(
    a => a.statut === 'cloturee' || a.statut === 'validee'
  );

  if (anomaliesResolues.length === 0 || developpeurs.length === 0) {
    return null;
  }

  const motsClesNouvelle = extraireMotsCles(
    `${anomalie.titre} ${anomalie.description} ${anomalie.module || ''}`
  );

  if (motsClesNouvelle.length === 0) {
    return getDeveloppeurPlusActif(anomaliesResolues, developpeurs);
  }

  const scoresDeveloppeurs = new Map<string, number>();

  for (const developpeur of developpeurs) {
    scoresDeveloppeurs.set(developpeur.id, 0);
  }

  for (const anomalieResolue of anomaliesResolues) {
    const developpeurId = anomalieResolue.developpeurId;
    if (!developpeurId) continue;

    const motsClesResolue = extraireMotsCles(
      `${anomalieResolue.titre} ${anomalieResolue.description}`
    );

    const similarite = calculerSimilarite(motsClesNouvelle, motsClesResolue);

    if (similarite > 0) {
      const scoreActuel = scoresDeveloppeurs.get(developpeurId) || 0;
      scoresDeveloppeurs.set(developpeurId, scoreActuel + similarite);
    }
  }

  let meilleurDeveloppeurId: string | null = null;
  let maxScore = 0;

  for (const [devId, score] of scoresDeveloppeurs.entries()) {
    if (score > maxScore) {
      maxScore = score;
      meilleurDeveloppeurId = devId;
    }
  }

  if (maxScore === 0 || !meilleurDeveloppeurId) {
    return getDeveloppeurPlusActif(anomaliesResolues, developpeurs);
  }

  return meilleurDeveloppeurId;
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
