import { Link } from "react-router-dom";
import { Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";
import { useAcademy } from "../context/AcademyContext.jsx";
import { useLanguage } from "../context/LanguageContext.jsx";
import styles from "./AcademyPage.module.css";

const localeTags = { kg: "ky-KG", ru: "ru-KG", en: "en-US" };

function formatPrice(amount, language) {
  return new Intl.NumberFormat(localeTags[language], {
    style: "currency",
    currency: "KGS",
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function CartPage() {
  const { t, language } = useLanguage();
  const { catalog, cart, setCartQuantity } = useAcademy();
  const items = Object.entries(cart)
    .map(([courseId, quantity]) => ({
      course: catalog.find((course) => course.id === courseId),
      quantity,
    }))
    .filter((item) => item.course);
  const total = items.reduce((sum, item) => sum + item.course.price * item.quantity, 0);

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <p className="text-[10px] font-bold uppercase tracking-[0.17em] text-slate-500">{t("header.cart")}</p>
        <h2 className="mt-1 font-display text-2xl font-extrabold tracking-tight text-white">{t("cart.title")}</h2>
      </div>

      {items.length === 0 ? (
        <section className="rounded-xl border border-white/[0.07] bg-[#101827] p-8 text-center">
          <ShoppingCart size={26} className="mx-auto text-slate-500" />
          <p className="mt-3 text-xs text-slate-400">{t("cart.empty")}</p>
          <Link to="/courses" className="mt-4 inline-flex rounded-lg bg-sky-400 px-4 py-2.5 text-[10px] font-bold text-slate-950">
            {t("cart.browse")}
          </Link>
        </section>
      ) : (
        <div className={styles.checkoutGrid}>
          <section className="space-y-3">
            {items.map(({ course, quantity }) => {
              const title = course.titleOverride || (course.linkedCourseId ? t(`course.${course.linkedCourseId}.title`) : course.title);
              return (
                <article key={course.id} className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-white/[0.07] bg-[#101827] p-4">
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-sm font-bold text-white">{title}</h3>
                    <p className="mt-1 text-[10px] text-slate-400">{formatPrice(course.price, language)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      aria-label={`${t("cart.quantity")}: -1`}
                      onClick={() => setCartQuantity(course.id, quantity - 1)}
                      className="grid h-8 w-8 place-items-center rounded-md border border-white/10 text-slate-300 hover:bg-white/[0.05]"
                    >
                      <Minus size={13} />
                    </button>
                    <span className="min-w-6 text-center text-xs text-white" aria-label={`${t("cart.quantity")}: ${quantity}`}>{quantity}</span>
                    <button
                      type="button"
                      aria-label={`${t("cart.quantity")}: +1`}
                      disabled={quantity >= 10}
                      onClick={() => setCartQuantity(course.id, quantity + 1)}
                      className="grid h-8 w-8 place-items-center rounded-md border border-white/10 text-slate-300 hover:bg-white/[0.05] disabled:opacity-40"
                    >
                      <Plus size={13} />
                    </button>
                    <button
                      type="button"
                      aria-label={`${t("cart.remove")}: ${title}`}
                      onClick={() => setCartQuantity(course.id, 0)}
                      className="grid h-8 w-8 place-items-center rounded-md text-rose-300 hover:bg-rose-300/10"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <p className="w-full text-right text-xs font-semibold text-slate-200 sm:w-auto">
                    {formatPrice(course.price * quantity, language)}
                  </p>
                </article>
              );
            })}
          </section>

          <aside className="h-fit rounded-xl border border-white/[0.07] bg-[#101827] p-5">
            <h3 className="text-sm font-bold text-white">{t("cart.subtotal")}</h3>
            <p className="mt-3 font-display text-2xl font-extrabold text-sky-200">{formatPrice(total, language)}</p>
            <p className="mt-2 text-[10px] leading-5 text-slate-500">{t("checkout.demoNote")}</p>
            <Link to="/checkout" className="mt-5 flex w-full justify-center rounded-lg bg-sky-400 px-4 py-3 text-[10px] font-bold text-slate-950 transition hover:bg-sky-300">
              {t("cart.checkout")}
            </Link>
            <Link to="/courses" className="mt-3 block text-center text-[10px] font-semibold text-slate-400 hover:text-white">
              {t("cart.browse")}
            </Link>
          </aside>
        </div>
      )}
    </div>
  );
}
