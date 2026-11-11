import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Code2, Mail, LockKeyhole, UserRound } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useLanguage } from "../context/LanguageContext.jsx";
import LanguageSelector from "../components/LanguageSelector.jsx";

export default function AuthPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isRegister, setIsRegister] = useState(() => searchParams.get("mode") === "register");
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { user, authError, clearAuthError, register, signIn, resetPassword } = useAuth();
  const { t } = useLanguage();

  useEffect(() => {
    if (user) navigate("/dashboard", { replace: true });
  }, [user, navigate]);

  async function handleSubmit(event) {
    event.preventDefault();
    setErrorMessage("");
    setStatusMessage("");
    clearAuthError();

    setIsSubmitting(true);
    try {
      if (isResettingPassword) {
        await resetPassword(email, password);
        setStatusMessage(t("auth.passwordUpdated"));
        setIsResettingPassword(false);
      } else if (isRegister) {
        const displayName = name.trim();
        if (!displayName) {
          setErrorMessage(t("auth.enterName"));
          return;
        }
        await register(email, password, displayName);
        navigate("/dashboard", { replace: true });
      } else {
        await signIn(email, password);
        navigate("/dashboard", { replace: true });
      }
    } catch (error) {
      setErrorMessage(error.message || t("auth.requestFailed"));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="auth-page relative flex min-h-screen items-center justify-center overflow-hidden bg-[#080d18] px-5 py-10 text-white">
      <div className="pointer-events-none absolute -left-32 top-0 h-96 w-96 rounded-full bg-blue-600/[0.12] blur-[110px]" />
      <div className="pointer-events-none absolute -bottom-40 -right-20 h-96 w-96 rounded-full bg-sky-500/[0.08] blur-[120px]" />
      <div className="relative z-10 w-full max-w-[420px]">
        <div className="mb-8 flex items-center justify-between gap-3">
          <Link to="/" className="inline-flex items-center gap-2 text-xs font-medium text-slate-400 transition hover:text-white">
            <ArrowLeft size={14} /> {t("auth.backHome")}
          </Link>
          <LanguageSelector compact />
        </div>
        <div className="rounded-2xl border border-white/[0.08] bg-[#0d1421]/95 p-6 shadow-2xl shadow-black/20 sm:p-8">
          <div className="mb-7 text-center">
            <span className="brand-mark mx-auto grid h-11 w-11 place-items-center rounded-xl text-white">
              <Code2 size={22} />
            </span>
            <h1 className="mt-4 font-display text-2xl font-extrabold tracking-tight">
              {isResettingPassword ? t("auth.newPassword") : isRegister ? t("auth.createAccount") : t("auth.welcomeBack")}
            </h1>
            <p className="mt-2 text-xs text-slate-400">
              {isResettingPassword ? t("auth.enterEmailNewPassword") : isRegister ? t("auth.startJourney") : t("auth.signInContinue")}
            </p>
          </div>

          <p className="mb-4 rounded-lg border border-sky-300/15 bg-sky-300/[0.05] px-3 py-2.5 text-[10px] leading-5 text-sky-200">
            {t("auth.demoNote")}
          </p>
          {errorMessage && (
            <p role="alert" className="mb-4 rounded-lg border border-rose-300/20 bg-rose-300/[0.06] px-3 py-2.5 text-[10px] leading-5 text-rose-200">
              {errorMessage}
            </p>
          )}
          {authError && (
            <p role="alert" className="mb-4 rounded-lg border border-rose-300/20 bg-rose-300/[0.06] px-3 py-2.5 text-[10px] leading-5 text-rose-200">
              {authError}
            </p>
          )}
          {statusMessage && (
            <p role="status" className="mb-4 rounded-lg border border-emerald-300/20 bg-emerald-300/[0.06] px-3 py-2.5 text-[10px] leading-5 text-emerald-200">
              {statusMessage}
            </p>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && !isResettingPassword && (
              <label className="block">
                <span className="mb-1.5 block text-[11px] font-medium text-slate-300">{t("auth.name")}</span>
                <span className="input-wrap flex items-center gap-2.5 rounded-lg border border-white/[0.09] bg-[#090f1a] px-3">
                  <UserRound size={15} className="text-slate-500" />
                  <input
                    required
                    autoComplete="name"
                    type="text"
                    name="name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    maxLength={80}
                    placeholder={t("auth.namePlaceholder")}
                    className="w-full bg-transparent py-3 text-xs text-white outline-none placeholder:text-slate-600"
                  />
                </span>
              </label>
            )}
            <label className="block">
              <span className="mb-1.5 block text-[11px] font-medium text-slate-300">{t("auth.email")}</span>
              <span className="input-wrap flex items-center gap-2.5 rounded-lg border border-white/[0.09] bg-[#090f1a] px-3">
                <Mail size={15} className="text-slate-500" />
                <input
                  required
                  autoComplete="email"
                  type="email"
                  name="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  className="w-full bg-transparent py-3 text-xs text-white outline-none placeholder:text-slate-600"
                />
              </span>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[11px] font-medium text-slate-300">{t("auth.password")}</span>
              <span className="input-wrap flex items-center gap-2.5 rounded-lg border border-white/[0.09] bg-[#090f1a] px-3">
                <LockKeyhole size={15} className="text-slate-500" />
                <input
                  required
                  autoComplete={isRegister || isResettingPassword ? "new-password" : "current-password"}
                  type="password"
                  name="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  minLength={6}
                  placeholder={t("auth.passwordPlaceholder")}
                  className="w-full bg-transparent py-3 text-xs text-white outline-none placeholder:text-slate-600"
                />
              </span>
            </label>
            {!isRegister && !isResettingPassword && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setIsResettingPassword(true);
                    setErrorMessage("");
                    setStatusMessage("");
                  }}
                  className="text-[10px] font-medium text-sky-300 hover:text-sky-200"
                >
                  {t("auth.forgotPassword")}
                </button>
              </div>
            )}
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-sky-400 py-3 text-xs font-bold text-slate-950 transition hover:bg-sky-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? t("auth.wait") : isResettingPassword ? t("auth.savePassword") : isRegister ? t("auth.createAccount") : t("auth.signIn")} <ArrowRight size={14} />
            </button>
          </form>

          <p className="mt-6 text-center text-[11px] text-slate-500">
            {isResettingPassword ? t("auth.rememberPassword") : isRegister ? t("auth.alreadyAccount") : t("auth.firstTime")}{" "}
            <button
              type="button"
              onClick={() => {
                if (isResettingPassword) {
                  setIsResettingPassword(false);
                  setIsRegister(false);
                  setSearchParams({});
                } else {
                  const nextIsRegister = !isRegister;
                  setIsRegister(nextIsRegister);
                  setSearchParams(nextIsRegister ? { mode: "register" } : {});
                }
                setErrorMessage("");
                setStatusMessage("");
              }}
              aria-label={isRegister ? t("auth.signIn") : isResettingPassword ? t("auth.signIn") : t("auth.register")}
              title={isRegister ? t("auth.signIn") : undefined}
              className="inline-flex items-center font-semibold text-sky-300 hover:text-sky-200"
            >
              {isRegister ? <UserRound size={15} aria-hidden="true" /> : isResettingPassword ? t("auth.signIn") : t("auth.register")}
            </button>
          </p>
        </div>
        <p className="mt-5 text-center text-[10px] text-slate-600">
          {t("auth.terms")}
        </p>
      </div>
    </main>
  );
}
