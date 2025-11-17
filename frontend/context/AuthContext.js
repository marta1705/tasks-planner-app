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
  const db = getFirestore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // odświeża dane użytkownika
        await user.reload();
        const refreshedUser = auth.currentUser;

        // aktualizacja usera
        setUser(refreshedUser);

        // === AKTUALIZACJA EMAILA W FIRESTORE ===
        try {
          const userRef = doc(db, "users", refreshedUser.uid);
          await updateDoc(userRef, { email: refreshedUser.email });
        } catch (err) {
          console.log("Firestore update error:", err);
        }
      } else {
        setUser(null);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);


  const value = {
    user,
    isAuthenticated: !!user,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
