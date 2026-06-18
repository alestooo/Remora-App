export const isPasskeySupported = () => {
  return window.PublicKeyCredential && navigator.credentials;
};

const bufferToBase64url = (buffer) => {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
};

const base64urlToBuffer = (base64url) => {
  const base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
  const binary = atob(padded);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
};

const randomChallenge = () => {
  const challenge = new Uint8Array(32);
  crypto.getRandomValues(challenge);
  return challenge;
};

export const registerPasskey = async (user) => {
  if (!isPasskeySupported()) {
    throw new Error("Este navegador no soporta Passkeys.");
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

  return bufferToBase64url(credential.rawId);
};

export const unlockWithPasskey = async (credentialId) => {
  if (!isPasskeySupported()) {
    throw new Error("Este navegador no soporta Passkeys.");
  }

  await navigator.credentials.get({
    publicKey: {
      challenge: randomChallenge(),
      allowCredentials: [
        {
          id: base64urlToBuffer(credentialId),
          type: "public-key",
        },
      ],
      userVerification: "required",
      timeout: 60000,
    },
  });

  return true;
};