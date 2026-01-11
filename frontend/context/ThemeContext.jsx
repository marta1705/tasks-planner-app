import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { createContext, useContext, useEffect, useState } from "react";
import { Colors } from "../themes/Colors";
import { auth, db } from "../services/firebase";

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
    const [theme, setTheme] = useState("light");
    const [user, setUser] = useState(null);

    useEffect(() => {
        // Zabezpieczenie przed błędem undefined (reading 'onAuthStateChanged')
        if (!auth) return;

        const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            if (!currentUser) {
                setTheme("light");
            }
        });

        return () => unsubscribeAuth();
    }, []);

    useEffect(() => {
        if (!user || !db) return;

        const userDocRef = doc(db, "users", user.uid);

        const unsubscribeSnapshot = onSnapshot(userDocRef, (docSnap) => {
            if (docSnap.exists()) {
                const userData = docSnap.data();
                if (userData.theme) {
                    setTheme(userData.theme);
                }
            }
        }, (error) => {
            if (error.code === 'permission-denied') return;
            console.error("Theme snapshot error:", error);
        });

        return () => unsubscribeSnapshot();
    }, [user]);

    const toggleTheme = async () => {
        const newTheme = theme === "light" ? "dark" : "light";
        setTheme(newTheme);

        if (user && db) {
            try {
                const userRef = doc(db, "users", user.uid);
                await setDoc(userRef, { theme: newTheme }, { merge: true });
            } catch (error) {
                console.error("Błąd zapisu motywu:", error);
            }
        }
    };

    const colors = Colors[theme] || Colors.light;

    const value = {
        theme,
        colors,
        toggleTheme,
        isDark: theme === 'dark'
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