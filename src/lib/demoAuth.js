const STORAGE_KEY = "devtrack.demo-auth.v1";
const PASSWORD_ITERATIONS = 120000;
const AUTH_UPDATE_EVENT = "devtrack:demo-auth-updated";

function createEmptyStore() {
  return { users: [], sessionUserId: null, activity: [] };
}

function readStore() {
  let saved;
  try {
    saved = window.localStorage.getItem(STORAGE_KEY);
  } catch (error) {
    throw new Error(`Не удалось прочитать демо-аккаунты из браузера: ${error.message}`);
  }
  if (!saved) return createEmptyStore();

  try {
    const parsed = JSON.parse(saved);
    if (
      !parsed ||
      !Array.isArray(parsed.users) ||
      !(parsed.sessionUserId === null || typeof parsed.sessionUserId === "string") ||
      (parsed.activity !== undefined && !Array.isArray(parsed.activity)) ||
      parsed.users.some(
        (user) =>
          !user ||
          typeof user.id !== "string" ||
          typeof user.email !== "string" ||
          typeof user.displayName !== "string" ||
          typeof user.passwordSalt !== "string" ||
          typeof user.passwordHash !== "string",
      )
    ) {
      throw new Error("Сохранённые данные имеют неизвестный формат.");
    }
    return {
      ...parsed,
      users: parsed.users.map((user) => ({
        ...user,
        role: "student",
        createdAt: typeof user.createdAt === "string" ? user.createdAt : null,
        lastLoginAt: typeof user.lastLoginAt === "string" ? user.lastLoginAt : null,
        lastSeenAt: typeof user.lastSeenAt === "string" ? user.lastSeenAt : null,
        isOnline: user.isOnline === true,
      })),
      activity: (parsed.activity ?? []).filter((entry) =>
        entry &&
        typeof entry.id === "string" &&
        typeof entry.userId === "string" &&
        typeof entry.type === "string" &&
        typeof entry.createdAt === "string",
      ),
    };
  } catch (error) {
    throw new Error(`Не удалось прочитать демо-аккаунты: ${error.message}`);
  }
}

function writeStore(store) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    window.dispatchEvent(new Event(AUTH_UPDATE_EVENT));
  } catch (error) {
    throw new Error(`Не удалось сохранить демо-аккаунт в браузере: ${error.message}`);
  }
}

function createActivity(userId, type, details = {}) {
  const allowedDetails = ["courseId", "courseTitle", "lessonTitle", "bookingId"];
  return {
    id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`,
    userId,
    type,
    details: Object.fromEntries(
      allowedDetails
        .filter((key) => typeof details[key] === "string")
        .map((key) => [key, details[key].slice(0, 160)]),
    ),
    createdAt: new Date().toISOString(),
  };
}

function toPublicUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    email: user.email,
    role: user.role ?? "student",
    user_metadata: { display_name: user.displayName },
  };
}

function normalizeEmail(email) {
  const normalized = email.trim().toLocaleLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    throw new Error("Введите корректный адрес электронной почты.");
  }
  return normalized;
}

async function hashPassword(password, salt) {
  if (!globalThis.crypto?.subtle) {
    throw new Error("В этом браузере недоступно безопасное хранение пароля.");
  }
  const encoder = new TextEncoder();
  const key = await globalThis.crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await globalThis.crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: encoder.encode(salt),
      iterations: PASSWORD_ITERATIONS,
      hash: "SHA-256",
    },
    key,
    256,
  );
  return Array.from(new Uint8Array(bits), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}

function createSalt() {
  if (
    !globalThis.crypto?.getRandomValues ||
    typeof globalThis.crypto.randomUUID !== "function"
  ) {
    throw new Error("В этом браузере недоступно безопасное хранение пароля.");
  }
  const bytes = globalThis.crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function getSessionUser(store) {
  return toPublicUser(
    store.users.find((user) => user.id === store.sessionUserId) ?? null,
  );
}

export function getDemoSession() {
  return getSessionUser(readStore());
}

export function getDemoUsers() {
  return readStore().users
    .map((user) => ({
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
      lastSeenAt: user.lastSeenAt,
      isOnline: user.isOnline,
    }))
    .sort((a, b) => (b.lastSeenAt || "").localeCompare(a.lastSeenAt || ""));
}

export function getDemoActivity() {
  return readStore().activity
    .slice()
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function recordDemoActivity(userId, type, details) {
  if (!userId) return;
  const store = readStore();
  if (
    store.sessionUserId !== userId ||
    !store.users.some((user) => user.id === userId)
  ) return;
  const createdAt = new Date().toISOString();
  const event = { ...createActivity(userId, type, details), createdAt };
  const users = store.users.map((user) =>
    user.id === userId ? { ...user, lastSeenAt: createdAt, isOnline: true } : user,
  );
  writeStore({
    ...store,
    users,
    activity: [event, ...store.activity].slice(0, 500),
  });
}

export function updateDemoLastSeen(userId) {
  if (!userId) return;
  const store = readStore();
  if (store.sessionUserId !== userId) return;
  const createdAt = new Date().toISOString();
  const users = store.users.map((user) =>
    user.id === userId ? { ...user, lastSeenAt: createdAt, isOnline: true } : user,
  );
  if (!users.some((user) => user.id === userId)) return;
  writeStore({ ...store, users });
}

export async function registerDemoUser(email, password, displayName) {
  const normalizedEmail = normalizeEmail(email);
  const normalizedName = displayName.trim();
  if (!normalizedName) throw new Error("Введите имя.");
  if (password.length < 6) throw new Error("Пароль должен содержать не менее 6 символов.");

  const store = readStore();
  if (store.users.some((user) => user.email === normalizedEmail)) {
    throw new Error("Этот адрес уже зарегистрирован. Попробуйте войти.");
  }

  const passwordSalt = createSalt();
  const user = {
    id: globalThis.crypto.randomUUID(),
    email: normalizedEmail,
    displayName: normalizedName,
    role: "student",
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
    lastSeenAt: new Date().toISOString(),
    isOnline: true,
    passwordSalt,
    passwordHash: await hashPassword(password, passwordSalt),
  };
  const event = createActivity(user.id, "register");
  const timestamp = new Date().toISOString();
  writeStore({
    ...store,
    users: [
      ...store.users.map((item) =>
        item.id === store.sessionUserId
          ? { ...item, lastSeenAt: timestamp, isOnline: false }
          : item,
      ),
      user,
    ],
    sessionUserId: user.id,
    activity: [event, ...store.activity].slice(0, 500),
  });
  return toPublicUser(user);
}

export async function signInDemoUser(email, password) {
  const normalizedEmail = normalizeEmail(email);
  const store = readStore();
  const user = store.users.find((item) => item.email === normalizedEmail);
  if (!user || (await hashPassword(password, user.passwordSalt)) !== user.passwordHash) {
    throw new Error("Неверный адрес электронной почты или пароль.");
  }
  const timestamp = new Date().toISOString();
  const signedInUser = {
    ...user,
    lastLoginAt: timestamp,
    lastSeenAt: timestamp,
    isOnline: true,
  };
  const event = createActivity(user.id, "login");
  writeStore({
    ...store,
    users: store.users.map((item) => {
      if (item.id === user.id) return signedInUser;
      if (item.id === store.sessionUserId) {
        return { ...item, lastSeenAt: timestamp, isOnline: false };
      }
      return item;
    }),
    sessionUserId: user.id,
    activity: [event, ...store.activity].slice(0, 500),
  });
  return toPublicUser(signedInUser);
}

export async function resetDemoPassword(email, password) {
  const normalizedEmail = normalizeEmail(email);
  if (password.length < 6) throw new Error("Пароль должен содержать не менее 6 символов.");

  const store = readStore();
  const userIndex = store.users.findIndex((user) => user.email === normalizedEmail);
  if (userIndex === -1) throw new Error("Аккаунт с таким адресом не найден.");

  const passwordSalt = createSalt();
  const users = [...store.users];
  users[userIndex] = {
    ...users[userIndex],
    passwordSalt,
    passwordHash: await hashPassword(password, passwordSalt),
  };
  writeStore({ ...store, users });
}

export function updateDemoDisplayName(userId, displayName) {
  const normalizedName = displayName.trim();
  if (!normalizedName) throw new Error("Введите имя.");

  const store = readStore();
  const userIndex = store.users.findIndex((user) => user.id === userId);
  if (userIndex === -1 || store.sessionUserId !== userId) {
    throw new Error("Не удалось найти текущий демо-аккаунт.");
  }

  const users = [...store.users];
  users[userIndex] = { ...users[userIndex], displayName: normalizedName };
  writeStore({ ...store, users });
  return toPublicUser(users[userIndex]);
}

export function signOutDemoUser() {
  const store = readStore();
  const userId = store.sessionUserId;
  const timestamp = new Date().toISOString();
  writeStore({
    ...store,
    users: store.users.map((user) =>
      user.id === userId ? { ...user, lastSeenAt: timestamp, isOnline: false } : user,
    ),
    sessionUserId: null,
  });
}
