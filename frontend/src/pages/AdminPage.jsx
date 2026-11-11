import { useState } from "react";
import { Link } from "react-router-dom";
import { Activity, ArrowLeft, ClipboardCheck, Pencil, Plus, ShieldCheck, Trash2, UsersRound } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { useAcademy } from "../context/AcademyContext.jsx";
import { useLanguage } from "../context/LanguageContext.jsx";
import styles from "./AcademyPage.module.css";

function getCourseTitle(course, t) {
  return course.titleOverride || (course.linkedCourseId
    ? t(`course.${course.linkedCourseId}.title`)
    : course.title);
}

export default function AdminPage() {
  const { t, language } = useLanguage();
  const { users, activity } = useAuth();
  const { catalog, attendance, addAttendance, addCourse, updateCourse, deleteCourse, storageError } = useAcademy();
  const [formError, setFormError] = useState("");
  const [editingCourse, setEditingCourse] = useState(null);
  const [editError, setEditError] = useState("");
  const [attendanceQuery, setAttendanceQuery] = useState("");
  const [attendanceDate, setAttendanceDate] = useState("");
  const [attendanceError, setAttendanceError] = useState("");
  const [userSearch, setUserSearch] = useState("");

  const localeTags = { kg: "ky-KG", ru: "ru-KG", en: "en-US" };
  const filteredAttendance = attendance
    .filter((record) => {
      const matchesName = record.studentName
        .toLocaleLowerCase()
        .includes(attendanceQuery.trim().toLocaleLowerCase());
      const date = new Date(record.attendedAt);
      const recordDate = [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, "0"),
        String(date.getDate()).padStart(2, "0"),
      ].join("-");
      return matchesName && (!attendanceDate || attendanceDate === recordDate);
    })
    .sort((a, b) => Date.parse(b.attendedAt) - Date.parse(a.attendedAt));
  const normalizedUserSearch = userSearch.trim().toLocaleLowerCase();
  const filteredUsers = users.filter((user) =>
    `${user.displayName} ${user.email}`.toLocaleLowerCase().includes(normalizedUserSearch),
  );
  const visibleActivity = activity
    .filter((entry) => {
      if (!normalizedUserSearch) return true;
      const user = users.find((item) => item.id === entry.userId);
      return user &&
        `${user.displayName} ${user.email}`.toLocaleLowerCase().includes(normalizedUserSearch);
    })
    .slice(0, 50);

  function submitCourse(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const title = String(formData.get("title") || "").trim();
    const category = String(formData.get("category") || "").trim();
    const description = String(formData.get("description") || "").trim();
    const duration = String(formData.get("duration") || "").trim();
    const price = Number(formData.get("price"));

    if (
      !title ||
      !category ||
      !description ||
      !duration ||
      !Number.isFinite(price) ||
      price < 0 ||
      price > 2_000_000
    ) {
      setFormError(t("catalog.validationError"));
      return;
    }

    addCourse({
      title,
      subtitle: category,
      category,
      description,
      duration,
      price,
      level: String(formData.get("level") || "beginner"),
    });
    setFormError("");
    form.reset();
  }

  function confirmDelete(course) {
    if (window.confirm(`${t("catalog.deleteConfirm")} ${getCourseTitle(course, t)}`)) {
      deleteCourse(course.id);
    }
  }

  function openEditor(course) {
    setEditingCourse({ ...course, title: getCourseTitle(course, t) });
    setEditError("");
  }

  function saveCourse(event) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const title = String(formData.get("title") || "").trim();
    const level = String(formData.get("level") || "");

    if (!editingCourse || !title || !["beginner", "intermediate"].includes(level)) {
      setEditError(t("catalog.validationError"));
      return;
    }

    updateCourse(editingCourse.id, { title, level });
    setEditingCourse(null);
    setEditError("");
  }

  function submitAttendance(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const studentName = String(formData.get("studentName") || "").trim();
    const courseId = String(formData.get("attendanceCourse") || "");
    const lessonTitle = String(formData.get("lessonTitle") || "").trim();
    const attendedAt = String(formData.get("attendedAt") || "");
    const status = String(formData.get("attendanceStatus") || "");
    const course = catalog.find((item) => item.id === courseId);
    const date = new Date(attendedAt);

    if (
      !studentName ||
      !course ||
      !lessonTitle ||
      !attendedAt ||
      Number.isNaN(date.getTime()) ||
      !["attended", "missed"].includes(status)
    ) {
      setAttendanceError(t("attendance.validationError"));
      return;
    }

    addAttendance({
      studentName,
      courseId,
      courseTitle: getCourseTitle(course, t),
      lessonTitle,
      attendedAt: date.toISOString(),
      status,
    });
    form.reset();
    setAttendanceError("");
  }

  function formatAttendanceDate(value) {
    return new Intl.DateTimeFormat(localeTags[language], {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  }

  function getActivityLabel(type) {
    const keyByType = {
      register: "users.eventRegister",
      login: "users.eventLogin",
      site_visit: "users.eventVisit",
      lesson_open: "users.eventLesson",
      booking_created: "users.eventBooking",
    };
    return t(keyByType[type] || "users.eventOther");
  }

  function getActivityDetails(entry) {
    const details = entry.details || {};
    if (details.lessonTitle) {
      return `${details.courseTitle || ""} · ${details.lessonTitle}`;
    }
    if (details.courseTitle) return details.courseTitle;
    return "";
  }

  function formatUserDate(value) {
    if (!value) return t("users.never");
    return formatAttendanceDate(value);
  }

  function isOnline(user) {
    const lastSeen = Date.parse(user.lastSeenAt || "");
    return user.isOnline && Number.isFinite(lastSeen) && Date.now() - lastSeen <= 90_000;
  }

  return (
    <div>
      <Link to="/courses" className="inline-flex items-center gap-2 text-[11px] font-medium text-slate-400 transition hover:text-white">
        <ArrowLeft size={14} />
        {t("cart.browse")}
      </Link>

      <header className="mb-6 mt-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.17em] text-slate-500">{t("catalog.adminDemo")}</p>
        <h2 className="mt-1 font-display text-2xl font-extrabold tracking-tight text-white">{t("catalog.adminTitle")}</h2>
        <p className="mt-2 text-xs text-slate-400">{t("catalog.adminDescription")}</p>
      </header>

      <p className="mb-5 rounded-lg border border-amber-300/20 bg-amber-300/[0.06] px-4 py-3 text-[10px] leading-5 text-amber-200">
        {t("catalog.adminWarning")}
      </p>
      {storageError && (
        <p role="alert" className="mb-5 rounded-lg border border-rose-300/20 bg-rose-300/[0.06] px-4 py-3 text-[10px] text-rose-200">
          {storageError}
        </p>
      )}

      <section className="mb-7 rounded-xl border border-white/[0.07] bg-[#101827] p-4 sm:p-6">
        <div className="mb-5 flex items-center gap-2">
          <ShieldCheck size={17} className="text-sky-300" />
          <h3 className="text-sm font-bold text-white">{t("catalog.addCourse")}</h3>
        </div>
        <form onSubmit={submitCourse} className={styles.adminForm}>
          <label className="text-[10px] text-slate-400">
            {t("catalog.courseName")}
            <input name="title" required maxLength={80} className="mt-1.5 w-full rounded-lg border border-white/10 bg-[#090f1a] px-3 py-2.5 text-xs text-white" />
          </label>
          <label className="text-[10px] text-slate-400">
            {t("catalog.courseCategory")}
            <input name="category" required maxLength={60} className="mt-1.5 w-full rounded-lg border border-white/10 bg-[#090f1a] px-3 py-2.5 text-xs text-white" />
          </label>
          <label className="text-[10px] text-slate-400 sm:col-span-2">
            {t("catalog.courseDescription")}
            <textarea name="description" required maxLength={400} rows={3} className="mt-1.5 w-full resize-y rounded-lg border border-white/10 bg-[#090f1a] px-3 py-2.5 text-xs text-white" />
          </label>
          <label className="text-[10px] text-slate-400">
            {t("catalog.coursePrice")}
            <input name="price" type="number" min="0" max="2000000" step="1" required className="mt-1.5 w-full rounded-lg border border-white/10 bg-[#090f1a] px-3 py-2.5 text-xs text-white" />
          </label>
          <label className="text-[10px] text-slate-400">
            {t("catalog.level")}
            <select name="level" defaultValue="beginner" className="mt-1.5 w-full rounded-lg border border-white/10 bg-[#090f1a] px-3 py-2.5 text-xs text-white">
              <option value="beginner">{t("catalog.level.beginner")}</option>
              <option value="intermediate">{t("catalog.level.intermediate")}</option>
            </select>
          </label>
          <label className="text-[10px] text-slate-400">
            {t("catalog.duration")}
            <input name="duration" required maxLength={40} placeholder="8 weeks" className="mt-1.5 w-full rounded-lg border border-white/10 bg-[#090f1a] px-3 py-2.5 text-xs text-white" />
          </label>
          <button type="submit" className="inline-flex items-center justify-center gap-2 self-end rounded-lg bg-sky-400 px-4 py-2.5 text-[10px] font-bold text-slate-950 transition hover:bg-sky-300">
            <Plus size={14} />
            {t("catalog.addCourse")}
          </button>
        </form>
        {formError && <p role="alert" className="mt-3 text-[10px] text-rose-300">{formError}</p>}
      </section>

      <section>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-bold text-white">{t("catalog.adminTitle")}</h3>
          <span className="text-[10px] text-slate-500">
            {t("catalog.adminCount").replace("{count}", String(catalog.length))}
          </span>
        </div>
        {catalog.length === 0 ? (
          <p className="rounded-xl border border-white/[0.07] bg-[#101827] px-4 py-8 text-center text-xs text-slate-400">
            {t("catalog.emptyAdmin")}
          </p>
        ) : (
          <ul className={styles.adminList}>
            {catalog.map((course) => (
              <li key={course.id} className={styles.adminListItem}>
                <div className="min-w-0">
                  <Link to={`/item/${encodeURIComponent(course.id)}`} className="truncate text-xs font-semibold text-white hover:text-sky-200">
                    {getCourseTitle(course, t)}
                  </Link>
                  <p className="mt-1 truncate text-[10px] text-slate-500">
                    {course.category} · {course.price} сом
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={() => openEditor(course)}
                    aria-label={`${t("catalog.edit")}: ${getCourseTitle(course, t)}`}
                    className="grid h-9 w-9 place-items-center rounded-lg text-sky-300 transition hover:bg-sky-300/10"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() => confirmDelete(course)}
                    aria-label={`${t("catalog.delete")}: ${getCourseTitle(course, t)}`}
                    className="grid h-9 w-9 place-items-center rounded-lg text-rose-300 transition hover:bg-rose-300/10"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section className="mt-8">
        <div className="mb-4 flex items-center gap-2">
          <ClipboardCheck size={17} className="text-emerald-300" />
          <div>
            <h3 className="text-sm font-bold text-white">{t("attendance.title")}</h3>
            <p className="mt-1 text-[10px] text-slate-500">{t("attendance.description")}</p>
          </div>
        </div>

        <form
          onSubmit={submitAttendance}
          className="mb-4 grid gap-3 rounded-xl border border-white/[0.07] bg-[#101827] p-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          <label className="text-[10px] text-slate-400">
            {t("attendance.student")}
            <input
              name="studentName"
              required
              maxLength={100}
              className="mt-1.5 w-full rounded-lg border border-white/10 bg-[#090f1a] px-3 py-2.5 text-xs text-white"
            />
          </label>
          <label className="text-[10px] text-slate-400">
            {t("attendance.course")}
            <select
              name="attendanceCourse"
              required
              defaultValue=""
              className="mt-1.5 w-full rounded-lg border border-white/10 bg-[#090f1a] px-3 py-2.5 text-xs text-white"
            >
              <option value="" disabled>{t("attendance.chooseCourse")}</option>
              {catalog.map((course) => (
                <option key={course.id} value={course.id}>{getCourseTitle(course, t)}</option>
              ))}
            </select>
          </label>
          <label className="text-[10px] text-slate-400">
            {t("attendance.lesson")}
            <input
              name="lessonTitle"
              required
              maxLength={120}
              className="mt-1.5 w-full rounded-lg border border-white/10 bg-[#090f1a] px-3 py-2.5 text-xs text-white"
            />
          </label>
          <label className="text-[10px] text-slate-400">
            {t("attendance.dateTime")}
            <input
              name="attendedAt"
              type="datetime-local"
              required
              defaultValue={new Date(Date.now() - new Date().getTimezoneOffset() * 60_000)
                .toISOString()
                .slice(0, 16)}
              className="mt-1.5 w-full rounded-lg border border-white/10 bg-[#090f1a] px-3 py-2.5 text-xs text-white"
            />
          </label>
          <label className="text-[10px] text-slate-400">
            {t("attendance.status")}
            <select
              name="attendanceStatus"
              defaultValue="attended"
              className="mt-1.5 w-full rounded-lg border border-white/10 bg-[#090f1a] px-3 py-2.5 text-xs text-white"
            >
              <option value="attended">{t("attendance.attended")}</option>
              <option value="missed">{t("attendance.missed")}</option>
            </select>
          </label>
          <button
            type="submit"
            disabled={catalog.length === 0}
            className="inline-flex items-center justify-center gap-2 self-end rounded-lg bg-emerald-300 px-4 py-2.5 text-[10px] font-bold text-slate-950 transition hover:bg-emerald-200 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus size={14} />
            {t("attendance.add")}
          </button>
        </form>
        {attendanceError && (
          <p role="alert" className="mb-3 text-[10px] text-rose-300">{attendanceError}</p>
        )}

        <div className="mb-3 grid gap-2 sm:grid-cols-2">
          <label className="text-[10px] text-slate-500">
            {t("attendance.search")}
            <input
              type="search"
              value={attendanceQuery}
              onChange={(event) => setAttendanceQuery(event.target.value)}
              placeholder={t("attendance.student")}
              className="mt-1.5 w-full rounded-lg border border-white/[0.08] bg-[#101827] px-3 py-2.5 text-xs text-white outline-none placeholder:text-slate-500 focus:border-sky-300/40"
            />
          </label>
          <label className="text-[10px] text-slate-500">
            {t("attendance.filterDate")}
            <input
              type="date"
              value={attendanceDate}
              onChange={(event) => setAttendanceDate(event.target.value)}
              className="mt-1.5 w-full rounded-lg border border-white/[0.08] bg-[#101827] px-3 py-2.5 text-xs text-white outline-none focus:border-sky-300/40"
            />
          </label>
        </div>

        {filteredAttendance.length === 0 ? (
          <p className="rounded-xl border border-white/[0.07] bg-[#101827] px-4 py-7 text-center text-xs text-slate-400">
            {attendance.length === 0 ? t("attendance.empty") : t("attendance.noResults")}
          </p>
        ) : (
          <div className={styles.attendanceTableWrap}>
            <table className={styles.attendanceTable}>
              <thead>
                <tr>
                  <th scope="col">{t("attendance.student")}</th>
                  <th scope="col">{t("attendance.course")}</th>
                  <th scope="col">{t("attendance.lesson")}</th>
                  <th scope="col">{t("attendance.dateTime")}</th>
                  <th scope="col">{t("attendance.status")}</th>
                </tr>
              </thead>
              <tbody>
                {filteredAttendance.map((record) => (
                  <tr key={record.id}>
                    <td>{record.studentName}</td>
                    <td>{record.courseTitle}</td>
                    <td>{record.lessonTitle}</td>
                    <td>{formatAttendanceDate(record.attendedAt)}</td>
                    <td>
                      <span className={record.status === "attended" ? styles.attendedStatus : styles.missedStatus}>
                        {t(`attendance.${record.status}`)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      <section className="mt-8">
        <div className="mb-4 flex items-center gap-2">
          <UsersRound size={17} className="text-sky-300" />
          <div>
            <h3 className="text-sm font-bold text-white">{t("users.title")}</h3>
            <p className="mt-1 text-[10px] text-slate-500">{t("users.description")}</p>
          </div>
        </div>
        <p className="mb-4 rounded-lg border border-sky-300/15 bg-sky-300/[0.05] px-3 py-2.5 text-[10px] leading-5 text-sky-100/80">
          {t("users.demoNote")}
        </p>
        <label className="mb-3 block text-[10px] text-slate-500">
          {t("users.search")}
          <input
            type="search"
            value={userSearch}
            onChange={(event) => setUserSearch(event.target.value)}
            className="mt-1.5 w-full rounded-lg border border-white/[0.08] bg-[#101827] px-3 py-2.5 text-xs text-white outline-none placeholder:text-slate-500 focus:border-sky-300/40"
          />
        </label>

        {filteredUsers.length === 0 ? (
          <p className="rounded-xl border border-white/[0.07] bg-[#101827] px-4 py-7 text-center text-xs text-slate-400">
            {users.length === 0 ? t("users.empty") : t("users.noResults")}
          </p>
        ) : (
          <div className={styles.attendanceTableWrap}>
            <table className={styles.attendanceTable}>
              <thead>
                <tr>
                  <th scope="col">{t("users.name")}</th>
                  <th scope="col">{t("users.role")}</th>
                  <th scope="col">{t("users.lastLogin")}</th>
                  <th scope="col">{t("users.lastSeen")}</th>
                  <th scope="col">{t("users.status")}</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => {
                  const online = isOnline(user);
                  return (
                    <tr key={user.id}>
                      <td>
                        <span className="block font-semibold text-slate-200">{user.displayName}</span>
                        <span className="mt-1 block text-slate-500">{user.email}</span>
                      </td>
                      <td>{t(`users.role.${user.role}`)}</td>
                      <td>{formatUserDate(user.lastLoginAt)}</td>
                      <td>{formatUserDate(user.lastSeenAt)}</td>
                      <td>
                        <span className={online ? styles.onlineStatus : styles.offlineStatus}>
                          {online ? t("users.online") : t("users.offline")}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="mb-3 mt-7 flex items-center gap-2">
          <Activity size={15} className="text-violet-300" />
          <h4 className="text-xs font-bold text-white">{t("users.activityTitle")}</h4>
        </div>
        {visibleActivity.length === 0 ? (
          <p className="rounded-xl border border-white/[0.07] bg-[#101827] px-4 py-6 text-center text-xs text-slate-400">
            {t("users.activityEmpty")}
          </p>
        ) : (
          <ul className={styles.userActivityList}>
            {visibleActivity.map((entry) => {
              const user = users.find((item) => item.id === entry.userId);
              return (
                <li key={entry.id} className={styles.userActivityItem}>
                  <span className={styles.userActivityDot} />
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-semibold text-slate-200">
                      {user?.displayName || t("users.unknownUser")} · {getActivityLabel(entry.type)}
                    </p>
                    {getActivityDetails(entry) && (
                      <p className="mt-1 truncate text-[10px] text-slate-500">{getActivityDetails(entry)}</p>
                    )}
                  </div>
                  <time className="shrink-0 text-[9px] text-slate-500" dateTime={entry.createdAt}>
                    {formatUserDate(entry.createdAt)}
                  </time>
                </li>
              );
            })}
          </ul>
        )}
      </section>
      {editingCourse && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-slate-950/75 p-4"
          onKeyDown={(event) => {
            if (event.key === "Escape") setEditingCourse(null);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-course-title"
            className="w-full max-w-md rounded-xl border border-white/10 bg-[#101827] p-5 shadow-2xl"
          >
            <h3 id="edit-course-title" className="font-display text-lg font-bold text-white">
              {t("catalog.editCourse")}
            </h3>
            <form onSubmit={saveCourse} className="mt-4 grid gap-4">
              <label className="text-[10px] text-slate-400">
                {t("catalog.courseName")}
                <input
                  name="title"
                  required
                  maxLength={80}
                  defaultValue={editingCourse.title}
                  autoFocus
                  className="mt-1.5 w-full rounded-lg border border-white/10 bg-[#090f1a] px-3 py-2.5 text-xs text-white"
                />
              </label>
              <label className="text-[10px] text-slate-400">
                {t("catalog.level")}
                <select
                  name="level"
                  defaultValue={editingCourse.level}
                  className="mt-1.5 w-full rounded-lg border border-white/10 bg-[#090f1a] px-3 py-2.5 text-xs text-white"
                >
                  <option value="beginner">{t("catalog.level.beginner")}</option>
                  <option value="intermediate">{t("catalog.level.intermediate")}</option>
                </select>
              </label>
              {editError && <p role="alert" className="text-[10px] text-rose-300">{editError}</p>}
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingCourse(null)}
                  className="rounded-lg border border-white/10 px-4 py-2.5 text-[10px] font-semibold text-slate-300 transition hover:bg-white/[0.05]"
                >
                  {t("common.cancel")}
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-lg bg-sky-400 px-4 py-2.5 text-[10px] font-bold text-slate-950 transition hover:bg-sky-300"
                >
                  {t("catalog.save")}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
