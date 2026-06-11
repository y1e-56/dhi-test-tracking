import pool from '../config/database.js';

export async function getMemberIds(campaignId, client = null) {
  const c = client || pool;
  const result = await c.query(
    'SELECT user_id, team_type FROM campaign_members WHERE campaign_id = $1',
    [campaignId]
  );
  const testers = result.rows.filter(m => m.team_type === 'tester').map(m => m.user_id);
  const developers = result.rows.filter(m => m.team_type === 'developer').map(m => m.user_id);
  return { testers, developers };
}

export async function getMembersWithDetails(campaignId, client = null) {
  const c = client || pool;
  const result = await c.query(
    `SELECT cm.team_type, u.id, u.email, u.first_name, u.last_name, u.role, u.created_at
     FROM campaign_members cm JOIN users u ON u.id = cm.user_id
     WHERE cm.campaign_id = $1`,
    [campaignId]
  );
  const testers = [];
  const developers = [];
  for (const row of result.rows) {
    const user = { id: row.id, email: row.email, first_name: row.first_name, last_name: row.last_name, role: row.role, created_at: row.created_at };
    if (row.team_type === 'tester') testers.push(user);
    else developers.push(user);
  }
  return { testers, developers };
}

export async function addMember(campaignId, userId, teamType, client = null) {
  const c = client || pool;
  await c.query(
    'INSERT INTO campaign_members (campaign_id, user_id, team_type) VALUES ($1, $2, $3) ON CONFLICT (campaign_id, user_id) DO UPDATE SET team_type = $3',
    [campaignId, userId, teamType]
  );
}

export async function removeMember(campaignId, userId, client = null) {
  const c = client || pool;
  const result = await c.query(
    'DELETE FROM campaign_members WHERE campaign_id = $1 AND user_id = $2 RETURNING id',
    [campaignId, userId]
  );
  return result.rows[0] || null;
}

export async function setTesters(campaignId, userIds, client = null) {
  const c = client || pool;
  await c.query('DELETE FROM campaign_members WHERE campaign_id = $1 AND team_type = $2', [campaignId, 'tester']);
  for (const userId of userIds) {
    await c.query(
      'INSERT INTO campaign_members (campaign_id, user_id, team_type) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
      [campaignId, userId, 'tester']
    );
  }
}

export async function setDevelopers(campaignId, userIds, client = null) {
  const c = client || pool;
  await c.query('DELETE FROM campaign_members WHERE campaign_id = $1 AND team_type = $2', [campaignId, 'developer']);
  for (const userId of userIds) {
    await c.query(
      'INSERT INTO campaign_members (campaign_id, user_id, team_type) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
      [campaignId, userId, 'developer']
    );
  }
}

export async function deleteAll(campaignId, client = null) {
  const c = client || pool;
  await c.query('DELETE FROM campaign_members WHERE campaign_id = $1', [campaignId]);
}

export async function getUserCampaigns(userId, client = null) {
  const c = client || pool;
  const result = await c.query(
    'SELECT campaign_id, team_type FROM campaign_members WHERE user_id = $1',
    [userId]
  );
  return result.rows;
}
