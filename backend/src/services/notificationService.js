import * as db from '../db/index.js';

export async function getUserNotifications(userId) {
  const result = await db.notifications.findByUser(userId);
  return result.map((n) => ({
    ...n,
    anomaly_description: n.description || n.anomaly_description,
    link_url: n.link_url || (n.anomaly_id ? `/anomalies/${n.anomaly_id}` : undefined),
  }));
}

export async function markAsRead(notificationId, userId) {
  if (!Number.isInteger(notificationId) || !Number.isInteger(userId)) return;
  await db.notifications.markAsRead(notificationId, userId);
}

export async function markAllAsRead(userId) {
  if (!Number.isInteger(userId)) return;
  await db.notifications.markAllAsRead(userId);
}

export async function createNotification(data) {
  const notification = await db.notifications.create({
    ...data,
    description: data.description || null,
  });

  notification.link_url = notification.link_url || (notification.anomaly_id ? `/anomalies/${notification.anomaly_id}` : undefined);

  if (notification.anomaly_id) {
    notification.anomaly_description = data.anomaly_description || null;
  }

  return notification;
}
