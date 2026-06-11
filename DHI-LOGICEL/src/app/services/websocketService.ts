import { socketService } from './socketService';

// Alias léger pour compatibilité : réutilise l'unique instance/socket de socketService
export const websocketService = {
  connect: (userId: number, token?: string) => socketService.connect(userId, token),
  disconnect: () => socketService.disconnect(),
  joinCampaign: (campaignId: number) => socketService.joinCampaign(campaignId),
  leaveCampaign: (campaignId: number) => socketService.leaveCampaign(campaignId),
  onNotification: (cb: (notification: any) => void) => socketService.onNotification(cb),
  onCampaignUpdate: (cb: (update: any) => void) => socketService.onCampaignUpdate(cb),
  onAnomalyCreated: (cb: (anomaly: any) => void) => socketService.onAnomalyCreated(cb),
  onAnomalyUpdated: (cb: (anomaly: any) => void) => socketService.onAnomalyUpdated(cb),
  onFeatureStatusChanged: (cb: (feature: any) => void) => socketService.onFeatureStatusChanged(cb),
  onTaskAssigned: (cb: (task: any) => void) => socketService.onTaskAssigned(cb),
  on: (event: string, handler: (...args: any[]) => void) => socketService.on(event, handler),
  off: (event: string, handler?: (...args: any[]) => void) => socketService.off(event, handler),
};
