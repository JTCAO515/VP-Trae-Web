export type SessionStatus = 'active' | 'revoked';

export interface SessionEntity {
  id: string;
  userId: string;
  accessToken: string;
  accessTokenHash: string;
  refreshToken: string;
  refreshTokenHash: string;
  status: SessionStatus;
  expiresAt: Date;
  lastSeenAt: Date;
  createdAt: Date;
  updatedAt: Date;
  revokedAt: Date | null;
}
