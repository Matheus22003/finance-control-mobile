import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { ApiError } from '@/core/api/request';
import { mobileLogin, mobileLogout, mobileRefresh } from './mobile-auth-api';
import { clearRefreshToken, getInstallationId, getRefreshToken, replaceRefreshToken } from './secure-session';
import { applySessionResponse, clearSession, createInitialSessionState } from './session-state';
import type { SessionState } from './types';

type AuthContextValue = SessionState & {
  isRestoring: boolean;
  signIn(email: string, password: string): Promise<void>;
  refresh(): Promise<string | null>;
  authorizedRequest<T>(operation: (accessToken: string) => Promise<T>): Promise<T>;
  signOut(): Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function platform(): 'android' | 'ios' {
  if (Platform.OS === 'ios') return 'ios';
  return 'android';
}

function deviceName(): string {
  return Platform.OS === 'ios' ? 'iPhone/iPad' : 'Android device';
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<SessionState>(createInitialSessionState);
  const [isRestoring, setIsRestoring] = useState(true);
  const refreshInFlight = useRef<Promise<string | null> | null>(null);

  const accept = useCallback(async (response: Awaited<ReturnType<typeof mobileLogin>>) => {
    await replaceRefreshToken(response.refreshToken);
    setSession(current => applySessionResponse(current, response));
  }, []);

  const erase = useCallback(async () => {
    await clearRefreshToken();
    setSession(clearSession);
  }, []);

  const refresh = useCallback(async (): Promise<string | null> => {
    if (refreshInFlight.current) return refreshInFlight.current;

    const operation = (async () => {
      const [refreshToken, installationId] = await Promise.all([getRefreshToken(), getInstallationId()]);
      if (!refreshToken) return null;

      try {
        const response = await mobileRefresh(refreshToken, installationId);
        await accept(response);
        return response.accessToken;
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) await erase();
        throw error;
      }
    })();
    refreshInFlight.current = operation;
    try {
      return await operation;
    } finally {
      refreshInFlight.current = null;
    }
  }, [accept, erase]);

  useEffect(() => {
    void (async () => {
      try {
        await refresh();
      } catch {
        // The UI presents the sign-in screen; no token or response body is logged.
      } finally {
        setIsRestoring(false);
      }
    })();
  }, [refresh]);

  const signIn = useCallback(async (email: string, password: string) => {
    const response = await mobileLogin({
      email: email.trim(),
      password,
      deviceInstallationId: await getInstallationId(),
      deviceName: deviceName(),
      platform: platform(),
      appVersion: Constants.expoConfig?.version ?? '1.0.0',
    });
    await accept(response);
  }, [accept]);

  const authorizedRequest = useCallback(async <T,>(operation: (accessToken: string) => Promise<T>): Promise<T> => {
    if (!session.accessToken) throw new ApiError('Sua sessão expirou. Entre novamente.', 401);
    try {
      return await operation(session.accessToken);
    } catch (error) {
      if (!(error instanceof ApiError) || error.status !== 401) throw error;
      const rotatedAccessToken = await refresh();
      if (!rotatedAccessToken) throw error;
      return operation(rotatedAccessToken);
    }
  }, [refresh, session.accessToken]);

  const signOut = useCallback(async () => {
    const [refreshToken, installationId] = await Promise.all([getRefreshToken(), getInstallationId()]);
    try {
      if (refreshToken) await mobileLogout(refreshToken, installationId);
    } catch {
      // Local credential removal is intentional even if the network is unavailable.
    } finally {
      await erase();
    }
  }, [erase]);

  const value = useMemo<AuthContextValue>(() => ({ ...session, isRestoring, signIn, refresh, authorizedRequest, signOut }),
    [authorizedRequest, isRestoring, refresh, session, signIn, signOut]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be rendered inside AuthProvider.');
  return value;
}
