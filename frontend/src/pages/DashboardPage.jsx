import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  CheckCircle2,
  Code2,
  Layers3,
  Play,
  Trophy,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import CourseCard from "../components/CourseCard.jsx";
import { courses } from "../data/courses.js";
import {
  getCourseProgress,
  getOverallProgress,
  useLearningProgress,
} from "../context/ProgressContext.jsx";
import { useLanguage } from "../context/LanguageContext.jsx";

function getCourseTitle(course, t) {
  const key = `course.${course.id}.title`;
  const translatedTitle = t(key);
  return translatedTitle === key ? course.title : translatedTitle;
}

function StatCard({ label, value, note, icon: Icon, tone }) {
  return (
    <article className="rounded-xl border border-white/[0.07] bg-[#101827] p-4 sm:p-5">
      <span className={`grid h-9 w-9 place-items-center rounded-lg ${tone}`}>
        <Icon size={17} />
      </span>
      <p className="mt-4 text-[11px] text-slate-500">{label}</p>
      <div className="mt-1 flex items-baseline gap-2">
        <span className="font-display text-2xl font-extrabold tracking-tight text-white">{value}</span>
        <span className="text-[9px] text-slate-400">{note}</span>
      </div>
    </article>
  );
}

export default function DashboardPage() {
  const { progress } = useLearningProgress();
  const { displayName } = useAuth();
  const { t, topicTitle } = useLanguage();
  const overall = getOverallProgress(progress);
  const totalTasks = courses.reduce((sum, course) => sum + course.topics.length, 0);
  const completedTasks = progress.completedTasks.length;
  const activeCourse = courses.find((course) =>
    course.topics.some((topic) => !progress.completedTopics.includes(topic.id)),
  );
  const nextTopic = activeCourse?.topics.find(
    (topic) => !progress.completedTopics.includes(topic.id),
  );
  const lastCompletedTopic = [...progress.completedTopics]
    .reverse()
    .map((topicId) =>
      courses
        .flatMap((course) =>
          course.topics.map((topic) => ({ topic, course })),
        )
        .find((item) => item.topic.id === topicId),
    )
    .find(Boolean);

  const stats = [
    { label: t("dashboard.overallProgress"), value: `${overall.percent}%`, note: t("dashboard.allCourses"), icon: BookOpen, tone: "bg-sky-400/10 text-sky-300" },
    { label: t("dashboard.topicsLearned"), value: overall.completed, note: t("dashboard.ofTopics").replace("{total}", String(overall.total)), icon: CheckCircle2, tone: "bg-emerald-400/10 text-emerald-300" },
    { label: t("dashboard.tasksSolved"), value: completedTasks, note: t("dashboard.ofTasks").replace("{total}", String(totalTasks)), icon: Code2, tone: "bg-violet-400/10 text-violet-300" },
    { label: t("dashboard.coursesStarted"), value: courses.filter((course) => progress.startedTopics.some((topicId) => course.topics.some((topic) => topic.id === topicId)) || course.topics.some((topic) => progress.completedTopics.includes(topic.id))).length, note: t("dashboard.ofCourses").replace("{total}", String(courses.length)), icon: Trophy, tone: "bg-amber-300/10 text-amber-300" },
  ];

  return (
    <div>
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs text-slate-400">{t("dashboard.intro")}</p>
          <h2 className="mt-1.5 font-display text-2xl font-extrabold tracking-tight text-white sm:text-[28px]">
            {displayName ? t("dashboard.greetingNamed").replace("{name}", displayName) : t("dashboard.greeting")}
          </h2>
          <p className="mt-1.5 text-xs text-slate-500">{t("dashboard.motivation")}</p>
        </div>
        <Link
          to={nextTopic ? `/courses/${activeCourse.id}/topics/${nextTopic.id}` : "/courses"}
          className="inline-flex items-center gap-2 rounded-lg bg-sky-400 px-4 py-2.5 text-[11px] font-bold text-slate-950 transition hover:bg-sky-300"
        >
          <Play size={13} fill="currentColor" /> {nextTopic ? t("dashboard.continue") : t("dashboard.repeat")}
        </Link>
      </div>

      <section aria-label={t("dashboard.statsLabel")} className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        {stats.map((stat) => <StatCard key={stat.label} {...stat} />)}
      </section>

      <section className="mt-7 grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <div className="relative overflow-hidden rounded-xl border border-sky-300/10 bg-gradient-to-br from-[#11243a] via-[#111d30] to-[#111827] p-5 sm:p-6">
          <div className="pointer-events-none absolute -right-12 -top-20 h-64 w-64 rounded-full bg-sky-400/[0.08] blur-3xl" />
          <div className="relative z-10 flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
            <div className="max-w-md">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-300/15 bg-sky-300/[0.07] px-2.5 py-1 text-[9px] font-semibold text-sky-200">
                <Trophy size={11} /> {t("dashboard.nextStep")}
              </span>
              {nextTopic ? (
                <>
                  <h3 className="mt-3 font-display text-lg font-bold text-white">{getCourseTitle(activeCourse, t)}: {topicTitle(nextTopic)}</h3>
                  <p className="mt-1.5 text-[11px] leading-5 text-slate-400">
                    {t("dashboard.nextTopicHint")}
                  </p>
                  <Link
                    to={`/courses/${activeCourse.id}/topics/${nextTopic.id}`}
                    className="mt-4 inline-flex items-center gap-2 rounded-lg bg-sky-400 px-3.5 py-2.5 text-[10px] font-bold text-slate-950 transition hover:bg-sky-300"
                  >
                    {t("dashboard.openTopic")} <ArrowRight size={13} />
                  </Link>
                </>
              ) : (
                <>
                  <h3 className="mt-3 font-display text-lg font-bold text-white">{t("dashboard.allTopicsDone")}</h3>
                  <p className="mt-1.5 text-[11px] leading-5 text-slate-400">{t("dashboard.doneEncouragement")}</p>
                  <Link to="/tasks" className="mt-4 inline-flex items-center gap-2 rounded-lg bg-sky-400 px-3.5 py-2.5 text-[10px] font-bold text-slate-950">
                    {t("dashboard.goToTasks")} <ArrowRight size={13} />
                  </Link>
                </>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-3 rounded-xl border border-white/[0.07] bg-black/10 px-4 py-3">
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-sky-400/10 text-sky-300"><BookOpen size={19} /></span>
              <div>
                <p className="text-[10px] text-slate-500">{t("dashboard.progress")}</p>
                <p className="mt-0.5 text-xs font-bold text-white">{t("dashboard.topicsCount").replace("{completed}", String(overall.completed)).replace("{total}", String(overall.total))}</p>
                <div className="mt-1.5 flex items-center gap-2">
                  <span className="h-1 w-20 overflow-hidden rounded-full bg-white/10">
                    <span className="block h-full rounded-full bg-sky-300" style={{ width: `${overall.percent}%` }} />
                  </span>
                  <span className="text-[9px] text-sky-200">{overall.percent}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-3">
          <Link to="/tasks" className="group flex items-center justify-between gap-3 rounded-xl border border-white/[0.07] bg-[#101827] p-5 transition hover:border-white/[0.13] sm:p-6">
            <div>
              <div className="flex items-center gap-2 text-violet-300">
                <Code2 size={14} />
                <span className="text-[10px] font-semibold uppercase tracking-[0.12em]">{t("dashboard.practice")}</span>
              </div>
              <h3 className="mt-3 font-display text-base font-bold text-white">{t("dashboard.practiceTitle")}</h3>
              <p className="mt-1.5 max-w-[250px] text-[10px] leading-5 text-slate-500">
                {t("dashboard.practiceDescription").replace("{completed}", String(completedTasks)).replace("{total}", String(totalTasks))}
              </p>
            </div>
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white/[0.04] text-slate-400 transition group-hover:bg-sky-300/10 group-hover:text-sky-300">
              <ArrowRight size={16} />
            </span>
          </Link>
          <Link to="/flashcards" className="group flex items-center justify-between gap-3 rounded-xl border border-white/[0.07] bg-[#101827] p-5 transition hover:border-white/[0.13] sm:p-6">
            <div>
              <div className="flex items-center gap-2 text-sky-300">
                <Layers3 size={14} />
                <span className="text-[10px] font-semibold uppercase tracking-[0.12em]">{t("nav.flashcards")}</span>
              </div>
              <h3 className="mt-3 font-display text-base font-bold text-white">{t("dashboard.flashcardsTitle")}</h3>
              <p className="mt-1.5 max-w-[250px] text-[10px] leading-5 text-slate-500">{t("dashboard.flashcardsDescription")}</p>
            </div>
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white/[0.04] text-slate-400 transition group-hover:bg-sky-300/10 group-hover:text-sky-300">
              <ArrowRight size={16} />
            </span>
          </Link>
        </div>
      </section>

      <section className="mt-8">
        <div className="mb-4 flex items-end justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.17em] text-slate-500">{t("dashboard.learningPlan")}</p>
            <h3 className="mt-1 font-display text-lg font-bold text-white">{t("dashboard.myCourses")}</h3>
          </div>
          <Link to="/courses" className="inline-flex items-center gap-1 text-[10px] font-semibold text-sky-300 transition hover:text-sky-200">
            {t("dashboard.allCoursesLink")} <ArrowUpRight size={13} />
          </Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {courses.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              progress={getCourseProgress(course, progress)}
            />
          ))}
        </div>
      </section>

      <section className="mt-8 rounded-xl border border-white/[0.07] bg-[#101827] p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.17em] text-slate-500">{t("dashboard.recentActivity")}</p>
            <h3 className="mt-1 font-display text-sm font-bold text-white">{t("dashboard.completedTopics")}</h3>
          </div>
          <Link to="/statistics" className="text-[10px] font-semibold text-sky-300 hover:text-sky-200">{t("dashboard.statistics")}</Link>
        </div>
        {lastCompletedTopic ? (
          <Link
            to={`/courses/${lastCompletedTopic.course.id}/topics/${lastCompletedTopic.topic.id}`}
            className="mt-4 flex items-center gap-3 rounded-lg border border-white/[0.05] bg-white/[0.02] p-3 transition hover:border-white/[0.1]"
          >
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-emerald-400/10 text-emerald-300"><CheckCircle2 size={17} /></span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[11px] font-semibold text-slate-200">{topicTitle(lastCompletedTopic.topic)}</span>
              <span className="mt-1 block text-[9px] text-slate-500">{getCourseTitle(lastCompletedTopic.course, t)} · {t("dashboard.topicCompleted")}</span>
            </span>
            <ArrowRight size={14} className="text-slate-500" />
          </Link>
        ) : (
          <p className="mt-4 rounded-lg border border-white/[0.05] bg-white/[0.02] p-4 text-[11px] text-slate-500">
            {t("dashboard.noCompletedTopics")}
          </p>
        )}
      </section>
    </div>
  );
}
