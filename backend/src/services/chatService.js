import pool from '../config/database.js';

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'qwen2.5:7b';

async function getContextData(campaignId, userId, role) {
  const c = pool;

  const [campaignsRes, currentCampaignRes, anomaliesRes, recentActivityRes, featuresRes, projectsRes] = await Promise.all([
    c.query('SELECT id, name, status, created_at FROM campaigns ORDER BY created_at DESC LIMIT 10'),
    campaignId ? c.query('SELECT id, name, status FROM campaigns WHERE id = $1', [campaignId]) : Promise.resolve({ rows: [] }),
    c.query('SELECT status, COUNT(*)::int as count FROM anomalies GROUP BY status'),
    c.query(`SELECT h.action_type, h.description, h.created_at, u.first_name, u.last_name
      FROM history_actions h LEFT JOIN users u ON u.id = h.user_id
      ORDER BY h.created_at DESC LIMIT 10`),
    c.query('SELECT status, COUNT(*)::int as count FROM features GROUP BY status'),
    c.query('SELECT id, name, is_archived FROM projects ORDER BY created_at DESC LIMIT 10'),
  ]);

  const totalCampaigns = await c.query('SELECT COUNT(*)::int as count FROM campaigns');
  const totalAnomalies = await c.query('SELECT COUNT(*)::int as count FROM anomalies');
  const totalFeatures = await c.query('SELECT COUNT(*)::int as count FROM features');

  const currentCampaign = currentCampaignRes.rows[0] || null;

  let myFeatures = [];
  let myAnomaliesReported = [];
  let myAnomaliesAssigned = [];
  let myCampaigns = [];

  if (role === 'tester' && userId) {
    const [featuresRows, anomaliesRows] = await Promise.all([
      c.query(`SELECT f.name, f.status, camp.name as campaign_name
        FROM assignments a
        JOIN features f ON f.id = a.feature_id
        JOIN campaigns camp ON camp.id = f.campaign_id
        WHERE a.assigned_to = $1
        ORDER BY a.assigned_at DESC LIMIT 10`, [userId]),
      c.query(`SELECT a.description, a.status, camp.name as campaign_name
        FROM anomalies a
        JOIN campaigns camp ON camp.id = a.campaign_id
        WHERE a.reported_by = $1
        ORDER BY a.created_at DESC LIMIT 10`, [userId]),
    ]);
    myFeatures = featuresRows.rows;
    myAnomaliesReported = anomaliesRows.rows;
  }

  if (role === 'developer' && userId) {
    const anomaliesRows = await c.query(`SELECT a.description, a.status, camp.name as campaign_name
      FROM anomalies a
      JOIN campaigns camp ON camp.id = a.campaign_id
      WHERE a.assigned_to = $1
      ORDER BY a.created_at DESC LIMIT 10`, [userId]);
    myAnomaliesAssigned = anomaliesRows.rows;
  }

  if (role === 'chef_testeur' && userId) {
    const campaignsRows = await c.query(`SELECT camp.id, camp.name, camp.status
      FROM campaign_test_leads ctl
      JOIN campaigns camp ON camp.id = ctl.campaign_id
      WHERE ctl.user_id = $1
      ORDER BY camp.created_at DESC LIMIT 10`, [userId]);
    myCampaigns = campaignsRows.rows;
  }

  return {
    campaigns: campaignsRes.rows.map(c => ({ id: c.id, nom: c.name, statut: c.status, created_at: c.created_at })),
    currentCampaign: currentCampaign ? { id: currentCampaign.id, nom: currentCampaign.name, statut: currentCampaign.status } : null,
    projects: projectsRes.rows.map(p => ({ id: p.id, nom: p.name, archive: p.is_archived })),
    anomaliesByStatus: anomaliesRes.rows,
    featuresByStatus: featuresRes.rows,
    recentActivity: recentActivityRes.rows.slice(0, 5),
    myFeatures,
    myAnomaliesReported,
    myAnomaliesAssigned,
    myCampaigns,
    totals: {
      campaigns: totalCampaigns.rows[0].count,
      anomalies: totalAnomalies.rows[0].count,
      features: totalFeatures.rows[0].count,
    },
  };
}

const STATUS_LABELS = {
  // campaigns
  planning: 'En préparation',
  completed: 'Terminée',
  archived: 'Archivée',
  // features
  pending: 'Non testée',
  conforme: 'Conforme',
  anomaly_detected: 'Anomalie détectée',
  // anomalies
  new: 'Nouvelle',
  resolution_signaled: 'Résolution signalée',
  validated: 'Validée',
  rejected: 'Rejetée',
  // shared
  in_progress: 'En cours',
};

const ROLE_LABELS = {
  admin: 'administrateur',
  chef_testeur: 'chef testeur',
  tester: 'testeur',
  developer: 'développeur',
};

function label(s) {
  return STATUS_LABELS[s] || s;
}

function buildSystemPrompt(context, user) {
  const anomaliesParStatut = context.anomaliesByStatus
    .map(a => `  - ${label(a.status)} : ${a.count}`)
    .join('\n');

  const featuresParStatut = context.featuresByStatus
    .map(f => `  - ${label(f.status)} : ${f.count}`)
    .join('\n');

  const campagnesRecentes = context.campaigns
    .map(c => `  - ${c.nom} (${label(c.statut)})`)
    .join('\n');

  const projetsRecents = context.projects
    .map(p => `  - ${p.nom} (${p.archive ? 'Archivé' : 'Actif'})`)
    .join('\n');

  const activiteRecente = context.recentActivity
    .map(a => `  - ${a.first_name || '?'} ${a.last_name || '?'} : ${a.description || a.action_type} (${new Date(a.created_at).toLocaleDateString('fr-FR')})`)
    .join('\n');

  const contexteCampagne = context.currentCampaign
    ? `\nL'utilisateur consulte actuellement la campagne "${context.currentCampaign.nom}" (${label(context.currentCampaign.statut)}).`
    : '';

  let sectionPersonnelle = '';
  if (user.role === 'tester') {
    const mesTaches = context.myFeatures
      .map(f => `  - ${f.name} — campagne "${f.campaign_name}" (${label(f.status)})`)
      .join('\n');
    const mesAnomalies = context.myAnomaliesReported
      .map(a => `  - ${a.description} — campagne "${a.campaign_name}" (${label(a.status)})`)
      .join('\n');
    sectionPersonnelle = `\nMes tâches assignées :\n${mesTaches || '(aucune tâche assignée)'}\n\nMes anomalies signalées :\n${mesAnomalies || '(aucune anomalie signalée)'}`;
  } else if (user.role === 'developer') {
    const mesAnomalies = context.myAnomaliesAssigned
      .map(a => `  - ${a.description} — campagne "${a.campaign_name}" (${label(a.status)})`)
      .join('\n');
    sectionPersonnelle = `\nAnomalies qui me sont assignées :\n${mesAnomalies || '(aucune anomalie assignée)'}`;
  } else if (user.role === 'chef_testeur') {
    const mesCampagnes = context.myCampaigns
      .map(c => `  - ${c.name} (${label(c.status)})`)
      .join('\n');
    sectionPersonnelle = `\nCampagnes dont je suis chef testeur :\n${mesCampagnes || '(aucune campagne)'}`;
  }

  return `Tu es l'assistant IA de DHI (Digital Hub for Testing), une application de gestion de tests logiciels. Tu aides les administrateurs, chefs testeur, testeurs et développeurs à analyser leurs projets, campagnes, anomalies, et fonctionnalités.

RÈGLES STRICTES :
- Réponds TOUJOURS en français, de façon naturelle et amicale, comme un collègue expérimenté.
- Utilise les données réelles ci-dessous pour répondre. Si l'utilisateur pose une question hors-sujet (non liée aux tests, projets, campagnes, anomalies), réponds poliment que tu es spécialisé dans le suivi de tests DHI.
- Ne donne jamais d'information que tu ne connais pas à partir des données fournies.
- Tu peux uniquement donner des informations et des conseils. Tu ne peux modifier, créer ou supprimer aucune donnée de l'application.
- Sois précis et concis (2-3 phrases max pour une question simple).
- Si on te demande une suggestion (priorité, développeur), base-toi sur les données disponibles.

VOICI LES DONNÉES ACTUELLES DU PROJET :

Vue d'ensemble :
- ${context.totals.campaigns} campagne(s)
- ${context.totals.features} fonctionnalité(s)
- ${context.totals.anomalies} anomalie(s)

Projets récents :
${projetsRecents || '(aucun projet)'}

Anomalies par statut :
${anomaliesParStatut || '(aucune donnée)'}

Fonctionnalités par statut :
${featuresParStatut || '(aucune donnée)'}

Campagnes récentes :
${campagnesRecentes || '(aucune campagne)'}

Activité récente :
${activiteRecente || '(aucune activité)'}
${contexteCampagne}
${sectionPersonnelle}

Utilisateur connecté : ${user.prenom} ${user.nom} (${ROLE_LABELS[user.role] || user.role})`;
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
      .map(a => `${a.count} ${label(a.status)}`)
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

  const context = await getContextData(campaignId, user.id, user.role);

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
