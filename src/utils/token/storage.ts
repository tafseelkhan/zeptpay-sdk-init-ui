import AsyncStorage from '@react-native-async-storage/async-storage';

export const storage = {
  async set(key: string, value: any): Promise<void> {
    try {
      const jsonValue = JSON.stringify(value);
      await AsyncStorage.setItem(key, jsonValue);
    } catch (error) {
      console.error('[ZeptPay] Storage set failed:', error);
    }
  },

  async get<T>(key: string): Promise<T | null> {
    try {
      const jsonValue = await AsyncStorage.getItem(key);
      return jsonValue ? JSON.parse(jsonValue) : null;
    } catch (error) {
      console.error('[ZeptPay] Storage get failed:', error);
      return null;
    }
  },

  async remove(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error('[ZeptPay] Storage remove failed:', error);
    }
  },

  async clear(): Promise<void> {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      console.error('[ZeptPay] Storage clear failed:', error);
    }
  }
};