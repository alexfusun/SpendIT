import {
  GoogleAuthProvider,
  User,
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
} from "firebase/auth";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { auth } from "./firebase";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3001/api";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  getToken: () => Promise<string>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const provider = new GoogleAuthProvider();

async function syncUserWithBackend(user: User): Promise<void> {
  const token = await user.getIdToken();
  await fetch(`${API_BASE}/auth/me`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsub;
  }, []);

  async function signInWithGoogle() {
    const result = await signInWithPopup(auth, provider);
    await syncUserWithBackend(result.user);
  }

  async function signOut() {
    await firebaseSignOut(auth);
  }

  async function getToken(): Promise<string> {
    if (!auth.currentUser) throw new Error("Not authenticated");
    return auth.currentUser.getIdToken();
  }

  return (
    <AuthContext.Provider
      value={{ user, loading, signInWithGoogle, signOut, getToken }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
