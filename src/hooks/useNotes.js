import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "../services/firebase";
export default function useNotes(user) {
  const [notes, setNotes] = useState([]);
  useEffect(() => {
    if (!user) { setNotes([]); return; }
    const q = query(collection(db, "users", user.uid, "notes"), orderBy("position", "asc"));
    return onSnapshot(q, (snapshot) => setNotes(snapshot.docs.map((document) => ({ id: document.id, ...document.data() }))));
  }, [user]);
  return { notes, setNotes };
}
