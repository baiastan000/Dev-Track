import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Moon, Sun } from "lucide-react";
import { useLearningProgress } from "../context/ProgressContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";

export default function SettingsPage() {
  const { progress, setTheme, resetLearningProgress } = useLearningProgress();
  const { user, displayName, updateDisplayName } = useAuth();
  const [profileName, setProfileName] = useState(displayName);
  const [profileMessage, setProfileMessage] = useState("");
  const [profileError, setProfileError] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [resetMessage, setResetMessage] = useState("");

  useEffect(() => {
    setProfileName(displayName);
  }, [displayName]);

  useEffect(() => {
    if (!resetMessage) return undefined;
    const timeout = window.setTimeout(() => setResetMessage(""), 5000);
    return () => window.clearTimeout(timeout);
  }, [resetMessage]);

  function confirmReset() {
    const confirmed = window.confirm(
      "Сбросить весь учебный прогресс, задания и план недели? Проекты и выбранная тема оформления останутся.",
    );
    if (!confirmed) return;
    resetLearningProgress();
    setResetMessage("Учебный прогресс, задания и план недели сброшены.");
  }

  async function saveProfile(event) {
    event.preventDefault();
    setProfileMessage("");
    setProfileError("");
    const nextName = profileName.trim();
    if (!nextName) {
      setProfileError("Введите имя.");
      return;
    }

    setIsSavingProfile(true);
    try {
      await updateDisplayName(nextName);
      setProfileMessage("Имя профиля обновлено.");
    } catch (error) {
      setProfileError(error.message || "Не удалось обновить имя профиля.");
    } finally {
      setIsSavingProfile(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-7">
        <p className="text-[10px] font-bold uppercase tracking-[0.17em] text-slate-500">ПРОФИЛЬ</p>
        <h2 className="mt-1 font-display text-2xl font-extrabold tracking-tight text-white">Настройки</h2>
        <p className="mt-2 text-xs text-slate-400">Управляй профилем, интерфейсом и учебными данными.</p>
      </div>

      <section className="rounded-xl border border-white/[0.07] bg-[#101827] p-5 sm:p-6">
        <div className="mb-5">
          <h3 className="text-sm font-bold text-white">Профиль пользователя</h3>
          <p className="mt-1 text-[10px] leading-5 text-slate-500">
            Демо-профиль хранится в браузере и используется во всём кабинете.
          </p>
        </div>
        <form onSubmit={saveProfile} className="space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-[11px] font-medium text-slate-300">Имя</span>
            <input
              type="text"
              name="displayName"
              autoComplete="name"
              maxLength={80}
              required
              value={profileName}
              onChange={(event) => setProfileName(event.target.value)}
              placeholder="Как к тебе обращаться?"
              className="w-full rounded-lg border border-white/[0.09] bg-[#090f1a] px-3 py-3 text-xs text-white outline-none placeholder:text-slate-600 focus:border-sky-300/40"
            />
          </label>
          <p className="text-[10px] text-slate-500">
            Аккаунт: {user?.email || "Адрес электронной почты недоступен"}
          </p>
          {profileError && (
            <p role="alert" className="rounded-lg border border-rose-300/20 bg-rose-300/[0.06] px-3 py-2.5 text-[10px] leading-5 text-rose-200">
              {profileError}
            </p>
          )}
          {profileMessage && (
            <p role="status" className="rounded-lg border border-emerald-300/15 bg-emerald-300/[0.05] px-3 py-2.5 text-[10px] text-emerald-200">
              {profileMessage}
            </p>
          )}
          <button
            type="submit"
            disabled={isSavingProfile || !profileName.trim() || profileName.trim() === displayName}
            className="rounded-lg bg-sky-400 px-4 py-2.5 text-[10px] font-bold text-slate-950 transition hover:bg-sky-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSavingProfile ? "Сохраняем..." : "Сохранить имя"}
          </button>
        </form>
      </section>

      <section className="rounded-xl border border-white/[0.07] bg-[#101827] p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-violet-400/10 text-violet-300">
            {progress.theme === "dark" ? <Moon size={17} /> : <Sun size={17} />}
          </span>
          <div className="flex-1">
            <h3 className="text-sm font-bold text-white">Оформление</h3>
            <p className="mt-1 text-[10px] leading-5 text-slate-500">Выбери тему интерфейса. Настройка сохраняется на этом устройстве.</p>
          </div>
        </div>
        <div className="mt-5 grid gap-2 sm:grid-cols-2">
          {[
            { id: "dark", label: "Тёмная", icon: Moon, description: "Тёмно-синяя тема DevTrack" },
            { id: "light", label: "Светлая", icon: Sun, description: "Светлая тема для кабинета" },
          ].map(({ id, label, icon: Icon, description }) => (
            <button
              key={id}
              type="button"
              aria-pressed={progress.theme === id}
              onClick={() => setTheme(id)}
              className={`flex items-center gap-3 rounded-lg border p-3 text-left transition ${
                progress.theme === id ? "border-sky-300/30 bg-sky-300/[0.06]" : "border-white/[0.07] bg-[#0b111c] hover:border-white/[0.14]"
              }`}
            >
              <Icon size={17} className={progress.theme === id ? "text-sky-300" : "text-slate-500"} />
              <span className="flex-1">
                <span className="block text-xs font-semibold text-slate-200">{label}</span>
                <span className="mt-1 block text-[9px] text-slate-500">{description}</span>
              </span>
              {progress.theme === id && <CheckCircle2 size={15} className="text-sky-300" />}
            </button>
          ))}
        </div>
      </section>

      <section className="mt-4 rounded-xl border border-rose-300/10 bg-[#101827] p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-rose-400/10 text-rose-300"><AlertTriangle size={17} /></span>
          <div className="flex-1">
            <h3 className="text-sm font-bold text-white">Сбросить учебный прогресс</h3>
            <p className="mt-1 max-w-xl text-[10px] leading-5 text-slate-500">
              Будут удалены отметки пройденных тем, решённых заданий, черновики кода, история активности и отметки плана недели. Проекты и тема оформления сохранятся.
            </p>
          </div>
        </div>
        {resetMessage && (
          <p role="status" className="mt-4 rounded-lg border border-emerald-300/15 bg-emerald-300/[0.05] px-3 py-2.5 text-[10px] text-emerald-200">
            {resetMessage}
          </p>
        )}
        <button
          type="button"
          onClick={confirmReset}
          className="mt-5 rounded-lg border border-rose-300/20 px-3.5 py-2.5 text-[10px] font-semibold text-rose-200 transition hover:bg-rose-300/[0.08]"
        >
          Сбросить учебные данные
        </button>
      </section>

      <p className="mt-4 text-[9px] leading-5 text-slate-600">
        Данные аккаунта хранятся в Supabase. Учебный прогресс и настройки интерфейса хранятся в localStorage этого браузера; очистка данных браузера удалит сохранённый прогресс.
      </p>
    </div>
  );
}
