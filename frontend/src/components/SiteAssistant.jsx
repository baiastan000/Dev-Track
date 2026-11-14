import { useState } from "react";
import { Bot, MessageCircle, X } from "lucide-react";
import { useLanguage } from "../context/LanguageContext.jsx";
import styles from "./SiteAssistant.module.css";

const assistantCopy = {
  kg: {
    title: "DevTrack жардамчысы",
    greeting: "Салам! Сурооңузду тандаңыз — жардам берүүгө даярмын.",
    open: "Жардамчыны ачуу",
    close: "Жардамчыны жабуу",
    online: "Онлайн",
    prompt: "Көп берилген суроолор",
    questions: [
      {
        question: "DevTrack деген эмне?",
        answer: "DevTrack — программалоону үйрөнүп, курстарды, тапшырмаларды жана жетишкендиктериңизди бир жерден көзөмөлдөөгө жардам берген платформа.",
      },
      {
        question: "Окууну кантип баштасам болот?",
        answer: "Каталогдон кызыккан курсуңузду тандап, темаларын жана тапшырмаларын караңыз. Окууну баштоо үчүн аккаунт түзүп же сайтка кириңиз.",
      },
      {
        question: "Курстар акысызбы?",
        answer: "Каталогдон курс тууралуу маалыматты жана баасын көрө аласыз. Төлөм алынбайт, ал эми заказ серверге сакталат жана WhatsApp аркылуу жөнөтүлөт.",
      },
      {
        question: "Жетишкендиктеримди кайдан көрөм?",
        answer: "Кабинеттеги статистика жана окуу планы барактарынан окуу прогрессиңизди, аткарылган тапшырмаларды жана планыңызды караңыз.",
      },
      {
        question: "Курс боюнча кантип катталам?",
        answer: "Курсту себетке кошуп, катталууну ырастасаңыз болот. Заказ серверге сакталат жана WhatsApp аркылуу жөнөтүлөт. Төлөм азырынча алынбайт.",
      },
    ],
  },
  ru: {
    title: "Помощник DevTrack",
    greeting: "Здравствуйте! Выберите вопрос — я помогу разобраться.",
    open: "Открыть помощника",
    close: "Закрыть помощника",
    online: "Онлайн",
    prompt: "Частые вопросы",
    questions: [
      {
        question: "Что такое DevTrack?",
        answer: "DevTrack — платформа для изучения программирования, где можно смотреть курсы, выполнять задания и отслеживать прогресс.",
      },
      {
        question: "Как начать обучение?",
        answer: "Выберите интересующий курс в каталоге и изучите его темы и задания. Чтобы начать, создайте аккаунт или войдите на сайт.",
      },
      {
        question: "Курсы бесплатные?",
        answer: "Информация о курсе и его цене доступна в каталоге. Оплата не взимается, а заказ сохраняется на сервере и отправляется через WhatsApp.",
      },
      {
        question: "Где посмотреть свой прогресс?",
        answer: "Откройте статистику или учебный план в личном кабинете, чтобы посмотреть прогресс, выполненные задания и план обучения.",
      },
      {
        question: "Как записаться на курс?",
        answer: "Добавьте курс в корзину и подтвердите заказ. Он сохранится на сервере и отправится через WhatsApp. Оплата пока не взимается.",
      },
    ],
  },
  en: {
    title: "DevTrack Assistant",
    greeting: "Hi! Choose a question and I’ll help you find your way around.",
    open: "Open assistant",
    close: "Close assistant",
    online: "Online",
    prompt: "Frequently asked questions",
    questions: [
      {
        question: "What is DevTrack?",
        answer: "DevTrack is a platform for learning programming, exploring courses, completing tasks, and tracking your progress in one place.",
      },
      {
        question: "How do I start learning?",
        answer: "Choose a course from the catalog and explore its topics and tasks. Create an account or sign in to get started.",
      },
      {
        question: "Are the courses free?",
        answer: "Course details and prices are shown in the catalog. No payment is collected; the order is saved on the server and sent through WhatsApp.",
      },
      {
        question: "Where can I see my progress?",
        answer: "Open Statistics or Learning Plan in your dashboard to review your progress, completed tasks, and study plan.",
      },
      {
        question: "How do I enroll in a course?",
        answer: "Add a course to your cart and confirm the order. It will be saved on the server and sent through WhatsApp. Payment is not collected yet.",
      },
    ],
  },
};

export default function SiteAssistant() {
  const { language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const copy = assistantCopy[language] || assistantCopy.kg;

  return (
    <aside className={styles.root}>
      {isOpen && (
        <section className={styles.panel} aria-label={copy.title}>
          <header className={styles.header}>
            <span className={styles.avatar} aria-hidden="true"><Bot size={19} /></span>
            <span className={styles.headerText}>
              <span className={styles.title}>{copy.title}</span>
              <span className={styles.status}>● {copy.online}</span>
            </span>
            <button
              type="button"
              className={styles.close}
              onClick={() => setIsOpen(false)}
              aria-label={copy.close}
            >
              <X size={18} />
            </button>
          </header>

          <div className={styles.content} aria-live="polite">
            <p className={styles.greeting}>{copy.greeting}</p>
            {selectedQuestion && (
              <div className={styles.conversation}>
                <p className={styles.userMessage}>{copy.questions[selectedQuestion].question}</p>
                <p className={styles.answer}>{copy.questions[selectedQuestion].answer}</p>
              </div>
            )}
            <p className={styles.prompt}>
              {copy.prompt}
            </p>
            <div className={styles.questions}>
              {copy.questions.map(({ question }, index) => (
                <button
                  type="button"
                  key={question}
                  className={`${styles.question} ${selectedQuestion === index ? styles.selected : ""}`}
                  onClick={() => setSelectedQuestion(index)}
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      <button
        type="button"
        className={styles.trigger}
        aria-label={isOpen ? copy.close : copy.open}
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
      >
        {isOpen ? <X size={22} /> : <MessageCircle size={22} />}
        <span>{isOpen ? copy.close : copy.title}</span>
      </button>
    </aside>
  );
}
