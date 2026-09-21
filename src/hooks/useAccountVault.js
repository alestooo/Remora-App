import { useEffect, useState } from "react";
import { collection, deleteDoc, doc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "../services/firebase";
import { encryptAccountPayload } from "../services/vault";

const EMPTY_ACCOUNT_FORM = {
  title: "",
  username: "",
  cedula: "",
  email: "",
  user: "",
  password: "",
  pin: "",
};

export default function useAccountVault({ user, security, showAlert, closeAlert }) {
  const [visibleAccountId, setVisibleAccountId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_ACCOUNT_FORM);
  const [errors, setErrors] = useState({});
  const [masterInput, setMasterInput] = useState("");
  const [newMasterPassword, setNewMasterPassword] = useState("");
  const [confirmMasterPassword, setConfirmMasterPassword] = useState("");
  const [recoveryCode, setRecoveryCode] = useState("");

  useEffect(() => {
    if (!security.accountsUnlocked) setVisibleAccountId(null);
  }, [security.accountsUnlocked]);

  const clearSecurityInputs = () => {
    setMasterInput("");
    setNewMasterPassword("");
    setConfirmMasterPassword("");
    setRecoveryCode("");
  };

  const createInitialPassword = async () => {
    try {
      await security.createInitialPassword(newMasterPassword, confirmMasterPassword);
      clearSecurityInputs();
    } catch (error) {
      showAlert({ type: "warning", title: "No se pudo crear", message: error.message, confirmText: "Entendido", onlyConfirm: true, onConfirm: closeAlert });
    }
  };

  const unlockAccounts = async () => {
    try {
      await security.unlockWithPassword(masterInput);
      clearSecurityInputs();
    } catch (error) {
      setMasterInput("");
      showAlert({ type: "warning", title: "No se pudo desbloquear", message: error.message, confirmText: "Entendido", onlyConfirm: true, onConfirm: closeAlert });
    }
  };

  const unlockAccountsWithPasskey = async () => {
    try {
      await security.unlockWithRegisteredPasskey();
      clearSecurityInputs();
    } catch (error) {
      showAlert({ type: "warning", title: "No se pudo usar la Passkey", message: error.message, confirmText: "Entendido", onlyConfirm: true, onConfirm: closeAlert });
    }
  };

  const beginForgotPassword = async () => {
    try {
      await security.beginForgotPassword();
      clearSecurityInputs();
    } catch (error) {
      showAlert({ type: "warning", title: "No se pudo verificar tu cuenta", message: error.message, confirmText: "Entendido", onlyConfirm: true, onConfirm: closeAlert });
    }
  };

  const resetForgottenPassword = async () => {
    try {
      await security.resetForgottenPassword({
        password: newMasterPassword,
        confirmation: confirmMasterPassword,
        recoveryCode,
      });
      clearSecurityInputs();
      showAlert({ type: "success", title: "Contraseña actualizada", message: "Tu bóveda continúa cifrada y ya usa la nueva contraseña.", confirmText: "Listo", onlyConfirm: true, onConfirm: closeAlert });
    } catch (error) {
      showAlert({ type: "warning", title: "No se pudo restablecer", message: error.message, confirmText: "Entendido", onlyConfirm: true, onConfirm: closeAlert });
    }
  };

  const registerPasskeyForAccounts = async () => {
    try {
      await security.registerPasskeyForAccounts();
      showAlert({ type: "success", title: "Passkey registrada", message: "Este dispositivo quedó vinculado a la bóveda cifrada.", confirmText: "Listo", onlyConfirm: true, onConfirm: closeAlert });
    } catch (error) {
      showAlert({ type: "warning", title: "No se pudo registrar", message: error.message, confirmText: "Entendido", onlyConfirm: true, onConfirm: closeAlert });
    }
  };

  const save = async () => {
    const nextErrors = {};
    if (!form.title.trim()) nextErrors.title = "Agrega un título.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    if (!security.vaultKey) {
      showAlert({ type: "warning", title: "Bóveda bloqueada", message: "Desbloquea Cuentas antes de guardar una credencial.", confirmText: "Entendido", onlyConfirm: true, onConfirm: closeAlert });
      return;
    }

    const encrypted = await encryptAccountPayload(form, security.vaultKey);
    const accountRef = doc(collection(db, "users", user.uid, "accounts"));
    await setDoc(accountRef, {
      id: accountRef.id,
      ...encrypted,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    setForm(EMPTY_ACCOUNT_FORM);
    setShowModal(false);
  };

  const remove = (id) => showAlert({
    type: "danger",
    title: "Eliminar cuenta",
    message: "¿Seguro que quieres eliminar esta cuenta? Esta acción no se puede deshacer.",
    confirmText: "Sí, eliminar",
    cancelText: "Cancelar",
    onConfirm: async () => {
      await deleteDoc(doc(db, "users", user.uid, "accounts", id));
      closeAlert();
    },
  });

  const toggleVisible = (id) => setVisibleAccountId((current) => current === id ? null : id);

  const lockAccounts = () => {
    security.lockAccounts();
    setVisibleAccountId(null);
  };

  return {
    visibleAccountId,
    setVisibleAccountId,
    showModal,
    setShowModal,
    form, setForm,
    errors,
    masterInput, setMasterInput,
    newMasterPassword, setNewMasterPassword,
    confirmMasterPassword, setConfirmMasterPassword,
    recoveryCode, setRecoveryCode,
    clearSecurityInputs,
    createInitialPassword,
    unlockAccounts,
    unlockAccountsWithPasskey,
    beginForgotPassword,
    resetForgottenPassword,
    registerPasskeyForAccounts,
    save,
    remove,
    toggleVisible,
    lockAccounts,
  };
}
