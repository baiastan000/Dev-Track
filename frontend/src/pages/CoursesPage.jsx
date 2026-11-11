import { useMemo, useState } from "react";
import { Search, ShoppingCart } from "lucide-react";
import { Link } from "react-router-dom";
import CourseCatalogCard from "../components/CourseCatalogCard.jsx";
import { useAcademy } from "../context/AcademyContext.jsx";
import { useLanguage } from "../context/LanguageContext.jsx";
import styles from "./AcademyPage.module.css";

export default function CoursesPage() {
  const { t } = useLanguage();
  const { catalog, cart, storageError } = useAcademy();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const cartCount = Object.values(cart).reduce((sum, quantity) => sum + quantity, 0);

  const categories = useMemo(
    () => [...new Set(catalog.map((course) => course.category))].sort((a, b) => a.localeCompare(b)),
    [catalog],
  );
  const visibleCourses = useMemo(() => {
    const search = query.trim().toLocaleLowerCase();
    return catalog
      .filter((course) => {
        const matchesCategory = !category || course.category === category;
        const translationKey = course.linkedCourseId
          ? `course.${course.linkedCourseId}`
          : "";
        const searchableFields = translationKey
          ? [
              course.titleOverride || t(`${translationKey}.title`),
              t(`${translationKey}.subtitle`),
              t(`${translationKey}.description`),
              course.category,
            ]
          : [course.title, course.subtitle, course.description, course.category];
        const matchesSearch = !search ||
          searchableFields
            .some((value) => value.toLocaleLowerCase().includes(search));
        return matchesCategory && matchesSearch;
      })
      .sort((a, b) => {
        const titleA = a.titleOverride || (a.linkedCourseId ? t(`course.${a.linkedCourseId}.title`) : a.title);
        const titleB = b.titleOverride || (b.linkedCourseId ? t(`course.${b.linkedCourseId}.title`) : b.title);
        if (sortBy === "priceAsc") return a.price - b.price || titleA.localeCompare(titleB);
        if (sortBy === "priceDesc") return b.price - a.price || titleA.localeCompare(titleB);
        return titleA.localeCompare(titleB);
      });
  }, [catalog, category, query, sortBy, t]);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.17em] text-slate-500">{t("catalog.eyebrow")}</p>
          <h2 className="mt-1 font-display text-2xl font-extrabold tracking-tight text-white">{t("catalog.title")}</h2>
          <p className="mt-2 max-w-2xl text-xs leading-5 text-slate-400">{t("catalog.description")}</p>
        </div>
        <Link
          to="/cart"
          className="inline-flex items-center gap-2 rounded-lg border border-white/[0.08] px-3 py-2.5 text-[10px] font-semibold text-slate-200 transition hover:border-sky-300/30 hover:text-sky-200"
        >
          <ShoppingCart size={15} />
          {t("header.cart")}
          <span className="rounded-full bg-sky-400/10 px-1.5 py-0.5 text-sky-300">{cartCount}</span>
        </Link>
      </div>

      {storageError && (
        <p role="alert" className="mb-4 rounded-lg border border-amber-300/20 bg-amber-300/[0.06] px-4 py-3 text-[10px] text-amber-200">
          {storageError}
        </p>
      )}

      <section aria-label={t("catalog.title")} className="mb-5">
        <div className={styles.toolbar}>
          <label className="relative block">
            <span className="sr-only">{t("catalog.search")}</span>
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t("catalog.search")}
              className="w-full rounded-lg border border-white/[0.08] bg-[#101827] py-3 pl-9 pr-3 text-xs text-white outline-none placeholder:text-slate-500 focus:border-sky-300/40"
            />
          </label>
          <label className="text-[10px] text-slate-500">
            <span className="sr-only">{t("catalog.category")}</span>
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="w-full rounded-lg border border-white/[0.08] bg-[#101827] px-3 py-3 text-xs text-slate-200 outline-none focus:border-sky-300/40"
            >
              <option value="">{t("catalog.category")}</option>
              {categories.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
          <label className="text-[10px] text-slate-500">
            <span className="sr-only">{t("catalog.sort")}</span>
            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value)}
              className="w-full rounded-lg border border-white/[0.08] bg-[#101827] px-3 py-3 text-xs text-slate-200 outline-none focus:border-sky-300/40"
            >
              <option value="name">{t("catalog.sortName")}</option>
              <option value="priceAsc">{t("catalog.sortPriceAsc")}</option>
              <option value="priceDesc">{t("catalog.sortPriceDesc")}</option>
            </select>
          </label>
        </div>
        <p className="mt-2 text-[10px] text-slate-500">
          {t("catalog.results").replace("{count}", String(visibleCourses.length))}
        </p>
      </section>

      <section className={styles.catalogGrid}>
        {visibleCourses.map((course) => (
          <CourseCatalogCard
            key={course.id}
            course={course}
          />
        ))}
      </section>
      {visibleCourses.length === 0 && (
        <p className="rounded-xl border border-white/[0.07] bg-[#101827] px-4 py-10 text-center text-xs text-slate-400">
          {t("catalog.empty")}
        </p>
      )}

    </div>
  );
}
