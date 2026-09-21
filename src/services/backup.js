import {
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  Timestamp,
  writeBatch,
} from "firebase/firestore";
import { db } from "./firebase";
import { BACKUP_VERSION } from "../constants/app";

const COLLECTIONS = ["tasks", "notes", "clients", "accounts"];

const serializeValue = (value) => {
  if (value instanceof Timestamp) {
    return { __type: "timestamp", milliseconds: value.toMillis() };
  }
  if (Array.isArray(value)) return value.map(serializeValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, serializeValue(item)])
    );
  }
  return value;
};

const reviveValue = (value) => {
  if (Array.isArray(value)) return value.map(reviveValue);
  if (value && typeof value === "object") {
    if (value.__type === "timestamp") {
      return Timestamp.fromMillis(value.milliseconds);
    }
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, reviveValue(item)])
    );
  }
  return value;
};

const readCollection = async (uid, name) => {
  const snapshot = await getDocs(collection(db, "users", uid, name));
  return snapshot.docs.map((item) => ({
    id: item.id,
    data: serializeValue(item.data()),
  }));
};

const readMeta = async (uid, name) => {
  const snapshot = await getDoc(doc(db, "users", uid, "meta", name));
  return snapshot.exists() ? serializeValue(snapshot.data()) : null;
};

export const createBackupObject = async (user) => {
  if (!user) throw new Error("No hay una sesión activa.");

  const collections = {};
  for (const name of COLLECTIONS) {
    collections[name] = await readCollection(user.uid, name);
  }

  const security = await readMeta(user.uid, "security");
  const preferences = await readMeta(user.uid, "preferences");
  const tools = await readMeta(user.uid, "tools");

  if (security) {
    delete security.passkeyCredentialId;
    delete security.passkeyCredentialIds;
  }

  return {
    app: "Remora",
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    uid: user.uid,
    email: user.email || "",
    collections,
    meta: {
      security,
      preferences,
      tools,
    },
  };
};

export const downloadBackup = async (user) => {
  const backup = await createBackupObject(user);
  const blob = new Blob([JSON.stringify(backup, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  const date = new Date().toISOString().slice(0, 10);
  anchor.href = url;
  anchor.download = `remora-backup-${date}.json`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
};

const commitInChunks = async (operations) => {
  for (let index = 0; index < operations.length; index += 450) {
    const batch = writeBatch(db);
    operations.slice(index, index + 450).forEach((operation) => operation(batch));
    await batch.commit();
  }
};

export const importBackupObject = async (user, backup) => {
  if (!user) throw new Error("No hay una sesión activa.");
  if (!backup || backup.app !== "Remora") {
    throw new Error("El archivo no parece ser una copia de Remora.");
  }
  if (!backup.collections) {
    throw new Error("La copia está incompleta.");
  }

  const operations = [];

  for (const name of COLLECTIONS) {
    const items = Array.isArray(backup.collections[name])
      ? backup.collections[name]
      : [];

    items.forEach((item) => {
      if (!item?.id || !item?.data) return;
      operations.push((batch) => {
        batch.set(
          doc(db, "users", user.uid, name, item.id),
          {
            ...reviveValue(item.data),
            restoredAt: serverTimestamp(),
          },
          { merge: true }
        );
      });
    });
  }

  ["security", "preferences", "tools"].forEach((name) => {
    const data = backup.meta?.[name];
    if (!data) return;
    operations.push((batch) => {
      batch.set(
        doc(db, "users", user.uid, "meta", name),
        {
          ...reviveValue(data),
          restoredAt: serverTimestamp(),
        },
        { merge: true }
      );
    });
  });

  await commitInChunks(operations);
  return operations.length;
};

export const importBackupFile = async (user, file) => {
  const text = await file.text();
  let backup;
  try {
    backup = JSON.parse(text);
  } catch {
    throw new Error("El archivo JSON no es válido.");
  }
  return importBackupObject(user, backup);
};
