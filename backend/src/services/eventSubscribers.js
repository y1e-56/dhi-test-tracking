import bus from '../lib/eventBus.js';
import * as notificationService from './notificationService.js';
import { sendEmail, canSendLoginEmail } from './emailService.js';
import {
  taskAssignedEmail,
  anomalyAssignedEmail,
  resolutionSignaledEmail,
  anomalyRejectedEmail,
  featureConformeEmail,
  projectCreatedEmail,
  campaignCreatedEmail,
  loginNotificationEmail,
  userCreatedEmail,
} from './emailTemplates.js';
import * as db from '../db/index.js';
import { emitNotification, emitDataChanged, emitCampaignCreated, emitCampaignUpdated, emitCampaignDeleted } from '../socket.js';

export function setupEventSubscribers(io) {
  // ── Notifications ────────────────────────────────────────

  // ── Socket émissions (adaptateur interne) ──────────────

  bus.on('feature:conforme', async ({ feature, campaign_name, test_lead_id }) => {
    try {
      const notification = await notificationService.createNotification({
        notified_user_id: test_lead_id,
        anomaly_id: null,
        notification_type: 'feature_conforme',
        description: `[${campaign_name}] La fonctionnalité "${feature.name}" a été marquée comme conforme`,
        link_url: `/campagnes/${feature.campaign_id}`,
      });
      if (io) emitNotification(io, test_lead_id, notification);
    } catch (e) {
      console.error('[events] Erreur notification feature:conforme', e);
    }

    try {
      const lead = await db.users.findById(test_lead_id);
      if (lead?.email) {
        await sendEmail({
          to: lead.email,
          subject: `Fonctionnalité conforme — ${feature.name}`,
          html: featureConformeEmail({
            userFirstName: lead.first_name,
            featureName: feature.name,
            campaignName: campaign_name || '',
            linkUrl: `${process.env.APP_URL || 'http://localhost:5173'}/campagnes/${feature.campaign_id}`,
          }),
        });
      }
    } catch (e) {
      console.error('[email] Erreur envoi feature:conforme', e);
    }
  });

  bus.on('anomaly:created', async ({ anomaly, assigned_to }) => {
    if (!assigned_to) return;
    try {
      const notification = await notificationService.createNotification({
        notified_user_id: assigned_to,
        anomaly_id: anomaly.id,
        notification_type: 'anomaly_reported',
        anomaly_description: anomaly.description,
      });
      if (io) emitNotification(io, assigned_to, notification);
    } catch (e) {
      console.error('[events] Erreur notification anomaly:created', e);
    }

    try {
      const dev = await db.users.findById(assigned_to);
      if (dev?.email) {
        let featureName = `#${anomaly.feature_id}`;
        try {
          const feat = await db.features.findById(anomaly.feature_id);
          if (feat) featureName = feat.name;
        } catch {}
        await sendEmail({
          to: dev.email,
          subject: `Anomalie assignée — ${anomaly.description?.slice(0, 60)}`,
          html: anomalyAssignedEmail({
            userFirstName: dev.first_name,
            anomalyDescription: anomaly.description || '',
            featureName,
            linkUrl: `${process.env.APP_URL || 'http://localhost:5173'}/developpeur/anomalies`,
          }),
        });
      }
    } catch (e) {
      console.error('[email] Erreur envoi anomaly:created', e);
    }
  });

  bus.on('anomaly:resolution_signaled', async ({ anomaly, reported_by }) => {
    if (!reported_by) return;
    try {
      const notification = await notificationService.createNotification({
        notified_user_id: reported_by,
        anomaly_id: anomaly.id,
        notification_type: 'resolution_signaled',
        anomaly_description: anomaly.description,
      });
      if (io) emitNotification(io, reported_by, notification);
    } catch (e) {
      console.error('[events] Erreur notification anomaly:resolution_signaled', e);
    }

    try {
      const tester = await db.users.findById(reported_by);
      if (tester?.email) {
        const dev = anomaly.assigned_to ? await db.users.findById(anomaly.assigned_to).catch(() => null) : null;
        await sendEmail({
          to: tester.email,
          subject: `Résolution signalée — anomalie #${anomaly.id}`,
          html: resolutionSignaledEmail({
            userFirstName: tester.first_name,
            anomalyDescription: anomaly.description || '',
            devName: dev ? `${dev.first_name} ${dev.last_name}` : 'Le développeur',
            linkUrl: `${process.env.APP_URL || 'http://localhost:5173'}/anomalies/${anomaly.id}`,
          }),
        });
      }
    } catch (e) {
      console.error('[email] Erreur envoi anomaly:resolution_signaled', e);
    }
  });

  bus.on('anomaly:rejected', async ({ anomaly, reported_by }) => {
    if (!reported_by) return;
    try {
      const notification = await notificationService.createNotification({
        notified_user_id: reported_by,
        anomaly_id: anomaly.id,
        notification_type: 'reopened',
        anomaly_description: anomaly.description,
      });
      if (io) emitNotification(io, reported_by, notification);
    } catch (e) {
      console.error('[events] Erreur notification anomaly:rejected', e);
    }

    try {
      const tester = await db.users.findById(reported_by);
      if (tester?.email && anomaly.assigned_to) {
        const dev = await db.users.findById(anomaly.assigned_to).catch(() => null);
        await sendEmail({
          to: tester.email,
          subject: `Résolution rejetée — anomalie #${anomaly.id}`,
          html: anomalyRejectedEmail({
            userFirstName: dev ? dev.first_name : 'Développeur',
            anomalyDescription: anomaly.description || '',
            testerName: `${tester.first_name} ${tester.last_name}`,
            linkUrl: `${process.env.APP_URL || 'http://localhost:5173'}/anomalies/${anomaly.id}`,
          }),
        });
      }
    } catch (e) {
      console.error('[email] Erreur envoi anomaly:rejected', e);
    }
  });

  bus.on('assignment:created', async ({ assigned_to, feature_name, feature_id, campaign_name }) => {
    try {
      const notification = await notificationService.createNotification({
        notified_user_id: assigned_to,
        anomaly_id: null,
        notification_type: 'task_assigned',
        description: `La fonctionnalité "${feature_name}" vous a été assignée`,
        link_url: '/testeur/taches',
      });
      if (io) emitNotification(io, assigned_to, notification);
    } catch (e) {
      console.error('[events] Erreur notification assignment:created', e);
    }

    try {
      const tester = await db.users.findById(assigned_to);
      if (tester?.email) {
        await sendEmail({
          to: tester.email,
          subject: `Nouvelle tâche — ${feature_name}`,
          html: taskAssignedEmail({
            userFirstName: tester.first_name,
            featureName: feature_name || '',
            campaignName: campaign_name || '',
            linkUrl: `${process.env.APP_URL || 'http://localhost:5173'}/testeur/taches`,
          }),
        });
      }
    } catch (e) {
      console.error('[email] Erreur envoi assignment:created', e);
    }
  });

  bus.on('assignment:reassigned', async ({ assigned_to, feature_name, feature_id, campaign_name }) => {
    try {
      const notification = await notificationService.createNotification({
        notified_user_id: assigned_to,
        anomaly_id: null,
        notification_type: 'task_assigned',
        description: `La fonctionnalité "${feature_name}" vous a été réassignée`,
        link_url: '/testeur/taches',
      });
      if (io) emitNotification(io, assigned_to, notification);
    } catch (e) {
      console.error('[events] Erreur notification assignment:reassigned', e);
    }

    try {
      const tester = await db.users.findById(assigned_to);
      if (tester?.email) {
        await sendEmail({
          to: tester.email,
          subject: `Tâche réassignée — ${feature_name}`,
          html: taskAssignedEmail({
            userFirstName: tester.first_name,
            featureName: feature_name || '',
            campaignName: campaign_name || '',
            linkUrl: `${process.env.APP_URL || 'http://localhost:5173'}/testeur/taches`,
          }),
        });
      }
    } catch (e) {
      console.error('[email] Erreur envoi assignment:reassigned', e);
    }
  });

  // ── Socket data-changed ─────────────────────────────────

  bus.on('campaign:created', async ({ campaign, project_name }) => {
    if (io) { emitCampaignCreated(io, campaign); emitDataChanged(io, 'campaigns'); }

    try {
      const projectName = project_name || `#${campaign.project_id}`;
      const allMemberIds = [...(campaign.testers || []), ...(campaign.developers || [])];
      const uniqueIds = [...new Set(allMemberIds)];

      for (const userId of uniqueIds) {
        const user = await db.users.findById(userId).catch(() => null);
        if (!user?.email) continue;

        const isTester = (campaign.testers || []).includes(userId);
        const roleLabel = isTester ? 'testeur' : 'développeur';

        await sendEmail({
          to: user.email,
          subject: `Nouvelle campagne — ${campaign.name}`,
          html: campaignCreatedEmail({
            userFirstName: user.first_name,
            campaignName: campaign.name,
            projectName,
            campaignLink: `${process.env.APP_URL || 'http://localhost:5173'}/campagnes/${campaign.id}`,
            roleLabel,
          }),
        }).catch(e => console.error('[email] Erreur envoi campaign:created à', user.email, e.message));
      }
    } catch (e) {
      console.error('[email] Erreur campaign:created', e);
    }
  });

  bus.on('campaign:updated', async ({ campaign }) => {
    if (io) { emitCampaignUpdated(io, campaign); emitDataChanged(io, 'campaigns'); }
  });

  bus.on('campaign:deleted', async ({ campaign_id }) => {
    if (io) { emitCampaignDeleted(io, campaign_id); emitDataChanged(io, 'campaigns'); emitDataChanged(io, 'features'); }
  });

  bus.on('project:created', async ({ project }) => {
    if (io) emitDataChanged(io, 'projects');

    try {
      const leadIds = project.test_lead_ids || [];
      for (const id of leadIds) {
        const lead = await db.users.findById(id).catch(() => null);
        if (!lead?.email) continue;
        await sendEmail({
          to: lead.email,
          subject: `Nouveau projet — ${project.name}`,
          html: projectCreatedEmail({
            userFirstName: lead.first_name,
            projectName: project.name,
            linkUrl: `${process.env.APP_URL || 'http://localhost:5173'}/projets`,
          }),
        }).catch(e => console.error('[email] Erreur envoi project:created à', lead.email, e.message));
      }
    } catch (e) {
      console.error('[email] Erreur project:created', e);
    }
  });
  bus.on('project:updated', async () => { if (io) emitDataChanged(io, 'projects'); });
  bus.on('project:archived', async () => { if (io) { emitDataChanged(io, 'projects'); emitDataChanged(io, 'campaigns'); } });
  bus.on('project:deleted', async () => { if (io) emitDataChanged(io, 'projects'); });

  bus.on('feature:created', async () => { if (io) emitDataChanged(io, 'features'); });
  bus.on('feature:updated', async () => { if (io) emitDataChanged(io, 'features'); });
  bus.on('feature:deleted', async () => { if (io) emitDataChanged(io, 'features'); });
  bus.on('feature:conforme', async () => { if (io) emitDataChanged(io, 'features'); });
  bus.on('feature:status_changed', async () => { if (io) emitDataChanged(io, 'features'); });

  bus.on('anomaly:created', async () => { if (io) emitDataChanged(io, 'anomalies'); });
  bus.on('anomaly:updated', async () => { if (io) emitDataChanged(io, 'anomalies'); });
  bus.on('anomaly:deleted', async () => { if (io) emitDataChanged(io, 'anomalies'); });
  bus.on('anomaly:status_changed', async () => { if (io) emitDataChanged(io, 'anomalies'); });

  bus.on('assignment:created', async () => { if (io) emitDataChanged(io, 'features'); });
  bus.on('assignment:reassigned', async () => { if (io) emitDataChanged(io, 'features'); });
  bus.on('assignment:deleted', async () => { if (io) emitDataChanged(io, 'features'); });

  bus.on('campaignMember:added', async () => { if (io) emitDataChanged(io, 'campaigns'); });
  bus.on('campaignMember:removed', async () => { if (io) emitDataChanged(io, 'campaigns'); });

  bus.on('testCase:created', async () => { if (io) emitDataChanged(io, 'features'); });
  bus.on('testCase:deleted', async () => { if (io) emitDataChanged(io, 'features'); });

  // ── Data changed générique (routes) ──────────────────────

  bus.on('data:changed', async ({ entity }) => {
    if (io) emitDataChanged(io, entity);
  });

  // ── History audit ────────────────────────────────────────

  bus.on('campaign:created', async ({ campaign, user_id }) => {
    try {
      await db.history.addAction({
        entity_type: 'campaign',
        entity_id: campaign.id,
        user_id,
        action_type: 'created',
        description: `Campagne "${campaign.name}" créée`,
      });
    } catch (e) {
      console.error('[events] Erreur history campaign:created', e);
    }
  });

  bus.on('campaign:updated', async ({ campaign_id, user_id }) => {
    try {
      await db.history.addAction({
        entity_type: 'campaign',
        entity_id: campaign_id,
        user_id,
        action_type: 'updated',
        description: 'Campagne mise à jour',
      });
    } catch (e) {
      console.error('[events] Erreur history campaign:updated', e);
    }
  });

  bus.on('campaign:deleted', async ({ campaign_id, user_id }) => {
    try {
      await db.history.addAction({
        entity_type: 'campaign',
        entity_id: campaign_id,
        user_id,
        action_type: 'deleted',
        description: 'Campagne supprimée',
      });
    } catch (e) {
      console.error('[events] Erreur history campaign:deleted', e);
    }
  });

  bus.on('project:created', async ({ project, user_id }) => {
    try {
      await db.history.addAction({
        entity_type: 'project',
        entity_id: project.id,
        user_id,
        action_type: 'created',
        description: `Projet "${project.name}" créé`,
      });
    } catch (e) {
      console.error('[events] Erreur history project:created', e);
    }
  });

  bus.on('project:updated', async ({ project_id, user_id }) => {
    try {
      await db.history.addAction({
        entity_type: 'project',
        entity_id: project_id,
        user_id,
        action_type: 'updated',
        description: 'Projet mis à jour',
      });
    } catch (e) {
      console.error('[events] Erreur history project:updated', e);
    }
  });

  bus.on('project:deleted', async ({ project_id, user_id }) => {
    try {
      await db.history.addAction({
        entity_type: 'project',
        entity_id: project_id,
        user_id,
        action_type: 'deleted',
        description: 'Projet supprimé',
      });
    } catch (e) {
      console.error('[events] Erreur history project:deleted', e);
    }
  });

  bus.on('project:archived', async ({ project, project_id, user_id }) => {
    try {
      await db.history.addAction({
        entity_type: 'project',
        entity_id: project_id,
        user_id,
        action_type: 'archived',
        description: `Projet "${project.name || ''}" archivé — campagnes liées archivées`,
      });
    } catch (e) {
      console.error('[events] Erreur history project:archived', e);
    }
  });

  bus.on('anomaly:created', async ({ anomaly, user_id }) => {
    try {
      await db.history.addAction({
        entity_type: 'anomaly',
        entity_id: anomaly.id,
        user_id,
        action_type: 'created',
        description: `Anomalie signalée : ${anomaly.description?.slice(0, 100)}`,
      });
    } catch (e) {
      console.error('[events] Erreur history anomaly:created', e);
    }
  });

  bus.on('anomaly:status_changed', async ({ anomaly, user_id, new_status }) => {
    try {
      await db.history.addAction({
        entity_type: 'anomaly',
        entity_id: anomaly.id,
        user_id,
        action_type: 'status_changed',
        description: `Anomalie passée en "${new_status}"`,
      });
    } catch (e) {
      console.error('[events] Erreur history anomaly:status_changed', e);
    }
  });

  bus.on('feature:status_changed', async ({ feature, user_id, new_status }) => {
    try {
      await db.history.addAction({
        entity_type: 'feature',
        entity_id: feature.id,
        user_id,
        action_type: 'status_changed',
        description: `Fonctionnalité "${feature.name}" passée en "${new_status}"`,
      });
    } catch (e) {
      console.error('[events] Erreur history feature:status_changed', e);
    }
  });

  bus.on('campaignMember:added', async ({ campaign_id, user_id, team_type }) => {
    try {
      await db.history.addAction({
        entity_type: 'campaign',
        entity_id: campaign_id,
        user_id,
        action_type: 'member_added',
        description: `Membre ${team_type} ajouté à la campagne`,
      });
    } catch (e) {
      console.error('[events] Erreur history campaignMember:added', e);
    }
  });

  bus.on('campaignMember:removed', async ({ campaign_id, user_id }) => {
    try {
      await db.history.addAction({
        entity_type: 'campaign',
        entity_id: campaign_id,
        user_id,
        action_type: 'member_removed',
        description: 'Membre retiré de la campagne',
      });
    } catch (e) {
      console.error('[events] Erreur history campaignMember:removed', e);
    }
  });

  bus.on('testCase:created', async ({ testCase, feature_id }) => {
    try {
      await db.history.addAction({
        entity_type: 'feature',
        entity_id: feature_id,
        user_id: null,
        action_type: 'test_case_created',
        description: 'Cas de test ajouté',
      });
    } catch (e) {
      console.error('[events] Erreur history testCase:created', e);
    }
  });

  bus.on('testCase:deleted', async ({ test_case_id }) => {
    try {
      await db.history.addAction({
        entity_type: 'feature',
        entity_id: null,
        user_id: null,
        action_type: 'test_case_deleted',
        description: 'Cas de test supprimé',
      });
    } catch (e) {
      console.error('[events] Erreur history testCase:deleted', e);
    }
  });

  // ── Email création de compte ────────────────────────────

  bus.on('user:created', async ({ user, password }) => {
    if (!user?.email) return;
    try {
      await sendEmail({
        to: user.email,
        subject: 'Votre compte DHI Test Tracking',
        html: userCreatedEmail({
          userFirstName: user.first_name,
          email: user.email,
          password,
          linkUrl: process.env.APP_URL || 'http://localhost:5173',
        }),
      });
    } catch (e) {
      console.error('[email] Erreur envoi user:created', e);
    }
  });

  // ── Email notification de connexion ─────────────────────

  bus.on('user:logged_in', async ({ user, ip }) => {
    if (!user?.email) return;
    if (!canSendLoginEmail(user.id)) return;

    try {
      const now = new Date();
      await sendEmail({
        to: user.email,
        subject: 'Connexion à votre compte DHI Test Tracking',
        html: loginNotificationEmail({
          userFirstName: user.first_name,
          date: now.toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
          time: now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
          ip: ip || 'Inconnue',
        }),
      });
    } catch (e) {
      console.error('[email] Erreur envoi user:logged_in', e);
    }
  });
}
