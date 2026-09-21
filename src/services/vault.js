const VAULT_VERSION = 1;
const PBKDF2_ITERATIONS = 310000;
const encoder = new TextEncoder();
const decoder = new TextDecoder();

const bytesToBase64 = (bytes) => {
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
};

const base64ToBytes = (value) => {
  const binary = atob(value);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
};

const randomBytes = (length) => {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return bytes;
};

const importAesKey = (raw, extractable = false) =>
  crypto.subtle.importKey("raw", raw, { name: "AES-GCM" }, extractable, [
    "encrypt",
    "decrypt",
  ]);

const deriveWrappingKey = async (secret, salt, iterations = PBKDF2_ITERATIONS) => {
  const material = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations,
      hash: "SHA-256",
    },
    material,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
};

const encryptBytes = async (key, bytes) => {
  const iv = randomBytes(12);
  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, bytes);
  return {
    cipherText: bytesToBase64(new Uint8Array(encrypted)),
    iv: bytesToBase64(iv),
  };
};

const decryptBytes = async (key, cipherText, iv) => {
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: base64ToBytes(iv) },
    key,
    base64ToBytes(cipherText)
  );
  return new Uint8Array(decrypted);
};

const recoveryCodeFromBytes = (bytes) => {
  const value = bytesToBase64(bytes)
    .replace(/\+/g, "A")
    .replace(/\//g, "B")
    .replace(/=/g, "")
    .toUpperCase();

  return value.match(/.{1,4}/g).join("-");
};

const normalizeRecoveryCode = (code) => code.replace(/[^A-Z0-9]/gi, "").toUpperCase();

export const createVaultSetup = async (password) => {
  if (!crypto?.subtle) {
    throw new Error("Este navegador no soporta el cifrado requerido.");
  }

  const vaultKeyBytes = randomBytes(32);
  const passwordWrapSalt = randomBytes(16);
  const passwordWrapKey = await deriveWrappingKey(password, passwordWrapSalt);
  const passwordWrap = await encryptBytes(passwordWrapKey, vaultKeyBytes);

  const recoveryCode = recoveryCodeFromBytes(randomBytes(24));
  const recoveryWrapSalt = randomBytes(16);
  const recoveryWrapKey = await deriveWrappingKey(
    normalizeRecoveryCode(recoveryCode),
    recoveryWrapSalt
  );
  const recoveryWrap = await encryptBytes(recoveryWrapKey, vaultKeyBytes);

  return {
    vaultKeyBytes,
    recoveryCode,
    securityFields: {
      vaultVersion: VAULT_VERSION,
      passwordWrapSalt: bytesToBase64(passwordWrapSalt),
      passwordWrappedVaultKey: passwordWrap.cipherText,
      passwordWrappedVaultIv: passwordWrap.iv,
      recoveryWrapSalt: bytesToBase64(recoveryWrapSalt),
      recoveryWrappedVaultKey: recoveryWrap.cipherText,
      recoveryWrappedVaultIv: recoveryWrap.iv,
    },
  };
};

export const unlockVaultWithPassword = async (password, securityData) => {
  if (!securityData?.passwordWrappedVaultKey || !securityData?.passwordWrapSalt) {
    throw new Error("La bóveda todavía no está configurada.");
  }

  const key = await deriveWrappingKey(
    password,
    base64ToBytes(securityData.passwordWrapSalt)
  );

  return decryptBytes(
    key,
    securityData.passwordWrappedVaultKey,
    securityData.passwordWrappedVaultIv
  );
};

export const unlockVaultWithRecoveryCode = async (recoveryCode, securityData) => {
  if (!securityData?.recoveryWrappedVaultKey || !securityData?.recoveryWrapSalt) {
    throw new Error("No hay una clave de recuperación configurada.");
  }

  const key = await deriveWrappingKey(
    normalizeRecoveryCode(recoveryCode),
    base64ToBytes(securityData.recoveryWrapSalt)
  );

  try {
    return await decryptBytes(
      key,
      securityData.recoveryWrappedVaultKey,
      securityData.recoveryWrappedVaultIv
    );
  } catch {
    throw new Error("La clave de recuperación no es correcta.");
  }
};

export const rewrapVaultWithPassword = async (vaultKeyBytes, password) => {
  const passwordWrapSalt = randomBytes(16);
  const key = await deriveWrappingKey(password, passwordWrapSalt);
  const wrapped = await encryptBytes(key, vaultKeyBytes);

  return {
    passwordWrapSalt: bytesToBase64(passwordWrapSalt),
    passwordWrappedVaultKey: wrapped.cipherText,
    passwordWrappedVaultIv: wrapped.iv,
  };
};

export const encryptAccountPayload = async (accountData, vaultKeyBytes) => {
  const key = await importAesKey(vaultKeyBytes);
  const payload = encoder.encode(JSON.stringify(accountData));
  const encrypted = await encryptBytes(key, payload);

  return {
    vaultVersion: VAULT_VERSION,
    encryptedPayload: encrypted.cipherText,
    encryptedIv: encrypted.iv,
  };
};

export const decryptAccountPayload = async (documentData, vaultKeyBytes) => {
  if (!documentData?.encryptedPayload) {
    return {
      title: documentData?.title || "",
      username: documentData?.username || "",
      cedula: documentData?.cedula || "",
      email: documentData?.email || "",
      user: documentData?.user || "",
      password: documentData?.password || "",
      pin: documentData?.pin || "",
    };
  }

  const key = await importAesKey(vaultKeyBytes);
  const decrypted = await decryptBytes(
    key,
    documentData.encryptedPayload,
    documentData.encryptedIv
  );

  return JSON.parse(decoder.decode(decrypted));
};

/*
  Device wrapping lets a verified Passkey reopen the same vault on this
  browser profile. The wrapping key stays in IndexedDB and never goes to
  Firestore. This protects cloud data at rest, but it is not a substitute
  for preventing XSS in the web app.
*/
const DEVICE_DB_NAME = "remora-device-vault";
const DEVICE_STORE = "keys";

const openDeviceDb = () =>
  new Promise((resolve, reject) => {
    const request = indexedDB.open(DEVICE_DB_NAME, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(DEVICE_STORE)) {
        request.result.createObjectStore(DEVICE_STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

const getDeviceKey = async (userId, createIfMissing = false) => {
  const db = await openDeviceDb();

  const existing = await new Promise((resolve, reject) => {
    const tx = db.transaction(DEVICE_STORE, "readonly");
    const request = tx.objectStore(DEVICE_STORE).get(userId);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });

  if (existing || !createIfMissing) return existing;

  const key = await crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );

  await new Promise((resolve, reject) => {
    const tx = db.transaction(DEVICE_STORE, "readwrite");
    tx.objectStore(DEVICE_STORE).put(key, userId);
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });

  return key;
};

const deviceVaultStorageKey = (userId) => `remora_device_vault_${userId}`;

export const linkVaultToCurrentDevice = async (userId, vaultKeyBytes) => {
  const deviceKey = await getDeviceKey(userId, true);
  const encrypted = await encryptBytes(deviceKey, vaultKeyBytes);
  localStorage.setItem(deviceVaultStorageKey(userId), JSON.stringify(encrypted));
};

export const unlockVaultFromCurrentDevice = async (userId) => {
  const stored = localStorage.getItem(deviceVaultStorageKey(userId));
  if (!stored) {
    throw new Error("Esta Passkey todavía no tiene la bóveda vinculada en este dispositivo. Entra una vez con contraseña y vuelve a registrar la Passkey.");
  }

  const deviceKey = await getDeviceKey(userId, false);
  if (!deviceKey) {
    throw new Error("No se encontró la clave local de este dispositivo.");
  }

  const parsed = JSON.parse(stored);
  return decryptBytes(deviceKey, parsed.cipherText, parsed.iv);
};

export const clearDeviceVaultLink = (userId) => {
  localStorage.removeItem(deviceVaultStorageKey(userId));
};
