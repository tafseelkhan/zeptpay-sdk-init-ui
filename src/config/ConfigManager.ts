import { Logger } from '../utils/log/logger';

export interface SDKConfig {
  publicKey: string;
  enableLogging?: boolean;
  tokenRefreshEndpoint?: string;
  apiBaseUrl?: string;
}

export class ConfigManager {
  private static instance: ConfigManager;
  private config: SDKConfig | null = null;
  private logger: Logger;

  private constructor() {
    this.logger = new Logger({
      enabled: true,
      prefix: '[ZeptPay SDK]'
    });
  }

  static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  initialize(config: SDKConfig): void {
    if (!config.publicKey?.trim()) {
      throw new Error('Public key is required');
    }

    this.config = {
      enableLogging: __DEV__,
      ...config
    };

    this.logger.setEnabled(this.config.enableLogging || false);
    
    this.log('🚀 ZeptPay SDK initialized:');
    this.log('  📌 Public key:', config.publicKey.substring(0, 8) + '...');
  }

  getPublicKey(): string {
    if (!this.config?.publicKey) {
      throw new Error('SDK not initialized. Call initialize() first.');
    }
    return this.config.publicKey;
  }

  getTokenRefreshEndpoint(): string | undefined {
    return this.config?.tokenRefreshEndpoint;
  }

  getApiBaseUrl(): string {
    return this.config?.apiBaseUrl || 'http://172.20.10.12:7000';
  }

  isLoggingEnabled(): boolean {
    return this.config?.enableLogging || false;
  }

  log(...args: any[]): void {
    if (this.isLoggingEnabled()) {
      this.logger.info(...args);
    }
  }

  error(...args: any[]): void {
    if (this.isLoggingEnabled()) {
      this.logger.error(...args);
    }
  }

  isInitialized(): boolean {
    return !!this.config?.publicKey;
  }
}