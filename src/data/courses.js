import { BookOpen, Code2, Layers3, Palette } from "lucide-react";

function createCurriculumTopics(courseId, curriculum, examples, lessonDetails = {}) {
  const isHtml = courseId === "html";
  const isCss = courseId === "css";
  const starter = isHtml
    ? "<!-- Напиши HTML-код по теме -->"
    : isCss
      ? "/* Напиши CSS-правило по теме */"
      : courseId === "react"
        ? "// Создай React-компонент или JSX по теме"
        : "// Напиши JavaScript-код по теме";
  const check = isHtml
    ? { label: "Добавлен HTML-элемент", pattern: "<[a-z][^>]*>" }
    : isCss
      ? { label: "Добавлено CSS-объявление", pattern: "[\\w-]+\\s*:\\s*[^;]+;" }
      : courseId === "react"
        ? {
            label: "Добавлен JSX или React-компонент",
            pattern: "(?:function\\s+[A-Z]|const\\s+[A-Z][\\w]*\\s*=|use[A-Z]\\w*\\s*\\(|<[A-Za-z][\\w.-]*(?:\\s|>|/))",
          }
        : {
            label: "Добавлен JavaScript-код по теме",
            pattern: "(?:\\b(?:const|let|var|function|class|if|for|while|return|async|await|throw|import|export|try)\\b|=>|console\\.|document\\.|fetch\\s*\\(|Promise\\b)",
          };

  return curriculum.map(([title, description], index) => ({
    id: `${courseId}-${index + 1}`,
    title,
    description,
    duration: "10 мин",
    theory: [description],
    example: examples[index],
    task: {
      title: `Практика: ${title}`,
      prompt: isHtml || isCss
        ? `Напиши код по теме «${title}». Используй пример как ориентир, выполни задание самостоятельно и проверь решение.`
        : courseId === "react"
          ? `Создай React-компонент по теме «${title}». ${curriculum[index][1]} Используй JSX и проверь результат.`
          : `Напиши JavaScript-код по теме «${title}». ${curriculum[index][1]} Используй пример как ориентир и проверь решение.`,
      starter,
      checks: [check],
      hints: [
        "Открой вкладку «Примеры» и изучи структуру кода.",
        "Напиши решение в редакторе и проверь его.",
      ],
    },
    ...lessonDetails[index + 1],
  }));
}

const htmlCurriculum = [
  ["Назначение HTML и устройство веб-страницы", "Разберётесь, как браузер использует HTML для отображения содержимого и чем структура страницы отличается от её оформления и поведения."],
  ["Базовая структура HTML-документа", "Создадите документ с <!DOCTYPE html>, элементами <html>, <head> и <body> и узнаете, зачем нужен каждый из них."],
  ["Теги, элементы и атрибуты", "Научитесь читать HTML-разметку, правильно вкладывать элементы и задавать их атрибуты."],
  ["Текст и абзацы", "Разметите текст с помощью абзацев и элементов для смыслового выделения фрагментов."],
  ["Заголовки и структура содержимого", "Выстроите заголовки от <h1> до <h6> в логичную иерархию, понятную читателям и вспомогательным технологиям."],
  ["Маркированные и нумерованные списки", "Создадите списки и вложенные пункты, выбирая подходящий тип для содержимого."],
  ["Ссылки и навигация", "Добавите ссылки на другие страницы, внешние сайты и разделы текущего документа."],
  ["Изображения и альтернативный текст", "Вставите изображения и зададите alt, чтобы передать их смысл тем, кто не может их увидеть."],
  ["Пути к файлам и подключение ресурсов", "Научитесь указывать относительные пути к страницам, изображениям и другим файлам проекта."],
  ["Таблицы для табличных данных", "Создадите таблицу с заголовками, строками и ячейками, не используя её для построения макета страницы."],
  ["Формы и отправка данных", "Узнаете, как HTML-формы собирают пользовательский ввод и что происходит при их отправке."],
  ["Метки и базовые поля формы", "Свяжете подписи с полями и добавите текстовые поля, кнопки и поля для длинных ответов."],
  ["Типы полей ввода", "Подберёте элементы для электронной почты, пароля, даты, числа и других типов данных."],
  ["Выбор вариантов в формах", "Добавите флажки, переключатели и выпадающие списки для выбора одного или нескольких значений."],
  ["Встроенная проверка форм", "Настроите обязательные поля, допустимые форматы и ограничения длины с помощью HTML-атрибутов."],
  ["Семантические элементы страницы", "Примените <header>, <nav>, <main>, <section>, <article> и <footer> в соответствии с их назначением."],
  ["Элементы управления содержимым", "Разберётесь в назначении элементов вроде <button>, <details>, <summary>, <figure> и <figcaption>."],
  ["Аудио и видео", "Встроите медиаконтент с помощью <audio> и <video> и добавите элементы управления воспроизведением."],
  ["Встраивание стороннего содержимого", "Добавите внешний контент с помощью <iframe> и узнаете о мерах безопасности и доступности при его использовании."],
  ["Метаданные и элемент <head>", "Укажете кодировку, заголовок, описание страницы и другие метаданные, нужные браузеру и поисковым системам."],
  ["Продвинутая семантика HTML", "Научитесь выбирать элементы по смыслу, а не только по внешнему виду, и строить последовательную структуру документа."],
  ["Доступность HTML-разметки", "Свяжете подписи и поля, зададите осмысленные альтернативные тексты и обеспечите логичную структуру для клавиатуры и скринридеров."],
  ["Практика: семантическая и доступная страница", "Соберёте страницу с навигацией, основным содержимым, изображениями и формой, применив семантическую разметку и базовые требования доступности."],
];

const cssCurriculum = [
  ["Назначение CSS и подключение стилей", "Узнаете, как CSS управляет внешним видом страницы, и подключите внешний файл стилей к HTML-документу."],
  ["Правила CSS и базовый синтаксис", "Научитесь задавать селекторы, свойства и значения и поймёте, как браузер применяет CSS-правило."],
  ["Простые селекторы", "Выберете элементы по тегу, классу и идентификатору и узнаете, когда использовать каждый тип селектора."],
  ["Комбинирование селекторов", "Настроите стили для групп элементов и элементов, находящихся внутри других элементов или рядом с ними."],
  ["Псевдоклассы и псевдоэлементы", "Оформите интерактивные состояния и добавите декоративные элементы без изменения HTML-разметки."],
  ["Каскад, наследование и специфичность", "Разберётесь, как разрешаются конфликты между стилями и почему одни правила имеют приоритет над другими."],
  ["Цвета и единицы измерения", "Зададите цвета разными способами и примените абсолютные и относительные единицы измерения."],
  ["Шрифты и типографика", "Настроите семейство, размер, насыщенность шрифта, высоту строки, выравнивание и интервалы текста."],
  ["Блочная модель", "Изучите содержимое, внутренние отступы, границы и внешние отступы, а также влияние box-sizing на размеры элемента."],
  ["Ширина, высота и переполнение", "Зададите размеры элементов и настроите поведение содержимого, которое не помещается внутри блока."],
  ["Режимы отображения элементов", "Разберётесь в block, inline, inline-block и none и научитесь менять поведение элементов на странице."],
  ["Позиционирование элементов", "Используете статическое, относительное, абсолютное, фиксированное и липкое позиционирование."],
  ["Порядок наложения и z-index", "Настроите, какие элементы располагаются поверх других, и познакомитесь с контекстом наложения."],
  ["Фоны и градиенты", "Добавите цвет, изображение или градиент на фон и настроите его размер, положение и повторение."],
  ["Границы, скругления и тени", "Оформите блоки с помощью рамок, скруглённых углов и теней."],
  ["Стилизация списков, таблиц и форм", "Настроите маркеры списков, границы таблиц, поля ввода и кнопки."],
  ["Псевдоклассы состояний и фокус", "Оформите состояния наведения, нажатия и фокуса, чтобы взаимодействие было заметно мышью и клавиатурой."],
  ["Flexbox: основы", "Расположите элементы в строку или колонку и научитесь управлять направлением и переносом элементов."],
  ["Flexbox: выравнивание и распределение", "Выстроите элементы по главной и поперечной осям и распределите свободное пространство между ними."],
  ["CSS Grid: основы", "Создадите сетку с колонками и строками и разместите в ней элементы."],
  ["CSS Grid: области и адаптивные сетки", "Опишете области макета и построите сетки, которые подстраиваются под доступное пространство."],
  ["Адаптивная вёрстка и медиазапросы", "Настроите разные варианты оформления для телефонов, планшетов и больших экранов."],
  ["Размеры и адаптивные значения", "Используете %, vw, vh, rem и функции min(), max(), clamp() для гибких размеров."],
  ["Изображения и визуальное кадрирование", "Управляете размером и обрезкой изображений с помощью object-fit и object-position."],
  ["Переходы и трансформации", "Добавите плавное изменение стилей и перемещение, поворот или масштабирование элементов."],
  ["Анимации с @keyframes", "Создадите анимации с ключевыми кадрами и настроите их длительность, направление и повторение."],
  ["Пользовательские свойства CSS", "Заведёте CSS-переменные для повторно используемых цветов, размеров и других значений."],
  ["Современная организация CSS", "Познакомитесь с логическими свойствами для разных направлений письма и с каскадными слоями @layer."],
  ["Современные возможности и предпочтения пользователя", "Попробуете контейнерные запросы и научитесь учитывать системные настройки, например предпочтение уменьшенной анимации."],
  ["Практика: адаптивный макет сайта", "Создадите макет веб-страницы с использованием Flexbox, Grid, адаптивных правил, переменных и современных возможностей CSS."],
];

const javascriptCurriculum = [
  ["Знакомство с JavaScript и DevTools", "Узнаете роль JavaScript во фронтенде и запустите первые команды в консоли браузера."],
  ["Подключение JavaScript к HTML", "Подключите внешний скрипт и разберётесь с порядком и моментом выполнения кода."],
  ["Синтаксис и комментарии", "Освоите правила записи инструкций, блоков кода и комментариев."],
  ["Переменные: let и const", "Создадите переменные и выберете объявление в зависимости от того, меняется ли значение."],
  ["Типы данных", "Познакомитесь со строками, числами, логическими значениями, null, undefined и объектами."],
  ["Преобразование типов", "Поймёте неявное и явное преобразование значений и научитесь определять тип данных."],
  ["Операторы и выражения", "Примените арифметические, сравнительные, логические операторы и операторы присваивания."],
  ["Условия и ветвления", "Напишете проверки с if, else и тернарным оператором для выбора нужного поведения."],
  ["Конструкция switch", "Обработаете несколько вариантов одного значения с помощью switch и break."],
  ["Циклы", "Повторите действия с помощью циклов for, while и do...while."],
  ["Объявление и вызов функций", "Создадите функции для повторно используемых действий и научитесь их вызывать."],
  ["Параметры и возвращаемые значения", "Передадите данные функции через параметры и вернёте результат с помощью return."],
  ["Функциональные выражения и стрелочные функции", "Сравните способы создания функций и примените стрелочный синтаксис в колбэках."],
  ["Область видимости и поднятие объявлений", "Разберётесь в областях видимости, времени жизни переменных и hoisting."],
  ["Замыкания", "Поймёте, как функция сохраняет доступ к переменным внешней области видимости."],
  ["Строки и шаблонные литералы", "Найдёте и преобразуете текст, а также подставите значения в шаблонные строки."],
  ["Числа и объект Math", "Выполните числовые преобразования, округление и вычисления с методами Math."],
  ["Массивы: создание и изменение", "Создадите массивы и получите, измените, добавите или удалите их элементы."],
  ["Перебор и преобразование массивов", "Используете forEach, map, filter и find для обработки коллекций."],
  ["Проверка массивов и вычисления", "Примените some, every и reduce для проверки элементов и получения итогов."],
  ["Объекты и свойства", "Создадите объекты, прочитаете и измените свойства, проверите наличие ключей."],
  ["Деструктуризация объектов и массивов", "Извлечёте значения в переменные и зададите значения по умолчанию."],
  ["Операторы spread и rest", "Скопируете и объедините коллекции, а также соберёте аргументы функции."],
  ["Методы объектов и контекст this", "Создадите методы и разберётесь, как контекст вызова определяет this."],
  ["Коллекции Map и Set", "Выберете Map для пар ключ-значение и Set для хранения уникальных значений."],
  ["Классы и объектно-ориентированное программирование", "Создадите классы, конструкторы и экземпляры и познакомитесь с наследованием."],
  ["Модули JavaScript", "Разделите код на файлы и экспортируете и импортируете функции и данные."],
  ["Ошибки и исключения", "Обработаете ошибки с помощью try...catch и создадите исключения через throw."],
  ["Отладка кода", "Используете точки останова и пошаговое выполнение для поиска ошибок."],
  ["Знакомство с DOM", "Узнаете, как HTML-документ представлен в браузере в виде дерева объектов."],
  ["Поиск элементов в DOM", "Найдёте нужные элементы с помощью querySelector и родственных методов."],
  ["Изменение содержимого и атрибутов", "Обновите текст, атрибуты и классы DOM-элементов безопасными способами."],
  ["Создание и удаление DOM-элементов", "Создадите узлы, добавите их в документ и удалите ненужные элементы."],
  ["События браузера и обработчики", "Обработаете клики, ввод текста и другие события с помощью addEventListener."],
  ["Формы и пользовательский ввод", "Перехватите отправку формы, прочитаете значения полей и покажете результат."],
  ["Всплытие и делегирование событий", "Поймёте распространение событий и обработаете действия дочерних узлов через родителя."],
  ["Асинхронный код и цикл событий", "Разберётесь, как браузер планирует асинхронные задачи, не блокируя интерфейс."],
  ["Промисы", "Обработаете успешное и неуспешное завершение операции методами then, catch и finally."],
  ["async/await и обработка ошибок", "Напишете асинхронный код в последовательном стиле и обработаете ошибки через try...catch."],
  ["Запросы к серверу через fetch", "Отправите HTTP-запрос, преобразуете JSON-ответ и покажете состояния загрузки и ошибки."],
];

const reactCurriculum = [
  ["Введение в React и создание проекта", "Узнаете задачи React и запустите приложение с помощью современного инструмента сборки."],
  ["JSX", "Освоите синтаксис JSX и опишете интерфейс разметкой внутри JavaScript."],
  ["Функциональные компоненты", "Создадите React-компоненты и поймёте, как они отображаются на странице."],
  ["JavaScript-выражения в JSX", "Выведете значения переменных и вычисления в JSX с помощью фигурных скобок."],
  ["Передача данных через props", "Передадите значения родительского компонента дочернему и зададите значения по умолчанию."],
  ["Композиция компонентов и children", "Соберёте интерфейс из повторно используемых компонентов и передадите им вложенное содержимое."],
  ["Обработчики событий", "Добавите реакцию на клики и ввод пользователя с обработчиками React."],
  ["Состояние и useState", "Сохраните изменяемые данные в состоянии и обновите интерфейс после их изменения."],
  ["Обновление массивов и объектов в состоянии", "Обновите сложное состояние иммутабельным способом, не изменяя исходные данные."],
  ["Условный рендеринг", "Покажете разные части интерфейса в зависимости от состояния и свойств."],
  ["Списки и ключи", "Отобразите данные списком компонентов и выберете стабильные ключи для элементов."],
  ["Управляемые формы", "Свяжете значения полей ввода с состоянием React и обработаете отправку формы."],
  ["Подъём состояния", "Переместите общее состояние в ближайший общий компонент для синхронизации интерфейса."],
  ["Побочные эффекты и useEffect", "Выполните побочные действия после рендера и настройте зависимости эффекта."],
  ["Очистка эффектов", "Освободите подписки, таймеры и другие ресурсы при повторном эффекте или размонтировании."],
  ["Загрузка данных в React", "Загрузите данные API и отобразите состояния загрузки, успеха и ошибки."],
  ["Ссылки на элементы с useRef", "Получите ссылку на DOM-элемент или сохраните значение без дополнительного рендера."],
  ["Общий контекст с useContext", "Передадите общие данные нескольким уровням компонентов без промежуточных props."],
  ["Сложное состояние с useReducer", "Организуете обновление состояния через действия и редьюсер."],
  ["Пользовательские хуки", "Вынесете повторяющуюся логику состояния и эффектов в собственные хуки."],
  ["Маршрутизация страниц", "Настроите переходы, вложенные маршруты и маршруты с параметрами."],
  ["Глобальное управление состоянием", "Определите, когда достаточно локального состояния и контекста, а когда нужен общий стор."],
  ["Стилизация и доступность React-интерфейса", "Оформите компоненты и сделаете интерфейс доступным для клавиатуры и вспомогательных технологий."],
  ["Оптимизация и обработка ошибок", "Узнаете, когда применять memo, useMemo, useCallback и границы ошибок."],
  ["Итоговый проект на React", "Разработаете приложение с компонентами, формами, маршрутизацией, состоянием и загрузкой данных."],
];

const htmlExamples = [
  `<!doctype html>
<html lang="ru">
  <head><meta charset="UTF-8"><title>Мой сайт</title></head>
  <body><h1>Привет!</h1></body>
</html>`,
  `<html lang="ru">
  <head><title>Страница</title></head>
  <body><main>Содержимое</main></body>
</html>`,
  `<p class="intro">Текст <strong>с выделением</strong></p>`,
  `<p>Первый абзац.</p>
<p>Второй абзац с <em>акцентом</em>.</p>`,
  `<h1>Основной заголовок</h1>
<h2>Подраздел</h2>
<h3>Часть подраздела</h3>`,
  `<ul><li>HTML</li><li>CSS</li></ul>
<ol><li>Шаг первый</li><li>Шаг второй</li></ol>`,
  `<nav><a href="/courses">Курсы</a>
<a href="#contacts">Контакты</a></nav>`,
  `<img src="portrait.jpg" alt="Портрет автора" width="320">`,
  `<a href="./about.html">О проекте</a>
<img src="./images/logo.svg" alt="Логотип">`,
  `<table>
  <thead><tr><th>Тема</th><th>Статус</th></tr></thead>
  <tbody><tr><td>HTML</td><td>В процессе</td></tr></tbody>
</table>`,
  `<form action="/signup" method="post">
  <label for="email">Почта</label>
  <input id="email" name="email">
  <button type="submit">Отправить</button>
</form>`,
  `<label for="name">Имя</label>
<input id="name" name="name" type="text">`,
  `<input type="email" name="email">
<input type="date" name="start">
<input type="number" name="lessons">`,
  `<label><input type="checkbox" name="topics" value="html"> HTML</label>
<select name="level"><option>Начальный</option></select>`,
  `<input type="email" required minlength="5">
<input type="number" min="1" max="10">`,
  `<header>Шапка сайта</header>
<nav>Навигация</nav>
<main><article><h1>Статья</h1></article></main>
<footer>Подвал</footer>`,
  `<figure>
  <img src="chart.png" alt="График посещаемости">
  <figcaption>Посещаемость за неделю</figcaption>
</figure>
<details><summary>Подробнее</summary><p>Описание</p></details>`,
  `<video controls width="480">
  <source src="lesson.mp4" type="video/mp4">
  Ваш браузер не поддерживает видео.
</video>`,
  `<iframe
  src="https://example.com"
  title="Встроенная страница"
  loading="lazy"
></iframe>`,
  `<head>
  <meta charset="UTF-8">
  <meta name="description" content="Учебный сайт">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>DevTrack</title>
</head>`,
  `<main>
  <article>
    <header><h1>Заметка</h1><time datetime="2026-10-28">28 октября</time></header>
    <p>Текст заметки.</p>
  </article>
</main>`,
  `<a href="#main-content" class="skip-link">Перейти к содержимому</a>
<main id="main-content"><h1>Главная</h1></main>`,
  `<header><nav aria-label="Основная навигация">...</nav></header>
<main><article><h1>Профиль</h1><p>Описание</p></article></main>
<footer>Контакты</footer>`,
];

const cssExamples = [
  `<link rel="stylesheet" href="styles.css">`,
  `h1 {
  color: #172554;
  background-color: #dbeafe;
}`,
  `p { color: #334155; }
.card { background: white; }
#main { max-width: 70rem; }`,
  `article > h2 { margin-block: 1rem; }
nav a + a { margin-inline-start: 1rem; }`,
  `a:hover { color: dodgerblue; }
button::before { content: "→"; }`,
  `/* Наследование и каскад */
body { color: #1e293b; }
.notice { color: #b91c1c; }`,
  `:root { --brand: hsl(210 90% 50%); }
body { color: #1e293b; font-size: 1rem; }`,
  `body {
  font-family: system-ui, sans-serif;
  font-size: 1rem;
  line-height: 1.6;
}`,
  `* { box-sizing: border-box; }
.card { padding: 1rem; border: 1px solid #cbd5e1; margin: 1rem; }`,
  `.panel { width: min(100%, 40rem); height: 20rem; overflow: auto; }`,
  `.label { display: inline-block; }
.content { display: block; }
.hidden { display: none; }`,
  `.badge { position: absolute; inset-block-start: 0; inset-inline-end: 0; }
.toolbar { position: sticky; top: 0; }`,
  `.modal { position: fixed; inset: 0; z-index: 10; }`,
  `.hero {
  background: linear-gradient(135deg, #1d4ed8, #7c3aed);
}`,
  `.card {
  border: 1px solid #334155;
  border-radius: 0.75rem;
  box-shadow: 0 8px 24px #0f172a22;
}`,
  `ul { list-style: square; padding-inline-start: 1.5rem; }
table { border-collapse: collapse; }
input, button { padding: 0.6rem; }`,
  `button:hover { background: #1d4ed8; }
input:focus-visible { outline: 3px solid #38bdf8; }`,
  `.menu { display: flex; flex-direction: row; flex-wrap: wrap; }`,
  `.menu {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}`,
  `.grid { display: grid; grid-template-columns: 1fr 2fr; }`,
  `.layout {
  display: grid;
  grid-template-areas: "header header" "nav main";
  grid-template-columns: 14rem 1fr;
}`,
  `@media (max-width: 40rem) {
  .layout { grid-template-columns: 1fr; }
}`,
  `.container { width: min(100% - 2rem, 72rem); }
h1 { font-size: clamp(2rem, 5vw, 4rem); }`,
  `.thumbnail {
  width: 100%;
  aspect-ratio: 16 / 9;
  object-fit: cover;
  object-position: center;
}`,
  `.card { transition: transform 180ms ease, opacity 180ms ease; }
.card:hover { transform: translateY(-4px) scale(1.02); }`,
  `@keyframes appear {
  from { opacity: 0; transform: translateY(1rem); }
  to { opacity: 1; transform: translateY(0); }
}
.panel { animation: appear 300ms ease-out both; }`,
  `:root {
  --color-brand: #0284c7;
  --space-card: 1.25rem;
}
.card { color: var(--color-brand); padding: var(--space-card); }`,
  `@layer reset, components;
@layer components {
  .card { padding-inline: 1rem; }
}`,
  `@container (width > 30rem) {
  .card { display: grid; grid-template-columns: 1fr 2fr; }
}
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: 0.01ms; }
}`,
  `.page { display: grid; grid-template-columns: 1fr 2fr; gap: 1.5rem; }
@media (max-width: 40rem) {
  .page { grid-template-columns: 1fr; }
}`,
];

const javascriptExamples = [
  `console.log("JavaScript запущен");`,
  `// Подключение файла в HTML: <script src="app.js" defer></script>
console.log("app.js загружен");`,
  `// Подсчёт результата
const total = 2 + 3;
console.log(total);`,
  `const learner = "Айжан";
let lessons = 0;
lessons += 1;`,
  `const title = "Frontend";
const count = 5;
const isReady = true;`,
  `const input = "42";
const count = Number(input);
console.log(typeof count);`,
  `const price = 120;
const hasDiscount = price > 100 && true;`,
  `const score = 82;
if (score >= 60) console.log("Сдано");
else console.log("Повторить");`,
  `const role = "student";
switch (role) {
  case "student": console.log("Учись"); break;
  default: console.log("Привет");
}`,
  `for (let index = 0; index < 3; index += 1) {
  console.log(index);
}`,
  `function greet() {
  console.log("Привет!");
}
greet();`,
  `function add(first, second) {
  return first + second;
}
console.log(add(2, 3));`,
  `const double = (number) => number * 2;
console.log(double(4));`,
  `function makeCounter() {
  let count = 0;
  return () => ++count;
}`,
  `function createGreeter(name) {
  return () => \`Привет, \${name}!\`;
}`,
  `const name = "Алия";
console.log(\`Привет, \${name}!\`.toUpperCase());`,
  `const price = 12.7;
console.log(Math.round(price));
console.log(Math.max(3, 8));`,
  `const topics = ["HTML", "CSS"];
topics.push("JavaScript");
console.log(topics[0]);`,
  `const numbers = [1, 2, 3];
const doubled = numbers.map((number) => number * 2);
const even = doubled.filter((number) => number % 2 === 0);`,
  `const scores = [8, 10, 7];
const allPassed = scores.every((score) => score >= 5);
const total = scores.reduce((sum, score) => sum + score, 0);`,
  `const learner = { name: "Алия", level: "beginner" };
learner.level = "junior";
console.log(learner.name);`,
  `const { name, level = "beginner" } = { name: "Алия" };
const [first, second] = ["HTML", "CSS"];`,
  `const base = [1, 2];
const values = [...base, 3];
function sum(...numbers) { return numbers.length; }`,
  `const user = {
  name: "Алия",
  greet() { return \`Привет, \${this.name}\`; }
};`,
  `const unique = new Set([1, 1, 2]);
const scores = new Map([["Алия", 10]]);
console.log(unique.size, scores.get("Алия"));`,
  `class Course {
  constructor(title) { this.title = title; }
}
const course = new Course("JavaScript");`,
  `export function add(a, b) { return a + b; }
// import { add } from "./math.js";`,
  `try {
  JSON.parse("{");
} catch (error) {
  console.error(error.message);
}`,
  `debugger;
const result = [1, 2, 3].map((value) => value * 2);
console.log(result);`,
  `const heading = document.querySelector("h1");
console.log(heading?.textContent);`,
  `const button = document.querySelector(".save");
button?.addEventListener("click", () => console.log("Сохранено"));`,
  `const heading = document.createElement("h2");
heading.textContent = "Новая тема";
document.body.append(heading);`,
  `document.querySelector("button")?.addEventListener("click", (event) => {
  event.currentTarget.classList.toggle("active");
});`,
  `document.querySelector("form")?.addEventListener("submit", (event) => {
  event.preventDefault();
  console.log(new FormData(event.currentTarget).get("email"));
});`,
  `document.querySelector("list")?.addEventListener("click", (event) => {
  if (event.target.matches("button")) console.log("Элемент выбран");
});`,
  `console.log("Сначала");
setTimeout(() => console.log("Позже"), 0);
console.log("Между задачами");`,
  `Promise.resolve("Готово")
  .then((value) => console.log(value))
  .catch((error) => console.error(error));`,
  `async function loadTopics() {
  try { return await Promise.resolve(["HTML", "CSS"]); }
  catch (error) { console.error(error); }
}`,
  `async function loadTopics() {
  const response = await fetch("/api/topics");
  if (!response.ok) throw new Error("Ошибка загрузки");
  return response.json();
}`,
  `const button = document.querySelector("button");
button?.addEventListener("click", async () => {
  const response = await fetch("/api/topics");
  const topics = await response.json();
  document.querySelector("output").textContent = topics.length;
});`,
];

const reactExamples = [
  `import { createRoot } from "react-dom/client";
createRoot(document.getElementById("root")).render(<App />);`,
  `const title = <h1>Привет, React!</h1>;`,
  `function Welcome() {
  return <h1>Добро пожаловать</h1>;
}`,
  `const name = "Алия";
const greeting = <p>Привет, {name}!</p>;`,
  `function Greeting({ name }) {
  return <h1>Привет, {name}!</h1>;
}`,
  `function Card({ children }) {
  return <section className="card">{children}</section>;
}`,
  `function SaveButton() {
  return <button onClick={() => console.log("Сохранено")}>Сохранить</button>;
}`,
  `import { useState } from "react";
function Counter() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(count + 1)}>{count}</button>;
}`,
  `setItems((items) => [...items, newItem]);
setUser((user) => ({ ...user, name: "Алия" }));`,
  `return isLoading ? <p>Загрузка...</p> : <p>Готово</p>;`,
  `const rows = items.map((item) => <li key={item.id}>{item.name}</li>);`,
  `const [email, setEmail] = useState("");
return <input value={email} onChange={(event) => setEmail(event.target.value)} />;`,
  `function App() {
  const [count, setCount] = useState(0);
  return <><Counter value={count} /><Button onClick={() => setCount(count + 1)} /></>;
}`,
  `useEffect(() => {
  document.title = \`Счёт: \${count}\`;
}, [count]);`,
  `useEffect(() => {
  const timer = setInterval(refresh, 1000);
  return () => clearInterval(timer);
}, []);`,
  `useEffect(() => {
  let active = true;
  fetch("/api/topics").then((response) => response.json())
    .then((data) => { if (active) setTopics(data); });
  return () => { active = false; };
}, []);`,
  `const inputRef = useRef(null);
return <><input ref={inputRef} /><button onClick={() => inputRef.current.focus()}>Фокус</button></>;`,
  `const ThemeContext = createContext("dark");
function Label() {
  const theme = useContext(ThemeContext);
  return <span>{theme}</span>;
}`,
  `function reducer(state, action) {
  if (action.type === "increment") return { count: state.count + 1 };
  return state;
}`,
  `function useToggle(initial = false) {
  const [value, setValue] = useState(initial);
  return [value, () => setValue((current) => !current)];
}`,
  `import { BrowserRouter, Routes, Route } from "react-router-dom";
<BrowserRouter><Routes><Route path="/" element={<Home />} /></Routes></BrowserRouter>`,
  `const [state, dispatch] = useReducer(appReducer, initialState);
<AppContext.Provider value={{ state, dispatch }}><Dashboard /></AppContext.Provider>`,
  `<button type="button" aria-pressed={active} onClick={toggle}>
  {active ? "Выключить" : "Включить"}
</button>`,
  `const MemoCard = memo(Card);
const total = useMemo(() => calculate(items), [items]);`,
  `function App() {
  return <main><CourseList /><ProgressPanel /></main>;
}`,
];

const htmlLessonDetails = {
  2: {
    duration: "12 мин",
    theory: [
      "HTML описывает структуру страницы с помощью элементов — специальных тегов с открывающей и закрывающей частью.",
      "Документ начинается с <!doctype html>. Внутри html находятся head с настройками страницы и body с видимым содержимым.",
      "Заголовок страницы задают в title, а основной текст и элементы интерфейса размещают в body.",
    ],
    example: "<!doctype html>\n<html lang=\"ru\">\n  <head>\n    <meta charset=\"UTF-8\">\n    <title>Моя страница</title>\n  </head>\n  <body>\n    <h1>Привет, мир!</h1>\n    <p>Это моя первая страница.</p>\n  </body>\n</html>",
    task: {
      title: "Создай страницу-знакомство",
      prompt: "Напиши базовую HTML-страницу на русском языке: добавь заголовок первого уровня «Обо мне» и абзац с коротким описанием.",
      starter: "<!doctype html>\n<html lang=\"ru\">\n<head>\n  <meta charset=\"UTF-8\">\n  <title>Обо мне</title>\n</head>\n<body>\n  <!-- Добавь заголовок и абзац -->\n</body>\n</html>",
      checks: [
        { label: "Добавлен заголовок h1", pattern: "<h1\\b[^>]*>" },
        { label: "Добавлен текстовый абзац", pattern: "<p\\b[^>]*>[^<]+" },
        { label: "Указан русский язык документа", pattern: "<html\\b[^>]*lang\\s*=\\s*[\"']ru[\"']" },
      ],
      hints: ["Используй парные теги <h1> и </h1>.", "Помести описание внутрь элемента <p>.", "Добавь атрибут lang=\"ru\" элементу <html>."],
    },
  },
  7: {
    duration: "14 мин",
    theory: [
      "Ссылка создаётся тегом a. Атрибут href указывает адрес, куда она ведёт.",
      "Изображение добавляется тегом img. Для него важен атрибут src с путём к файлу и alt с кратким описанием.",
      "Тег img не имеет закрывающей пары. Описательный alt помогает людям, использующим программы чтения с экрана.",
    ],
    example: "<a href=\"https://example.com\">Открыть сайт</a>\n<img src=\"cat.jpg\" alt=\"Рыжий кот на окне\">",
    task: {
      title: "Добавь ссылку и изображение",
      prompt: "Добавь ссылку с атрибутом href и изображение с атрибутами src и непустым alt.",
      starter: "<!-- Добавь ссылку и изображение -->",
      checks: [
        { label: "Добавлена ссылка с href", pattern: "<a\\b[^>]*href\\s*=" },
        { label: "У изображения указан src", pattern: "<img\\b[^>]*src\\s*=" },
        { label: "У изображения есть описание alt", pattern: "<img\\b[^>]*alt\\s*=\\s*[\"'][^\"']+[\"']" },
      ],
      hints: ["Создай ссылку через <a href=\"...\">.", "Для изображения используй <img src=\"...\">.", "Добавь короткое описание в атрибут alt."],
    },
  },
  16: {
    duration: "15 мин",
    theory: [
      "Семантические теги объясняют роль содержимого не только браузеру, но и другим разработчикам.",
      "header обычно содержит вводную часть, main — главное содержимое страницы, а footer — заключительную информацию.",
      "Используй один главный элемент main на странице и вкладывай в него основные разделы.",
    ],
    example: "<header>\n  <p>Мой блог</p>\n</header>\n<main>\n  <article>\n    <h1>Первая заметка</h1>\n    <p>Я изучаю HTML.</p>\n  </article>\n</main>\n<footer>\n  <p>© 2026</p>\n</footer>",
    task: {
      title: "Разметь статью",
      prompt: "Создай семантическую страницу: используй header, main и article, а внутри статьи добавь заголовок h1.",
      starter: "<!-- Добавь семантические элементы -->",
      checks: [
        { label: "Есть шапка страницы", pattern: "<header\\b" },
        { label: "Есть основное содержимое", pattern: "<main\\b" },
        { label: "Статья содержит заголовок", pattern: "<article\\b[\\s\\S]*?<h1\\b" },
      ],
      hints: ["Обозначь начало страницы элементом <header>.", "Основную часть оберни в <main>.", "Помести статью в <article> и добавь заголовок."],
    },
  },
};

const cssLessonDetails = {
  3: {
    duration: "14 мин",
    theory: [
      "CSS описывает внешний вид элементов HTML. Правило состоит из селектора и блока объявлений в фигурных скобках.",
      "Селектор по тегу выбирает все элементы этого типа. Класс начинается с точки и позволяет оформить выбранные элементы.",
      "Свойство color задаёт цвет текста, а background-color — цвет фона.",
    ],
    example: "p {\n  color: #dbeafe;\n  background-color: #111827;\n}\n\n.card {\n  color: white;\n}",
    task: {
      title: "Оформи карточку",
      prompt: "Создай CSS-правило для класса .card и задай ему цвет текста и цвет фона.",
      starter: ".card {\n  /* Добавь свойства */\n}",
      checks: [
        { label: "Есть селектор .card", pattern: "\\.card\\s*\\{" },
        { label: "Задан цвет текста", pattern: "color\\s*:\\s*[^;]+;" },
        { label: "Задан цвет фона", pattern: "background-color\\s*:\\s*[^;]+;" },
      ],
      hints: ["Селектор класса начинается с точки: .card.", "Задай свойство color.", "Цвет фона задаётся свойством background-color."],
    },
  },
  9: {
    duration: "16 мин",
    theory: [
      "У каждого элемента есть содержимое, внутренний отступ padding, рамка border и внешний отступ margin.",
      "Padding добавляет пространство внутри рамки. Margin разделяет элемент и соседние элементы.",
      "Свойство box-sizing: border-box упрощает расчёты: заданная ширина включает содержимое и padding.",
    ],
    example: ".card {\n  box-sizing: border-box;\n  width: 280px;\n  padding: 20px;\n  margin: 16px;\n  border: 1px solid #334155;\n}",
    task: {
      title: "Настрой отступы",
      prompt: "Для класса .card установи внутренний и внешний отступ, а также включи border-box.",
      starter: ".card {\n  /* Настрой модель блока */\n}",
      checks: [
        { label: "Есть селектор .card", pattern: "\\.card\\s*\\{" },
        { label: "Задан внутренний отступ", pattern: "padding\\s*:\\s*[^;]+;" },
        { label: "Задан внешний отступ", pattern: "margin\\s*:\\s*[^;]+;" },
        { label: "Используется border-box", pattern: "box-sizing\\s*:\\s*border-box\\s*;" },
      ],
      hints: ["Внутреннее пространство регулирует padding.", "Для отступа снаружи используй margin.", "Добавь box-sizing: border-box."],
    },
  },
  18: {
    duration: "18 мин",
    theory: [
      "Flexbox помогает располагать элементы в строку или колонку и управлять свободным пространством.",
      "Чтобы включить его, задай родительскому элементу display: flex. Дочерние элементы станут flex-элементами.",
      "Свойство justify-content распределяет элементы по главной оси, а gap задаёт расстояние между ними.",
    ],
    example: ".menu {\n  display: flex;\n  justify-content: space-between;\n  align-items: center;\n  gap: 16px;\n}",
    task: {
      title: "Собери меню",
      prompt: "Сделай класс .menu flex-контейнером, выровняй элементы по центру и добавь промежуток.",
      starter: ".menu {\n  /* Добавь настройки flex */\n}",
      checks: [
        { label: "Включён Flexbox", pattern: "display\\s*:\\s*flex\\s*;" },
        { label: "Элементы выровнены", pattern: "align-items\\s*:\\s*center\\s*;" },
        { label: "Добавлен промежуток", pattern: "gap\\s*:\\s*[^;]+;" },
      ],
      hints: ["Добавь display: flex.", "Выровнять элементы по центру поможет align-items: center.", "Расстояние между элементами задаёт gap."],
    },
  },
};

export const courses = [
  {
    id: "html",
    title: "HTML",
    subtitle: "Структура и семантика страниц",
    description: "Научись создавать понятную структуру веб-страницы и размечать её содержимое.",
    icon: Code2,
    color: {
      iconBg: "bg-sky-400/10",
      iconText: "text-sky-300",
      progressText: "text-sky-300",
      bar: "bg-gradient-to-r from-blue-500 to-sky-300",
    },
    topics: createCurriculumTopics("html", htmlCurriculum, htmlExamples, htmlLessonDetails),
  },
  {
    id: "css",
    title: "CSS",
    subtitle: "Стили и адаптивная вёрстка",
    description: "Оформляй страницы: выбирай цвета, настраивай отступы и располагай элементы.",
    icon: Palette,
    color: {
      iconBg: "bg-violet-400/10",
      iconText: "text-violet-300",
      progressText: "text-violet-300",
      bar: "bg-gradient-to-r from-violet-600 to-violet-300",
    },
    topics: createCurriculumTopics("css", cssCurriculum, cssExamples, cssLessonDetails),
  },
  {
    id: "javascript",
    title: "JavaScript",
    subtitle: "Логика и интерактивность",
    description: "Изучи синтаксис JavaScript, работу с DOM и асинхронный код для интерактивных сайтов.",
    icon: Code2,
    color: {
      iconBg: "bg-amber-300/10",
      iconText: "text-amber-300",
      progressText: "text-amber-300",
      bar: "bg-gradient-to-r from-amber-500 to-yellow-300",
    },
    topics: [
      {
        id: "js-variables",
        title: "Переменные и значения",
        duration: "15 мин",
        theory: [
          "Переменная хранит значение, к которому можно обратиться по имени. В современном JavaScript для этого обычно используют const и let.",
          "const подходит, если переменную не нужно переназначать. let используют, когда значение будет меняться.",
          "Строки записывают в кавычках, числа — без кавычек, а логические значения — true или false.",
        ],
        example: "const learner = \"Студент\";\nlet completedLessons = 0;\ncompletedLessons = completedLessons + 1;\n\nconsole.log(learner, completedLessons);",
        task: {
          title: "Создай переменные",
          prompt: "Объяви const с именем learner и let с количеством lessons. Используй строку и число.",
          starter: "// Объяви переменные learner и lessons\n",
          checks: [
            { label: "Имя learner объявлено через const", pattern: "const\\s+learner\\s*=" },
            { label: "Переменная lessons объявлена через let", pattern: "let\\s+lessons\\s*=" },
            { label: "В коде есть числовое значение", pattern: "\\b\\d+\\b" },
          ],
          hints: ["Для постоянного имени используй const learner = ...", "Количество уроков можно объявить через let lessons = 0.", "Числа записываются без кавычек."],
        },
      },
      {
        id: "js-functions",
        title: "Функции и параметры",
        duration: "18 мин",
        theory: [
          "Функция — именованный блок кода, который можно запускать повторно. Она может принимать параметры и возвращать результат.",
          "Параметры указывают в скобках при объявлении. Ключевое слово return возвращает значение из функции.",
          "Разделение программы на небольшие функции помогает повторно использовать код и легче его понимать.",
        ],
        example: "function greet(name) {\n  return `Привет, ${name}!`;\n}\n\nconst message = greet(\"Мир\");\nconsole.log(message);",
        task: {
          title: "Напиши функцию приветствия",
          prompt: "Напиши функцию greet, которая принимает name и возвращает строку приветствия.",
          starter: "function greet(name) {\n  // Верни приветствие\n}\n",
          checks: [
            { label: "Объявлена функция greet с параметром name", pattern: "function\\s+greet\\s*\\(\\s*name\\s*\\)" },
            { label: "Функция возвращает результат", pattern: "return\\s+" },
            { label: "В строке используется параметр name", pattern: "`[^`]*\\$\\{\\s*name\\s*\\}[^`]*`|[\"'][^\"']*\\s*\\+\\s*name\\s*\\+\\s*[\"']" },
          ],
          hints: ["Объяви function greet(name).", "Используй return, чтобы вернуть строку.", "Для подстановки параметра подойдёт шаблонная строка: `Привет, ${name}`."],
        },
      },
      {
        id: "js-arrays",
        title: "Массивы и методы",
        duration: "20 мин",
        theory: [
          "Массив хранит несколько значений в одном упорядоченном списке. Первый элемент находится по индексу 0.",
          "Метод map создаёт новый массив, применяя функцию к каждому элементу исходного массива.",
          "Метод filter создаёт новый массив только из элементов, которые проходят указанную проверку.",
        ],
        example: "const numbers = [1, 2, 3];\nconst doubled = numbers.map((number) => number * 2);\nconst large = doubled.filter((number) => number > 2);\n\nconsole.log(large);",
        task: {
          title: "Удвой числа массива",
          prompt: "Создай массив numbers и получи массив doubled с помощью метода map. Каждое число нужно умножить на 2.",
          starter: "const numbers = [1, 2, 3];\n// Создай doubled с помощью map\n",
          checks: [
            { label: "Используется массив numbers", pattern: "const\\s+numbers\\s*=\\s*\\[" },
            { label: "Создан массив doubled через map", pattern: "const\\s+doubled\\s*=\\s*numbers\\.map\\s*\\(" },
            { label: "Значения умножаются на 2", pattern: "=>\\s*[^,;\\n]*\\*\\s*2|return\\s+[^;\\n]*\\*\\s*2" },
          ],
          hints: ["Создай массив с помощью квадратных скобок.", "Вызови numbers.map(...), чтобы получить новый массив.", "В функции преобразования умножь каждый элемент на 2."],
        },
      },
    ],
  },
  {
    id: "react",
    title: "React",
    subtitle: "Компонентный подход",
    description: "Создавай интерфейсы на компонентах, хуках, маршрутизации и управлении состоянием.",
    icon: Layers3,
    color: {
      iconBg: "bg-cyan-400/10",
      iconText: "text-cyan-300",
      progressText: "text-cyan-300",
      bar: "bg-gradient-to-r from-cyan-600 to-cyan-300",
    },
    topics: [
      {
        id: "react-components",
        title: "Первый компонент",
        duration: "16 мин",
        theory: [
          "Компонент React — функция JavaScript, которая возвращает описание интерфейса в формате JSX.",
          "Имена компонентов принято начинать с заглавной буквы. Это помогает React отличать компоненты от встроенных HTML-тегов.",
          "Чтобы показать компонент на странице, используй его как JSX-элемент: <Welcome />.",
        ],
        example: "function Welcome() {\n  return <h1>Привет, React!</h1>;\n}\n\nfunction App() {\n  return <Welcome />;\n}",
        task: {
          title: "Создай компонент приветствия",
          prompt: "Объяви компонент Welcome, который возвращает JSX-заголовок с текстом приветствия.",
          starter: "function Welcome() {\n  // Верни JSX-заголовок\n}\n",
          checks: [
            { label: "Объявлена функция-компонент Welcome", pattern: "function\\s+Welcome\\s*\\(" },
            { label: "Компонент возвращает JSX", pattern: "return\\s+<" },
            { label: "Есть закрывающий тег h1", pattern: "<h1\\b[^>]*>[\\s\\S]*?<\\/h1>" },
          ],
          hints: ["Назови компонент с заглавной буквы: Welcome.", "Внутри функции используй return.", "Для заголовка подойдёт JSX: <h1>Текст</h1>."],
        },
      },
      {
        id: "react-props",
        title: "Свойства компонентов",
        duration: "18 мин",
        theory: [
          "Props — данные, которые родительский компонент передаёт дочернему. Их удобно использовать для повторяющихся элементов интерфейса.",
          "Компонент получает props как аргумент функции. Например, значение props.title можно показать в заголовке.",
          "Props предназначены для чтения внутри компонента. Чтобы интерфейс менялся от действий пользователя, понадобится состояние.",
        ],
        example: "function Greeting(props) {\n  return <h1>Привет, {props.name}!</h1>;\n}\n\nfunction App() {\n  return <Greeting name=\"Аня\" />;\n}",
        task: {
          title: "Передай имя через props",
          prompt: "Создай компонент Greeting, получающий props, и используй props.name в JSX.",
          starter: "function Greeting(props) {\n  // Покажи props.name\n}\n",
          checks: [
            { label: "Компонент принимает props", pattern: "function\\s+Greeting\\s*\\(\\s*props\\s*\\)" },
            { label: "Компонент возвращает JSX", pattern: "return\\s+<" },
            { label: "Используется props.name", pattern: "props\\.name" },
          ],
          hints: ["Добавь параметр props в функцию Greeting.", "В JSX-выражении используй фигурные скобки.", "Значение свойства доступно как props.name."],
        },
      },
      {
        id: "react-state",
        title: "Состояние и useState",
        duration: "20 мин",
        theory: [
          "Состояние (state) хранит данные компонента, которые могут меняться. Когда состояние обновляется, React перерисовывает интерфейс.",
          "Хук useState возвращает текущее значение и функцию, которая обновляет его. Начальное значение указывают в вызове useState.",
          "Вызывай setter для обновления состояния — не меняй значение напрямую.",
        ],
        example: "import { useState } from \"react\";\n\nfunction Counter() {\n  const [count, setCount] = useState(0);\n  return (\n    <button onClick={() => setCount(count + 1)}>\n      Счёт: {count}\n    </button>\n  );\n}",
        task: {
          title: "Добавь состояние счётчика",
          prompt: "Импортируй useState и создай состояние count со значением 0 и функцией setCount.",
          starter: "import { useState } from \"react\";\n\nfunction Counter() {\n  // Создай состояние count\n}\n",
          checks: [
            { label: "Используется хук useState", pattern: "useState\\s*\\(" },
            { label: "Состояние называется count", pattern: "\\[\\s*count\\s*," },
            { label: "Создан setter setCount", pattern: "\\[\\s*count\\s*,\\s*setCount\\s*\\]" },
          ],
          hints: ["Вызови useState(0) внутри компонента.", "Распакуй результат в массив [count, setCount].", "Вторая переменная должна называться setCount."],
        },
      },
    ],
  },
];

courses.find((course) => course.id === "javascript").topics =
  createCurriculumTopics("javascript", javascriptCurriculum, javascriptExamples);
courses.find((course) => course.id === "react").topics =
  createCurriculumTopics("react", reactCurriculum, reactExamples);

export function getCourse(courseId) {
  return courses.find((course) => course.id === courseId);
}

export function getTopic(courseId, topicId) {
  return getCourse(courseId)?.topics.find((topic) => topic.id === topicId);
}
