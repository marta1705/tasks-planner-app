import { onAuthStateChanged } from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";
import { createContext, useContext, useEffect, useState } from "react";
// Importujemy teraz tylko funkcję inicjalizującą i niezainicjalizowane instancje,
// które będą wypełnione po jej wywołaniu.
import { auth, initializeFirebaseClient } from "../services/firebase";

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const db = getFirestore();
  // Nowy stan śledzący, czy Firebase zostało już zainicjalizowane
  const [isFirebaseInitialized, setIsFirebaseInitialized] = useState(false);

  // === KROK 1: INICJALIZACJA FIREBASE ===
  useEffect(() => {
    async function initFirebase() {
      try {
        // Czekamy na zainicjowanie globalnych instancji 'auth' i 'db' 
        // w pliku services/firebase.js
        const { auth: initializedAuth, db: initializedDb } = await initializeFirebaseClient();

        if (initializedAuth && initializedDb) {
          setIsFirebaseInitialized(true);
        } else {
          // W przypadku błędu (np. na serwerze SSR) kończymy ładowanie
          console.error("Firebase failed to initialize on client.");
          setLoading(false);
        }
      } catch (error) {
        console.error("Error during Firebase initialization:", error);
        setLoading(false);
      }
    }

    // Zapobiega wielokrotnemu uruchomieniu w Hot Reloading
    if (!isFirebaseInitialized) {
      initFirebase();
    }
  }, []);


  // === NASŁUCHIWANIE ZMIAN AUTORYZACJI PO INICJALIZACJI ===
  useEffect(() => {
    // nasłuchiwanie tylko gdy Firebase jest gotowe
    if (!isFirebaseInitialized) {
      return;
    }

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
      } catch (err) {
        console.log("Auth error:", err);
        setLoading(false);
      }
    });

    return unsubscribe;
  }, [isFirebaseInitialized]);

  const value = {
    user,
    isAuthenticated: !!user,
    // Loading jest true, dopóki Firebase się nie zainicjalizuje i nie sprawdzi stanu Auth
    loading,
    registering,
    setRegistering,
  };

  if (loading) {
    // Można tu użyć jakiegoś dedykowanego komponentu ładowania
    return null;
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}