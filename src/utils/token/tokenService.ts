import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = 'merchantToken';

// NEVER log the token
const log = (message: string) => {
  if (__DEV__) {
    console.log(`[ZeptPay Token] ${message}`);
  }
};

export const tokenService = {
  async saveToken(token: string): Promise<void> {
    if (!token?.trim()) {
      // Silent fail - don't throw
      return;
    }
    try {
      // Remove any existing token first - only one token at a time
      await this.clearToken();
      await AsyncStorage.setItem(TOKEN_KEY, token);
      log('Token saved securely');
    } catch (error) {
      // Silent fail - no logs in production
      if (__DEV__) {
        console.log('Failed to save token');
      }
    }
  },

  async getToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(TOKEN_KEY);
    } catch (error) {
      // Return null silently if error occurs
      return null;
    }
  },

  async clearToken(): Promise<void> {
    try {
      await AsyncStorage.removeItem(TOKEN_KEY);
      log('Token cleared');
    } catch (error) {
      // Silent fail
    }
  },

  async hasToken(): Promise<boolean> {
    const token = await this.getToken();
    return token !== null;
  },

  // REMOVED: attachTokenToRequest - SDK should not auto-attach tokens
};