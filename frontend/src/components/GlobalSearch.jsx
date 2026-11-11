import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, BookOpen, Search, X } from "lucide-react";
import { courses } from "../data/courses.js";
import { useLanguage } from "../context/LanguageContext.jsx";

const pageLinks = [
  { to: "/dashboard", titleKey: "nav.dashboard", icon: BookOpen },
  { to: "/courses", titleKey: "nav.courses", icon: BookOpen },
  { to: "/flashcards", titleKey: "search.flashcards", icon: BookOpen },
  { to: "/tasks", titleKey: "nav.tasks", icon: BookOpen },
  { to: "/plan", titleKey: "nav.plan", icon: BookOpen },
  { to: "/projects", titleKey: "nav.projects", icon: BookOpen },
  { to: "/statistics", titleKey: "nav.statistics", icon: BookOpen },
  { to: "/settings", titleKey: "nav.settings", icon: BookOpen },
];

export default function GlobalSearch() {
  const { t, topicTitle } = useLanguage();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return undefined;
    inputRef.current?.focus();
    function handleKeyDown(event) {
      if (event.key === "Escape") setIsOpen(false);
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const results = useMemo(() => {
    const search = query.trim().toLocaleLowerCase();
    const entries = [
      ...courses.map((course) => {
        const titleKey = `course.${course.id}.title`;
        const title = t(titleKey) === titleKey ? course.title : t(titleKey);
        return {
          title,
          description: t("search.courses"),
          to: `/courses/${course.id}`,
          type: "course",
        };
      }),
      ...courses.flatMap((course) =>
        course.topics.map((topic) => ({
          title: topicTitle(topic),
          description: t(`course.${course.id}.title`),
          to: `/courses/${course.id}/topics/${topic.id}`,
          type: "topic",
        })),
      ),
      ...pageLinks.map((page) => ({
        title: t(page.titleKey),
        description: t("search.pages"),
        to: page.to,
        type: "page",
      })),
    ];

    if (!search) return entries.filter((entry) => entry.type === "page").slice(0, 6);
    return entries
      .filter((entry) =>
        `${entry.title} ${entry.description}`.toLocaleLowerCase().includes(search),
      )
      .slice(0, 12);
  }, [query, t, topicTitle]);

  function closeSearch() {
    setIsOpen(false);
    setQuery("");
  }

  function openResult(path) {
    closeSearch();
    navigate(path);
  }

  return (
    <>
      <button
        type="button"
        aria-label={t("search.open")}
        title={t("search.open")}
        onClick={() => setIsOpen(true)}
        className="rounded-lg border border-white/[0.08] p-2 text-slate-400 transition hover:border-white/[0.16] hover:text-white sm:px-3"
      >
        <Search size={16} />
      </button>
      {isOpen && (
        <div
          className="fixed inset-0 z-[70] flex items-start justify-center bg-black/70 px-4 pt-[12vh] backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeSearch();
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-label={t("search.results")}
            className="w-full max-w-xl overflow-hidden rounded-xl border border-white/[0.1] bg-[#101827] shadow-2xl shadow-black/50"
          >
            <div className="flex items-center gap-3 border-b border-white/[0.07] px-4">
              <Search size={17} className="shrink-0 text-slate-500" />
              <input
                ref={inputRef}
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t("search.placeholder")}
                aria-label={t("search.placeholder")}
                className="min-w-0 flex-1 bg-transparent py-4 text-sm text-white outline-none placeholder:text-slate-500"
              />
              <button
                type="button"
                onClick={closeSearch}
                aria-label={t("search.close")}
                className="rounded-md p-1.5 text-slate-500 hover:bg-white/[0.06] hover:text-white"
              >
                <X size={16} />
              </button>
            </div>
            <div className="max-h-[55vh] overflow-y-auto p-2">
              <p className="px-3 py-2 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
                {query.trim() ? t("search.results") : t("search.pages")}
              </p>
              {results.length ? results.map((result) => (
                <button
                  key={`${result.type}:${result.to}`}
                  type="button"
                  onClick={() => openResult(result.to)}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left transition hover:bg-white/[0.05]"
                >
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-sky-400/10 text-sky-300">
                    <BookOpen size={15} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-semibold text-slate-200">{result.title}</span>
                    <span className="mt-1 block text-[10px] text-slate-500">{result.description}</span>
                  </span>
                  <ArrowRight size={14} className="shrink-0 text-slate-500" />
                </button>
              )) : (
                <p className="px-3 py-6 text-center text-xs text-slate-500">{t("search.noResults")}</p>
              )}
            </div>
            <div className="border-t border-white/[0.07] px-4 py-2 text-[9px] text-slate-600">
              Esc · {t("search.close")}
            </div>
          </section>
        </div>
      )}
    </>
  );
}
