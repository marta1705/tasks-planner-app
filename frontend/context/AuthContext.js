import { onAuthStateChanged } from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";
import { createContext, useContext, useEffect, useState } from "react";
// Importujemy teraz tylko funkcję inicjalizującą i niezainicjalizowane instancje,
// które będą wypełnione po jej wywołaniu.
import { auth, db, initializeFirebaseClient } from "../services/firebase";

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
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


  // === KROK 2: NASŁUCHIWANIE ZMIAN AUTORYZACJI PO INICJALIZACJI ===
  useEffect(() => {
    // Uruchamiamy nasłuchiwanie TYLKO gdy Firebase jest gotowe
    if (!isFirebaseInitialized) {
      return;
    }

    // Teraz instancja 'auth' powinna być już wypełniona
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // odświeża dane użytkownika
        await user.reload();
        const refreshedUser = auth.currentUser;

        // aktualizacja usera
        setUser(refreshedUser);

        // === AKTUALIZACJA EMAILA W FIRESTORE ===
        try {
          // Instancja 'db' powinna być już wypełniona
          const userRef = doc(db, "users", refreshedUser.uid);
          await updateDoc(userRef, { email: refreshedUser.email });
        } catch (err) {
          console.log("Firestore update error (is db initialized?):", err);
        }
      } else {
        setUser(null);
      }

      setLoading(false);
    });

    return unsubscribe;
    // Zależności: Nasłuchujemy zmian tylko po udanej inicjalizacji
  }, [isFirebaseInitialized]);


  const value = {
    user,
    isAuthenticated: !!user,
    // Loading jest true, dopóki Firebase się nie zainicjalizuje i nie sprawdzi stanu Auth
    loading,
  };

  // Opcjonalnie: Możesz wyświetlić ekran ładowania, dopóki wszystko nie będzie gotowe
  if (loading) {
      // Można tu użyć jakiegoś dedykowanego komponentu ładowania
      return null; 
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}