import { useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import { useAcademy } from "../context/AcademyContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useLanguage } from "../context/LanguageContext.jsx";
import PageBackLink from "../components/PageBackLink.jsx";
import styles from "./AcademyPage.module.css";

const localeTags = { kg: "ky-KG", ru: "ru-KG", en: "en-US" };
const whatsappNumber = "996501306654";
const apiBaseUrl = (
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.PROD ? "https://dev-track-yptw.onrender.com" : "")
).replace(/\/+$/, "");

function createIdempotencyKey() {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }
  const bytes = new Uint8Array(16);
  if (typeof globalThis.crypto?.getRandomValues === "function") {
    globalThis.crypto.getRandomValues(bytes);
  } else {
    bytes.forEach((_, index) => {
      bytes[index] = Math.floor(Math.random() * 256);
    });
  }
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function formatPrice(amount, language) {
  return new Intl.NumberFormat(localeTags[language], {
    style: "currency",
    currency: "KGS",
    maximumFractionDigits: 0,
  }).format(amount);
}

function getWhatsAppUrl(order) {
  const courses = order.items
    .map((item) => `${item.title} x ${item.quantity}`)
    .join(", ");
  const message = [
    `Заказ №${order.id.slice(-8)}`,
    `Имя: ${order.customer.name}`,
    `Курсы: ${courses}`,
    `Сумма: ${order.total} KGS`,
  ].join("\n");
  return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
}

export default function CheckoutPage() {
  const { t, language } = useLanguage();
  const { user, displayName } = useAuth();
  const { catalog, cart, clearCart } = useAcademy();
  const [savedOrder, setSavedOrder] = useState(null);
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [idempotencyKey] = useState(createIdempotencyKey);
  const items = Object.entries(cart)
    .map(([courseId, quantity]) => ({
      course: catalog.find((course) => course.id === courseId),
      quantity,
    }))
    .filter((item) => item.course);
  const total = items.reduce((sum, item) => sum + item.course.price * item.quantity, 0);
  async function submitOrder(event) {
    event.preventDefault();
    if (!items.length || isSubmitting) return;
    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name") || "").trim();
    const email = String(formData.get("email") || "").trim();
    if (!name || !email) {
      setFormError(t("form.nameError"));
      return;
    }
    setFormError("");
    setIsSubmitting(true);

    const orderItems = items.map(({ course, quantity }) => ({
      course_id: course.id,
      title: course.titleOverride || (course.linkedCourseId ? t(`course.${course.linkedCourseId}.title`) : course.title),
      unit_price: course.price,
      quantity,
    }));

    try {
      const response = await fetch(`${apiBaseUrl}/api/v1/orders/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idempotency_key: idempotencyKey,
          customer_name: name,
          customer_email: email,
          items: orderItems,
        }),
      });

      if (!response.ok) {
        setFormError(
          response.status === 429
            ? t("checkout.rateLimited")
            : t("checkout.requestFailed"),
        );
        return;
      }

      let order;
      try {
        order = await response.json();
      } catch {
        setFormError(t("checkout.requestFailed"));
        return;
      }
      if (
        typeof order.id !== "string" ||
        !Array.isArray(order.items) ||
        typeof order.total !== "string"
      ) {
        setFormError(t("checkout.requestFailed"));
        return;
      }
      clearCart();
      setSavedOrder(order);
    } catch {
      setFormError(t("checkout.requestFailed"));
    } finally {
      setIsSubmitting(false);
    }
  }

  if (savedOrder) {
    return (
      <section className="mx-auto max-w-xl rounded-xl border border-emerald-300/15 bg-[#101827] p-7 text-center">
        <CheckCircle2 size={38} className="mx-auto text-emerald-300" />
        <h2 className="mt-4 font-display text-xl font-extrabold text-white">{t("checkout.success")}</h2>
        <p className="mt-2 text-xs leading-5 text-slate-400">{t("checkout.successNote")}</p>
        <p className="mt-4 text-[10px] text-slate-500">{t("checkout.order")} {savedOrder.id.slice(-8)}</p>
        <a
          href={getWhatsAppUrl(savedOrder)}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-flex rounded-lg bg-emerald-400 px-4 py-2.5 text-[10px] font-bold text-slate-950"
        >
          {t("checkout.sendWhatsApp")}
        </a>
        <Link to="/courses" className="mt-6 inline-flex rounded-lg bg-sky-400 px-4 py-2.5 text-[10px] font-bold text-slate-950">
          {t("checkout.continue")}
        </Link>
      </section>
    );
  }

  if (!items.length) {
    return (
      <section className="mx-auto max-w-xl rounded-xl border border-white/[0.07] bg-[#101827] p-8 text-center">
        <h2 className="font-display text-xl font-extrabold text-white">{t("checkout.title")}</h2>
        <p className="mt-3 text-xs text-slate-400">{t("checkout.empty")}</p>
        <Link to="/courses" className="mt-5 inline-flex rounded-lg bg-sky-400 px-4 py-2.5 text-[10px] font-bold text-slate-950">
          {t("cart.browse")}
        </Link>
      </section>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      <PageBackLink to="/cart" />
      <div className="mb-6">
        <p className="text-[10px] font-bold uppercase tracking-[0.17em] text-slate-500">{t("checkout.contact")}</p>
        <h2 className="mt-1 font-display text-2xl font-extrabold tracking-tight text-white">{t("checkout.title")}</h2>
      </div>
      <div className={styles.checkoutGrid}>
        <form onSubmit={submitOrder} className="h-fit rounded-xl border border-white/[0.07] bg-[#101827] p-5 sm:p-6">
          <h3 className="mb-5 text-sm font-bold text-white">{t("checkout.contact")}</h3>
          <div className="space-y-4">
            <label className="block text-[10px] font-medium text-slate-400">
              {t("checkout.name")}
              <input
                name="name"
                required
                maxLength={80}
                autoComplete="name"
                defaultValue={displayName}
                className="mt-1.5 w-full rounded-lg border border-white/[0.09] bg-[#090f1a] px-3 py-3 text-xs text-white outline-none focus:border-sky-300/40"
              />
            </label>
            <label className="block text-[10px] font-medium text-slate-400">
              {t("checkout.email")}
              <input
                name="email"
                required
                type="email"
                maxLength={254}
                autoComplete="email"
                defaultValue={user?.email || ""}
                className="mt-1.5 w-full rounded-lg border border-white/[0.09] bg-[#090f1a] px-3 py-3 text-xs text-white outline-none focus:border-sky-300/40"
              />
            </label>
          </div>
          <p className="mt-4 rounded-lg border border-amber-300/15 bg-amber-300/[0.04] px-3 py-2.5 text-[10px] leading-5 text-amber-200/80">
            {t("checkout.demoNote")}
          </p>
          {formError && <p role="alert" className="mt-3 text-[10px] text-rose-300">{formError}</p>}
          <button disabled={isSubmitting} type="submit" className="mt-5 w-full rounded-lg bg-sky-400 px-4 py-3 text-[10px] font-bold text-slate-950 transition hover:bg-sky-300 disabled:cursor-wait disabled:opacity-60">
            {isSubmitting ? t("checkout.sending") : t("checkout.submit")}
          </button>
        </form>

        <aside className="h-fit rounded-xl border border-white/[0.07] bg-[#101827] p-5">
          <h3 className="text-sm font-bold text-white">{t("cart.title")}</h3>
          <ul className="mt-4 space-y-3">
            {items.map(({ course, quantity }) => (
              <li key={course.id} className="flex justify-between gap-3 text-[10px]">
                <span className="text-slate-300">
                  {course.titleOverride || (course.linkedCourseId ? t(`course.${course.linkedCourseId}.title`) : course.title)} × {quantity}
                </span>
                <span className="shrink-0 text-slate-400">{formatPrice(course.price * quantity, language)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex justify-between border-t border-white/[0.08] pt-4 text-xs font-bold text-white">
            <span>{t("cart.subtotal")}</span>
            <span>{formatPrice(total, language)}</span>
          </div>
          <Link to="/cart" className="mt-4 block text-center text-[10px] font-semibold text-slate-400 hover:text-white">
            {t("cart.title")}
          </Link>
        </aside>
      </div>
    </div>
  );
}
