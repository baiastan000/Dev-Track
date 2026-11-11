import { useState } from "react";
import { CalendarClock, CheckCircle2 } from "lucide-react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { useAcademy } from "../context/AcademyContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useLanguage } from "../context/LanguageContext.jsx";

const timeSlots = ["09:00", "11:00", "14:00", "16:00", "18:00"];

function getTomorrowDate() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return [
    tomorrow.getFullYear(),
    String(tomorrow.getMonth() + 1).padStart(2, "0"),
    String(tomorrow.getDate()).padStart(2, "0"),
  ].join("-");
}

export default function BookingPage() {
  const { courseId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, displayName, trackActivity } = useAuth();
  const { catalog, addBooking, storageError } = useAcademy();
  const { t } = useLanguage();
  const [message, setMessage] = useState("");
  const [bookingId, setBookingId] = useState("");

  const course = catalog.find((item) => item.id === courseId);
  const localizedCourseTitle = course?.titleOverride || (course?.linkedCourseId
    ? t(`course.${course.linkedCourseId}.title`)
    : course?.title);
  const courseTitle = location.state?.courseTitle || localizedCourseTitle;

  function submitBooking(event) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name") || "").trim();
    const email = String(formData.get("email") || "").trim();
    const date = String(formData.get("date") || "");
    const time = String(formData.get("time") || "");

    if (!name || !email || !date || !time) {
      setMessage(t("form.nameError"));
      return;
    }
    if (date < getTomorrowDate()) {
      setMessage(t("booking.dateError"));
      return;
    }

    const booking = addBooking({
      courseId: course.id,
      courseTitle,
      name,
      email,
      date,
      time,
    });
    trackActivity("booking_created", {
      courseId: course.id,
      courseTitle,
      bookingId: booking.id,
    });
    setBookingId(booking.id);
  }

  if (!course || !courseTitle) {
    return (
      <section className="mx-auto max-w-xl rounded-xl border border-white/[0.07] bg-[#101827] p-8 text-center">
        <h2 className="font-display text-xl font-extrabold text-white">{t("booking.title")}</h2>
        <p className="mt-3 text-xs text-slate-400">{t("booking.courseNotFound")}</p>
        <Link to="/courses" className="mt-5 inline-flex rounded-lg bg-sky-400 px-4 py-2.5 text-[10px] font-bold text-slate-950">
          {t("cart.browse")}
        </Link>
      </section>
    );
  }

  if (bookingId) {
    return (
      <section className="mx-auto max-w-xl rounded-xl border border-emerald-300/15 bg-[#101827] p-7 text-center">
        <CheckCircle2 size={38} className="mx-auto text-emerald-300" />
        <h2 className="mt-4 font-display text-xl font-extrabold text-white">
          {t("booking.success")}
        </h2>
        <p className="mt-2 text-xs leading-5 text-slate-400">{t("booking.saved")}</p>
        <p className="mt-4 text-[10px] text-slate-500">{t("checkout.order")} {bookingId.slice(-8)}</p>
        {storageError && <p role="alert" className="mt-3 text-[10px] text-amber-200">{storageError}</p>}
        <button
          type="button"
          onClick={() => navigate("/courses")}
          className="mt-6 rounded-lg bg-sky-400 px-4 py-2.5 text-[10px] font-bold text-slate-950 transition hover:bg-sky-300"
        >
          {t("checkout.continue")}
        </button>
      </section>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <p className="text-[10px] font-bold uppercase tracking-[0.17em] text-slate-500">
          {t("catalog.eyebrow")}
        </p>
        <h2 className="mt-1 font-display text-2xl font-extrabold tracking-tight text-white">
          {t("booking.title")}: {courseTitle}
        </h2>
        <p className="mt-2 text-xs leading-5 text-slate-400">{t("booking.description")}</p>
      </div>

      <form
        onSubmit={submitBooking}
        className="rounded-xl border border-white/[0.07] bg-[#101827] p-5 sm:p-7"
      >
        <div className="mb-5 flex items-center gap-2">
          <CalendarClock size={17} className="text-sky-300" />
          <h3 className="text-sm font-bold text-white">{courseTitle}</h3>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-[10px] font-medium text-slate-400">
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
          <label className="text-[10px] font-medium text-slate-400">
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
          <label className="text-[10px] font-medium text-slate-400">
            {t("booking.date")}
            <input
              name="date"
              required
              type="date"
              min={getTomorrowDate()}
              className="mt-1.5 w-full rounded-lg border border-white/[0.09] bg-[#090f1a] px-3 py-3 text-xs text-white outline-none focus:border-sky-300/40"
            />
          </label>
          <label className="text-[10px] font-medium text-slate-400">
            {t("booking.time")}
            <select
              name="time"
              required
              defaultValue=""
              className="mt-1.5 w-full rounded-lg border border-white/[0.09] bg-[#090f1a] px-3 py-3 text-xs text-white outline-none focus:border-sky-300/40"
            >
              <option value="" disabled>{t("booking.chooseTime")}</option>
              {timeSlots.map((time) => <option key={time} value={time}>{time}</option>)}
            </select>
          </label>
        </div>
        <p className="mt-4 rounded-lg border border-amber-300/15 bg-amber-300/[0.04] px-3 py-2.5 text-[10px] leading-5 text-amber-200/80">
          {t("checkout.demoNote")}
        </p>
        {message && <p role="alert" className="mt-3 text-[10px] text-rose-300">{message}</p>}
        {storageError && <p role="alert" className="mt-3 text-[10px] text-amber-200">{storageError}</p>}
        <div className="mt-5 flex flex-wrap gap-3">
          <button type="submit" className="rounded-lg bg-sky-400 px-4 py-3 text-[10px] font-bold text-slate-950 transition hover:bg-sky-300">
            {t("booking.submit")}
          </button>
          <button
            type="button"
            onClick={() => navigate("/courses")}
            className="rounded-lg border border-white/10 px-4 py-3 text-[10px] font-semibold text-slate-300 transition hover:bg-white/[0.05]"
          >
            {t("common.cancel")}
          </button>
        </div>
      </form>
    </div>
  );
}
