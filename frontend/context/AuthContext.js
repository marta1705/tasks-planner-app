// context/AuthContext.js
import { onAuthStateChanged } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore"; // Importujemy setDoc dla bezpieczeństwa
import { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "../services/firebase"; // Upewnij się, że firebase.js eksportuje zainicjalizowane obiekty

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);

  useEffect(() => {
    // Sprawdzamy czy auth istnieje, aby uniknąć błędu "Cannot read properties of undefined"
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          // Odświeżamy dane użytkownika
          await firebaseUser.reload();
          const refreshedUser = auth.currentUser;

          if (!refreshedUser) {
            setUser(null);
            setLoading(false);
            return;
          }
          
          setUser(refreshedUser);

          // Synchronizacja z Firestore
          if (refreshedUser?.uid) {
            const userRef = doc(db, "users", refreshedUser.uid);
            
            // setDoc + merge: true tworzy dokument jeśli go brakuje
            // Naprawia to błąd "No document to update" z logów
            await setDoc(userRef, { 
              email: refreshedUser.email,
              lastLogin: new Date().toISOString()
            }, { merge: true }).catch((err) => {
              console.log("Firestore sync error:", err.message);
            });
          }
        } else {
          setUser(null);
        }
      } catch (err) {
        console.log("Auth internal error:", err);
      } finally {
        // Zawsze wyłączamy ekran ładowania
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const value = {
    user,
    isAuthenticated: !!user,
    loading,
    registering,
    setRegistering,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}