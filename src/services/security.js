const DEFAULT_ITERATIONS = 310000;
const HASH_ALGORITHM = "SHA-256";
const KEY_LENGTH = 256;

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

const derivePasswordHash = async (password, salt, iterations) => {
  if (!window.crypto?.subtle) {
    throw new Error("Este navegador no soporta el sistema de seguridad requerido.");
  }

  const passwordKey = await window.crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );

  const derivedBits = await window.crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt,
      iterations,
      hash: HASH_ALGORITHM,
    },
    passwordKey,
    KEY_LENGTH
  );

  return new Uint8Array(derivedBits);
};

export const validateMasterPassword = (password) => {
  if (!password || password.length < 8) {
    return "La contraseña debe tener al menos 8 caracteres.";
  }

  if (password.length > 128) {
    return "La contraseña es demasiado larga.";
  }

  return "";
};

export const createPasswordHash = async (password) => {
  const salt = new Uint8Array(16);
  window.crypto.getRandomValues(salt);

  const hashBytes = await derivePasswordHash(
    password,
    salt,
    DEFAULT_ITERATIONS
  );

  return {
    passwordHash: bytesToBase64(hashBytes),
    passwordSalt: bytesToBase64(salt),
    passwordIterations: DEFAULT_ITERATIONS,
  };
};

export const verifyPasswordHash = async (password, securityData) => {
  if (!securityData?.passwordHash || !securityData?.passwordSalt) {
    return false;
  }

  const salt = base64ToBytes(securityData.passwordSalt);
  const iterations = Number(
    securityData.passwordIterations || DEFAULT_ITERATIONS
  );

  const calculatedHash = await derivePasswordHash(
    password,
    salt,
    iterations
  );

  const storedHash = base64ToBytes(securityData.passwordHash);

  if (calculatedHash.length !== storedHash.length) {
    return false;
  }

  let difference = 0;

  for (let index = 0; index < calculatedHash.length; index += 1) {
    difference |= calculatedHash[index] ^ storedHash[index];
  }

  return difference === 0;
};
