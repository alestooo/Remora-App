import { useEffect, useState } from "react";
import { onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";
import { auth, provider } from "../services/firebase";
export default function useAuth({ onLoginError } = {}) {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  useEffect(() => {
    let mounted = true;
    const fallback = setTimeout(() => { if (mounted) setAuthLoading(false); }, 3000);
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => { clearTimeout(fallback); if (!mounted) return; setUser(currentUser); setAuthLoading(false); }, (error) => { clearTimeout(fallback); console.error("Auth error:", error); if (mounted) setAuthLoading(false); });
    return () => { mounted = false; clearTimeout(fallback); unsubscribe(); };
  }, []);
  const login = async () => { try { await signInWithPopup(auth, provider); } catch (error) { onLoginError?.(error); } };
  const logout = () => signOut(auth);
  return { user, authLoading, login, logout };
}
