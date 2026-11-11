import { Activity, BookOpen, CheckCircle2, Flame, Target } from "lucide-react";
import CourseCard from "../components/CourseCard.jsx";
import WeeklyActivityChart from "../components/WeeklyActivityChart.jsx";
import { courses } from "../data/courses.js";
import {
  getCourseProgress,
  getOverallProgress,
  getStudyStreak,
  useLearningProgress,
} from "../context/ProgressContext.jsx";
import { useLanguage } from "../context/LanguageContext.jsx";
import PageBackLink from "../components/PageBackLink.jsx";

function SummaryCard({ label, value, note, icon: Icon, tone }) {
  return (
    <article className="rounded-xl border border-white/[0.07] bg-[#101827] p-4 sm:p-5">
      <span className={`grid h-9 w-9 place-items-center rounded-lg ${tone}`}><Icon size={17} /></span>
      <p className="mt-4 text-[11px] text-slate-500">{label}</p>
      <p className="mt-1 font-display text-2xl font-extrabold text-white">{value}</p>
      <p className="mt-1 text-[9px] text-slate-500">{note}</p>
    </article>
  );
}

function dayWord(count, language, t) {
  if (language !== "ru") return count === 1 ? t("statistics.day") : t("statistics.days");
  const lastTwoDigits = count % 100;
  if (lastTwoDigits >= 11 && lastTwoDigits <= 14) return t("statistics.days");
  if (count % 10 === 1) return t("statistics.day");
  if (count % 10 >= 2 && count % 10 <= 4) return t("statistics.daysFew");
  return t("statistics.days");
}

export default function StatisticsPage() {
  const { progress } = useLearningProgress();
  const { t, language } = useLanguage();
  const overall = getOverallProgress(progress);
  const streak = getStudyStreak(progress.activityDays);
  const studyDays = Object.values(progress.activityDays).filter((count) => Number(count) > 0).length;
  const totalTasks = courses.reduce((sum, course) => sum + course.topics.length, 0);

  return (
    <div>
      <PageBackLink />
      <div className="mb-7">
        <p className="text-[10px] font-bold uppercase tracking-[0.17em] text-slate-500">{t("statistics.eyebrow")}</p>
        <h2 className="mt-1 font-display text-2xl font-extrabold tracking-tight text-white">{t("statistics.title")}</h2>
        <p className="mt-2 text-xs text-slate-400">{t("statistics.description")}</p>
      </div>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <SummaryCard label={t("statistics.overall")} value={`${overall.percent}%`} note={t("dashboard.topicsCount").replace("{completed}", String(overall.completed)).replace("{total}", String(overall.total))} icon={Target} tone="bg-sky-400/10 text-sky-300" />
        <SummaryCard label={t("statistics.completedTopics")} value={overall.completed} note={t("statistics.totalTopics").replace("{count}", String(overall.total))} icon={BookOpen} tone="bg-emerald-400/10 text-emerald-300" />
        <SummaryCard label={t("statistics.completedTasks")} value={progress.completedTasks.length} note={t("statistics.totalTasks").replace("{count}", String(totalTasks))} icon={CheckCircle2} tone="bg-violet-400/10 text-violet-300" />
        <SummaryCard label={t("statistics.streak")} value={`${streak} ${dayWord(streak, language, t)}`} note={t("statistics.studyDays").replace("{count}", String(studyDays))} icon={Flame} tone="bg-orange-400/10 text-orange-300" />
      </section>

      <section className="mt-5 grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <article className="rounded-xl border border-white/[0.07] bg-[#101827] p-4 sm:p-5">
          <div className="mb-4 flex items-center gap-2">
            <Activity size={15} className="text-sky-300" />
            <div>
              <h3 className="text-xs font-bold text-white">{t("statistics.activity")}</h3>
              <p className="mt-0.5 text-[9px] text-slate-500">{t("statistics.activityDescription")}</p>
            </div>
          </div>
          <WeeklyActivityChart activityDays={progress.activityDays} />
        </article>
        <article className="rounded-xl border border-white/[0.07] bg-[#101827] p-4 sm:p-5">
          <div className="mb-4 flex items-center gap-2">
            <Target size={15} className="text-violet-300" />
            <h3 className="text-xs font-bold text-white">{t("statistics.courseProgress")}</h3>
          </div>
          <div className="space-y-4">
            {courses.map((course) => {
              const courseProgress = getCourseProgress(course, progress);
              return (
                <div key={course.id}>
                  <div className="flex items-center justify-between gap-3 text-[10px]">
                    <span className="font-medium text-slate-300">{t(`course.${course.id}.title`)}</span>
                    <span className="text-slate-500">{courseProgress.completed}/{courseProgress.total} · {courseProgress.percent}%</span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.07]" role="progressbar" aria-label={t("statistics.ariaProgress").replace("{title}", t(`course.${course.id}.title`))} aria-valuenow={courseProgress.percent} aria-valuemin="0" aria-valuemax="100">
                    <div className={`h-full rounded-full ${course.color.bar}`} style={{ width: `${courseProgress.percent}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </article>
      </section>

      <section className="mt-8">
        <div className="mb-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.17em] text-slate-500">{t("statistics.byCourse")}</p>
          <h3 className="mt-1 font-display text-lg font-bold text-white">{t("statistics.detailed")}</h3>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {courses.map((course) => (
            <CourseCard key={course.id} course={course} progress={getCourseProgress(course, progress)} />
          ))}
        </div>
      </section>
    </div>
  );
}
