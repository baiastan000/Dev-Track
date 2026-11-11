import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, RotateCw, Shuffle } from "lucide-react";
import { useLanguage } from "../context/LanguageContext.jsx";
import PageBackLink from "./PageBackLink.jsx";
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
    translations: {
      kg: { question: "HTML деген эмне?", answer: "Веб-баракчанын түзүлүшүн жана мазмунунун маанисин аныктаган белгилөө тили." },
      en: { question: "What is HTML?", answer: "A markup language that defines the structure and meaning of a web page." },
    },
  },
  {
    category: "HTML",
    question: "Для чего нужен семантический HTML?",
    answer: "Он описывает назначение частей страницы с помощью элементов вроде <header>, <nav> и <main>. Это помогает браузерам, поисковым системам и вспомогательным технологиям.",
    translations: {
      kg: { question: "Семантикалык HTML эмне үчүн керек?", answer: "Ал баракчанын бөлүктөрүнүн милдетин <header>, <nav> жана <main> сыяктуу элементтер менен сүрөттөйт. Бул браузерлерге, издөө системаларына жана көмөкчү технологияларга жардам берет." },
      en: { question: "What is semantic HTML for?", answer: "It describes the purpose of page sections with elements such as <header>, <nav>, and <main>. This helps browsers, search engines, and assistive technologies." },
    },
  },
  {
    category: "HTML",
    question: "Зачем изображению нужен атрибут alt?",
    answer: "Он предоставляет текстовую альтернативу изображению, например для скринридеров или если изображение не загрузилось.",
    translations: {
      kg: { question: "Сүрөттөгү alt атрибуту эмне үчүн керек?", answer: "Ал сүрөттүн тексттик сүрөттөмөсүн берет. Бул экран окугучтарга же сүрөт жүктөлбөй калганда пайдалуу." },
      en: { question: "Why does an image need the alt attribute?", answer: "It provides a text alternative for the image, for example for screen readers or when the image fails to load." },
    },
  },
  {
    category: "CSS",
    question: "Что такое CSS?",
    answer: "Язык стилей, который управляет внешним видом и расположением HTML-элементов.",
    translations: {
      kg: { question: "CSS деген эмне?", answer: "HTML элементтеринин көрүнүшүн жана жайгашуусун башкарган стилдер тили." },
      en: { question: "What is CSS?", answer: "A style language that controls the appearance and layout of HTML elements." },
    },
  },
  {
    category: "CSS",
    question: "Что такое каскад в CSS?",
    answer: "Это механизм выбора итогового стиля, когда несколько правил подходят одному элементу. Учитываются источник, важность, специфичность и порядок правил.",
    translations: {
      kg: { question: "CSS каскады деген эмне?", answer: "Бир элементке бир нече эреже туура келгенде акыркы стилди тандоо механизми. Булак, маанилүүлүк, өзгөчөлүк жана эрежелердин ирети эске алынат." },
      en: { question: "What is the CSS cascade?", answer: "It determines the final style when multiple rules match an element. It considers origin, importance, specificity, and rule order." },
    },
  },
  {
    category: "CSS",
    question: "Для чего нужен Flexbox?",
    answer: "Flexbox помогает располагать элементы в строке или колонке и управлять их выравниванием, промежутками и распределением свободного места.",
    translations: {
      kg: { question: "Flexbox эмне үчүн керек?", answer: "Flexbox элементтерди сапка же тилкеге жайгаштырууга жана алардын тегизделишин, аралыгын, бош орунду бөлүштүрүүнү башкарууга жардам берет." },
      en: { question: "What is Flexbox used for?", answer: "Flexbox helps arrange elements in a row or column and control their alignment, spacing, and distribution of free space." },
    },
  },
  {
    category: "CSS",
    question: "Что делает свойство position: absolute?",
    answer: "Оно исключает элемент из обычного потока и позиционирует его относительно ближайшего предка с заданным position; если такого нет — относительно начального контейнера.",
    translations: {
      kg: { question: "position: absolute касиети эмне кылат?", answer: "Ал элементти кадимки агымдан чыгарып, position касиети берилген эң жакын ата-элементке салыштырмалуу жайгаштырат. Андай ата-элемент жок болсо, баштапкы контейнерге салыштырмалуу жайгашат." },
      en: { question: "What does position: absolute do?", answer: "It removes an element from the normal flow and positions it relative to its nearest positioned ancestor, or the initial containing block if there is none." },
    },
  },
  {
    category: "JavaScript",
    question: "Что такое DOM?",
    answer: "DOM — объектное представление HTML-документа. JavaScript может находить его элементы и менять содержимое, атрибуты и структуру страницы.",
    translations: {
      kg: { question: "DOM деген эмне?", answer: "DOM — HTML документтин объект түрүндөгү көрүнүшү. JavaScript анын элементтерин таап, мазмунун, атрибуттарын жана түзүлүшүн өзгөртө алат." },
      en: { question: "What is the DOM?", answer: "The DOM is an object representation of an HTML document. JavaScript can find its elements and change the page's content, attributes, and structure." },
    },
  },
  {
    category: "JavaScript",
    question: "Чем отличаются let и const?",
    answer: "Обе переменные имеют блочную область видимости. Значение let можно переназначить, а const — нет; при этом содержимое объекта или массива, объявленного через const, менять можно.",
    translations: {
      kg: { question: "let менен const эмнеси менен айырмаланат?", answer: "Экөөнүн тең көрүнүү аймагы блок менен чектелет. let маанисин кайра берсе болот, const маанисин кайра берүүгө болбойт; бирок const менен жарыяланган объекттин же массивдин ичин өзгөртүүгө болот." },
      en: { question: "How are let and const different?", answer: "Both are block-scoped. A let binding can be reassigned, but a const binding cannot. The contents of an object or array declared with const can still be changed." },
    },
  },
  {
    category: "JavaScript",
    question: "Что такое событие в JavaScript?",
    answer: "Это уведомление о действии или изменении — например, клике, нажатии клавиши или загрузке страницы. Обработчик события запускает нужный код.",
    translations: {
      kg: { question: "JavaScript'теги окуя деген эмне?", answer: "Бул аракет же өзгөрүү тууралуу билдирүү: мисалы, чыкылдатуу, баскычты басуу же баракчаны жүктөө. Окуяны иштетүүчү керектүү кодду иштетет." },
      en: { question: "What is an event in JavaScript?", answer: "It signals an action or change, such as a click, key press, or page load. An event handler runs the relevant code." },
    },
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
      title: "Флеш-карталар",
      description: "HTML, CSS жана JavaScript боюнча билимиңди текшер. Жоопту көрүү үчүн карточканы бас.",
      question: "СУРОО",
      answer: "ЖООП",
      flip: "Которуу үчүн бас",
      progress: "Карточка {current} / {total}",
      previous: "Мурунку карточка",
      next: "Кийинки карточка",
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
  const displayCard = card?.translations?.[language]
    ? { ...card, ...card.translations[language] }
    : card;

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
        <PageBackLink />
        <p className={styles.empty}>
          {language === "en" ? "There are no flashcards in this deck yet." : language === "kg" ? "Бул топтомдо азырынча карточкалар жок." : "В этой колоде пока нет карточек."}
        </p>
      </section>
    );
  }

  const progress = text.progress
    .replace("{current}", String(currentIndex + 1))
    .replace("{total}", String(shuffledCards.length));

  return (
    <section className={styles.page}>
      <PageBackLink />
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
          aria-label={`${isFlipped ? text.answer : text.question}: ${isFlipped ? displayCard.answer : displayCard.question}. ${text.flip}`}
          aria-pressed={isFlipped}
          onClick={() => setIsFlipped((flipped) => !flipped)}
        >
          <span className={`${styles.cardInner} ${isFlipped ? styles.flipped : ""}`}>
            <span className={`${styles.cardFace} ${styles.cardFront}`} aria-hidden={isFlipped}>
              <span className={styles.faceLabel}>{text.question}</span>
              <span className={styles.cardText}>{displayCard.question}</span>
              <span className={styles.flipHint}><RotateCw size={14} /> {text.flip}</span>
            </span>
            <span className={`${styles.cardFace} ${styles.cardBack}`} aria-hidden={!isFlipped}>
              <span className={styles.faceLabel}>{text.answer}</span>
              <span className={styles.cardText}>{displayCard.answer}</span>
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
