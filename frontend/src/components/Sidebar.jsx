import { NavLink, useNavigate } from "react-router-dom";
import {
  BarChart3,
  BookOpen,
  CalendarDays,
  CheckSquare,
  Code2,
  FolderKanban,
  LayoutDashboard,
  Layers3,
  LogOut,
  ShieldCheck,
  Settings,
} from "lucide-react";
import { useLearningProgress } from "../context/ProgressContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useLanguage } from "../context/LanguageContext.jsx";
import { courses } from "../data/courses.js";

const navigation = [
  { labelKey: "nav.dashboard", to: "/dashboard", icon: LayoutDashboard },
  { labelKey: "nav.courses", to: "/courses", icon: BookOpen },
  { labelKey: "nav.flashcards", to: "/flashcards", icon: Layers3 },
  { labelKey: "nav.tasks", to: "/tasks", icon: CheckSquare },
  { labelKey: "nav.plan", to: "/plan", icon: CalendarDays },
  { labelKey: "nav.projects", to: "/projects", icon: FolderKanban },
  { labelKey: "nav.statistics", to: "/statistics", icon: BarChart3 },
  { labelKey: "catalog.adminTitle", to: "/admin", icon: ShieldCheck },
];

export default function Sidebar({ onNavigate }) {
  const navigate = useNavigate();
  const { progress } = useLearningProgress();
  const { displayName, signOut, showAuthError } = useAuth();
  const { t } = useLanguage();
  const remainingTasks = Math.max(
    0,
    courses.reduce((sum, course) => sum + course.topics.length, 0) -
      progress.completedTasks.length,
  );

  async function handleSignOut() {
    try {
      await signOut();
      navigate("/");
      onNavigate?.();
    } catch (error) {
      showAuthError(error.message || t("auth.signOutFailed"));
    }
  }

  return (
    <aside className="sidebar flex h-screen flex-col overflow-y-auto scroll-smooth border-r border-white/[0.07] bg-[#0b111e]">
      <NavLink
        to="/dashboard"
        className="flex items-center gap-3 px-6 py-6"
        onClick={onNavigate}
      >
        <span className="brand-mark grid h-9 w-9 place-items-center rounded-xl text-white">
          <Code2 size={20} strokeWidth={2.5} />
        </span>
        <span className="font-display text-[19px] font-extrabold tracking-[-0.06em] text-white">
          dev<span className="text-sky-400">track</span>
        </span>
      </NavLink>

      <div className="px-4 pt-7">
        <p className="px-3 pb-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
          {t("nav.workspace")}
        </p>
        <nav className="space-y-1">
          {navigation.map(({ labelKey, to, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onNavigate}
              className={({ isActive }) =>
                `nav-link flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium transition ${
                  isActive
                    ? "nav-link-active text-white"
                    : "text-slate-400 hover:bg-white/[0.04] hover:text-slate-100"
                }`
              }
            >
              <Icon size={17} strokeWidth={1.8} />
              <span>{t(labelKey)}</span>
              {labelKey === "nav.tasks" && remainingTasks > 0 && (
                <span className="ml-auto rounded-md bg-sky-400/10 px-1.5 py-0.5 text-[10px] font-semibold text-sky-300">
                  {remainingTasks}
                </span>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="mx-4 mt-8 border-t border-white/[0.07] pt-5">
        <p className="px-3 pb-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
          {t("nav.account")}
        </p>
        <NavLink
          to="/settings"
          onClick={onNavigate}
          className={({ isActive }) =>
            `nav-link flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium transition ${
              isActive
                ? "nav-link-active text-white"
                : "text-slate-400 hover:bg-white/[0.04] hover:text-slate-100"
            }`
          }
        >
          <Settings size={17} strokeWidth={1.8} />
          {t("nav.settings")}
        </NavLink>
      </div>

      <div className="mt-auto p-4">
        <div className="flex items-center justify-between">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-sky-300 to-blue-600 text-[11px] font-bold text-white">
              {displayName ? Array.from(displayName)[0].toLocaleUpperCase() : "?"}
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-slate-200">
                {displayName || t("header.profileMissing")}
              </p>
              <p className="text-[10px] text-slate-500">{t("nav.student")}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            aria-label={t("nav.signOut")}
            title={t("nav.signOut")}
            className="rounded-md p-2 text-slate-500 transition hover:bg-white/[0.06] hover:text-slate-200"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </aside>
  );
}
