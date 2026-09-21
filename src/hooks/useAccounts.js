import { useEffect, useState } from "react";
import {
  collection,
  deleteField,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "../services/firebase";
import { decryptAccountPayload, encryptAccountPayload } from "../services/vault";

const accountPayloadFromLegacy = (data) => ({
  title: data.title || "",
  username: data.username || "",
  cedula: data.cedula || "",
  email: data.email || "",
  user: data.user || "",
  password: data.password || "",
  pin: data.pin || "",
});

export default function useAccounts(user, vaultKey) {
  const [rawAccounts, setRawAccounts] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [accountsLoading, setAccountsLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      setRawAccounts([]);
      setAccounts([]);
      return undefined;
    }

    setAccountsLoading(true);
    const accountsQuery = query(
      collection(db, "users", user.uid, "accounts"),
      orderBy("createdAt", "desc")
    );

    return onSnapshot(
      accountsQuery,
      (snapshot) => {
        setRawAccounts(snapshot.docs.map((document) => ({ id: document.id, ...document.data() })));
        setAccountsLoading(false);
      },
      (error) => {
        console.error("Accounts error:", error);
        setAccountsLoading(false);
      }
    );
  }, [user]);

  useEffect(() => {
    let cancelled = false;

    const decryptAccounts = async () => {
      if (!user || !vaultKey) {
        setAccounts([]);
        return;
      }

      const result = [];
      for (const raw of rawAccounts) {
        try {
          const payload = await decryptAccountPayload(raw, vaultKey);
          result.push({ id: raw.id, ...payload, createdAt: raw.createdAt, updatedAt: raw.updatedAt });

          if (!raw.encryptedPayload) {
            const encrypted = await encryptAccountPayload(accountPayloadFromLegacy(raw), vaultKey);
            await updateDoc(doc(db, "users", user.uid, "accounts", raw.id), {
              ...encrypted,
              title: deleteField(),
              username: deleteField(),
              cedula: deleteField(),
              email: deleteField(),
              user: deleteField(),
              password: deleteField(),
              pin: deleteField(),
              migratedToEncryptedAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
          }
        } catch (error) {
          console.error(`Could not decrypt account ${raw.id}:`, error);
        }
      }

      if (!cancelled) setAccounts(result);
    };

    decryptAccounts();
    return () => {
      cancelled = true;
    };
  }, [user, vaultKey, rawAccounts]);

  return { accounts, accountsLoading, rawAccounts };
}
