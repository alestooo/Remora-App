import { useEffect, useState } from "react";
import { collection, doc, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "../services/firebase";
export default function useAccounts(user) {
  const [accounts, setAccounts] = useState([]);
  const [securityData, setSecurityData] = useState({});
  useEffect(() => {
    if (!user) { setAccounts([]); return; }
    const q = query(collection(db, "users", user.uid, "accounts"), orderBy("createdAt", "desc"));
    return onSnapshot(q, (snapshot) => setAccounts(snapshot.docs.map((document) => ({ id: document.id, ...document.data() }))));
  }, [user]);
  useEffect(() => {
    if (!user) { setSecurityData({}); return; }
    return onSnapshot(doc(db, "users", user.uid, "meta", "security"), (snapshot) => setSecurityData(snapshot.exists() ? snapshot.data() : {}));
  }, [user]);
  return { accounts, setAccounts, securityData, setSecurityData };
}
