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

// --- ВОССТАНОВЛЕННАЯ ФУНКЦИЯ ---
// Основная функция для общего копирования (используется в других частях сайта)
function copyToClipboard(text = "") {
  if (!document.getElementById('bubbleNotification')) {
    initCopyNotification();
  }

  // Эта логика для обработки URL страницы и других вызовов
  if (text === 127) {
    text = window.location.href.replace('localhost', '127.0.0.1');
  } else if (text === "") {
    text = window.location.href;
  }

  // Используем общий метод для копирования
  navigator.clipboard.writeText(text)
    .then(() => showBubbleNotification(getNotificationText()))
    .catch(() => fallbackCopy(text));
}
// --- КОНЕЦ ВОССТАНОВЛЕННОЙ ФУНКЦИИ ---


// Выполняется после полной загрузки DOM
document.addEventListener('DOMContentLoaded', function() {

  // Скрыть share icon на production
  const shareOnlineElement = document.getElementById('shareOnline');
  if (shareOnlineElement && window.location.href.includes('dhamma.gift')) {
    shareOnlineElement.style.display = 'none';
  }

  // Инициализируем уведомление при загрузке
  initCopyNotification();

  // --- ЛОГИКА ДЛЯ ЧЕКБОКСА 'copyMode' ---
  const copyModeCheckbox = document.getElementById('copyMode');
  if (copyModeCheckbox) {
    const savedState = localStorage.getItem('copyModeEnabled');
    if (savedState !== null) {
      copyModeCheckbox.checked = savedState === 'true';
    }
    copyModeCheckbox.addEventListener('change', function() {
      localStorage.setItem('copyModeEnabled', copyModeCheckbox.checked);
    });
  }
  // --- КОНЕЦ ЛОГИКИ ДЛЯ ЧЕКБОКСА ---


  // --- СПЕЦИАЛЬНЫЙ ОБРАБОТЧИК ДЛЯ КОПИРОВАНИЯ ЦИТАТ (.copyLink) ---
  document.addEventListener('click', function(e) {
    const copyLink = e.target.closest('.copyLink');
    if (!copyLink) return;

    e.preventDefault();

    let url = copyLink.dataset.copyText || '';
    if (url.includes('localhost') || url.includes('127.0.0.1')) {
      url = url.replace(/http:\/\/(localhost|127\.0\.0\.1)(:\d+)?/g, 'https://dhamma.gift');
    }

    // Проверяем, существует ли чекбокс и включен ли он
    const isSimpleCopyMode = copyModeCheckbox && copyModeCheckbox.checked;

    let textToCopy = '';

    if (isSimpleCopyMode) {
      // РЕЖИМ 1: Копируем только URL
      textToCopy = url;
    } else {
      // РЕЖИМ 2 (по умолчанию): Собираем полную цитату
      const contentBlock = copyLink.closest('span[id]');
      if (!contentBlock) return;

      const processText = (text) => {
        if (!text) return '';
        return text.replace(/\u00A0/g, '\n').replace(/\s\s+/g, '\n').trim();
      };

      // 1. Текст на пали
      const piTextElements = contentBlock.querySelectorAll('[lang="pi"]:not(.hidden-variant)');
      let piText = '';
      piTextElements.forEach(el => {
        const text = processText(el.textContent);
        if (text) {
          if (piText) piText += '\n';
          piText += text;
        }
      });
      if (piText) textToCopy += piText;

      // 2. Переводы
      const langSet = new Set();
      const translations = [];
      for (const el of contentBlock.querySelectorAll('[lang]:not([lang="pi"]):not(.hidden-variant)')) {
        const lang = el.getAttribute('lang');
        const text = processText(el.textContent);
        if (!text || text === piText || langSet.has(lang)) continue;
        langSet.add(lang);
        translations.push({ lang, text });
      }

      if (translations.length > 0) {
        textToCopy += '\n\n';
        let currentLang = null;
        translations.forEach((t, i) => {
          if (currentLang && currentLang !== t.lang) textToCopy += '\n';
          textToCopy += t.text;
          if (i < translations.length - 1) textToCopy += '\n';
          currentLang = t.lang;
        });
      }

      // 3. Номер сутты и URL
      const suttaId = new URL(url).searchParams.get('q') || '';
      if (suttaId) textToCopy += `\n\n${suttaId}`;
      textToCopy += `\n${url}`;
    }

    // Копируем в буфер и показываем уведомление
    navigator.clipboard.writeText(textToCopy)
      .then(() => showBubbleNotification(getNotificationText()))
      .catch(() => fallbackCopy(textToCopy));
  });
});