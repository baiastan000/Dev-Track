import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Check, CheckCircle2, ChevronDown, Circle, Lightbulb, Play, RotateCcw } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { courses } from "../data/courses.js";
import { getNextLessonStage, useLearningProgress } from "../context/ProgressContext.jsx";
import CodeBlock from "../components/CodeBlock.jsx";

const assignments = courses.flatMap((course) =>
  course.topics.filter((topic) => topic.task).map((topic) => ({
    id: topic.id,
    title: topic.task.title,
    prompt: topic.task.prompt,
    starter: topic.task.starter,
    checks: topic.task.checks,
    hints: topic.task.hints,
    course,
    topic,
  })),
);

function checkAssignment(source, checks) {
  return checks.map((check) => ({
    label: check.label,
    passed: new RegExp(check.pattern, "i").test(source),
  }));
}

export default function TasksPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { progress, saveTaskDraft, completeTask, completeLessonStage } = useLearningProgress();
  const requestedTask = searchParams.get("topic");
  const selectedTask = assignments.find((task) => task.id === requestedTask) || assignments[0];
  const [result, setResult] = useState(null);
  const [showHints, setShowHints] = useState(false);
  const source = progress.taskDrafts[selectedTask.id] ?? selectedTask.starter;
  const taskUnlocked =
    progress.completedTopics.includes(selectedTask.id) ||
    getNextLessonStage(selectedTask.id, progress) === "task";
  const completedCount = assignments.filter((task) =>
    progress.completedTasks.includes(task.id),
  ).length;

  useEffect(() => {
    if (requestedTask && !assignments.some((task) => task.id === requestedTask)) {
      setSearchParams({}, { replace: true });
    }
  }, [requestedTask, setSearchParams]);

  const courseGroups = useMemo(
    () =>
      courses.map((course) => ({
        course,
        tasks: assignments.filter((task) => task.course.id === course.id),
      })),
    [],
  );

  function selectTask(taskId) {
    setSearchParams({ topic: taskId });
    setResult(null);
    setShowHints(false);
  }

  function runCheck() {
    if (!taskUnlocked) return;
    const checks = checkAssignment(source, selectedTask.checks);
    const passed = checks.every((check) => check.passed);
    setResult({ checks, passed });
    if (passed) {
      completeTask(selectedTask.id);
      completeLessonStage(selectedTask.id, "task");
      const topicIndex = selectedTask.course.topics.findIndex(
        (topic) => topic.id === selectedTask.id,
      );
      const nextTopic = selectedTask.course.topics[topicIndex + 1];
      navigate(
        nextTopic
          ? `/courses/${selectedTask.course.id}/topics/${nextTopic.id}`
          : `/courses/${selectedTask.course.id}`,
      );
    }
  }

  function resetDraft() {
    saveTaskDraft(selectedTask.id, selectedTask.starter);
    setResult(null);
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.17em] text-slate-500">ПРАКТИКА</p>
          <h2 className="mt-1 font-display text-2xl font-extrabold tracking-tight text-white">Задания</h2>
          <p className="mt-2 text-xs text-slate-400">Закрепляй темы небольшими практическими упражнениями.</p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-lg border border-white/[0.07] bg-[#101827] px-3 py-2.5 text-[11px] text-slate-400">
          <CheckCircle2 size={14} className="text-emerald-300" />
          <strong className="text-white">{completedCount}</strong> из {assignments.length} выполнено
        </span>
      </div>

      <div className="grid items-start gap-4 xl:grid-cols-[270px_minmax(0,1fr)]">
        <aside className="rounded-xl border border-white/[0.07] bg-[#101827] p-4">
          <p className="px-2 pb-3 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500">СПИСОК ЗАДАНИЙ</p>
          <div className="space-y-4">
            {courseGroups.map(({ course, tasks }) => (
              <div key={course.id}>
                <p className="px-2 pb-1.5 text-[10px] font-semibold text-slate-400">{course.title}</p>
                <div className="space-y-1">
                  {tasks.map((task, index) => {
                    const active = selectedTask.id === task.id;
                    const done = progress.completedTasks.includes(task.id);
                    return (
                      <button
                        key={task.id}
                        type="button"
                        onClick={() => selectTask(task.id)}
                        className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition ${
                          active ? "bg-sky-300/[0.09] text-white" : "text-slate-400 hover:bg-white/[0.04] hover:text-slate-200"
                        }`}
                      >
                        {done ? <CheckCircle2 size={14} className="shrink-0 text-emerald-300" /> : <Circle size={13} className="shrink-0 text-slate-600" />}
                        <span className="min-w-0 flex-1 truncate text-[10px]">{index + 1}. {task.title}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </aside>

        <section className="min-w-0 rounded-xl border border-white/[0.07] bg-[#101827] p-4 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-sky-300">{selectedTask.course.title} · {selectedTask.topic.title}</p>
              <h3 className="mt-1.5 font-display text-lg font-bold text-white">{selectedTask.title}</h3>
            </div>
            {progress.completedTasks.includes(selectedTask.id) && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300/15 bg-emerald-300/[0.07] px-2.5 py-1 text-[9px] font-semibold text-emerald-300">
                <Check size={12} /> Выполнено
              </span>
            )}
          </div>
          <p className="mt-3 text-xs leading-6 text-slate-300">{selectedTask.prompt}</p>
          {!taskUnlocked && (
            <p role="status" className="mt-3 rounded-lg border border-amber-300/15 bg-amber-300/[0.05] px-3 py-2.5 text-[10px] leading-5 text-amber-200">
              Сначала завершите теорию и пример этого урока.
            </p>
          )}

          <details className="mt-4 rounded-lg border border-white/[0.06] bg-[#0b111c]">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-2.5 text-[10px] font-semibold text-slate-400">
              Показать стартовый шаблон <ChevronDown size={13} />
            </summary>
            <div className="px-3 pb-3"><CodeBlock code={selectedTask.starter} compact /></div>
          </details>

          <label className="mt-5 block">
            <span className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">Твой код</span>
            <textarea
              value={source}
              onChange={(event) => {
                saveTaskDraft(selectedTask.id, event.target.value);
                setResult(null);
              }}
              spellCheck="false"
              aria-label="Поле для кода"
              className="min-h-[230px] w-full resize-y rounded-lg border border-white/[0.08] bg-[#080e18] p-4 font-mono text-[11px] leading-6 text-slate-200 outline-none transition placeholder:text-slate-600 focus:border-sky-300/40 focus:ring-2 focus:ring-sky-300/[0.08]"
            />
          </label>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={runCheck}
              disabled={!taskUnlocked}
              className="inline-flex items-center gap-2 rounded-lg bg-sky-400 px-4 py-2.5 text-[10px] font-bold text-slate-950 transition hover:bg-sky-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Play size={12} fill="currentColor" /> Проверить
            </button>
            <button
              type="button"
              onClick={resetDraft}
              className="inline-flex items-center gap-2 rounded-lg border border-white/[0.08] px-3 py-2.5 text-[10px] font-semibold text-slate-400 transition hover:border-white/20 hover:text-white"
            >
              <RotateCcw size={12} /> Сбросить шаблон
            </button>
            <button
              type="button"
              onClick={() => setShowHints((open) => !open)}
              className="ml-auto inline-flex items-center gap-1.5 px-2 py-2 text-[10px] font-semibold text-amber-300 hover:text-amber-200"
            >
              <Lightbulb size={13} /> {showHints ? "Скрыть подсказки" : "Подсказки"}
            </button>
          </div>

          {showHints && (
            <div className="mt-4 rounded-lg border border-amber-300/10 bg-amber-300/[0.04] p-4">
              <p className="text-[10px] font-semibold text-amber-200">Попробуй так</p>
              <ul className="mt-2 space-y-1.5">
                {selectedTask.hints.map((hint) => <li key={hint} className="text-[10px] leading-5 text-slate-400">• {hint}</li>)}
              </ul>
            </div>
          )}

          {result && (
            <div className={`mt-4 rounded-lg border p-4 ${
              result.passed ? "border-emerald-300/15 bg-emerald-300/[0.05]" : "border-amber-300/15 bg-amber-300/[0.04]"
            }`}>
              <div className="flex items-center gap-2">
                {result.passed ? <CheckCircle2 size={16} className="text-emerald-300" /> : <Lightbulb size={15} className="text-amber-300" />}
                <p className={`text-xs font-semibold ${result.passed ? "text-emerald-200" : "text-amber-200"}`}>
                  {result.passed ? "Отлично! Все требования задания выполнены." : "Пока не всё готово — проверь подсказки ниже."}
                </p>
              </div>
              <ul className="mt-3 space-y-1.5">
                {result.checks.map((check) => (
                  <li key={check.label} className={`flex items-center gap-2 text-[10px] ${check.passed ? "text-emerald-300" : "text-slate-400"}`}>
                    {check.passed ? <Check size={12} /> : <Circle size={10} />}
                    {check.label}
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-[9px] leading-4 text-slate-500">
                Автопроверка проверяет наличие обязательных конструкций в коде; она не запускает код в браузере.
              </p>
            </div>
          )}

          <Link
            to={`/courses/${selectedTask.course.id}/topics/${selectedTask.topic.id}`}
            className="mt-5 inline-flex items-center gap-1.5 text-[10px] font-semibold text-sky-300 hover:text-sky-200"
          >
            Вернуться к теме <ArrowRight size={12} />
          </Link>
        </section>
      </div>
    </div>
  );
}
