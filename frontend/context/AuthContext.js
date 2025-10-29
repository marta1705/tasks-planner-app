import { onAuthStateChanged } from "firebase/auth";
import { createContext, useContext, useEffect, useState } from "react";
import { auth } from "../services/firebase";

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    user,
    isAuthenticated: !!user,
    loading,
  };

  // dopóki nie zostanie sprawdzony stan autentykacji, aby uniknąć migotania ekranu
  // if (loading) {
  //   return null;
  // }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
