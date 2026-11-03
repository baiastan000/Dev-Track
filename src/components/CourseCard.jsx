import { ArrowRight, Check } from "lucide-react";
import { Link } from "react-router-dom";

export default function CourseCard({ course, progress }) {
  const { title, subtitle, description, id, icon: Icon, color } = course;

  return (
    <article className="course-card flex flex-col rounded-xl border border-white/[0.07] bg-[#101827] p-5 transition duration-200 hover:-translate-y-0.5 hover:border-white/[0.13]">
      <div className="flex items-start justify-between">
        <span className={`grid h-10 w-10 place-items-center rounded-xl ${color.iconBg} ${color.iconText}`}>
          <Icon size={20} strokeWidth={1.8} />
        </span>
        <span className="rounded-md bg-white/[0.04] px-2 py-1 text-[9px] font-medium text-slate-400">
          {progress.total} темы
        </span>
      </div>
      <div className="mt-5">
        <p className="font-display text-[15px] font-bold text-white">{title}</p>
        <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
        <p className="mt-3 min-h-10 text-[10px] leading-5 text-slate-400">{description}</p>
      </div>
      <div className="mt-5 flex items-center justify-between text-[11px]">
        <span className="text-slate-400">Прогресс</span>
        <span className={`font-semibold ${color.progressText}`}>{progress.percent}%</span>
      </div>
      <div
        className="progress-track mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.07]"
        role="progressbar"
        aria-label={`Прогресс курса ${title}`}
        aria-valuenow={progress.percent}
        aria-valuemin="0"
        aria-valuemax="100"
      >
        <div
          className={`h-full rounded-full ${color.bar}`}
          style={{ width: `${progress.percent}%` }}
        />
      </div>
      <div className="mt-3 flex items-center gap-1.5 text-[10px] text-slate-500">
        <span className="inline-flex items-center gap-1.5">
          <Check size={12} /> {progress.completed} из {progress.total} пройдено
        </span>
      </div>
      <Link
        to={`/courses/${id}`}
        className="mt-5 inline-flex items-center justify-center gap-2 rounded-lg border border-white/[0.08] px-3 py-2.5 text-[10px] font-semibold text-slate-200 transition hover:border-sky-300/30 hover:bg-sky-300/[0.05] hover:text-sky-200"
      >
        {progress.completed === progress.total ? "Повторить курс" : "Продолжить обучение"}
        <ArrowRight size={13} />
      </Link>
    </article>
  );
}
