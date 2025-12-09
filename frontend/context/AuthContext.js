// AuthProvider.js

import { onAuthStateChanged } from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";
import { createContext, useContext, useEffect, useState } from "react";
// Importujemy funkcję do inicjalizacji ORAZ zainicjalizowane zmienne 'let'
import { auth, db, initializeFirebaseClient } from "../services/firebase";

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  
  // USUNIĘTO: const db = getFirestore(); -> Ta linia była błędem.
  // Używamy teraz zainicjalizowanego, globalnego 'db' zaimportowanego z services/firebase.js

  useEffect(() => {
    
    let unsubscribeAuth = null;

    const setupFirebaseAndAuth = async () => {
      try {
        // KROK 1: POCZEKAJ NA PEŁNĄ INICJALIZACJĘ FIREBASE
        await initializeFirebaseClient(); 

        // KROK 2: JEŻELI INICJALIZACJA POWIODŁA SIĘ, URUCHOM NASŁUCHIWANIE
        if (auth && db) {
          // Używamy ZAINICJALIZOWANEGO 'auth'
          unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
            try {
              if (user) {
                // Odświeża dane użytkownika
                await user.reload();
                const refreshedUser = auth.currentUser; 

                if (refreshedUser) {
                  setUser(refreshedUser);

                  // Używamy ZAINICJALIZOWANEGO 'db'
                  const userRef = doc(db, "users", refreshedUser.uid);
                  // Aktualizacja dokumentu użytkownika
                  await updateDoc(userRef, { email: refreshedUser.email }).catch((e) => { 
                      console.warn("Could not update user doc on sign-in:", e.message);
                  });
                } else {
                  setUser(null);
                }
              } else {
                setUser(null);
              }
            } catch (authError) {
              console.error("Auth listener error:", authError);
            } finally {
              // Ustawiamy loading=false po pierwszym sprawdzeniu stanu autentykacji
              setLoading(false);
            }
          });
        } else {
            console.error("Błąd: Firebase nie zainicjalizowany poprawnie. Aplikacja Auth jest zablokowana.");
            setLoading(false);
        }

      } catch (initError) {
        console.error("Krytyczny błąd podczas setupu Firebase/Auth:", initError);
        setLoading(false);
      }
    };
    
    setupFirebaseAndAuth();

    // KROK 3: CLEANUP (Zatrzymanie nasłuchiwania przy odmontowaniu)
    return () => {
        if(unsubscribeAuth) {
            unsubscribeAuth();
        }
    };
  }, []); // Pusta tablica zależności: uruchamiamy tylko raz, po zamontowaniu.

  // ZAPEWNIENIE EKRANU ŁADOWANIA JEST KLUCZOWE!
  if (loading) {
     return <div>Ładowanie danych uwierzytelniania...</div>; 
  }

  const value = {
    user,
    isAuthenticated: !!user,
    // ... (pozostałe wartości)
    loading,
    registering,
    setRegistering,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}