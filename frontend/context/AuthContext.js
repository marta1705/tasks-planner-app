// AuthProvider.js
import { onAuthStateChanged } from "firebase/auth";
import { doc, getFirestore, updateDoc } from "firebase/firestore";
import { createContext, useContext, useEffect, useState } from "react";
import { auth } from "../services/firebase";

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const [registering, setRegistering] = useState(false);
  const db = getFirestore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        if (user) {
          // odświeża dane użytkownika
          await user.reload();
          const refreshedUser = auth.currentUser;

          // aktualizacja usera
          if (!refreshedUser) {
            setUser(null);
            setLoading(false);
            return;
          }
          setUser(refreshedUser);

          if (refreshedUser?.uid) {
            const userRef = doc(db, "users", refreshedUser.uid);
            await updateDoc(userRef, { email: refreshedUser.email }).catch(() => { });
          }

        } else {
          setUser(null);
        }

        setLoading(false);
        setInitialized(true);
      } catch (err) {
        console.log("Auth error:", err);
        setLoading(false);
        setInitialized(true);
      }
    });

    return unsubscribe;
  }, []);


  const value = {
    user,
    isAuthenticated: !!user,
    loading,
    initialized,
    registering,
    setRegistering,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}