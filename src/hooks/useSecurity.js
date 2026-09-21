import { useEffect, useMemo, useState } from "react";
import { reauthenticateWithPopup } from "firebase/auth";
import { arrayUnion, doc, serverTimestamp, setDoc } from "firebase/firestore";
import { db, provider } from "../services/firebase";
import {
  getPasskeyCredentialIds,
  isPasskeySupported,
  registerPasskey,
  unlockWithPasskey,
} from "../services/passkey";
import {
  createPasswordHash,
  validateMasterPassword,
  verifyPasswordHash,
} from "../services/security";
import {
  createVaultSetup,
  linkVaultToCurrentDevice,
  rewrapVaultWithPassword,
  unlockVaultFromCurrentDevice,
  unlockVaultWithPassword,
  unlockVaultWithRecoveryCode,
} from "../services/vault";
import { UNLOCK_TIME } from "../constants/app";

export default function useSecurity({ user, securityData, showAlert, onLock }) {
  const [accountsUnlocked, setAccountsUnlocked] = useState(false);
  const [unlockEnd, setUnlockEnd] = useState(null);
  const [unlockSecondsLeft, setUnlockSecondsLeft] = useState(0);
  const [vaultKey, setVaultKey] = useState(null);
  const [securityBusy, setSecurityBusy] = useState(false);
  const [passwordResetAuthorized, setPasswordResetAuthorized] = useState(false);
  const [recoveryCodeToShow, setRecoveryCodeToShow] = useState("");

  const passkeyAvailable = useMemo(() => isPasskeySupported(), []);
  const passkeyIds = useMemo(
    () => getPasskeyCredentialIds(securityData),
    [securityData]
  );
  const hasPasskey = passkeyIds.length > 0;
  const hasPassword = Boolean(
    securityData?.passwordHash &&
      securityData?.passwordSalt &&
      securityData?.passwordWrappedVaultKey
  );

  const lockAccounts = () => {
    setAccountsUnlocked(false);
    setUnlockEnd(null);
    setUnlockSecondsLeft(0);
    setVaultKey(null);
    setPasswordResetAuthorized(false);
    onLock?.();
  };

  const unlockSession = (keyBytes) => {
    setVaultKey(keyBytes);
    setAccountsUnlocked(true);
    setUnlockEnd(Date.now() + UNLOCK_TIME);
    setUnlockSecondsLeft(Math.ceil(UNLOCK_TIME / 1000));
  };

  useEffect(() => {
    if (!accountsUnlocked || !unlockEnd) return undefined;

    const interval = window.setInterval(() => {
      const left = Math.max(0, Math.ceil((unlockEnd - Date.now()) / 1000));
      setUnlockSecondsLeft(left);
      if (left <= 0) lockAccounts();
    }, 1000);

    return () => window.clearInterval(interval);
  }, [accountsUnlocked, unlockEnd]);

  useEffect(() => {
    if (!user) lockAccounts();
  }, [user]);

  const validateNewPassword = (password, confirmation) => {
    const validation = validateMasterPassword(password);
    if (validation) return validation;
    if (password !== confirmation) return "Las contraseñas no coinciden.";
    return "";
  };

  const createInitialPassword = async (password, confirmation) => {
    const error = validateNewPassword(password, confirmation);
    if (error) throw new Error(error);
    if (!user) throw new Error("No hay una sesión activa.");

    setSecurityBusy(true);
    try {
      const passwordData = await createPasswordHash(password);
      const vaultSetup = await createVaultSetup(password);

      await setDoc(
        doc(db, "users", user.uid, "meta", "security"),
        {
          ...passwordData,
          ...vaultSetup.securityFields,
          passwordCreatedAt: serverTimestamp(),
          passwordUpdatedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      setRecoveryCodeToShow(vaultSetup.recoveryCode);
      unlockSession(vaultSetup.vaultKeyBytes);
      return vaultSetup.recoveryCode;
    } finally {
      setSecurityBusy(false);
    }
  };

  const unlockWithPassword = async (password) => {
    if (!password) throw new Error("Escribe tu contraseña.");
    setSecurityBusy(true);
    try {
      const valid = await verifyPasswordHash(password, securityData);
      if (!valid) throw new Error("Contraseña incorrecta.");
      const key = await unlockVaultWithPassword(password, securityData);
      unlockSession(key);
      return true;
    } finally {
      setSecurityBusy(false);
    }
  };

  const unlockWithRegisteredPasskey = async () => {
    if (!user) throw new Error("No hay una sesión activa.");
    setSecurityBusy(true);
    try {
      await unlockWithPasskey(passkeyIds);
      const key = await unlockVaultFromCurrentDevice(user.uid);
      unlockSession(key);
      return true;
    } finally {
      setSecurityBusy(false);
    }
  };

  const registerPasskeyForAccounts = async () => {
    if (!user || !vaultKey) {
      throw new Error("Desbloquea Cuentas con tu contraseña antes de registrar una Passkey.");
    }

    setSecurityBusy(true);
    try {
      const credentialId = await registerPasskey(user);
      await linkVaultToCurrentDevice(user.uid, vaultKey);

      await setDoc(
        doc(db, "users", user.uid, "meta", "security"),
        {
          passkeyCredentialIds: arrayUnion(credentialId),
          passkeyCredentialId: credentialId,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      return credentialId;
    } finally {
      setSecurityBusy(false);
    }
  };

  const beginForgotPassword = async () => {
    if (!user) throw new Error("No hay una sesión activa.");
    setSecurityBusy(true);
    try {
      await reauthenticateWithPopup(user, provider);
      setPasswordResetAuthorized(true);
    } finally {
      setSecurityBusy(false);
    }
  };

  const resetForgottenPassword = async ({ password, confirmation, recoveryCode }) => {
    if (!passwordResetAuthorized) {
      throw new Error("Primero verifica tu cuenta de Google.");
    }

    const error = validateNewPassword(password, confirmation);
    if (error) throw new Error(error);

    setSecurityBusy(true);
    try {
      const key = vaultKey || (await unlockVaultWithRecoveryCode(recoveryCode, securityData));
      const passwordData = await createPasswordHash(password);
      const wrapData = await rewrapVaultWithPassword(key, password);

      await setDoc(
        doc(db, "users", user.uid, "meta", "security"),
        {
          ...passwordData,
          ...wrapData,
          passwordUpdatedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      setPasswordResetAuthorized(false);
      unlockSession(key);
      return true;
    } finally {
      setSecurityBusy(false);
    }
  };

  const cancelPasswordReset = () => setPasswordResetAuthorized(false);

  return {
    accountsUnlocked,
    unlockSecondsLeft,
    vaultKey,
    securityBusy,
    passkeyAvailable,
    hasPasskey,
    hasPassword,
    passwordResetAuthorized,
    recoveryCodeToShow,
    clearRecoveryCodeToShow: () => setRecoveryCodeToShow(""),
    createInitialPassword,
    unlockWithPassword,
    unlockWithRegisteredPasskey,
    registerPasskeyForAccounts,
    beginForgotPassword,
    resetForgottenPassword,
    cancelPasswordReset,
    lockAccounts,
  };
}
