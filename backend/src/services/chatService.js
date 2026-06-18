import pool from '../config/database.js';

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'qwen2.5:7b';

async function getContextData(campaignId) {
  const c = pool;

  const [campaignsRes, currentCampaignRes, anomaliesRes, recentActivityRes, featuresRes] = await Promise.all([
    c.query('SELECT id, nom, statut, created_at FROM campaigns ORDER BY created_at DESC LIMIT 10'),
    campaignId ? c.query('SELECT id, nom, statut FROM campaigns WHERE id = $1', [campaignId]) : Promise.resolve({ rows: [] }),
    c.query('SELECT status, COUNT(*)::int as count FROM anomalies GROUP BY status'),
    c.query(`SELECT h.action_type, h.description, h.created_at, u.first_name, u.last_name
      FROM history_actions h LEFT JOIN users u ON u.id = h.user_id
      ORDER BY h.created_at DESC LIMIT 10`),
    c.query('SELECT statut, COUNT(*)::int as count FROM features GROUP BY statut'),
  ]);

  const totalCampaigns = await c.query('SELECT COUNT(*)::int as count FROM campaigns');
  const totalAnomalies = await c.query('SELECT COUNT(*)::int as count FROM anomalies');
  const totalFeatures = await c.query('SELECT COUNT(*)::int as count FROM features');

  const currentCampaign = currentCampaignRes.rows[0] || null;

  return {
    campaigns: campaignsRes.rows,
    currentCampaign: currentCampaign ? { id: currentCampaign.id, nom: currentCampaign.nom, statut: currentCampaign.statut } : null,
    anomaliesByStatus: anomaliesRes.rows,
    featuresByStatus: featuresRes.rows,
    recentActivity: recentActivityRes.rows.slice(0, 5),
    totals: {
      campaigns: totalCampaigns.rows[0].count,
      anomalies: totalAnomalies.rows[0].count,
      features: totalFeatures.rows[0].count,
    },
  };
}

function buildSystemPrompt(context, user) {
  const statusLabels = {
    en_preparation: 'En préparation',
    en_cours: 'En cours',
    terminee: 'Terminée',
    archive: 'Archivée',
    non_testee: 'Non testée',
    conforme: 'Conforme',
    anomalie: 'Anomalie',
    a_verifier: 'À vérifier',
    ouverte: 'Ouverte',
    en_cours_resolution: 'En cours de résolution',
    resolution_signalee: 'Résolution signalée',
    resolue: 'Résolue',
    rejetee: 'Rejetée',
  };

  const anomaliesParStatut = context.anomaliesByStatus
    .map(a => `  - ${statusLabels[a.status] || a.status} : ${a.count}`)
    .join('\n');

  const featuresParStatut = context.featuresByStatus
    .map(f => `  - ${statusLabels[f.statut] || f.statut} : ${f.count}`)
    .join('\n');

  const campagnesRecentes = context.campaigns
    .map(c => `  - ${c.nom} (${statusLabels[c.statut] || c.statut})`)
    .join('\n');

  const activiteRecente = context.recentActivity
    .map(a => `  - ${a.first_name || '?'} ${a.last_name || '?'} : ${a.description || a.action_type} (${new Date(a.created_at).toLocaleDateString('fr-FR')})`)
    .join('\n');

  const contexteCampagne = context.currentCampaign
    ? `\nL'utilisateur consulte actuellement la campagne "${context.currentCampaign.nom}" (${statusLabels[context.currentCampaign.statut]}).`
    : '';

  return `Tu es l'assistant IA de DHI (Digital Hub for Testing), une application de gestion de tests logiciels. Tu aides les chefs testeur et testeurs à analyser leurs campagnes, anomalies, et fonctionnalités.

RÈGLES STRICTES :
- Réponds TOUJOURS en français, de façon naturelle et amicale, comme un collègue expérimenté.
- Utilise les données réelles ci-dessous pour répondre. Si l'utilisateur pose une question hors-sujet (non liée aux tests, campagnes, anomalies), réponds poliment que tu es spécialisé dans le suivi de tests DHI.
- Ne donne jamais d'information que tu ne connais pas à partir des données fournies.
- Sois précis et concis (2-3 phrases max pour une question simple).
- Si on te demande une suggestion (priorité, développeur), base-toi sur les données disponibles.

VOICI LES DONNÉES ACTUELLES DU PROJET :

Vue d'ensemble :
- ${context.totals.campaigns} campagne(s)
- ${context.totals.features} fonctionnalité(s)
- ${context.totals.anomalies} anomalie(s)

Anomalies par statut :
${anomaliesParStatut || '(aucune donnée)'}

Fonctionnalités par statut :
${featuresParStatut || '(aucune donnée)'}

Campagnes récentes :
${campagnesRecentes || '(aucune campagne)'}

Activité récente :
${activiteRecente || '(aucune activité)'}
${contexteCampagne}

Utilisateur connecté : ${user.prenom} ${user.nom} (${user.role})`;
}

async function chatWithOllama(messages, signal) {
  const url = `${OLLAMA_URL}/api/chat`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        messages,
        stream: false,
        options: { temperature: 0.3 },
      }),
      signal,
    });

    if (!response.ok) {
      throw new Error(`Ollama HTTP ${response.status}`);
    }

    const data = await response.json();
    return data.message?.content || '';
  } catch (err) {
    if (err.name === 'AbortError') throw err;
    console.error('Ollama error:', err.message);
    return null;
  }
}

function buildFallbackReply(message, context, user) {
  const msg = message.toLowerCase();

  if (msg.includes('bonjour') || msg.includes('salut') || msg.includes('hello')) {
    return `Bonjour ${user.prenom} ! Je suis votre assistant DHI. Actuellement, le projet compte ${context.totals.campaigns} campagne(s), ${context.totals.features} fonctionnalité(s) et ${context.totals.anomalies} anomalie(s). Comment puis-je vous aider ?`;
  }

  if (msg.includes('combien') && (msg.includes('campagne') || msg.includes('projet'))) {
    return `Il y a actuellement **${context.totals.campaigns} campagne(s)** dans le système.`;
  }

  if (msg.includes('anomalie') || msg.includes('bug')) {
    const anomaliesStr = context.anomaliesByStatus
      .map(a => `${a.count} ${a.status}`)
      .join(', ');
    return `Il y a **${context.totals.anomalies} anomalie(s)** au total. Répartition : ${anomaliesStr || 'aucune donnée disponible'}.`;
  }

  if (msg.includes('merci')) {
    return 'De rien ! N\'hésitez pas si vous avez d\'autres questions.';
  }

  if (msg.includes('qui') && (msg.includes('tu') || msg.includes('es'))) {
    return `Je suis l'assistant IA de **DHI** 🧪, votre outil de suivi de tests logiciels. Je peux vous renseigner sur les campagnes, anomalies, fonctionnalités et vous aider dans votre analyse.`;
  }

  if (context.currentCampaign) {
    return `Vous êtes sur la campagne **${context.currentCampaign.nom}**. Je peux vous donner des infos sur ses anomalies, ses fonctionnalités, ou vous aider à analyser son état. Que voulez-vous savoir ?`;
  }

  return null;
}

export async function processMessage({ message, userId, campaignId }) {
  if (!message || !message.trim()) {
    return { reply: 'Veuillez écrire un message.' };
  }

  const userResult = await pool.query(
    'SELECT id, first_name, last_name, role, email FROM users WHERE id = $1',
    [userId]
  );
  const user = userResult.rows[0] || { id: null, first_name: 'Utilisateur', last_name: '', role: 'inconnu' };
  const userInfo = { prenom: user.first_name, nom: user.last_name, role: user.role };

  const context = await getContextData(campaignId);

  const systemPrompt = buildSystemPrompt(context, userInfo);

  const ollamaMessages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: message },
  ];

  const ollamaReply = await chatWithOllama(ollamaMessages);

  if (ollamaReply !== null) {
    return { reply: ollamaReply, source: 'ollama' };
  }

  const fallbackReply = buildFallbackReply(message, context, userInfo);
  if (fallbackReply) {
    return { reply: fallbackReply, source: 'fallback' };
  }

  return {
    reply: `Désolé ${userInfo.prenom}, l'assistant IA n'est pas disponible actuellement. Vérifiez qu'Ollama est bien lancé (\`ollama run ${OLLAMA_MODEL}\`).`,
    source: 'offline',
  };
}
