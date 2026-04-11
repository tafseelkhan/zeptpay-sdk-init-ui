export interface LoggerOptions {
  enabled?: boolean;
  prefix?: string;
}

export class Logger {
  private enabled: boolean;
  private prefix: string;

  constructor(options: LoggerOptions = {}) {
    this.enabled = options.enabled ?? __DEV__;
    this.prefix = options.prefix || '[ZeptPay]';
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  info(...args: any[]): void {
    if (this.enabled) {
      console.log(this.prefix, ...args);
    }
  }

  warn(...args: any[]): void {
    if (this.enabled) {
      console.warn(this.prefix, ...args);
    }
  }

  error(...args: any[]): void {
    if (this.enabled) {
      console.error(this.prefix, ...args);
    }
  }

  debug(...args: any[]): void {
    if (this.enabled) {
      console.debug(this.prefix, '[DEBUG]', ...args);
    }
  }
}