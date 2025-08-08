// Функция для добавления стилей и элемента уведомления
function initCopyNotification() {

  // Создаем элемент уведомления
  const bubble = document.createElement('div');
  bubble.id = 'bubbleNotification';
  bubble.className = 'bubble-notification';
  document.body.appendChild(bubble);
}


// Функция для определения языка
function getNotificationText() {
  const path = window.location.pathname;
  const language = localStorage.getItem('siteLanguage') || 
                  (path.includes('/r/') ? 'ru' : 
                   path.includes('/read/') ? 'en' : 'en');
  
  return {
    ru: "Скопировано в буфер",
    en: "Copied to clipboard"
  }[language] || "Copied to clipboard";
}

// Основная функция копирования
function copyToClipboard(text = "") {
  // Инициализация уведомления
  if (!document.getElementById('bubbleNotification')) {
    initCopyNotification();
  }

  // Обработка URL
  if (text === 127) {
    text = window.location.href.replace('localhost', '127.0.0.1');
  } else if (text === "") {
    text = window.location.href;
    text = text.includes('localhost') || text.includes('127.0.0.1')
      ? text.replace(/https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/gi, 'https://dhamma.gift')
      : text.includes('dhamma.gift')
        ? text.replace('https://dhamma.gift', 'http://127.0.0.1:8080')
        : 'https://dhamma.gift' + text.substring(text.indexOf('/', 8));
  }

  // Получаем элемент, на котором кликнули
  const clickedElement = event?.target;
  if (!clickedElement || !clickedElement.classList.contains('copyLink')) {
    navigator.clipboard.writeText(text);
    showBubbleNotification(getNotificationText());
    return;
  }

  const parentSpan = clickedElement.closest('span[id]');
  if (!parentSpan) return;

  // Определяем язык кликнутого элемента
  const clickedLang = clickedElement.closest('[lang]')?.getAttribute('lang');
  const suttaId = new URL(text).searchParams.get('q') || '';

  let textParts = [];
  
  // 1. Всегда добавляем текст пали (с видимыми вариантами)
  const piElement = parentSpan.querySelector('.pli-lang');
  if (piElement) {
    const piClone = piElement.cloneNode(true);
    // Удаляем только скрытые варианты
    piClone.querySelectorAll('.hidden-variant').forEach(el => el.remove());
    const piText = piClone.textContent
      .trim()
      .replace(/\u00A0/g, '\n')
      .replace(/\s\s+/g, '\n');
    textParts.push(piText);
  }

  // 2. Если кликнули на перевод - добавляем его текст
  if (clickedLang !== 'pi') {
    const translationElement = clickedElement.closest('[lang]:not([lang="pi"])');
    if (translationElement) {
      const translationText = translationElement.textContent.trim();
      textParts.push(translationText);
    }
  }

  // 3. Добавляем все остальные видимые переводы (кроме кликнутого)
  if (clickedLang !== 'pi') {
    const otherTranslations = Array.from(
      parentSpan.querySelectorAll('[lang]:not([lang="pi"]):not([lang="' + clickedLang + '"])')
    )
      .filter(el => !el.closest('.hidden-variant'))
      .map(el => el.textContent.trim())
      .filter(Boolean);
    
    if (otherTranslations.length > 0) {
      textParts = textParts.concat(otherTranslations);
    }
  }

  // Собираем финальный текст с правильными отступами
  let textToCopy = textParts.join('\n\n'); // Двойной перенос между блоками
  
  // 4. Добавляем ID сутты и ссылку с дополнительными отступами
  if (suttaId) textToCopy += `\n\n${suttaId}`;
    
  if (text.includes('localhost') || text.includes('127.0.0.1')) {
    text = text.replace(/http:\/\/(localhost|127\.0\.0\.1)(:\d+)?/g, 'https://dhamma.gift');
    }

  textToCopy += `\n${text}`;

  console.log('Копируемый текст:', textToCopy);
  showBubbleNotification(getNotificationText());
  
  if (navigator.clipboard) {
    navigator.clipboard.writeText(textToCopy).catch(() => fallbackCopy(textToCopy));
  } else {
    fallbackCopy(textToCopy);
  }
}

// Fallback для старых браузеров
function fallbackCopy(text) {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  document.body.removeChild(textarea);
}

// Показать уведомление
function showBubbleNotification(text) {
  const bubble = document.getElementById('bubbleNotification');
  if (!bubble) return;
  
  bubble.textContent = text;
  bubble.classList.add('show');
  
  setTimeout(() => {
    bubble.classList.remove('show');
  }, 2000);
}

// Скрыть share icon на production
document.addEventListener('DOMContentLoaded', function() {
  const shareOnlineElement = document.getElementById('shareOnline');
  if (shareOnlineElement && window.location.href.includes('dhamma.gift')) {
    shareOnlineElement.style.display = 'none';
  }

  // Инициализируем уведомление при загрузке
  initCopyNotification();

  // =======================================================================
  // НАЧАЛО НОВОГО КОДА: Копирование ссылки на строку по правому клику/долгому нажатию
  // =======================================================================

  let pressTimer = null;

// Универсальная функция-обработчик, которая находит и копирует ссылку
  const handleLineLinkCopy = (event) => {
    // 1. Находим ближайший родительский элемент с атрибутом [id],
    // начиная от элемента, по которому кликнули.
    const anchorElement = event.target.closest('[id]');

    // Если элемент с ID не найден, ничего не делаем.
    if (!anchorElement) return;

    // 2. Ищем .copyLink ВНУТРИ найденного элемента с ID.
    // Это нужно, чтобы получить базовый URL для ссылки.
    const copyLinkElem = anchorElement.querySelector('.copyLink');

    // Если .copyLink не найден, мы не можем построить ссылку, выходим.
    if (!copyLinkElem) return;

    // Предотвращаем стандартное поведение (контекстное меню, выделение и т.д.)
    // Это действие выполняется только если все проверки выше прошли.
    event.preventDefault();

    // 3. Используем ID найденного элемента как хеш для ссылки.
    const hash = anchorElement.id;
    
    // --- Дальнейшая логика для сборки URL и копирования остается прежней ---

    const onclickAttr = copyLinkElem.getAttribute('onclick');
    const urlMatch = onclickAttr.match(/copyToClipboard\('([^']*)'\)/);
    if (!urlMatch || !urlMatch[1]) return;
    
    // Собираем итоговую ссылку, заменяя хеш на правильный
    const baseUrl = new URL(urlMatch[1]);
    baseUrl.hash = hash;
    let finalUrl = baseUrl.href;

    // Заменяем localhost на dhamma.gift, если нужно
    if (finalUrl.includes('localhost') || finalUrl.includes('127.0.0.1')) {
      finalUrl = finalUrl.replace(/https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/gi, 'https://dhamma.gift');
    }

    // Копируем в буфер обмена
    navigator.clipboard.writeText(finalUrl).then(() => {
      // Показываем кастомное уведомление
      const path = window.location.pathname;
      const language = localStorage.getItem('siteLanguage') || (path.includes('/r/') ? 'ru' : 'en');
      const notificationText = {
        ru: "Ссылка скопирована",
        en: "Link copied"
      }[language] || "Link copied";
      showBubbleNotification(notificationText);
    }).catch(err => {
      console.error('Не удалось скопировать ссылку: ', err);
      fallbackCopy(finalUrl); // Используем fallback для старых браузеров
    });
  };

  // 1. Обработчик для правого клика мыши
  document.addEventListener('contextmenu', handleLineLinkCopy);

  // 2. Обработчики для долгого нажатия на сенсорных устройствах
  document.addEventListener('touchstart', (event) => {
    // Запускаем таймер только если нажатие было на нужной строке
    if (event.target.closest('.verse-line')) {
      pressTimer = window.setTimeout(() => {
        handleLineLinkCopy(event);
        pressTimer = null;
      }, 500); // 500 мс для долгого нажатия
    }
  }, { passive: false }); // passive: false, чтобы работал event.preventDefault()

  const clearLongPressTimer = () => {
    clearTimeout(pressTimer);
  };
  
  document.addEventListener('touchend', clearLongPressTimer);
  document.addEventListener('touchmove', clearLongPressTimer);
   // =======================================================================
  // КОНЕЦ НОВОГО КОДА
  // =======================================================================
});