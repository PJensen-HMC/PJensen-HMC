export interface NotificationPayload {
  channel: string;
  to: string | string[];
  subject?: string;
  body: string;
  metadata?: Record<string, unknown>;
}

export interface NotificationResult {
  deliveryId: string;
  acceptedAt: string;
}

export interface NotificationsBinding {
  send(payload: NotificationPayload): Promise<NotificationResult>;
}
