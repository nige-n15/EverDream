import * as SecureStore from "expo-secure-store";

export interface SecureStorageError extends Error {
  code?: string;
}

export class SecureStorageService {
  private static async handleError(operation: string, error: unknown): Promise<never> {
    const secureError: SecureStorageError = error instanceof Error ? error : new Error(String(error));
    secureError.code = "SECURE_STORAGE_ERROR";
    console.error(`SecureStorage ${operation} failed:`, secureError);
    throw secureError;
  }

  static async setItem(key: string, value: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch (error) {
      await this.handleError("setItem", error);
    }
  }

  static async getItem(key: string): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      await this.handleError("getItem", error);
      return null; // This line won't be reached due to throw, but satisfies TypeScript
    }
  }

  static async deleteItem(key: string): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      await this.handleError("deleteItem", error);
    }
  }

  static async setProvenanceKey(userId: string, key: string): Promise<void> {
    const storageKey = `provenance_key_${userId}`;
    await this.setItem(storageKey, key);
  }

  static async getProvenanceKey(userId: string): Promise<string | null> {
    const storageKey = `provenance_key_${userId}`;
    return await this.getItem(storageKey);
  }

  static async setSessionToken(token: string): Promise<void> {
    await this.setItem("session_token", token);
  }

  static async getSessionToken(): Promise<string | null> {
    return await this.getItem("session_token");
  }

  static async clearSessionToken(): Promise<void> {
    await this.deleteItem("session_token");
  }

  static async setUserCredentials(userId: string, credentials: { email: string; password?: string }): Promise<void> {
    const storageKey = `credentials_${userId}`;
    await this.setItem(storageKey, JSON.stringify(credentials));
  }

  static async getUserCredentials(userId: string): Promise<{ email: string; password?: string } | null> {
    const storageKey = `credentials_${userId}`;
    const stored = await this.getItem(storageKey);
    if (!stored) return null;

    try {
      return JSON.parse(stored);
    } catch (error) {
      await this.handleError("parse credentials", error);
      return null; // This line won't be reached due to throw, but satisfies TypeScript
    }
  }

  static async clearUserCredentials(userId: string): Promise<void> {
    const storageKey = `credentials_${userId}`;
    await this.deleteItem(storageKey);
  }
}