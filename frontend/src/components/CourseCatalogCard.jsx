import { BookOpen, ShoppingCart } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAcademy } from "../context/AcademyContext.jsx";
import { useLanguage } from "../context/LanguageContext.jsx";
import styles from "../pages/AcademyPage.module.css";

const localeTags = { kg: "ky-KG", ru: "ru-KG", en: "en-US" };

export default function CourseCatalogCard({ course }) {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const { cart, addToCart } = useAcademy();
  const translationKey = course.linkedCourseId
    ? `course.${course.linkedCourseId}`
    : "";
  const title = course.titleOverride || (translationKey ? t(`${translationKey}.title`) : course.title);
  const subtitle = translationKey ? t(`${translationKey}.subtitle`) : course.category;
  const description = translationKey ? t(`${translationKey}.description`) : course.description;
  const price = new Intl.NumberFormat(localeTags[language], {
    style: "currency",
    currency: "KGS",
    maximumFractionDigits: 0,
  }).format(course.price);

  function openBookingPage() {
    navigate(`/booking/${encodeURIComponent(course.id)}`, {
      state: { courseTitle: title },
    });
  }

  return (
    <article className={styles.courseCard}>
      <div className="flex items-start justify-between gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-sky-400/10 text-sky-300">
          <BookOpen size={19} />
        </span>
        <span className="rounded-md bg-white/[0.04] px-2 py-1 text-[9px] font-medium text-slate-400">
          {course.level === "intermediate" ? t("catalog.level.intermediate") : t("catalog.level.beginner")}
        </span>
      </div>
      <div className="mt-4">
        <Link
          to={`/item/${encodeURIComponent(course.id)}`}
          className="font-display text-[15px] font-bold text-white hover:text-sky-200"
        >
          {title}
        </Link>
        <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
        <p className="mt-3 min-h-10 text-[10px] leading-5 text-slate-400">{description}</p>
      </div>
      <div className="mt-4 flex items-center justify-between gap-3">
        <span className="text-[10px] text-slate-500">
          {typeof course.duration === "number"
            ? t("catalog.topics").replace("{count}", String(course.duration))
            : course.duration}
        </span>
        <span className="font-display text-sm font-bold text-sky-200">
          {course.price === 0 ? t("catalog.priceFree") : price}
        </span>
      </div>
      <div className={styles.courseActions}>
        <div className={styles.courseActionRow}>
          <Link
            to={`/item/${encodeURIComponent(course.id)}`}
            className={styles.courseSecondaryButton}
          >
            {t("catalog.details")}
          </Link>
          {course.linkedCourseId ? (
            <Link
              to={`/courses/${course.linkedCourseId}`}
              className={styles.courseSecondaryButton}
            >
              {t("catalog.startLearning")}
            </Link>
          ) : (
            <span className={`${styles.courseSecondaryButton} ${styles.courseDisabledButton}`}>
              {t("catalog.lessonContent")}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => addToCart(course.id)}
          disabled={(cart[course.id] ?? 0) >= 10}
          aria-label={`${t("catalog.addToCart")}: ${title}`}
          className={styles.courseCartButton}
        >
          <ShoppingCart size={13} />
          {(cart[course.id] ?? 0) > 0
            ? `${t("catalog.added")} (${cart[course.id]})`
            : t("catalog.addToCart")}
        </button>
        <button
          type="button"
          onClick={openBookingPage}
          className={styles.courseBookingButton}
        >
          {t("catalog.bookTrial")}
        </button>
      </div>
    </article>
  );
}
