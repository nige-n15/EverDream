import { Platform } from "react-native";
import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";

const AES_KEY_BYTES = 32;
const IV_BYTES = 12;
const LOCAL_ACTOR_KEY = "everdream:local-actor-id";

function getWebCrypto() {
  const cryptoApi = globalThis.crypto;

  if (!cryptoApi?.subtle || typeof cryptoApi.getRandomValues !== "function") {
    throw new Error("Web Crypto API is unavailable in this runtime");
  }

  return cryptoApi;
}

function bytesToHex(bytes: Uint8Array) {
  return Array.from(bytes)
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("");
}

function hexToBytes(hex: string) {
  const bytes = new Uint8Array(hex.length / 2);

  for (let index = 0; index < bytes.length; index += 1) {
    bytes[index] = parseInt(hex.slice(index * 2, index * 2 + 2), 16);
  }

  return bytes;
}

async function getStoredDeviceSeed(userId: string) {
  const storageKey = `everdream:device-seed:${userId}`;

  if (Platform.OS === "web") {
    return globalThis.localStorage?.getItem(storageKey) ?? null;
  }

  return await SecureStore.getItemAsync(storageKey);
}

async function getStoredValue(key: string) {
  if (Platform.OS === "web") {
    return globalThis.localStorage?.getItem(key) ?? null;
  }

  return await SecureStore.getItemAsync(key);
}

async function setStoredValue(key: string, value: string) {
  if (Platform.OS === "web") {
    globalThis.localStorage?.setItem(key, value);
    return;
  }

  await SecureStore.setItemAsync(key, value);
}

async function setStoredDeviceSeed(userId: string, seedHex: string) {
  const storageKey = `everdream:device-seed:${userId}`;

  if (Platform.OS === "web") {
    globalThis.localStorage?.setItem(storageKey, seedHex);
    return;
  }

  await SecureStore.setItemAsync(storageKey, seedHex);
}

async function ensureBiometricAccess() {
  if (Platform.OS === "web") {
    return;
  }

  const hasHardware = await LocalAuthentication.hasHardwareAsync();
  const isEnrolled = await LocalAuthentication.isEnrolledAsync();

  if (!hasHardware || !isEnrolled) {
    throw new Error("Biometric authentication is unavailable on this device");
  }

  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: "Unlock Everdream vault",
    disableDeviceFallback: false,
  });

  if (!result.success) {
    throw new Error("Biometric authentication failed");
  }
}

async function getOrCreateDeviceSeed(userId: string) {
  const cryptoApi = getWebCrypto();
  const existing = await getStoredDeviceSeed(userId);

  if (existing) {
    return hexToBytes(existing);
  }

  const seed = cryptoApi.getRandomValues(new Uint8Array(AES_KEY_BYTES));
  await setStoredDeviceSeed(userId, bytesToHex(seed));
  return seed;
}

export async function deriveKeyFromBiometric(userId: string) {
  await ensureBiometricAccess();
  const cryptoApi = getWebCrypto();
  const seed = await getOrCreateDeviceSeed(userId);
  const rawSeed = seed.slice().buffer as ArrayBuffer;

  return await cryptoApi.subtle.importKey(
    "raw",
    rawSeed,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

async function importSeedAsKey(seed: Uint8Array) {
  const cryptoApi = getWebCrypto();
  const rawSeed = seed.slice().buffer as ArrayBuffer;

  return await cryptoApi.subtle.importKey(
    "raw",
    rawSeed,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

export async function deriveKeyForLocalVault(userId: string) {
  try {
    return await deriveKeyFromBiometric(userId);
  } catch (error) {
    console.warn("Falling back to device-bound key derivation", error);
    const seed = await getOrCreateDeviceSeed(userId);
    return await importSeedAsKey(seed);
  }
}

export async function getOrCreateLocalActorId() {
  const existing = await getStoredValue(LOCAL_ACTOR_KEY);

  if (existing) {
    return existing;
  }

  const nextId = typeof globalThis.crypto?.randomUUID === "function"
    ? globalThis.crypto.randomUUID()
    : `local-${Date.now()}-${Math.random().toString(16).slice(2)}`;

  await setStoredValue(LOCAL_ACTOR_KEY, nextId);
  return nextId;
}

export function arrayBufferToHex(buffer: ArrayBuffer) {
  return bytesToHex(new Uint8Array(buffer));
}

export async function createTimestampBindingHash(timestamp: string, userId: string) {
  const cryptoApi = getWebCrypto();
  const seed = await getOrCreateDeviceSeed(userId);
  const payload = new TextEncoder().encode(`${timestamp}:${userId}:${bytesToHex(seed)}`);
  const digest = await cryptoApi.subtle.digest("SHA-256", payload);
  return arrayBufferToHex(digest);
}

export async function encryptDreamMedia(mediaBlob: Blob, userKey: CryptoKey) {
  const cryptoApi = getWebCrypto();
  const iv = cryptoApi.getRandomValues(new Uint8Array(IV_BYTES));
  const plaintext = await mediaBlob.arrayBuffer();
  const ciphertext = await cryptoApi.subtle.encrypt(
    { name: "AES-GCM", iv },
    userKey,
    plaintext,
  );

  const combined = new Uint8Array(iv.length + ciphertext.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(ciphertext), iv.length);
  return combined.buffer;
}

export async function decryptDreamMedia(encryptedData: ArrayBuffer, userKey: CryptoKey) {
  const cryptoApi = getWebCrypto();
  const combined = new Uint8Array(encryptedData);
  const iv = combined.slice(0, IV_BYTES);
  const ciphertext = combined.slice(IV_BYTES);
  const decrypted = await cryptoApi.subtle.decrypt(
    { name: "AES-GCM", iv },
    userKey,
    ciphertext,
  );

  return new Blob([decrypted]);
}
