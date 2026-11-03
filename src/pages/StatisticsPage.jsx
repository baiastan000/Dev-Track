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

function dayWord(count) {
  const lastTwoDigits = count % 100;
  if (lastTwoDigits >= 11 && lastTwoDigits <= 14) return "дней";
  if (count % 10 === 1) return "день";
  if (count % 10 >= 2 && count % 10 <= 4) return "дня";
  return "дней";
}

export default function StatisticsPage() {
  const { progress } = useLearningProgress();
  const overall = getOverallProgress(progress);
  const streak = getStudyStreak(progress.activityDays);
  const studyDays = Object.values(progress.activityDays).filter((count) => Number(count) > 0).length;
  const totalTasks = courses.reduce((sum, course) => sum + course.topics.length, 0);

  return (
    <div>
      <div className="mb-7">
        <p className="text-[10px] font-bold uppercase tracking-[0.17em] text-slate-500">ТВОЙ ПУТЬ</p>
        <h2 className="mt-1 font-display text-2xl font-extrabold tracking-tight text-white">Статистика</h2>
        <p className="mt-2 text-xs text-slate-400">Результаты основаны на сохранённых завершениях тем и заданий.</p>
      </div>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <SummaryCard label="Общий прогресс" value={`${overall.percent}%`} note={`${overall.completed} из ${overall.total} тем`} icon={Target} tone="bg-sky-400/10 text-sky-300" />
        <SummaryCard label="Завершено тем" value={overall.completed} note={`всего тем: ${overall.total}`} icon={BookOpen} tone="bg-emerald-400/10 text-emerald-300" />
        <SummaryCard label="Завершено заданий" value={progress.completedTasks.length} note={`из ${totalTasks} учебных заданий`} icon={CheckCircle2} tone="bg-violet-400/10 text-violet-300" />
        <SummaryCard label="Серия занятий" value={`${streak} ${dayWord(streak)}`} note={`${studyDays} учебных ${dayWord(studyDays)} за всё время`} icon={Flame} tone="bg-orange-400/10 text-orange-300" />
      </section>

      <section className="mt-5 grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <article className="rounded-xl border border-white/[0.07] bg-[#101827] p-4 sm:p-5">
          <div className="mb-4 flex items-center gap-2">
            <Activity size={15} className="text-sky-300" />
            <div>
              <h3 className="text-xs font-bold text-white">Активность за 7 дней</h3>
              <p className="mt-0.5 text-[9px] text-slate-500">По завершённым темам и заданиям</p>
            </div>
          </div>
          <WeeklyActivityChart activityDays={progress.activityDays} />
        </article>
        <article className="rounded-xl border border-white/[0.07] bg-[#101827] p-4 sm:p-5">
          <div className="mb-4 flex items-center gap-2">
            <Target size={15} className="text-violet-300" />
            <h3 className="text-xs font-bold text-white">Прогресс по курсам</h3>
          </div>
          <div className="space-y-4">
            {courses.map((course) => {
              const courseProgress = getCourseProgress(course, progress);
              return (
                <div key={course.id}>
                  <div className="flex items-center justify-between gap-3 text-[10px]">
                    <span className="font-medium text-slate-300">{course.title}</span>
                    <span className="text-slate-500">{courseProgress.completed}/{courseProgress.total} тем · {courseProgress.percent}%</span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.07]" role="progressbar" aria-label={`Прогресс ${course.title}`} aria-valuenow={courseProgress.percent} aria-valuemin="0" aria-valuemax="100">
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
          <p className="text-[10px] font-bold uppercase tracking-[0.17em] text-slate-500">ПО КУРСАМ</p>
          <h3 className="mt-1 font-display text-lg font-bold text-white">Подробный прогресс</h3>
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
