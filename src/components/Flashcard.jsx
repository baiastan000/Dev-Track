import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, RotateCw, Shuffle } from "lucide-react";
import { useLanguage } from "../context/LanguageContext.jsx";
import styles from "./Flashcard.module.css";

function shuffleCards(cards, previousOrder = []) {
  const shuffled = [...cards];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
  }

  if (
    shuffled.length > 1 &&
    shuffled.every((card, index) => card === previousOrder[index])
  ) {
    [shuffled[0], shuffled[1]] = [shuffled[1], shuffled[0]];
  }

  return shuffled;
}

export const flashcards = [
  {
    category: "HTML",
    question: "Что такое HTML?",
    answer: "Язык разметки, который задаёт структуру и смысловое содержимое веб-страницы.",
  },
  {
    category: "HTML",
    question: "Для чего нужен семантический HTML?",
    answer: "Он описывает назначение частей страницы с помощью элементов вроде <header>, <nav> и <main>. Это помогает браузерам, поисковым системам и вспомогательным технологиям.",
  },
  {
    category: "HTML",
    question: "Зачем изображению нужен атрибут alt?",
    answer: "Он предоставляет текстовую альтернативу изображению, например для скринридеров или если изображение не загрузилось.",
  },
  {
    category: "CSS",
    question: "Что такое CSS?",
    answer: "Язык стилей, который управляет внешним видом и расположением HTML-элементов.",
  },
  {
    category: "CSS",
    question: "Что такое каскад в CSS?",
    answer: "Это механизм выбора итогового стиля, когда несколько правил подходят одному элементу. Учитываются источник, важность, специфичность и порядок правил.",
  },
  {
    category: "CSS",
    question: "Для чего нужен Flexbox?",
    answer: "Flexbox помогает располагать элементы в строке или колонке и управлять их выравниванием, промежутками и распределением свободного места.",
  },
  {
    category: "CSS",
    question: "Что делает свойство position: absolute?",
    answer: "Оно исключает элемент из обычного потока и позиционирует его относительно ближайшего предка с заданным position; если такого нет — относительно начального контейнера.",
  },
  {
    category: "JavaScript",
    question: "Что такое DOM?",
    answer: "DOM — объектное представление HTML-документа. JavaScript может находить его элементы и менять содержимое, атрибуты и структуру страницы.",
  },
  {
    category: "JavaScript",
    question: "Чем отличаются let и const?",
    answer: "Обе переменные имеют блочную область видимости. Значение let можно переназначить, а const — нет; при этом содержимое объекта или массива, объявленного через const, менять можно.",
  },
  {
    category: "JavaScript",
    question: "Что такое событие в JavaScript?",
    answer: "Это уведомление о действии или изменении — например, клике, нажатии клавиши или загрузке страницы. Обработчик события запускает нужный код.",
  },
];

export default function Flashcard({ cards = flashcards }) {
  const { language } = useLanguage();
  const [shuffledCards, setShuffledCards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  useEffect(() => {
    setShuffledCards(shuffleCards(Array.isArray(cards) ? cards : []));
    setCurrentIndex(0);
    setIsFlipped(false);
  }, [cards]);

  const card = shuffledCards[currentIndex];
  const translations = {
    kg: {
      eyebrow: "КАЙТАЛОО КАРТОЧКАЛАРЫ",
      title: "Флеш-карточки",
      description: "Проверь знания по HTML, CSS и JavaScript. Нажми на карточку, чтобы увидеть ответ.",
      question: "ВОПРОС",
      answer: "ОТВЕТ",
      flip: "Нажми, чтобы перевернуть",
      progress: "Карточка {current} из {total}",
      previous: "Предыдущая карточка",
      next: "Следующая карточка",
      shuffle: "Башынан баштоо",
    },
    ru: {
      eyebrow: "ПОВТОРЕНИЕ ТЕОРИИ",
      title: "Флеш-карточки",
      description: "Проверь знания по HTML, CSS и JavaScript. Нажми на карточку, чтобы увидеть ответ.",
      question: "ВОПРОС",
      answer: "ОТВЕТ",
      flip: "Нажми, чтобы перевернуть",
      progress: "Карточка {current} из {total}",
      previous: "Предыдущая карточка",
      next: "Следующая карточка",
      shuffle: "Начать сначала",
    },
    en: {
      eyebrow: "REVIEW THE THEORY",
      title: "Flashcards",
      description: "Review HTML, CSS, and JavaScript. Click a card to reveal the answer.",
      question: "QUESTION",
      answer: "ANSWER",
      flip: "Click to flip",
      progress: "Card {current} of {total}",
      previous: "Previous card",
      next: "Next card",
      shuffle: "Start over",
    },
  };
  const text = translations[language] ?? translations.ru;

  function showCard(index) {
    setCurrentIndex(index);
    setIsFlipped(false);
  }

  function restartDeck() {
    setShuffledCards(shuffleCards(Array.isArray(cards) ? cards : [], shuffledCards));
    setCurrentIndex(0);
    setIsFlipped(false);
  }

  if (!card || shuffledCards.length === 0) {
    return (
      <section className={styles.page} aria-live="polite">
        <p className={styles.empty}>
          {language === "en" ? "There are no flashcards in this deck yet." : "В этой колоде пока нет карточек."}
        </p>
      </section>
    );
  }

  const progress = text.progress
    .replace("{current}", String(currentIndex + 1))
    .replace("{total}", String(shuffledCards.length));

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>{text.eyebrow}</p>
        <h2 className={styles.title}>{text.title}</h2>
        <p className={styles.description}>{text.description}</p>
      </header>

      <div className={styles.deck}>
        <div className={styles.progressRow}>
          <span className={styles.category}>{card.category}</span>
          <span className={styles.progressText} aria-live="polite">{progress}</span>
        </div>
        <div
          className={styles.progressTrack}
          role="progressbar"
          aria-label={progress}
          aria-valuemin={1}
          aria-valuemax={shuffledCards.length}
          aria-valuenow={currentIndex + 1}
        >
          <span style={{ width: `${((currentIndex + 1) / shuffledCards.length) * 100}%` }} />
        </div>

        <button
          type="button"
          className={styles.flipCard}
          aria-label={`${isFlipped ? text.answer : text.question}: ${isFlipped ? card.answer : card.question}. ${text.flip}`}
          aria-pressed={isFlipped}
          onClick={() => setIsFlipped((flipped) => !flipped)}
        >
          <span className={`${styles.cardInner} ${isFlipped ? styles.flipped : ""}`}>
            <span className={`${styles.cardFace} ${styles.cardFront}`} aria-hidden={isFlipped}>
              <span className={styles.faceLabel}>{text.question}</span>
              <span className={styles.cardText}>{card.question}</span>
              <span className={styles.flipHint}><RotateCw size={14} /> {text.flip}</span>
            </span>
            <span className={`${styles.cardFace} ${styles.cardBack}`} aria-hidden={!isFlipped}>
              <span className={styles.faceLabel}>{text.answer}</span>
              <span className={styles.cardText}>{card.answer}</span>
              <span className={styles.flipHint}><RotateCw size={14} /> {text.flip}</span>
            </span>
          </span>
        </button>

        <div className={styles.controls}>
          <button
            type="button"
            className={styles.navButton}
            onClick={() => showCard(currentIndex - 1)}
            disabled={currentIndex === 0}
          >
            <ArrowLeft size={16} />
            <span>{text.previous}</span>
          </button>
          <button type="button" className={styles.shuffleButton} onClick={restartDeck}>
            <Shuffle size={15} />
            <span>{text.shuffle}</span>
          </button>
          <button
            type="button"
            className={styles.navButton}
            onClick={() => showCard(currentIndex + 1)}
            disabled={currentIndex === shuffledCards.length - 1}
          >
            <span>{text.next}</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </section>
  );
}
