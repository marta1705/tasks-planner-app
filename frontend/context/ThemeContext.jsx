import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { createContext, useContext, useEffect, useState } from "react";
import { Colors } from "../app/themes/Colors";
import { auth, db } from "../services/firebase";

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
    //const systemTheme = Appearance.getColorScheme(); // "light" / "dark"
    const [theme, setTheme] = useState("light");
    const [user, setUser] = useState(null);

    // 1. EFEKT AUTH: Tylko pilnuje, czy ktoś jest zalogowany
    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser); // Aktualizujemy stan, co wymusi uruchomienie Efektu nr 2

            if (!currentUser) {
                setTheme("light"); // Reset po wylogowaniu
            }
        });

        return () => unsubscribeAuth();
    }, []);

    // 2. EFEKT FIRESTORE: Reaguje na zmianę 'user'
    useEffect(() => {
        // Jeśli nie ma usera, nie uruchamiaj nasłuchu!
        if (!user) return;

        const userDocRef = doc(db, "users", user.uid);

        // Uruchamiamy nasłuch
        const unsubscribeSnapshot = onSnapshot(userDocRef, (docSnap) => {
            if (docSnap.exists()) {
                const userData = docSnap.data();
                if (userData.theme) {
                    setTheme(userData.theme);
                }
            }
        }, (error) => {
            // Zabezpieczenie: ignoruj błąd uprawnień przy wylogowywaniu
            if (error.code === 'permission-denied') return;
            console.error("Theme snapshot error:", error);
        });

        // TO JEST KLUCZ DO SUKCESU:
        // Ta funkcja wykona się AUTOMATYCZNIE w momencie, gdy 'user' zmieni się na null (wylogowanie).
        // React sam posprząta nasłuch, zanim Firebase zdąży rzucić błędem.
        return () => unsubscribeSnapshot();

    }, [user]);

    // 2. Funkcja przełączania motywu z zapisem do bazy
    const toggleTheme = async () => {
        const newTheme = theme === "light" ? "dark" : "light";

        // Optymistyczna aktualizacja (zmieniamy od razu w aplikacji, żeby było szybko)
        setTheme(newTheme);

        // Jeśli użytkownik jest zalogowany, zapisujemy to w Firestore
        if (user) {
            try {
                const userRef = doc(db, "users", user.uid);

                // Sprawdzamy czy dokument istnieje, żeby uniknąć błędu przy update
                // (choć przy rejestracji powinien być stworzony, to dla bezpieczeństwa)
                await setDoc(userRef, { theme: newTheme }, { merge: true });

            } catch (error) {
                console.error("Błąd zapisu motywu do Firebase:", error);
                // Opcjonalnie: można tu cofnąć zmianę setTheme, jeśli zapis się nie udał
            }
        }
    };

    const activeColors = Colors[theme] || Colors.light;

    const colors = Colors[theme];

    const value = {
        theme,          // "light" lub "dark"
        colors,         // Obiekt z konkretnymi kolorami { background: '...', text: '...' }
        toggleTheme,    // Funkcja zmiany
        isDark: theme === 'dark' // Pomocnicza flaga
    };

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    return useContext(ThemeContext);
}
