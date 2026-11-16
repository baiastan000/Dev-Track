import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  getDemoActivity,
  getDemoUsers,
  recordDemoActivity,
  updateDemoLastSeen,
} from "../lib/demoAuth.js";

const AuthContext = createContext(null);
const AUTH_UPDATE_EVENT = "devtrack:demo-auth-updated";
const apiBaseUrl = (
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.PROD ? "https://dev-track-yptw.onrender.com" : "")
).replace(/\/+$/, "");

async function getCsrfToken() {
  const response = await fetch(`${apiBaseUrl}/api/v1/auth/csrf/`, {
    credentials: "include",
  });
  const payload = await response.json();
  if (!response.ok || typeof payload.csrfToken !== "string") {
    throw new Error("Could not initialize a secure authentication request.");
  }
  return payload.csrfToken;
}

function getErrorMessage(payload, fallback) {
  if (typeof payload?.detail === "string") return payload.detail;
  for (const value of Object.values(payload || {})) {
    if (typeof value === "string") return value;
    if (Array.isArray(value) && typeof value[0] === "string") return value[0];
  }
  return fallback;
}

async function authRequest(path, { method = "GET", body } = {}) {
  const headers = {};
  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    headers["X-CSRFToken"] = await getCsrfToken();
  }

  const response = await fetch(`${apiBaseUrl}/api/v1/auth/${path}`, {
    method,
    credentials: "include",
    headers,
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  let payload = {};
  try {
    payload = await response.json();
  } catch (error) {
    if (response.ok) throw new Error("The authentication server returned an invalid response.");
  }
  if (!response.ok) {
    throw new Error(getErrorMessage(payload, `The authentication request failed (HTTP ${response.status}).`));
  }
  return payload;
}

function getUserDisplayName(user) {
  if (typeof user?.display_name === "string") return user.display_name.trim();
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
    let active = true;
    function refreshDirectory() {
      try {
        if (active) {
          setUsers(getDemoUsers());
          setActivity(getDemoActivity());
        }
      } catch (error) {
        console.error("Could not load demo user activity.", error);
        if (active) setAuthError(error.message || "Не удалось загрузить список пользователей.");
      }
    }

    function handleStorageChange(event) {
      if (event.key === "devtrack.demo-auth.v1" || event.key === null) {
        refreshDirectory();
      }
    }

    window.addEventListener(AUTH_UPDATE_EVENT, refreshDirectory);
    window.addEventListener("storage", handleStorageChange);
    authRequest("session/")
      .then(({ user }) => {
        if (!active) return;
        setSession(user ? { user } : null);
        if (user && !initialVisitLogged.current) {
          initialVisitLogged.current = true;
          recordDemoActivity(user.id, "site_visit");
        }
        refreshDirectory();
      })
      .catch((error) => {
        console.error("Could not restore the server session.", error);
        if (active) setAuthError(error.message || "Не удалось восстановить сессию.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
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
        const { user } = await authRequest("register/", {
          method: "POST",
          body: { email, display_name: displayName, password },
        });
        setSession({ user });
        setAuthError("");
      },
      async signIn(email, password) {
        const { user } = await authRequest("login/", {
          method: "POST",
          body: { email, password },
        });
        setSession({ user });
        setAuthError("");
      },
      async requestPasswordReset(email) {
        return authRequest("password-reset/", {
          method: "POST",
          body: { email },
        });
      },
      async verifyPasswordResetCode(email, code) {
        return authRequest("password-reset/verify/", {
          method: "POST",
          body: { email, code },
        });
      },
      async resetPassword(resetToken, password) {
        return authRequest("password-reset/confirm/", {
          method: "POST",
          body: { resetToken, password },
        });
      },
      clearAuthError() {
        setAuthError("");
      },
      showAuthError(message) {
        setAuthError(message);
      },
      async updateProfile(displayName, email) {
        if (!session?.user) throw new Error("Войдите в аккаунт.");
        const { user } = await authRequest("profile/", {
          method: "POST",
          body: { display_name: displayName, email },
        });
        setSession({ user });
      },
      async changePassword(currentPassword, newPassword) {
        if (!session?.user) throw new Error("Войдите в аккаунт.");
        await authRequest("change-password/", {
          method: "POST",
          body: { current_password: currentPassword, new_password: newPassword },
        });
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
        await authRequest("logout/", { method: "POST", body: {} });
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
