import { getRecentActivity } from "../context/ProgressContext.jsx";

export default function WeeklyActivityChart({ activityDays }) {
  const days = getRecentActivity(activityDays);
  const maxCount = Math.max(1, ...days.map((day) => day.count));
  const points = days.map((day, index) => {
    const x = 20 + index * 46.6;
    const y = 90 - (day.count / maxCount) * 68;
    return `${x},${y}`;
  });
  const line = points.join(" ");
  const area = `20,94 ${line} 300,94`;

  return (
    <div>
      <div className="rounded-lg border border-white/[0.05] bg-[#0c1320] px-3 pt-4">
        <svg
          viewBox="0 0 320 110"
          role="img"
          aria-label="График учебной активности за последние семь дней"
          className="h-36 w-full overflow-visible"
          preserveAspectRatio="none"
        >
          {[24, 48, 72, 94].map((y) => (
            <line key={y} x1="8" x2="312" y1={y} y2={y} stroke="rgba(148,163,184,0.12)" strokeDasharray="3 5" />
          ))}
          <polygon points={area} fill="rgba(56,189,248,0.10)" />
          <polyline points={line} fill="none" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          {days.map((day, index) => {
            const x = 20 + index * 46.6;
            const y = 90 - (day.count / maxCount) * 68;
            return (
              <circle
                key={day.date}
                cx={x}
                cy={y}
                r={day.isToday ? 4.5 : 3.5}
                fill={day.count ? "#7dd3fc" : "#1e293b"}
                stroke={day.count ? "#0c1320" : "#475569"}
                strokeWidth="2"
              >
                <title>{`${day.label}: ${day.count} учебных действия`}</title>
              </circle>
            );
          })}
        </svg>
        <div className="grid grid-cols-7 pb-3 text-center">
          {days.map((day) => (
            <span key={day.date} className={`text-[9px] capitalize ${day.isToday ? "font-bold text-sky-300" : "text-slate-500"}`}>
              {day.label}
            </span>
          ))}
        </div>
      </div>
      <p className="mt-2 text-[9px] leading-4 text-slate-500">
        Учитываются дни, когда ты завершил тему или успешно выполнил задание.
      </p>
    </div>
  );
}
