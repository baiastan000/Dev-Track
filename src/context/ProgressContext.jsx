import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { courses } from "../data/courses.js";

const STORAGE_KEY = "devtrack.learning-progress.v1";
const LESSON_STAGES = ["theory", "example", "task"];
const ProgressContext = createContext(null);

function getLocalDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getWeekKey(date = new Date()) {
  const monday = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const daysSinceMonday = (monday.getDay() + 6) % 7;
  monday.setDate(monday.getDate() - daysSinceMonday);
  return getLocalDateKey(monday);
}

function getWeeklyTaskIds(goal, completedTopics = []) {
  return courses
    .flatMap((course) => course.topics)
    .filter((topic) => !completedTopics.includes(topic.id))
    .slice(0, goal)
    .map((topic) => `weekly-${topic.id}`);
}

function sanitizeActivityDays(activityDays) {
  if (!activityDays || typeof activityDays !== "object" || Array.isArray(activityDays)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(activityDays).filter(
      ([date, count]) =>
        /^\d{4}-\d{2}-\d{2}$/.test(date) &&
        Number.isFinite(Number(count)) &&
        Number(count) > 0,
    ),
  );
}

function getCompletedStagePrefix(stages) {
  const validStages = Array.isArray(stages) ? stages : [];
  let index = 0;
  while (index < LESSON_STAGES.length && validStages[index] === LESSON_STAGES[index]) {
    index += 1;
  }
  return LESSON_STAGES.slice(0, index);
}

function createInitialProgress() {
  const goal = 5;
  return {
    completedTopics: [],
    startedTopics: [],
    completedTasks: [],
    lessonStages: {},
    taskDrafts: {},
    activityDays: {},
    plan: {
      goal,
      weekKey: getWeekKey(),
      completedTaskIds: [],
      taskIds: getWeeklyTaskIds(goal),
    },
    projects: [],
    theme: "dark",
  };
}

function readProgress() {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) return { progress: createInitialProgress(), error: "" };

    const parsed = JSON.parse(saved);
    if (
      !parsed ||
      !Array.isArray(parsed.completedTopics) ||
      !Array.isArray(parsed.startedTopics) ||
      !Array.isArray(parsed.completedTasks) ||
      typeof parsed.taskDrafts !== "object" ||
      parsed.taskDrafts === null ||
      Array.isArray(parsed.taskDrafts)
    ) {
      throw new Error("Сохранённые данные имеют неизвестный формат.");
    }

    const initial = createInitialProgress();
    const migrated = {
      ...initial,
      ...parsed,
      lessonStages:
        parsed.lessonStages &&
        typeof parsed.lessonStages === "object" &&
        !Array.isArray(parsed.lessonStages)
          ? parsed.lessonStages
          : {},
      activityDays: sanitizeActivityDays(parsed.activityDays),
      projects: Array.isArray(parsed.projects) ? parsed.projects : [],
      theme: parsed.theme === "light" ? "light" : "dark",
      plan: {
        ...initial.plan,
        ...(parsed.plan && typeof parsed.plan === "object" ? parsed.plan : {}),
      },
    };
    for (const topicId of migrated.completedTopics) {
      migrated.lessonStages[topicId] = [...LESSON_STAGES];
    }
    for (const [topicId, stages] of Object.entries(migrated.lessonStages)) {
      migrated.lessonStages[topicId] = getCompletedStagePrefix(stages);
    }
    if (![3, 5, 7].includes(Number(migrated.plan.goal))) {
      migrated.plan.goal = initial.plan.goal;
    }
    if (typeof migrated.plan.weekKey !== "string") migrated.plan.weekKey = getWeekKey();
    if (!Array.isArray(migrated.plan.completedTaskIds)) {
      migrated.plan.completedTaskIds = [];
    }
    if (!Array.isArray(migrated.plan.taskIds)) {
      migrated.plan.taskIds = getWeeklyTaskIds(
        migrated.plan.goal,
        migrated.completedTopics,
      );
    }

    if (migrated.plan.weekKey !== getWeekKey()) {
      migrated.plan = {
        ...migrated.plan,
        weekKey: getWeekKey(),
        completedTaskIds: [],
        taskIds: getWeeklyTaskIds(migrated.plan.goal, migrated.completedTopics),
      };
    }

    return { progress: migrated, error: "" };
  } catch (error) {
    console.error("Не удалось загрузить данные DevTrack из localStorage.", error);
    return {
      progress: createInitialProgress(),
      error: "Не удалось прочитать сохранённые данные. Проверьте localStorage браузера; начато новое учебное пространство.",
    };
  }
}

function recordActivity(activityDays) {
  const today = getLocalDateKey();
  return {
    ...activityDays,
    [today]: (Number(activityDays[today]) || 0) + 1,
  };
}

function createProjectId() {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }
  return `project-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function getCourseProgress(course, progress) {
  const completed = course.topics.filter((topic) =>
    progress.completedTopics.includes(topic.id),
  ).length;

  return {
    completed,
    total: course.topics.length,
    percent: course.topics.length
      ? Math.round((completed / course.topics.length) * 100)
      : 0,
  };
}

export function getNextLessonStage(topicId, progress) {
  const completedStages = progress.lessonStages?.[topicId] ?? [];
  return LESSON_STAGES.find((stage) => !completedStages.includes(stage)) ?? null;
}

export function getOverallProgress(progress) {
  const totalTopics = courses.reduce((sum, course) => sum + course.topics.length, 0);
  const completed = courses.reduce(
    (sum, course) =>
      sum +
      course.topics.filter((topic) => progress.completedTopics.includes(topic.id))
        .length,
    0,
  );

  return {
    completed,
    total: totalTopics,
    percent: totalTopics ? Math.round((completed / totalTopics) * 100) : 0,
  };
}

export function getStudyStreak(activityDays, today = new Date()) {
  const todayKey = getLocalDateKey(today);
  const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
  let cursor = Number(activityDays[todayKey]) > 0 ? today : yesterday;
  let streak = 0;

  while (Number(activityDays[getLocalDateKey(cursor)]) > 0) {
    streak += 1;
    cursor = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() - 1);
  }

  return streak;
}

export function getRecentActivity(activityDays, today = new Date()) {
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() - (6 - index));
    const key = getLocalDateKey(date);
    return {
      date: key,
      label: new Intl.DateTimeFormat("ru-RU", { weekday: "short" })
        .format(date)
        .replace(".", ""),
      count: Number(activityDays[key]) || 0,
      isToday: index === 6,
    };
  });
}

export function ProgressProvider({ children }) {
  const [initialState] = useState(readProgress);
  const [progress, setProgress] = useState(initialState.progress);
  const [storageError, setStorageError] = useState(initialState.error);
  const skipInitialSave = useRef(Boolean(initialState.error));

  useEffect(() => {
    if (skipInitialSave.current) {
      skipInitialSave.current = false;
      return;
    }
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
      setStorageError("");
    } catch (error) {
      console.error("Не удалось сохранить данные DevTrack в localStorage.", error);
      setStorageError("Не удалось сохранить изменения. Проверьте доступное место и настройки localStorage браузера.");
    }
  }, [progress]);

  useEffect(() => {
    document.documentElement.dataset.theme = progress.theme;
  }, [progress.theme]);

  useEffect(() => {
    const weekKey = getWeekKey();
    if (progress.plan.weekKey !== weekKey) {
      setProgress((current) => ({
        ...current,
        plan: {
          ...current.plan,
          weekKey,
          completedTaskIds: [],
          taskIds: getWeeklyTaskIds(current.plan.goal, current.completedTopics),
        },
      }));
    }
  }, [progress.plan.weekKey]);

  const value = useMemo(
    () => ({
      progress,
      storageError,
      startTopic(topicId) {
        setProgress((current) => {
          if (
            current.completedTopics.includes(topicId) ||
            current.startedTopics.includes(topicId)
          ) {
            return current;
          }
          return {
            ...current,
            startedTopics: [...current.startedTopics, topicId],
          };
        });
      },
      completeLessonStage(topicId, stage) {
        setProgress((current) => {
          if (!LESSON_STAGES.includes(stage) || current.completedTopics.includes(topicId)) {
            return current;
          }

          const completedStages = current.lessonStages[topicId] ?? [];
          const nextStage = LESSON_STAGES[completedStages.length];
          if (stage !== nextStage) return current;

          let nextStages = [...completedStages, stage];
          if (stage === "example" && current.completedTasks.includes(topicId)) {
            nextStages = [...nextStages, "task"];
          }
          const lessonCompleted = nextStages.length === LESSON_STAGES.length;
          return {
            ...current,
            lessonStages: { ...current.lessonStages, [topicId]: nextStages },
            startedTopics: lessonCompleted
              ? current.startedTopics.filter((id) => id !== topicId)
              : current.startedTopics,
            completedTopics: lessonCompleted
              ? [...current.completedTopics, topicId]
              : current.completedTopics,
            activityDays: lessonCompleted
              ? recordActivity(current.activityDays)
              : current.activityDays,
            plan:
              lessonCompleted && current.plan.taskIds.includes(`weekly-${topicId}`)
                ? {
                    ...current.plan,
                    completedTaskIds: current.plan.completedTaskIds.includes(`weekly-${topicId}`)
                      ? current.plan.completedTaskIds
                      : [...current.plan.completedTaskIds, `weekly-${topicId}`],
                  }
                : current.plan,
          };
        });
      },
      saveTaskDraft(taskId, draft) {
        setProgress((current) => ({
          ...current,
          taskDrafts: { ...current.taskDrafts, [taskId]: draft },
        }));
      },
      completeTask(taskId) {
        setProgress((current) => {
          if (current.completedTasks.includes(taskId)) return current;
          return {
            ...current,
            completedTasks: [...current.completedTasks, taskId],
            activityDays: recordActivity(current.activityDays),
          };
        });
      },
      setWeeklyGoal(goal) {
        setProgress((current) => {
          const nextGoal = Number(goal);
          const taskIds = getWeeklyTaskIds(nextGoal, current.completedTopics);
          return {
            ...current,
            plan: {
              ...current.plan,
              goal: nextGoal,
              taskIds,
              completedTaskIds: current.plan.completedTaskIds.filter((id) =>
                taskIds.includes(id),
              ),
            },
          };
        });
      },
      toggleWeeklyTask(taskId) {
        setProgress((current) => {
          const completedTaskIds = current.plan.completedTaskIds.includes(taskId)
            ? current.plan.completedTaskIds.filter((id) => id !== taskId)
            : [...current.plan.completedTaskIds, taskId];
          return {
            ...current,
            plan: { ...current.plan, completedTaskIds },
          };
        });
      },
      addProject(project) {
        setProgress((current) => ({
          ...current,
          projects: [{ ...project, id: createProjectId(), createdAt: Date.now() }, ...current.projects],
        }));
      },
      updateProject(projectId, updates) {
        setProgress((current) => ({
          ...current,
          projects: current.projects.map((project) =>
            project.id === projectId ? { ...project, ...updates, updatedAt: Date.now() } : project,
          ),
        }));
      },
      deleteProject(projectId) {
        setProgress((current) => ({
          ...current,
          projects: current.projects.filter((project) => project.id !== projectId),
        }));
      },
      setTheme(theme) {
        setProgress((current) => ({ ...current, theme }));
      },
      resetLearningProgress() {
        setProgress((current) => ({
          ...current,
          completedTopics: [],
          startedTopics: [],
          completedTasks: [],
          taskDrafts: {},
          activityDays: {},
          plan: {
            ...current.plan,
            weekKey: getWeekKey(),
            completedTaskIds: [],
            taskIds: getWeeklyTaskIds(current.plan.goal),
          },
        }));
      },
    }),
    [progress, storageError],
  );

  return (
    <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>
  );
}

export function useLearningProgress() {
  const context = useContext(ProgressContext);
  if (!context) {
    throw new Error("useLearningProgress должен использоваться внутри ProgressProvider.");
  }
  return context;
}
