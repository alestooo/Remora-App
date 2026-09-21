import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../services/firebase";

export default function useSecurityData(user) {
  const [securityData, setSecurityData] = useState({});
  const [securityLoading, setSecurityLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setSecurityData({});
      setSecurityLoading(false);
      return undefined;
    }

    setSecurityLoading(true);
    return onSnapshot(
      doc(db, "users", user.uid, "meta", "security"),
      (snapshot) => {
        setSecurityData(snapshot.exists() ? snapshot.data() : {});
        setSecurityLoading(false);
      },
      (error) => {
        console.error("Security data error:", error);
        setSecurityData({});
        setSecurityLoading(false);
      }
    );
  }, [user]);

  return { securityData, securityLoading };
}
