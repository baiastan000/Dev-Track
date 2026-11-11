import { useEffect, useState } from "react";
import { Activity, Eye, RefreshCw, Users } from "lucide-react";
import { useLanguage } from "../context/LanguageContext.jsx";
import styles from "./CourseAnalyticsPanel.module.css";

const localeTags = { kg: "ky-KG", ru: "ru-KG", en: "en-US" };

function parseAnalytics(data) {
  if (
    !data ||
    !Number.isSafeInteger(data.totalVisits) ||
    data.totalVisits < 0 ||
    !Number.isSafeInteger(data.uniqueUsers) ||
    data.uniqueUsers < 0 ||
    !Array.isArray(data.viewsByDay)
  ) {
    throw new Error("Course analytics response has an unexpected format.");
  }

  const viewsByDay = data.viewsByDay.map((entry) => {
    const date = typeof entry?.date === "string"
      ? new Date(`${entry.date}T00:00:00Z`)
      : null;
    if (
      !entry ||
      typeof entry.date !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(entry.date) ||
      Number.isNaN(date.getTime()) ||
      date.toISOString().slice(0, 10) !== entry.date ||
      !Number.isSafeInteger(entry.views) ||
      entry.views < 0
    ) {
      throw new Error("Course analytics response has an unexpected format.");
    }

    return { date: entry.date, views: entry.views };
  });

  return {
    totalVisits: data.totalVisits,
    uniqueUsers: data.uniqueUsers,
    viewsByDay: viewsByDay.sort((a, b) => a.date.localeCompare(b.date)),
  };
}

function SummaryCard({ icon: Icon, label, value, tone, language }) {
  return (
    <article className={styles.metric}>
      <span className={`${styles.metricIcon} ${tone}`}><Icon size={16} /></span>
      <div>
        <p className={styles.metricLabel}>{label}</p>
        <p className={styles.metricValue}>
          {new Intl.NumberFormat(localeTags[language]).format(value)}
        </p>
      </div>
    </article>
  );
}

export default function CourseAnalyticsPanel({ courseId }) {
  const { t, language } = useLanguage();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function loadAnalytics() {
      setLoading(true);
      setError(false);
      try {
        const response = await fetch(
          `/api/courses/${encodeURIComponent(courseId)}/analytics`,
          {
            headers: { Accept: "application/json" },
            cache: "no-store",
            signal: controller.signal,
          },
        );
        if (!response.ok) {
          throw new Error(`Analytics API returned ${response.status}.`);
        }

        const data = parseAnalytics(await response.json());
        setAnalytics(data);
      } catch (requestError) {
        if (controller.signal.aborted) return;
        console.error("Could not load course analytics.", requestError);
        setError(true);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    loadAnalytics();
    return () => controller.abort();
  }, [courseId, refreshKey]);

  const chartEntries = analytics?.viewsByDay.slice(-7) ?? [];
  const maxViews = Math.max(1, ...chartEntries.map((entry) => entry.views));
  const dateFormatter = new Intl.DateTimeFormat(localeTags[language], {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });

  return (
    <section
      className={styles.panel}
      aria-labelledby="course-analytics-title"
      aria-busy={loading}
    >
      <header className={styles.header}>
        <div className={styles.heading}>
          <span className={styles.headingIcon}><Activity size={17} /></span>
          <div>
            <h3 id="course-analytics-title" className={styles.title}>{t("analytics.title")}</h3>
            <p className={styles.subtitle}>{t("analytics.description")}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setRefreshKey((current) => current + 1)}
          disabled={loading}
          aria-label={t("analytics.refresh")}
          className={styles.refreshButton}
        >
          <RefreshCw size={14} className={loading ? styles.spinning : ""} />
          <span>{t("analytics.refresh")}</span>
        </button>
      </header>

      {loading && (
        <p className={styles.status} role="status">{t("analytics.loading")}</p>
      )}
      {!loading && error && (
        <div className={styles.error} role="alert">
          <p>{t("analytics.loadError")}</p>
          <button type="button" onClick={() => setRefreshKey((current) => current + 1)}>
            {t("analytics.retry")}
          </button>
        </div>
      )}
      {!loading && !error && analytics && (
        <>
          <div className={styles.metrics}>
            <SummaryCard
              icon={Eye}
              label={t("analytics.totalVisits")}
              value={analytics.totalVisits}
              tone={styles.blue}
              language={language}
            />
            <SummaryCard
              icon={Users}
              label={t("analytics.uniqueUsers")}
              value={analytics.uniqueUsers}
              tone={styles.violet}
              language={language}
            />
          </div>

          <div className={styles.chart}>
            <div className={styles.chartHeading}>
              <h4>{t("analytics.viewsByDay")}</h4>
              <span>{t("analytics.lastDays")}</span>
            </div>
            {chartEntries.length === 0 ? (
              <p className={styles.emptyChart}>{t("analytics.noViews")}</p>
            ) : (
              <div className={styles.bars} role="list" aria-label={t("analytics.viewsByDay")}>
                {chartEntries.map((entry) => {
                  const date = new Date(`${entry.date}T00:00:00Z`);
                  const height = entry.views === 0
                    ? 0
                    : Math.max(8, (entry.views / maxViews) * 100);
                  return (
                    <div
                      key={entry.date}
                      role="listitem"
                      className={styles.barColumn}
                      title={`${dateFormatter.format(date)}: ${entry.views}`}
                    >
                      <span className={styles.barValue}>
                        {new Intl.NumberFormat(localeTags[language]).format(entry.views)}
                      </span>
                      <div className={styles.barTrack}>
                        <div
                          className={styles.bar}
                          style={{ height: `${height}%` }}
                        />
                      </div>
                      <span className={styles.barLabel}>{dateFormatter.format(date)}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </section>
  );
}
