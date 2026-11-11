import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Circle, Clock3, LockKeyhole, Play, X } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import CourseAnalyticsPanel from "../components/CourseAnalyticsPanel.jsx";
import { getCourse } from "../data/courses.js";
import { getCourseProgress, useLearningProgress } from "../context/ProgressContext.jsx";
import { useLanguage } from "../context/LanguageContext.jsx";

function getTopicStatus(topic, progress, t) {
  if (progress.completedTopics.includes(topic.id)) return t("coursePage.completed");
  if (progress.startedTopics.includes(topic.id)) return t("coursePage.inProgress");
  return t("coursePage.notStarted");
}

export default function CourseDetailPage() {
  const { courseId } = useParams();
  const course = getCourse(courseId);
  const { progress } = useLearningProgress();
  const { t, topicTitle } = useLanguage();
  const [lockedLessonNotice, setLockedLessonNotice] = useState(false);
  const noticeTimeoutRef = useRef(null);

  useEffect(() => {
    return () => window.clearTimeout(noticeTimeoutRef.current);
  }, []);

  function showLockedLessonNotice() {
    setLockedLessonNotice(true);
    window.clearTimeout(noticeTimeoutRef.current);
    noticeTimeoutRef.current = window.setTimeout(() => {
      setLockedLessonNotice(false);
    }, 4500);
  }

  function dismissLockedLessonNotice() {
    window.clearTimeout(noticeTimeoutRef.current);
    setLockedLessonNotice(false);
  }

  if (!course) {
    return (
      <section className="rounded-xl border border-white/[0.07] bg-[#101827] p-8 text-center">
        <h2 className="font-display text-lg font-bold text-white">{t("coursePage.notFound")}</h2>
        <Link to="/courses" className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-sky-300">
          <ArrowLeft size={14} /> {t("coursePage.backToCourses")}
        </Link>
      </section>
    );
  }

  const courseProgress = getCourseProgress(course, progress);
  const firstUncompleted = course.topics.find(
    (topic) => !progress.completedTopics.includes(topic.id),
  );
  const continueTopic = firstUncompleted || course.topics[course.topics.length - 1];
  const Icon = course.icon;
  const titleKey = `course.${course.id}.title`;
  const descriptionKey = `course.${course.id}.description`;
  const courseTitle = t(titleKey) === titleKey ? course.title : t(titleKey);
  const courseDescription = t(descriptionKey) === descriptionKey ? course.description : t(descriptionKey);

  return (
    <div className="mx-auto max-w-4xl">
      <Link to="/courses" className="inline-flex items-center gap-2 text-[11px] font-medium text-slate-400 transition hover:text-white">
        <ArrowLeft size={14} /> {t("dashboard.allCoursesLink")}
      </Link>
      <section className="mt-5 rounded-xl border border-white/[0.07] bg-[#101827] p-5 sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="flex items-start gap-4">
            <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl ${course.color.iconBg} ${course.color.iconText}`}>
              <Icon size={23} />
            </span>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500">{t("coursePage.eyebrow")}</p>
              <h2 className="mt-1 font-display text-2xl font-extrabold text-white">{courseTitle}</h2>
              <p className="mt-1 text-xs text-slate-400">{courseDescription}</p>
            </div>
          </div>
          <Link
            to={`/courses/${course.id}/topics/${continueTopic.id}`}
            className="inline-flex items-center gap-2 rounded-lg bg-sky-400 px-4 py-2.5 text-[11px] font-bold text-slate-950 transition hover:bg-sky-300"
          >
            <Play size={13} fill="currentColor" /> {t("coursePage.continue")}
          </Link>
        </div>
        <div className="mt-6">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400">{t("coursePage.progress").replace("{completed}", String(courseProgress.completed)).replace("{total}", String(courseProgress.total))}</span>
            <span className={`font-semibold ${course.color.progressText}`}>{courseProgress.percent}%</span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.07]" role="progressbar" aria-label={t("statistics.ariaProgress").replace("{title}", courseTitle)} aria-valuenow={courseProgress.percent} aria-valuemin="0" aria-valuemax="100">
            <div className={`h-full rounded-full ${course.color.bar}`} style={{ width: `${courseProgress.percent}%` }} />
          </div>
        </div>
      </section>

      <CourseAnalyticsPanel courseId={course.id} />

      <section className="mt-7">
        <div className="mb-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.17em] text-slate-500">{t("coursePage.syllabus")}</p>
          <h3 className="mt-1 font-display text-lg font-bold text-white">{t("coursePage.topics")}</h3>
        </div>
        <div className="space-y-2">
          {course.topics.map((topic, index) => {
            const status = getTopicStatus(topic, progress, t);
            const completed = progress.completedTopics.includes(topic.id);
            const inProgress = progress.startedTopics.includes(topic.id);
            const locked = course.topics
              .slice(0, index)
              .some((previousTopic) => !progress.completedTopics.includes(previousTopic.id));

            return (
              <Link
                key={topic.id}
                to={`/courses/${course.id}/topics/${topic.id}`}
                aria-disabled={locked}
                onClick={(event) => {
                  if (locked) {
                    event.preventDefault();
                    showLockedLessonNotice();
                  }
                }}
                className={`group flex items-center gap-3 rounded-xl border border-white/[0.07] bg-[#101827] p-4 transition sm:gap-4 sm:px-5 ${
                  locked
                    ? "cursor-not-allowed"
                    : "hover:border-sky-300/20 hover:bg-[#111d2c]"
                }`}
              >
                <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg text-xs font-bold ${
                  completed
                    ? "bg-emerald-400/10 text-emerald-300"
                    : inProgress
                      ? "bg-sky-400/10 text-sky-300"
                      : locked
                        ? "border border-rose-400/25 bg-rose-400/[0.08] text-rose-300 shadow-[0_0_16px_rgba(251,113,133,0.3)]"
                        : "bg-white/[0.04] text-slate-500"
                }`}>
                  {completed ? <Check size={17} /> : locked ? <LockKeyhole size={16} /> : index + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-semibold text-slate-200 group-hover:text-white">{topicTitle(topic)}</span>
                  {topic.description && (
                    <span className="mt-1 block text-[10px] leading-5 text-slate-500">{topic.description}</span>
                  )}
                  <span className="mt-1 inline-flex items-center gap-1 text-[10px] text-slate-500">
                    <Clock3 size={11} /> {topic.duration}
                  </span>
                </span>
                <span className={`hidden items-center gap-1.5 text-[10px] sm:inline-flex ${
                  completed ? "text-emerald-300" : inProgress ? "text-sky-300" : "text-slate-500"
                }`}>
                  {completed ? <Check size={13} /> : locked ? <LockKeyhole size={11} className="text-rose-300" /> : <Circle size={11} />}
                  {!locked && status}
                </span>
                {locked
                  ? <LockKeyhole size={15} className="shrink-0 text-rose-300 drop-shadow-[0_0_6px_rgba(251,113,133,0.8)]" />
                  : <ArrowRight size={15} className="shrink-0 text-slate-600 transition group-hover:translate-x-0.5 group-hover:text-sky-300" />}
              </Link>
            );
          })}
        </div>
      </section>
      {lockedLessonNotice && (
        <div
          role="alert"
          aria-live="assertive"
          className="fixed bottom-5 right-5 z-50 flex max-w-[min(26rem,calc(100vw-2.5rem))] items-start gap-3 rounded-xl border border-rose-400/20 bg-[#0d1421]/95 p-4 text-slate-200 shadow-[0_0_28px_rgba(251,113,133,0.16)] backdrop-blur-xl"
        >
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-rose-400/25 bg-rose-400/10 text-rose-300 shadow-[0_0_16px_rgba(251,113,133,0.28)]">
            <LockKeyhole size={17} />
          </span>
          <p className="flex-1 pt-1 text-xs leading-5">
            {t("coursePage.lockedNotice")}
          </p>
          <button
            type="button"
            aria-label={t("coursePage.closeNotice")}
            onClick={dismissLockedLessonNotice}
            className="rounded-md p-1 text-slate-500 transition hover:bg-white/[0.06] hover:text-white"
          >
            <X size={15} />
          </button>
        </div>
      )}
    </div>
  );
}
