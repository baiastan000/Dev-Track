import { ArrowRight, BookOpen, CheckSquare, FolderKanban, BarChart3, Settings } from "lucide-react";
import { Link } from "react-router-dom";

const sectionContent = {
  Курсы: {
    icon: BookOpen,
    description: "Все учебные направления и твой прогресс по каждому курсу.",
    action: "Вернуться к моему плану",
    to: "/dashboard",
  },
  Задания: {
    icon: CheckSquare,
    description: "Практикуйся, закрепляй новые знания и отмечай выполненные задания.",
    action: "Посмотреть курсы",
    to: "/courses",
  },
  Проекты: {
    icon: FolderKanban,
    description: "Собирай учебные проекты и наблюдай, как растёт твоё портфолио.",
    action: "Перейти к курсам",
    to: "/courses",
  },
  Статистика: {
    icon: BarChart3,
    description: "Отслеживай регулярность занятий и отмечай, как меняется твой прогресс.",
    action: "На главную",
    to: "/dashboard",
  },
  Настройки: {
    icon: Settings,
    description: "Настройки профиля и предпочтения обучения появятся здесь.",
    action: "Вернуться в кабинет",
    to: "/dashboard",
  },
};

export default function SectionPage({ section }) {
  const content = sectionContent[section];
  const Icon = content.icon;

  return (
    <section className="mx-auto flex min-h-[55vh] max-w-3xl flex-col items-center justify-center text-center">
      <span className="grid h-14 w-14 place-items-center rounded-2xl border border-sky-300/15 bg-sky-300/[0.07] text-sky-300">
        <Icon size={24} />
      </span>
      <p className="mt-6 text-[10px] font-bold uppercase tracking-[0.2em] text-sky-300">Рабочее пространство</p>
      <h2 className="mt-2 font-display text-2xl font-extrabold text-white">{section}</h2>
      <p className="mt-3 max-w-md text-sm leading-6 text-slate-400">{content.description}</p>
      <div className="mt-7 rounded-xl border border-white/[0.07] bg-[#101827] px-5 py-4 text-left">
        <p className="text-xs font-semibold text-slate-200">Раздел готов к развитию</p>
        <p className="mt-1 text-[11px] leading-5 text-slate-500">
          Сейчас здесь подготовлена навигация и базовая структура. Учебные данные можно подключить на следующем этапе.
        </p>
      </div>
      <Link to={content.to} className="mt-5 inline-flex items-center gap-2 text-xs font-semibold text-sky-300 transition hover:text-sky-200">
        {content.action} <ArrowRight size={14} />
      </Link>
    </section>
  );
}
