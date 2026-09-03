export type AuthUser = {
  id: string;
  email: string;
  displayName: string;
};

export type MobileSessionResponse = {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  expiresAt: string;
  deviceInstallationId: string;
  user: AuthUser;
};

export type SessionState = {
  accessToken: string | null;
  expiresAt: string | null;
  user: AuthUser | null;
};
