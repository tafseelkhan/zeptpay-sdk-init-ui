import { useState, useCallback } from 'react';
import { useZeptPaySafe } from '../contexts/ZeptPayProvider';
import { tokenService } from '../utils/token/tokenService';
import { sdkEvents } from '../events/sdkEvents';
import { ErrorHandler, AppError } from '../error/errorHandler';

interface UseZeptPayReturn {
  loading: boolean;
  error: AppError | null;
  hasToken: boolean;
  submitToBackend: (data: any, backendApi: (data: any) => Promise<any>) => Promise<any>;
  // REMOVED: refreshToken
  logout: () => Promise<void>;
  clearError: () => void;
}

export const useZeptPay = (): UseZeptPayReturn => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<AppError | null>(null);
  const context = useZeptPaySafe();

  const submitToBackend = useCallback(async (
    data: any,
    backendApi: (data: any) => Promise<any>
  ): Promise<any> => {
    setLoading(true);
    setError(null);

    try {
      // REMOVED: Token check - SDK must not block flow if token is missing
      sdkEvents.emitEvent('onboarding:submitting');

      // Call developer's backend API
      const response = await backendApi(data);

      sdkEvents.emitEvent('onboarding:success', response);
      return response;
    } catch (err: any) {
      const appError = ErrorHandler.handle(err);
      setError(appError);
      sdkEvents.emitEvent('onboarding:error', appError);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // REMOVED: refreshToken function

  const logout = useCallback(async (): Promise<void> => {
    try {
      // Clear token from secure storage
      await tokenService.clearToken();
      
      // Clear any local state
      setError(null);
      setLoading(false);
      
      // Emit logout event
      sdkEvents.emitEvent('token:cleared');
      
      if (__DEV__) {
        console.log('[useZeptPay] User logged out successfully');
      }
    } catch (err) {
      // Silent fail
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    loading,
    error,
    hasToken: context?.hasToken || false,
    submitToBackend,
    // REMOVED: refreshToken
    logout,
    clearError
  };
};