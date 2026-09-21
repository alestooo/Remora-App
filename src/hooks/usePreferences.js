import { useEffect, useState } from "react";
import { doc, onSnapshot, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "../services/firebase";
import { DEFAULT_PREFERENCES } from "../constants/app";

const mergePreferences = (data = {}) => ({
  ...DEFAULT_PREFERENCES,
  ...data,
  dashboardCards: Array.isArray(data.dashboardCards)
    ? data.dashboardCards
    : DEFAULT_PREFERENCES.dashboardCards,
});

export default function usePreferences(user) {
  const [preferences, setPreferences] = useState(DEFAULT_PREFERENCES);
  const [preferencesLoading, setPreferencesLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setPreferences(DEFAULT_PREFERENCES);
      setPreferencesLoading(false);
      return undefined;
    }

    setPreferencesLoading(true);

    return onSnapshot(
      doc(db, "users", user.uid, "meta", "preferences"),
      (snapshot) => {
        setPreferences(mergePreferences(snapshot.exists() ? snapshot.data() : {}));
        setPreferencesLoading(false);
      },
      (error) => {
        console.error("Preferences error:", error);
        setPreferences(DEFAULT_PREFERENCES);
        setPreferencesLoading(false);
      }
    );
  }, [user]);

  const savePreferences = async (patch) => {
    if (!user) return;

    const next = mergePreferences({ ...preferences, ...patch });
    setPreferences(next);

    await setDoc(
      doc(db, "users", user.uid, "meta", "preferences"),
      {
        ...patch,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  };

  return {
    preferences,
    preferencesLoading,
    savePreferences,
  };
}
