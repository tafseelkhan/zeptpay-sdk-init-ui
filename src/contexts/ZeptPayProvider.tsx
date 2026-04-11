import React, { createContext, useContext, useState, useEffect } from 'react';
import { verifyPublicKey } from '../api/clients/verifyPublicKey';
import { tokenService } from '../utils/token/tokenService';
import { Logger } from '../utils/log/logger';

interface ZeptPayContextType {
  publicKey: string;
  isValid: boolean;
  loading: boolean;
  hasToken: boolean;
  error?: string;
  merchantId?: string;
  mode: 'test' | 'live';
}

const ZeptPayContext = createContext<ZeptPayContextType | null>(null);

interface Props {
  publicKey: string;
  children: React.ReactNode;
  enableLogging?: boolean;
}

const logger = new Logger({ prefix: '[ZeptPay Provider]' });

export const ZeptPayProvider: React.FC<Props> = ({ 
  publicKey, 
  children,
  enableLogging = __DEV__ 
}) => {
  const [state, setState] = useState<ZeptPayContextType>({
    publicKey,
    isValid: false,
    loading: true,
    hasToken: false,
    mode: 'test'
  });

  useEffect(() => {
    logger.setEnabled(enableLogging);

    const initialize = async () => {
      if (!publicKey?.trim()) {
        setState(prev => ({ 
          ...prev, 
          isValid: false, 
          loading: false,
          error: 'Public key is required'
        }));
        return;
      }

      try {
        logger.info('Initializing ZeptPay...');
        
        // Verify public key
        const verification = await verifyPublicKey(publicKey);
        
        // Check for existing token
        const hasToken = await tokenService.hasToken();
        
        // Extract merchantId from token if available
        let merchantId: string | undefined;
        if (hasToken) {
          const token = await tokenService.getToken();
          if (token) {
            try {
              const base64Url = token.split('.')[1];
              const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
              const payload = JSON.parse(atob(base64));
              merchantId = payload.merchantId || payload.sub;
            } catch {
              // Ignore decode errors
            }
          }
        }

        setState({
          publicKey,
          isValid: verification.valid,
          loading: false,
          hasToken,
          merchantId,
          mode: verification.merchantData?.mode || 'test'
        });

        logger.info('ZeptPay initialized successfully');
      } catch (error) {
        logger.error('Initialization failed:', error);
        setState({
          publicKey,
          isValid: false,
          loading: false,
          hasToken: false,
          error: 'Invalid public key',
          mode: 'test'
        });
      }
    };

    initialize();
  }, [publicKey, enableLogging]);

  return (
    <ZeptPayContext.Provider value={state}>
      {children}
    </ZeptPayContext.Provider>
  );
};

export const useZeptPay = (): ZeptPayContextType => {
  const context = useContext(ZeptPayContext);
  if (!context) {
    throw new Error('useZeptPay must be used within ZeptPayProvider');
  }
  return context;
};

export const useZeptPaySafe = (): ZeptPayContextType | null => {
  try {
    return useZeptPay();
  } catch {
    return null;
  }
};