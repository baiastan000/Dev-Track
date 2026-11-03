import { useEffect, useRef, useState } from "react";
import { Bell, BookOpen, CheckCheck, CheckCircle2, Sparkles } from "lucide-react";
import { useLanguage } from "../context/LanguageContext.jsx";
import styles from "./NotificationBell.module.css";

const initialNotifications = [
  { id: 1, type: "lesson", messageKey: "notification.lesson", timeKey: "notification.justNow", read: false },
  { id: 2, type: "review", messageKey: "notification.review", timeKey: "notification.oneHourAgo", read: false },
  { id: 3, type: "course", messageKey: "notification.course", timeKey: "notification.today", read: false },
];

const notificationIcons = {
  lesson: BookOpen,
  review: CheckCircle2,
  course: Sparkles,
};

export default function NotificationBell() {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState(initialNotifications);
  const containerRef = useRef(null);
  const unreadCount = notifications.filter((notification) => !notification.read).length;

  useEffect(() => {
    if (!isOpen) return undefined;

    function handlePointerDown(event) {
      if (!containerRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") setIsOpen(false);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  function markAllAsRead() {
    setNotifications((current) =>
      current.map((notification) => ({ ...notification, read: true })),
    );
  }

  function markAsRead(id) {
    setNotifications((current) =>
      current.map((notification) =>
        notification.id === id ? { ...notification, read: true } : notification,
      ),
    );
  }

  return (
    <div className={styles.container} ref={containerRef}>
      <button
        type="button"
        className={styles.trigger}
        aria-label={`${t("notification.title")}${unreadCount ? `: ${unreadCount}` : ""}`}
        aria-expanded={isOpen}
        aria-haspopup="true"
        onClick={() => setIsOpen((open) => !open)}
      >
        <Bell size={17} />
        {unreadCount > 0 && (
          <span className={styles.badge} aria-hidden="true">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      <section
        className={`${styles.dropdown} ${isOpen ? styles.open : ""}`}
        aria-label={t("notification.title")}
        aria-hidden={!isOpen}
        inert={!isOpen}
      >
        <header className={styles.dropdownHeader}>
          <div>
            <h2 className={styles.heading}>{t("notification.title")}</h2>
            <p className={styles.subtitle}>
              {unreadCount
                ? t("notification.unreadCount").replace("{count}", String(unreadCount))
                : t("notification.allCaughtUp")}
            </p>
          </div>
          <span className={styles.headerIcon}><Bell size={16} /></span>
        </header>

        <div className={styles.list}>
          {notifications.map((notification) => {
            const Icon = notificationIcons[notification.type];
            return (
              <button
                key={notification.id}
                type="button"
                className={`${styles.item} ${notification.read ? styles.read : ""}`}
                onClick={() => markAsRead(notification.id)}
              >
                <span className={`${styles.itemIcon} ${styles[notification.type]}`}>
                  <Icon size={15} />
                </span>
                <span className={styles.itemContent}>
                  <span className={styles.message}>{t(notification.messageKey)}</span>
                  <span className={styles.time}>{t(notification.timeKey)}</span>
                </span>
                {!notification.read && <span className={styles.unreadDot} aria-label={t("notification.unread")} />}
              </button>
            );
          })}
        </div>

        <footer className={styles.footer}>
          <button
            type="button"
            className={styles.markAll}
            onClick={markAllAsRead}
            disabled={unreadCount === 0}
          >
            <CheckCheck size={14} />
            {t("notification.markAllRead")}
          </button>
        </footer>
      </section>
    </div>
  );
}
