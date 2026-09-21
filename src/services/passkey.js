export const isPasskeySupported = () => {
  return Boolean(window.PublicKeyCredential && navigator.credentials);
};

const bufferToBase64url = (buffer) => {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
};

const base64urlToBuffer = (base64url) => {
  const base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(
    base64.length + ((4 - (base64.length % 4)) % 4),
    "="
  );
  const binary = atob(padded);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
};

const randomChallenge = () => {
  const challenge = new Uint8Array(32);
  crypto.getRandomValues(challenge);
  return challenge;
};

export const getPasskeyCredentialIds = (securityData = {}) => {
  const storedIds = Array.isArray(securityData.passkeyCredentialIds)
    ? securityData.passkeyCredentialIds
    : [];

  const legacyId = securityData.passkeyCredentialId
    ? [securityData.passkeyCredentialId]
    : [];

  return [...new Set([...storedIds, ...legacyId].filter(Boolean))];
};

export const registerPasskey = async (user) => {
  if (!isPasskeySupported()) {
    throw new Error("Este navegador o dispositivo no soporta Passkeys.");
  }

  const credential = await navigator.credentials.create({
    publicKey: {
      challenge: randomChallenge(),
      rp: {
        name: "Remora",
      },
      user: {
        id: new TextEncoder().encode(user.uid),
        name: user.email || "usuario@remora.app",
        displayName: user.displayName || "Usuario Remora",
      },
      pubKeyCredParams: [
        { type: "public-key", alg: -7 },
        { type: "public-key", alg: -257 },
      ],
      authenticatorSelection: {
        authenticatorAttachment: "platform",
        userVerification: "required",
        residentKey: "preferred",
      },
      timeout: 60000,
      attestation: "none",
    },
  });

  if (!credential) {
    throw new Error("No se pudo crear la Passkey.");
  }

  return bufferToBase64url(credential.rawId);
};

export const unlockWithPasskey = async (credentialIds) => {
  if (!isPasskeySupported()) {
    throw new Error("Este navegador o dispositivo no soporta Passkeys.");
  }

  const ids = Array.isArray(credentialIds)
    ? credentialIds.filter(Boolean)
    : [credentialIds].filter(Boolean);

  if (ids.length === 0) {
    throw new Error("No hay ninguna Passkey registrada todavía.");
  }

  const credential = await navigator.credentials.get({
    publicKey: {
      challenge: randomChallenge(),
      allowCredentials: ids.map((id) => ({
        id: base64urlToBuffer(id),
        type: "public-key",
      })),
      userVerification: "required",
      timeout: 60000,
    },
  });

  if (!credential) {
    throw new Error("No se pudo verificar la Passkey.");
  }

  return true;
};
