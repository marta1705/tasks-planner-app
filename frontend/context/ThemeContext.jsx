import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { createContext, useContext, useEffect, useState } from "react";
import { Colors } from "../themes/Colors";
import { auth, db } from "../services/firebase";

const ThemeContext = createContext();

export function ThemeProvider({ children }) {

    const [theme, setTheme] = useState("light");
    const [user, setUser] = useState(null);

    // pilnuje, czy ktoś jest zalogowany
    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser); // Aktualizujemy stan, co wymusi uruchomienie Efektu nr 2

            if (!currentUser) {
                setTheme("light"); // Reset po wylogowaniu
            }
        });

        return () => unsubscribeAuth();
    }, []);

    // Reaguje na zmianę 'user'
    useEffect(() => {
        // Jeśli nie ma usera, nie uruchomi nasłuchu
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
            // ignoruje błąd uprawnień przy wylogowywaniu
            if (error.code === 'permission-denied') return;
            console.error("Theme snapshot error:", error);
        });

        // Ta funkcja wykona się AUTOMATYCZNIE w momencie, gdy 'user' zmieni się na null (wylogowanie).
        // React sam posprząta nasłuch, zanim Firebase zdąży rzucić błędem.
        return () => unsubscribeSnapshot();

    }, [user]);

    // Funkcja przełączania motywu z zapisem do bazy
    const toggleTheme = async () => {
        const newTheme = theme === "light" ? "dark" : "light";

        setTheme(newTheme);

        // zapis do Firestore
        if (user) {
            try {
                const userRef = doc(db, "users", user.uid);

                await setDoc(userRef, { theme: newTheme }, { merge: true });

            } catch (error) {
                console.error("Błąd zapisu motywu do Firebase:", error);
            }
        }
    };

    const activeColors = Colors[theme] || Colors.light;

    const colors = Colors[theme];

    const value = {
        theme,          // "light" lub "dark"
        colors,         // Obiekt z konkretnymi kolorami
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
