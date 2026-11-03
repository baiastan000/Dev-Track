import {
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Check,
  Code2,
  Layers3,
  Play,
  Sparkles,
  Target,
} from "lucide-react";
import { Link } from "react-router-dom";

const features = [
  {
    icon: Target,
    title: "Понятный маршрут",
    description: "Разбей большую цель на короткие шаги и двигайся по плану.",
  },
  {
    icon: BarChart3,
    title: "Видимый прогресс",
    description: "Следи за темами, заданиями и своей регулярностью в одном месте.",
  },
  {
    icon: Layers3,
    title: "Практика по делу",
    description: "Закрепляй знания задачами и складывай результаты в портфолио.",
  },
];

function ProductPreview() {
  return (
    <div className="preview-window relative mx-auto w-full max-w-[520px] rounded-2xl border border-white/10 bg-[#0d1422] p-3 shadow-2xl shadow-sky-950/30 sm:p-4">
      <div className="flex items-center justify-between border-b border-white/[0.07] px-2 pb-3">
        <div className="flex items-center gap-2">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-sky-400/10 text-sky-300">
            <Code2 size={15} />
          </span>
          <span className="text-xs font-bold text-slate-200">Мой прогресс</span>
        </div>
        <span className="rounded-full border border-emerald-400/15 bg-emerald-400/[0.08] px-2.5 py-1 text-[9px] font-semibold text-emerald-300">
          На этой неделе +12%
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3 p-2 pt-4">
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.025] p-3.5">
          <p className="text-[10px] text-slate-500">Общий прогресс</p>
          <div className="mt-1.5 flex items-baseline gap-1">
            <span className="font-display text-2xl font-extrabold text-white">68</span>
            <span className="text-xs text-slate-400">%</span>
          </div>
          <div className="mt-3 h-1.5 rounded-full bg-white/[0.07]">
            <div className="h-full w-[68%] rounded-full bg-gradient-to-r from-blue-500 to-sky-300" />
          </div>
        </div>
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.025] p-3.5">
          <p className="text-[10px] text-slate-500">Выполнено заданий</p>
          <div className="mt-1.5 flex items-baseline gap-1">
            <span className="font-display text-2xl font-extrabold text-white">24</span>
            <span className="text-xs text-slate-400">из 36</span>
          </div>
          <p className="mt-2 text-[10px] text-emerald-300">Отличный темп!</p>
        </div>
      </div>
      <div className="space-y-2 px-2 pb-1 pt-1">
        {[
          ["HTML и семантика", "88%", "bg-sky-400", "w-[88%]"],
          ["Основы CSS", "64%", "bg-violet-400", "w-[64%]"],
          ["JavaScript", "42%", "bg-amber-300", "w-[42%]"],
        ].map(([label, percent, color, width]) => (
          <div
            key={label}
            className="flex items-center gap-3 rounded-lg border border-white/[0.05] bg-white/[0.02] px-3 py-2.5"
          >
            <span className={`h-1.5 w-1.5 rounded-full ${color}`} />
            <span className="flex-1 text-[10px] font-medium text-slate-300">{label}</span>
            <span className="mr-1 text-[9px] text-slate-500">{percent}</span>
            <span className="w-16 overflow-hidden rounded-full bg-white/[0.08]">
              <span className={`block h-1 ${width} ${color}`} />
            </span>
          </div>
        ))}
      </div>
      <div className="pointer-events-none absolute -right-4 -top-5 hidden h-16 w-16 rounded-full bg-blue-500/20 blur-2xl sm:block" />
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="landing-page min-h-screen overflow-hidden bg-[#080d18] text-white">
      <header className="relative z-10 mx-auto flex h-[76px] max-w-7xl items-center justify-between px-5 sm:px-8">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="brand-mark grid h-9 w-9 place-items-center rounded-xl text-white">
            <Code2 size={20} strokeWidth={2.5} />
          </span>
          <span className="font-display text-[19px] font-extrabold tracking-[-0.06em]">
            dev<span className="text-sky-400">track</span>
          </span>
        </Link>
        <nav className="hidden items-center gap-8 text-xs font-medium text-slate-400 md:flex">
          <a className="transition hover:text-white" href="#features">Возможности</a>
          <a className="transition hover:text-white" href="#how-it-works">Как это работает</a>
        </nav>
        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="hidden rounded-lg px-3 py-2 text-xs font-semibold text-slate-300 transition hover:text-white sm:inline-flex"
          >
            Войти
          </Link>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 rounded-lg bg-sky-400 px-3.5 py-2.5 text-xs font-bold text-slate-950 transition hover:bg-sky-300 sm:px-4"
          >
            Начать бесплатно <ArrowRight size={14} />
          </Link>
        </div>
      </header>

      <main>
        <section className="hero-section relative mx-auto grid max-w-7xl items-center gap-12 px-5 pb-20 pt-12 sm:px-8 sm:pt-20 lg:min-h-[590px] lg:grid-cols-[1fr_0.95fr] lg:gap-16 lg:pb-24 lg:pt-10">
          <div className="hero-glow pointer-events-none absolute -left-40 top-8 h-96 w-96 rounded-full bg-blue-600/[0.12] blur-[110px]" />
          <div className="relative z-10 max-w-[560px]">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-sky-300/15 bg-sky-300/[0.06] px-3 py-1.5 text-[10px] font-semibold tracking-wide text-sky-200">
              <Sparkles size={12} /> Твой путь в разработку начинается здесь
            </div>
            <h1 className="font-display text-[42px] font-extrabold leading-[1.08] tracking-[-0.055em] text-white sm:text-[56px] lg:text-[62px]">
              Учись кодить.
              <br />
              <span className="hero-gradient-text">Видь свой прогресс.</span>
            </h1>
            <p className="mt-6 max-w-[460px] text-sm leading-7 text-slate-400 sm:text-[15px]">
              DevTrack помогает превратить большую цель «стать разработчиком» в
              понятный план, регулярную практику и реальные результаты.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 rounded-lg bg-sky-400 px-5 py-3 text-xs font-bold text-slate-950 transition hover:-translate-y-0.5 hover:bg-sky-300"
              >
                Начать бесплатно <ArrowRight size={15} />
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.025] px-5 py-3 text-xs font-semibold text-slate-200 transition hover:border-white/20 hover:bg-white/[0.05]"
              >
                <Play size={13} /> Как это работает
              </a>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-[10px] text-slate-500">
              <span className="inline-flex items-center gap-1.5"><Check size={12} className="text-emerald-400" /> Бесплатно начать</span>
              <span className="inline-flex items-center gap-1.5"><Check size={12} className="text-emerald-400" /> Учись в своём темпе</span>
              <span className="inline-flex items-center gap-1.5"><Check size={12} className="text-emerald-400" /> Всё в одном месте</span>
            </div>
          </div>
          <div className="relative z-10 lg:pl-2">
            <ProductPreview />
            <div className="absolute -bottom-5 left-2 hidden items-center gap-2 rounded-xl border border-white/[0.08] bg-[#111a29] px-3 py-2 shadow-xl sm:flex lg:-left-5">
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-emerald-400/10 text-emerald-300"><Check size={15} /></span>
              <span>
                <span className="block text-[10px] font-semibold text-slate-200">Задание выполнено</span>
                <span className="block text-[9px] text-slate-500">Продолжай в том же духе!</span>
              </span>
            </div>
          </div>
        </section>

        <section id="features" className="border-y border-white/[0.06] bg-white/[0.015]">
          <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20">
            <div className="max-w-xl">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-sky-300">Всё для твоего роста</p>
              <h2 className="mt-3 font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
                Не просто учись. <span className="text-slate-500">Двигайся вперёд.</span>
              </h2>
            </div>
            <div className="mt-9 grid gap-4 md:grid-cols-3">
              {features.map(({ icon: Icon, title, description }, index) => (
                <article key={title} className="rounded-xl border border-white/[0.07] bg-[#0d1421] p-5 sm:p-6">
                  <span className={`grid h-10 w-10 place-items-center rounded-xl ${index === 1 ? "bg-violet-400/10 text-violet-300" : "bg-sky-400/10 text-sky-300"}`}>
                    <Icon size={19} />
                  </span>
                  <h3 className="mt-5 text-sm font-bold text-white">{title}</h3>
                  <p className="mt-2 text-xs leading-6 text-slate-400">{description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="how-it-works" className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 px-5 py-14 sm:flex-row sm:items-center sm:px-8 sm:py-16">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-sky-300">Твой следующий шаг</p>
            <h2 className="mt-2 font-display text-2xl font-bold tracking-tight text-white">Начни с малого. Создай большое.</h2>
            <p className="mt-2 text-xs text-slate-400">Выбери курс, выполняй задания и отмечай каждый новый навык.</p>
          </div>
          <Link
            to="/login"
            className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-sky-300/20 bg-sky-300/[0.06] px-4 py-3 text-xs font-semibold text-sky-200 transition hover:bg-sky-300/[0.12]"
          >
            Создать аккаунт <ArrowUpRight size={14} />
          </Link>
        </section>
      </main>

      <footer className="border-t border-white/[0.06] px-5 py-5 text-center text-[10px] text-slate-600 sm:px-8">
        © 2026 DevTrack. Твой прогресс — твоя история.
      </footer>
    </div>
  );
}
