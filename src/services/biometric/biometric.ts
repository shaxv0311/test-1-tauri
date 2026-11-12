import { isTauri } from "@tauri-apps/api/core";
import { biometricCipher } from "@tauri-apps/plugin-biometric";

const STORAGE_KEY = "billnex_biometric_credentials";

export interface SavedCredentials {
  email: string;
  password: string;
}

export function isAndroidApp(): boolean {
  return isTauri() && /Android/i.test(navigator.userAgent);
}

export function hasBiometricCredentials(): boolean {
  return Boolean(localStorage.getItem(STORAGE_KEY));
}

// Encrypt and save credentials after first successful login
export async function saveBiometricCredentials(
  credentials: SavedCredentials,
): Promise<void> {
  if (!isAndroidApp()) {
    throw new Error("Biometric login is only available on Android.");
  }

  const result = await biometricCipher("Enable secure login", {
    dataToEncrypt: JSON.stringify(credentials),
    allowDeviceCredential: true,
    title: "Enable secure login",
    subtitle: "Authenticate to save your login credentials",
    confirmationRequired: false,
  });

  localStorage.setItem(STORAGE_KEY, result.data);
}

// Android authentication happens while decrypting.
// Credentials are returned only after successful authentication.
export async function getBiometricCredentials(): Promise<SavedCredentials> {
  const encrypted = localStorage.getItem(STORAGE_KEY);

  if (!encrypted) {
    throw new Error("No saved credentials.");
  }

  const result = await biometricCipher("Authenticate to open Billnex", {
    dataToDecrypt: encrypted,
    allowDeviceCredential: true,
    title: "Welcome back",
    subtitle: "Verify your identity to continue",
    confirmationRequired: false,
  });

  return JSON.parse(result.data) as SavedCredentials;
}

export function removeBiometricCredentials(): void {
  localStorage.removeItem(STORAGE_KEY);
}
