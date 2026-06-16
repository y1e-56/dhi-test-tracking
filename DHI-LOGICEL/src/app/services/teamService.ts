import api from './api';
import { mapUserFromBackend } from '../utils/mappers';
import { User } from '../types';

export const teamService = {
  async addMember(campaignId: string, userId: string, teamType: 'tester' | 'developer'): Promise<void> {
    await api.post('/teams/members', {
      campaign_id: parseInt(campaignId),
      user_id: parseInt(userId),
      team_type: teamType,
    });
  },

  async removeMember(campaignId: string, userId: string): Promise<void> {
    await api.delete(`/teams/members/${campaignId}/${userId}`);
  },

  async getCampaignMembers(campaignId: string): Promise<{ testers: User[]; developers: User[] }> {
    const response = await api.get(`/teams/campaigns/${campaignId}/members`);
    const data = response.data;
    return {
      testers: (data.testers || data.filter?.((m: any) => m.team_type === 'tester') || []).map(mapUserFromBackend),
      developers: (data.developers || data.filter?.((m: any) => m.team_type === 'developer') || []).map(mapUserFromBackend),
    };
  },

  async getUserCampaigns(userId: string): Promise<any[]> {
    const response = await api.get(`/teams/users/${userId}/campaigns`);
    return response.data;
  },
};
