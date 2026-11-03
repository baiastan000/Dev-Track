import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, BookOpen, Check, CheckCircle2, Code2, ListChecks, LockKeyhole } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import CodeBlock from "../components/CodeBlock.jsx";
import { getCourse, getTopic } from "../data/courses.js";
import { getNextLessonStage, useLearningProgress } from "../context/ProgressContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";

const baseTabs = [
  { id: "theory", label: "Теория", icon: BookOpen },
];

export default function TopicPage() {
  const { courseId, topicId } = useParams();
  const navigate = useNavigate();
  const course = getCourse(courseId);
  const topic = getTopic(courseId, topicId);
  const { progress, startTopic, completeLessonStage } = useLearningProgress();
  const { trackActivity } = useAuth();
  const [activeTab, setActiveTab] = useState("theory");
  const trackedTopicId = useRef("");

  useEffect(() => {
    if (!topic) return;
    const nextStage = getNextLessonStage(topic.id, progress);
    setActiveTab(nextStage === "example" ? "examples" : nextStage === "task" ? "task" : "theory");
  }, [courseId, topicId]);

  useEffect(() => {
    if (!course || !topic) return;
    const topicIndex = course.topics.findIndex((item) => item.id === topic.id);
    const firstIncompleteIndex = course.topics.findIndex(
      (item) => !progress.completedTopics.includes(item.id),
    );
    if (firstIncompleteIndex !== -1 && topicIndex > firstIncompleteIndex) {
      navigate(`/courses/${course.id}/topics/${course.topics[firstIncompleteIndex].id}`, {
        replace: true,
      });
    }
  }, [course, topic, progress.completedTopics, navigate]);

  useEffect(() => {
    if (!course || !topic || trackedTopicId.current === topic.id) return;
    const topicIndex = course.topics.findIndex((item) => item.id === topic.id);
    const isUnlocked = course.topics
      .slice(0, topicIndex)
      .every((item) => progress.completedTopics.includes(item.id));
    if (!isUnlocked) return;

    trackedTopicId.current = topic.id;
    trackActivity("lesson_open", {
      courseId: course.id,
      courseTitle: course.title,
      lessonTitle: topic.title,
    });
  }, [course, topic, progress.completedTopics, trackActivity]);

  useEffect(() => {
    const topicIndex = course?.topics.findIndex((item) => item.id === topic?.id) ?? -1;
    const isUnlocked =
      course &&
      topicIndex >= 0 &&
      course.topics
        .slice(0, topicIndex)
        .every((item) => progress.completedTopics.includes(item.id));
    if (topic && isUnlocked && !progress.completedTopics.includes(topic.id)) {
      startTopic(topic.id);
    }
  }, [course, topic, startTopic, progress.completedTopics]);

  if (!course || !topic) {
    return (
      <section className="rounded-xl border border-white/[0.07] bg-[#101827] p-8 text-center">
        <h2 className="font-display text-lg font-bold text-white">Тема не найдена</h2>
        <Link to="/courses" className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-sky-300">
          <ArrowLeft size={14} /> К списку курсов
        </Link>
      </section>
    );
  }

  const topicIndex = course.topics.findIndex((item) => item.id === topic.id);
  const previousTopic = course.topics[topicIndex - 1];
  const nextTopic = course.topics[topicIndex + 1];
  const isComplete = progress.completedTopics.includes(topic.id);
  const taskCompleted = topic.task && progress.completedTasks.includes(topic.id);
  const nextStage = getNextLessonStage(topic.id, progress);
  const completedStages = progress.lessonStages?.[topic.id] ?? [];
  const stageIndex = { theory: 0, examples: 1, task: 2 };
  const tabs = [
    ...baseTabs,
    ...(topic.example ? [{ id: "examples", label: "Примеры", icon: Code2 }] : []),
    ...(topic.task ? [{ id: "task", label: "Задание", icon: ListChecks }] : []),
  ];

  function completeCurrentStage(stage, nextTab) {
    completeLessonStage(topic.id, stage);
    setActiveTab(nextTab);
  }

  function goToTopic(target) {
    navigate(`/courses/${course.id}/topics/${target.id}`);
  }

  return (
    <div className="mx-auto max-w-4xl">
      <Link to={`/courses/${course.id}`} className="inline-flex items-center gap-2 text-[11px] font-medium text-slate-400 transition hover:text-white">
        <ArrowLeft size={14} /> {course.title}
      </Link>

      <header className="mt-5 rounded-xl border border-white/[0.07] bg-[#101827] p-5 sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-sky-300">{course.title} · ТЕМА {topicIndex + 1} ИЗ {course.topics.length}</p>
            <h2 className="mt-2 font-display text-xl font-extrabold text-white sm:text-2xl">{topic.title}</h2>
            <p className="mt-2 text-[11px] text-slate-500">
              {topic.duration} · {topic.task ? "теория, пример и практика" : "теория"}
            </p>
          </div>
          {isComplete && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300/15 bg-emerald-300/[0.07] px-3 py-1.5 text-[10px] font-semibold text-emerald-300">
              <CheckCircle2 size={13} /> Пройдено
            </span>
          )}
        </div>
        <div className="mt-6 flex gap-1 border-b border-white/[0.07]">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              disabled={stageIndex[id] > stageIndex[nextStage] && !completedStages.includes(
                id === "examples" ? "example" : id,
              )}
              className={`inline-flex items-center gap-2 border-b-2 px-3 py-2.5 text-[11px] font-semibold transition ${
                activeTab === id ? "border-sky-400 text-sky-300" : "border-transparent text-slate-500 hover:text-slate-200"
              }`}
            >
              <Icon size={14} /> {label}
              {id === "task" && taskCompleted && <Check size={12} className="text-emerald-300" />}
            </button>
          ))}
        </div>
      </header>

      <section className="mt-4 rounded-xl border border-white/[0.07] bg-[#101827] p-5 sm:p-7">
        {activeTab === "theory" && (
          <div className="space-y-4">
            <h3 className="font-display text-sm font-bold text-white">Разберём тему простыми словами</h3>
            {topic.theory.map((paragraph) => (
              <p key={paragraph} className="text-xs leading-7 text-slate-300">{paragraph}</p>
            ))}
            <div className="mt-5 rounded-lg border border-sky-300/10 bg-sky-300/[0.04] p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-sky-300">Запомни</p>
              <p className="mt-1.5 text-[11px] leading-5 text-slate-300">
                Не обязательно запоминать всё сразу. Попробуй пример самостоятельно и возвращайся к теории по мере необходимости.
              </p>
            </div>
            <button
              type="button"
              onClick={() => completeCurrentStage("theory", "examples")}
              className="inline-flex items-center gap-2 rounded-lg bg-sky-400 px-4 py-2.5 text-[10px] font-bold text-slate-950 transition hover:bg-sky-300"
            >
              <Check size={13} /> Теория изучена — к примеру
            </button>
          </div>
        )}

        {activeTab === "examples" && topic.example && (
          <div>
            <div className="mb-3 flex items-center gap-2">
              <Code2 size={15} className="text-sky-300" />
              <h3 className="font-display text-sm font-bold text-white">Пример кода</h3>
            </div>
            <CodeBlock code={topic.example} />
            <p className="mt-3 text-[10px] leading-5 text-slate-500">
              Попробуй изменить пример и понаблюдать, как меняется его структура.
            </p>
            <button
              type="button"
              onClick={() => completeCurrentStage("example", "task")}
              className="mt-3 inline-flex items-center gap-2 rounded-lg bg-sky-400 px-4 py-2.5 text-[10px] font-bold text-slate-950 transition hover:bg-sky-300"
            >
              <Check size={13} /> Пример изучен — к заданию
            </button>
          </div>
        )}

        {activeTab === "task" && topic.task && (
          <div>
            <div className="flex items-center gap-2">
              <ListChecks size={15} className="text-violet-300" />
              <h3 className="font-display text-sm font-bold text-white">{topic.task.title}</h3>
            </div>
            <p className="mt-3 text-xs leading-6 text-slate-300">{topic.task.prompt}</p>
            <div className="mt-4">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">Стартовый пример</p>
              <CodeBlock code={topic.task.starter} />
            </div>
            <Link
              to={`/tasks?topic=${topic.id}`}
              className="mt-4 inline-flex items-center gap-2 rounded-lg border border-sky-300/15 bg-sky-300/[0.06] px-3.5 py-2.5 text-[10px] font-semibold text-sky-200 transition hover:bg-sky-300/[0.12]"
            >
              Открыть редактор задания <ArrowRight size={13} />
            </Link>
          </div>
        )}
      </section>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          disabled={!previousTopic}
          onClick={() => previousTopic && goToTopic(previousTopic)}
          className="inline-flex items-center gap-2 rounded-lg border border-white/[0.08] px-3.5 py-2.5 text-[10px] font-semibold text-slate-300 transition hover:border-white/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ArrowLeft size={13} /> Предыдущая тема
        </button>
        <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-slate-400">
          {isComplete ? <CheckCircle2 size={13} className="text-emerald-300" /> : <LockKeyhole size={12} />}
          {isComplete ? "Все 3 этапа пройдены" : `Этап ${completedStages.length + 1} из 3`}
        </span>
        <button
          type="button"
          disabled={!nextTopic || !isComplete}
          onClick={() => nextTopic && goToTopic(nextTopic)}
          className="inline-flex items-center gap-2 rounded-lg border border-white/[0.08] px-3.5 py-2.5 text-[10px] font-semibold text-slate-300 transition hover:border-white/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          Следующая тема <ArrowRight size={13} />
        </button>
      </div>
    </div>
  );
}
