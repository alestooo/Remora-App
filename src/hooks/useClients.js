import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "../services/firebase";
export default function useClients(user) {
  const [clients, setClients] = useState([]);
  useEffect(() => {
    if (!user) { setClients([]); return; }
    const q = query(collection(db, "users", user.uid, "clients"), orderBy("createdAt", "desc"));
    return onSnapshot(q, (snapshot) => setClients(snapshot.docs.map((document) => ({ id: document.id, ...document.data() }))));
  }, [user]);
  return { clients, setClients };
}
