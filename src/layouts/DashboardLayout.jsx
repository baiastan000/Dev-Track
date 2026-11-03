import { useState } from "react";
import { Menu, Search, ShoppingCart } from "lucide-react";
import { Link, Navigate, Outlet, useLocation } from "react-router-dom";
import Sidebar from "../components/Sidebar.jsx";
import { useLearningProgress } from "../context/ProgressContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useLanguage } from "../context/LanguageContext.jsx";
import { useAcademy } from "../context/AcademyContext.jsx";
import AnimatedPage from "../components/AnimatedPage.jsx";
import NotificationBell from "../components/NotificationBell.jsx";

const pageTitleKeys = {
  "/dashboard": "nav.dashboard",
  "/courses": "nav.courses",
  "/flashcards": "page.flashcards",
  "/admin": "catalog.adminTitle",
  "/cart": "cart.title",
  "/checkout": "checkout.title",
  "/tasks": "nav.tasks",
  "/plan": "nav.plan",
  "/projects": "nav.projects",
  "/statistics": "nav.statistics",
  "/settings": "nav.settings",
};

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { pathname } = useLocation();
  const { storageError } = useLearningProgress();
  const { user, displayName, loading, authError, clearAuthError } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const { cart } = useAcademy();
  const cartCount = Object.values(cart).reduce((sum, quantity) => sum + quantity, 0);
  if (loading) {
    return <div className="min-h-screen bg-[#080d18]" aria-label="Загрузка профиля" />;
  }
  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="dashboard-shell min-h-screen bg-[#080d18] text-slate-200">
      {sidebarOpen && (
        <button
          type="button"
          className="sidebar-backdrop fixed inset-0 z-30 bg-black/60 lg:hidden"
          aria-label="Закрыть меню"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <div
        className={`sidebar-drawer fixed inset-y-0 left-0 z-40 w-[250px] transition-transform duration-200 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar onNavigate={() => setSidebarOpen(false)} />
      </div>
      <div className="min-h-screen lg:pl-[250px]">
        <header className="dashboard-header sticky top-0 z-20 flex h-[68px] items-center justify-between border-b border-white/[0.07] bg-[#080d18]/90 px-3 backdrop-blur-md sm:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label={t("header.openMenu")}
              onClick={() => setSidebarOpen(true)}
              className="rounded-lg p-2 text-slate-300 hover:bg-white/[0.06] lg:hidden"
            >
              <Menu size={19} />
            </button>
            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.15em] text-slate-500">
                DevTrack
              </p>
              <h1 className="font-display text-sm font-bold text-white">
                {pageTitleKeys[pathname]
                  ? t(pageTitleKeys[pathname])
                  : pathname.startsWith("/booking/")
                    ? t("booking.title")
                    : pathname.startsWith("/item/")
                      ? t("catalog.detailsTitle")
                    : pathname.startsWith("/courses/")
                      ? t("page.learning")
                      : t("page.workspace")}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              aria-label={t("header.search")}
              className="rounded-lg border border-white/[0.08] p-2 text-slate-400 transition hover:border-white/[0.16] hover:text-white sm:px-3"
            >
              <Search size={16} />
            </button>
            <Link
              to="/cart"
              aria-label={`${t("header.cart")}: ${cartCount}`}
              className="relative rounded-lg border border-white/[0.08] p-2 text-slate-400 transition hover:border-white/[0.16] hover:text-white"
            >
              <ShoppingCart size={16} />
              {cartCount > 0 && (
                <span className="absolute -right-1 -top-1 grid min-h-4 min-w-4 place-items-center rounded-full bg-sky-400 px-1 text-[9px] font-bold text-slate-950">
                  {cartCount}
                </span>
              )}
            </Link>
            <label className="sr-only" htmlFor="interface-language">{t("language.label")}</label>
            <select
              id="interface-language"
              value={language}
              onChange={(event) => setLanguage(event.target.value)}
              className="rounded-lg border border-white/[0.08] bg-[#101827] px-2 py-2 text-[10px] font-semibold text-slate-300 outline-none focus:border-sky-300/40"
            >
              <option value="kg">KG</option>
              <option value="ru">RU</option>
              <option value="en">EN</option>
            </select>
            <div className="hidden h-8 w-px bg-white/[0.08] sm:block" />
            <div className="hidden text-right sm:block">
              <p className="text-xs font-semibold text-slate-200">
                {displayName || t("header.profileMissing")}
              </p>
              <p className="text-[10px] text-slate-500">{t("header.learning")}</p>
            </div>
            <div className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-sky-300 to-blue-600 text-[10px] font-bold text-white">
              {displayName ? Array.from(displayName)[0].toLocaleUpperCase() : "?"}
            </div>
            <NotificationBell />
          </div>
        </header>
        {storageError && (
          <div role="alert" className="mx-auto mt-4 max-w-[1440px] px-5 sm:px-8">
            <p className="rounded-lg border border-amber-300/20 bg-amber-300/[0.06] px-4 py-3 text-[10px] leading-5 text-amber-200">
              {storageError}
            </p>
          </div>
        )}
        {authError && (
          <div role="alert" className="mx-auto mt-4 max-w-[1440px] px-5 sm:px-8">
            <p className="flex items-center justify-between gap-3 rounded-lg border border-rose-300/20 bg-rose-300/[0.06] px-4 py-3 text-[10px] leading-5 text-rose-200">
              <span>{authError}</span>
              <button type="button" onClick={clearAuthError} className="shrink-0 font-semibold hover:text-white">
                Закрыть
              </button>
            </p>
          </div>
        )}
        <main className="mx-auto w-full max-w-[1440px] px-5 py-7 sm:px-8 sm:py-9">
          <AnimatedPage>
            <Outlet />
          </AnimatedPage>
        </main>
      </div>
    </div>
  );
}
