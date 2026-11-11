import { useState } from "react";
import { ArrowLeft, BookOpen, ShoppingCart } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { useAcademy } from "../context/AcademyContext.jsx";
import { useLanguage } from "../context/LanguageContext.jsx";

const localeTags = { kg: "ky-KG", ru: "ru-KG", en: "en-US" };

function formatPrice(amount, language) {
  return new Intl.NumberFormat(localeTags[language], {
    style: "currency",
    currency: "KGS",
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function ItemDetailsPage() {
  const { itemId } = useParams();
  const { t, language } = useLanguage();
  const { catalog, cart, addToCart } = useAcademy();
  const [added, setAdded] = useState(false);
  const item = catalog.find((course) => course.id === itemId);

  if (!item) {
    return (
      <section className="mx-auto max-w-xl rounded-xl border border-white/[0.07] bg-[#101827] p-8 text-center">
        <h2 className="font-display text-xl font-extrabold text-white">{t("catalog.detailsTitle")}</h2>
        <p className="mt-3 text-xs text-slate-400">{t("catalog.empty")}</p>
        <Link to="/courses" className="mt-5 inline-flex rounded-lg bg-sky-400 px-4 py-2.5 text-[10px] font-bold text-slate-950">
          {t("cart.browse")}
        </Link>
      </section>
    );
  }

  const translationKey = item.linkedCourseId ? `course.${item.linkedCourseId}` : "";
  const title = item.titleOverride || (translationKey ? t(`${translationKey}.title`) : item.title);
  const subtitle = translationKey ? t(`${translationKey}.subtitle`) : item.subtitle;
  const description = translationKey ? t(`${translationKey}.description`) : item.description;
  const duration = typeof item.duration === "number"
    ? t("catalog.topics").replace("{count}", String(item.duration))
    : item.duration;
  const quantity = cart[item.id] ?? 0;

  function handleAddToCart() {
    addToCart(item.id);
    setAdded(true);
  }

  return (
    <article className="mx-auto max-w-3xl">
      <Link to="/courses" className="inline-flex items-center gap-2 text-[11px] font-medium text-slate-400 transition hover:text-white">
        <ArrowLeft size={14} />
        {t("cart.browse")}
      </Link>

      <section className="mt-5 rounded-xl border border-white/[0.07] bg-[#101827] p-5 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-sky-400/10 text-sky-300">
              <BookOpen size={21} />
            </span>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-sky-300">{item.category}</p>
              <h2 className="mt-1 font-display text-2xl font-extrabold tracking-tight text-white">{title}</h2>
              <p className="mt-1 text-xs text-slate-400">{subtitle}</p>
            </div>
          </div>
          <span className="rounded-md bg-white/[0.04] px-2.5 py-1.5 text-[10px] font-medium text-slate-300">
            {item.level === "intermediate" ? t("catalog.level.intermediate") : t("catalog.level.beginner")}
          </span>
        </div>

        <div className="mt-7 border-t border-white/[0.07] pt-5">
          <h3 className="text-xs font-bold text-white">{t("catalog.detailsTitle")}</h3>
          <p className="mt-2 text-xs leading-6 text-slate-400">{description}</p>
          <dl className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg bg-white/[0.03] p-3">
              <dt className="text-[10px] text-slate-500">{t("catalog.courseCategory")}</dt>
              <dd className="mt-1 text-xs font-semibold text-slate-200">{item.category}</dd>
            </div>
            <div className="rounded-lg bg-white/[0.03] p-3">
              <dt className="text-[10px] text-slate-500">{t("catalog.duration")}</dt>
              <dd className="mt-1 text-xs font-semibold text-slate-200">{duration}</dd>
            </div>
          </dl>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-white/[0.07] pt-5">
          <div>
            <p className="text-[10px] text-slate-500">{t("catalog.coursePrice")}</p>
            <p className="mt-1 font-display text-2xl font-extrabold text-sky-200">
              {item.price === 0 ? t("catalog.priceFree") : formatPrice(item.price, language)}
            </p>
          </div>
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={quantity >= 10}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-sky-400 px-5 py-3 text-[11px] font-bold text-slate-950 transition hover:bg-sky-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ShoppingCart size={15} />
            {added || quantity > 0
              ? `${t("catalog.added")} (${quantity})`
              : t("catalog.addToCart")}
          </button>
        </div>
        {item.linkedCourseId && (
          <Link
            to={`/courses/${item.linkedCourseId}`}
            className="mt-4 inline-flex text-[10px] font-semibold text-slate-400 transition hover:text-sky-200"
          >
            {t("catalog.startLearning")}
          </Link>
        )}
      </section>
    </article>
  );
}
