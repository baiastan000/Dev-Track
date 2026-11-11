import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  getDemoActivity,
  getDemoSession,
  getDemoUsers,
  recordDemoActivity,
  registerDemoUser,
  resetDemoPassword,
  signInDemoUser,
  signOutDemoUser,
  updateDemoLastSeen,
  updateDemoDisplayName,
} from "../lib/demoAuth.js";

const AuthContext = createContext(null);
const AUTH_UPDATE_EVENT = "devtrack:demo-auth-updated";

function getUserDisplayName(user) {
  const displayName = user?.user_metadata?.display_name;
  return typeof displayName === "string" ? displayName.trim() : "";
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState("");
  const [users, setUsers] = useState([]);
  const [activity, setActivity] = useState([]);
  const initialVisitLogged = useRef(false);
  const lastSeenErrorShown = useRef(false);

  useEffect(() => {
    function refreshDirectory() {
      try {
        setUsers(getDemoUsers());
        setActivity(getDemoActivity());
      } catch (error) {
        console.error("Could not load demo user activity.", error);
        setAuthError(error.message || "Не удалось загрузить список пользователей.");
      }
    }

    function handleStorageChange(event) {
      if (event.key === "devtrack.demo-auth.v1" || event.key === null) {
        refreshDirectory();
      }
    }

    window.addEventListener(AUTH_UPDATE_EVENT, refreshDirectory);
    window.addEventListener("storage", handleStorageChange);
    try {
      const user = getDemoSession();
      setSession({ user });
      if (user && !initialVisitLogged.current) {
        initialVisitLogged.current = true;
        recordDemoActivity(user.id, "site_visit");
      }
      refreshDirectory();
      setLoading(false);
    } catch (error) {
      setAuthError(error.message || "Не удалось восстановить демо-сессию.");
      setLoading(false);
    }

    return () => {
      window.removeEventListener(AUTH_UPDATE_EVENT, refreshDirectory);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  useEffect(() => {
    const userId = session?.user?.id;
    if (!userId) return undefined;

    function updateLastSeen() {
      if (document.visibilityState !== "visible") return;
      try {
        updateDemoLastSeen(userId);
        lastSeenErrorShown.current = false;
      } catch (error) {
        console.error("Could not update demo user activity.", error);
        if (!lastSeenErrorShown.current) {
          setAuthError(error.message || "Не удалось обновить активность пользователя.");
          lastSeenErrorShown.current = true;
        }
      }
    }

    updateLastSeen();
    const heartbeat = window.setInterval(updateLastSeen, 30_000);
    document.addEventListener("visibilitychange", updateLastSeen);
    return () => {
      window.clearInterval(heartbeat);
      document.removeEventListener("visibilitychange", updateLastSeen);
    };
  }, [session?.user?.id]);

  const value = useMemo(
    () => ({
      user: session?.user ?? null,
      displayName: getUserDisplayName(session?.user),
      users,
      activity,
      loading,
      authError,
      async register(email, password, displayName) {
        const user = await registerDemoUser(email, password, displayName);
        setSession({ user });
        setAuthError("");
      },
      async signIn(email, password) {
        const user = await signInDemoUser(email, password);
        setSession({ user });
        setAuthError("");
      },
      async resetPassword(email, password) {
        await resetDemoPassword(email, password);
      },
      clearAuthError() {
        setAuthError("");
      },
      showAuthError(message) {
        setAuthError(message);
      },
      async updateDisplayName(value) {
        const displayName = value.trim();
        if (!displayName) throw new Error("Введите имя.");

        if (!session?.user) throw new Error("Войдите в демо-аккаунт.");
        const user = updateDemoDisplayName(session.user.id, displayName);
        setSession({ user });
      },
      trackActivity(type, details) {
        if (!session?.user) return;
        try {
          recordDemoActivity(session.user.id, type, details);
        } catch (error) {
          console.error("Could not record demo user activity.", error);
          setAuthError(error.message || "Не удалось сохранить действие пользователя.");
        }
      },
      async signOut() {
        signOutDemoUser();
        setSession(null);
      },
    }),
    [session, users, activity, loading, authError],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth должен использоваться внутри AuthProvider.");
  }
  return context;
}
