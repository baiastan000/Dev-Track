import { CalendarDays, Check, Circle, Target } from "lucide-react";
import { courses } from "../data/courses.js";
import { useLearningProgress } from "../context/ProgressContext.jsx";

const goalOptions = [
  { value: 3, label: "Спокойно", description: "3 учебных шага за неделю" },
  { value: 5, label: "Уверенно", description: "5 учебных шагов за неделю" },
  { value: 7, label: "Интенсивно", description: "7 учебных шагов за неделю" },
];

const weekdays = ["Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота", "Воскресенье"];
const studyTasks = courses.flatMap((course) =>
  course.topics.map((topic) => ({
    id: `weekly-${topic.id}`,
    topicId: topic.id,
    title: topic.title,
    courseTitle: course.title,
    duration: topic.duration,
    courseId: course.id,
  })),
);

export default function LearningPlanPage() {
  const { progress, setWeeklyGoal, toggleWeeklyTask } = useLearningProgress();
  const goal = goalOptions.some((option) => option.value === progress.plan.goal)
    ? progress.plan.goal
    : 5;
  const tasks = progress.plan.taskIds
    .map((taskId) => studyTasks.find((task) => task.id === taskId))
    .filter(Boolean);
  const completedIds = progress.plan.completedTaskIds;
  const completedCount = tasks.filter((task) => completedIds.includes(task.id)).length;

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-7">
        <p className="text-[10px] font-bold uppercase tracking-[0.17em] text-slate-500">ТВОЙ РИТМ ОБУЧЕНИЯ</p>
        <h2 className="mt-1 font-display text-2xl font-extrabold tracking-tight text-white">План обучения</h2>
        <p className="mt-2 text-xs text-slate-400">Выбери посильную цель и отмечай учебные шаги на этой неделе.</p>
      </div>

      <section className="rounded-xl border border-white/[0.07] bg-[#101827] p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-sky-400/10 text-sky-300"><Target size={17} /></span>
          <div>
            <h3 className="text-sm font-bold text-white">Выбери недельную цель</h3>
            <p className="mt-1 text-[10px] text-slate-500">Цель можно изменить в любой момент.</p>
          </div>
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          {goalOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={goal === option.value}
              onClick={() => setWeeklyGoal(option.value)}
              className={`rounded-lg border p-3 text-left transition ${
                goal === option.value
                  ? "border-sky-300/30 bg-sky-300/[0.07]"
                  : "border-white/[0.07] bg-[#0b111c] hover:border-white/[0.14]"
              }`}
            >
              <span className={`block text-xs font-semibold ${goal === option.value ? "text-sky-200" : "text-slate-200"}`}>{option.label}</span>
              <span className="mt-1 block text-[10px] text-slate-500">{option.description}</span>
            </button>
          ))}
        </div>
        <div className="mt-5">
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-slate-400">Прогресс недели</span>
            <span className="font-semibold text-sky-300">{completedCount} / {tasks.length}</span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.07]">
            <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-sky-300 transition-all" style={{ width: `${tasks.length ? completedCount / tasks.length * 100 : 0}%` }} />
          </div>
        </div>
      </section>

      <section className="mt-6">
        <div className="mb-3 flex items-center gap-2">
          <CalendarDays size={15} className="text-sky-300" />
          <h3 className="font-display text-sm font-bold text-white">Задачи на неделю</h3>
        </div>
        <div className="space-y-2">
          {tasks.length > 0 ? tasks.map((task, index) => {
              const done = completedIds.includes(task.id);
              return (
                <button
                  key={task.id}
                  type="button"
                  aria-pressed={done}
                  onClick={() => toggleWeeklyTask(task.id)}
                  className={`flex w-full items-center gap-3 rounded-xl border p-4 text-left transition sm:px-5 ${
                    done ? "border-emerald-300/15 bg-emerald-300/[0.035]" : "border-white/[0.07] bg-[#101827] hover:border-white/[0.14]"
                  }`}
                >
                  <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${done ? "bg-emerald-400/10 text-emerald-300" : "bg-white/[0.04] text-slate-500"}`}>
                    {done ? <Check size={15} /> : <Circle size={14} />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={`block truncate text-[11px] font-semibold ${done ? "text-slate-400 line-through" : "text-slate-200"}`}>{task.title}</span>
                    <span className="mt-1 block text-[9px] text-slate-500">{task.courseTitle} · {task.duration}</span>
                  </span>
                  <span className="hidden text-[9px] text-slate-500 sm:block">{weekdays[index]}</span>
                </button>
              );
            }) : (
              <p className="rounded-xl border border-emerald-300/15 bg-emerald-300/[0.04] p-4 text-[11px] leading-5 text-emerald-200">
                Все темы учебного плана уже пройдены. Отличный результат!
              </p>
            )}
        </div>
        {tasks.length > 0 && completedCount === tasks.length && (
          <p className="mt-4 rounded-lg border border-emerald-300/15 bg-emerald-300/[0.05] p-3 text-[10px] font-medium text-emerald-200">
            Цель на неделю выполнена. Отличная работа!
          </p>
        )}
      </section>
    </div>
  );
}
