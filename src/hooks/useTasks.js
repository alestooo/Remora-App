import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "../services/firebase";
export default function useTasks(user, { onLoadError } = {}) {
  const [tasks, setTasks] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  useEffect(() => {
    if (!user) { setTasks([]); return; }
    setTasksLoading(true);
    const q = query(collection(db, "users", user.uid, "tasks"), orderBy("createdAt", "desc"));
    return onSnapshot(q, (snapshot) => { setTasks(snapshot.docs.map((document) => ({ id: document.id, ...document.data() }))); setTasksLoading(false); }, (error) => { setTasksLoading(false); onLoadError?.(error); });
  }, [user, onLoadError]);
  return { tasks, setTasks, tasksLoading };
}
