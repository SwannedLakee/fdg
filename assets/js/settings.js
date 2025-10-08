const MAX_HISTORY = 84;
let textinfoCache = null; // Кеш для данных сутт

async function addToSearchHistory() {
    try {
        const url = new URL(window.location.href);
        const qParam = url.searchParams.get("q");
        if (!qParam) return;

        let key = processSearchQuery(qParam);

        // Основное сохранение (оригинальный ключ)
        await saveToHistory(key, url);

        // Попытка улучшить ключ (асинхронно)
        if (/\d/.test(key) && !key.includes(' ')) {
            try {
                const enhancedKey = await tryEnhanceKey(key);
                if (enhancedKey !== key) {
                    await saveToHistory(enhancedKey, url);
                }
            } catch (e) {
                console.debug("Не удалось добавить название:", e);
            }
        }
    } catch (e) {
        console.error("Ошибка сохранения истории:", e);
    }
}

function processSearchQuery(query) {
    return query.toLowerCase()
        .replace(/\s*https?:\/\/\S+/gi, '')
        .replace(/\s*www\.\S+/gi, '')
        .replace(/^"|"$/g, '')
        .trim();
}

async function tryEnhanceKey(key) {
    const textinfo = await loadTextData();
    const baseKey = key.split(/\s+/)[0];
    const suttaName = textinfo[baseKey]?.pi;
    return suttaName ? `${baseKey} ${suttaName}` : key;
}

async function loadTextData() {
    if (textinfoCache) return textinfoCache;
    
    // 1. Проверяем глобальную переменную
    if (typeof textinfo !== 'undefined') {
        textinfoCache = textinfo;
        return textinfo;
    }

    // 2. Пробуем загрузить как модуль
    try {
        const module = await import('/assets/js/textinfo.js?update=' + Date.now());
        if (module.textinfo) {
            textinfoCache = module.textinfo;
            return module.textinfo;
        }
    } catch {}

    // 3. Пробуем загрузить как сырой текст
    try {
        const response = await fetch('/assets/js/textinfo.js?update=' + Date.now());
        const text = await response.text();
        
        // Пытаемся разобрать разными способами
        const data = parseTextInfo(text);
        if (data) {
            textinfoCache = data;
            return data;
        }
    } catch (e) {
        console.error("Ошибка загрузки textinfo:", e);
    }

    return {};
}

function parseTextInfo(text) {
    try {
        // Вариант 1: Чистый JSON
        return JSON.parse(text);
    } catch {
        try {
            // Вариант 2: JS-объект с присваиванием
            const match = text.match(/var\s+\w+\s*=\s*({[\s\S]+?});/);
            if (match) return JSON.parse(match[1]);

            // Вариант 3: Самовыполняющаяся функция
            return (new Function(text + '; return textinfo || window.textinfo;'))();
        } catch {
            return null;
        }
    }
}

async function saveToHistory(key, url) {
    const value = url.pathname + url.search + url.hash;
    const timestamp = new Date().toISOString();
    
    let history = JSON.parse(localStorage.getItem("localSearchHistory")) || [];
    
    // Определяем базовый ключ для сравнения
    const baseKey = /\d/.test(key) ? key.split(/\s+/)[0] : key;
    
    // Удаляем все старые записи с таким же базовым ключом
    history = history.filter(([k]) => {
        if (k === key) return false; // Точное совпадение
        if (!/\d/.test(key)) return true; // Для не-сутт оставляем другие
        
        const kBase = k.split(/\s+/)[0];
        return kBase !== baseKey;
    });
    
    // Добавляем новую запись в начало
    history.unshift([key, value, timestamp]);
    
    // Ограничиваем историю
    localStorage.setItem("localSearchHistory", 
        JSON.stringify(history.slice(0, MAX_HISTORY)));
}
//установка фокуса в инпуте по нажатию / 
document.addEventListener('keydown', function(event) {
    // Проверяем именно символ / (код 191 или Slash)
    if (event.key === '/' || event.code === 'Slash') {
        // Проверяем, активно ли модальное окно
        const isModalActive = quickModalIsOpen && document.getElementById('quickSearchInput');
        
        // Если модальное окно активно, устанавливаем фокус в его поле ввода
        if (isModalActive) {
            const modalInput = document.getElementById('quickSearchInput');
            event.preventDefault();
            modalInput.focus();
            modalInput.setSelectionRange(modalInput.value.length, modalInput.value.length);
            return; // Прерываем выполнение, так как модальное окно активно
        }
        
        // Ищем все возможные инпуты (оригинальная логика)
        const inputs = document.querySelectorAll(
            '#paliauto[type="search"], #paliauto[type="text"], .dtsb-value.dtsb-input'
        );
        
        // Если нет ни одного подходящего инпута - выходим
        if (inputs.length === 0) return;
        
        // Берем первый подходящий инпут
        const input = inputs[0];
        
        // Предотвращаем действие по умолчанию только если нашли инпут
        event.preventDefault();
        
        // Фокусируемся и перемещаем курсор в конец
        input.focus();
        input.setSelectionRange(input.value.length, input.value.length);
    }
}); 

// Отключаем перехват / когда фокус уже в инпуте
const handleInputKeydown = (event) => {
    if (event.key === '/' || event.code === 'Slash') {
        event.stopPropagation();
    }
};

// Вешаем обработчики на все существующие и будущие инпуты
document.querySelectorAll('input').forEach(input => {
    input.addEventListener('keydown', handleInputKeydown);
});

// Наблюдатель для динамически добавляемых инпутов
new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
            if (node.nodeName === 'INPUT') {
                node.addEventListener('keydown', handleInputKeydown);
            } else if (node.querySelectorAll) {
                node.querySelectorAll('input').forEach(input => {
                    input.addEventListener('keydown', handleInputKeydown);
                });
            }
        });
    });
}).observe(document.body, { childList: true, subtree: true });

//конец фокуса в инпуте по нажатию / 


function loadModal(modalId, modalFile) {
    fetch(modalFile)
        .then(response => response.text())
        .then(html => {
            document.getElementById("modalContainer").innerHTML = html;
            let modal = new bootstrap.Modal(document.getElementById(modalId));
           //modal.show();
        })
        .catch(error => console.error("Ошибка загрузки модального окна:", error));
}

//loadModal("paliLookupInfo", "/assets/common/modalsSC.html");

//sett8ngs management
document.addEventListener('DOMContentLoaded', function() {
  
  const scriptSelect = document.getElementById('script-select');
  const dictSelect = document.getElementById('dict-select');

  const applyButton = document.getElementById('apply-button');
  const resetButton = document.getElementById('reset-button');
  const settingsButton = document.getElementById('settingsButton');
  const helpButton = document.getElementById('helpMessage');
  const goButton = document.querySelector('.go-button'); // Кнопка "Go"



function shouldIgnoreKeyEvent() {
  const activeElement = document.activeElement;
  return activeElement && activeElement.id === "paliauto" && activeElement.tagName === "INPUT";
}



window.addEventListener("keydown", (event) => {
    if (event.key === 'Escape' || event.code === 'Escape') {

    // --- 0. Close PWA banner ---
    const pwaBanner = document.getElementById('pwa-banner');
    if (pwaBanner && pwaBanner.offsetParent !== null) { // проверка, что видим
        const closePwaBtn = document.getElementById('closePwaBanner');
        if (closePwaBtn) {
            closePwaBtn.click();
            event.preventDefault();
            return;
        }
    }

      // --- 1. Close the hint popup ---
        const hintElement = document.querySelector('.hint');
        if (hintElement && hintElement.offsetParent !== null) { // проверка, что видимо
            const closeHintButton = document.getElementById('closeHintBtn');
            if (closeHintButton) {
                closeHintButton.click();
                event.preventDefault();
                return;
            }
        }
        
        // --- 1. Close the fdgPopup from openFdg.js ---
        // We look for the fdg-popup element and check if it's visible.
        const fdgPopupElement = document.querySelector('.fdg-popup');
        if (fdgPopupElement && fdgPopupElement.style.display === 'block') {
            // If the popup is open, we simulate a click on its close button.
            const fdgCloseButton = fdgPopupElement.querySelector('.fdg-close-btn');
            if (fdgCloseButton) {
                fdgCloseButton.click();
                event.preventDefault(); // Prevent any other action.
                return; // Stop further execution.
            }
        }

        // --- 2. Close the main dictionary popup from paliLookup.js ---
        // We look for the main lookup popup element and check its visibility.
        const paliLookupPopupElement = document.querySelector('.popup');
        if (paliLookupPopupElement && paliLookupPopupElement.style.display === 'block') {
            // If the popup is open, we simulate a click on its close button.
            const paliLookupCloseButton = paliLookupPopupElement.querySelector('.close-btn');
            if (paliLookupCloseButton) {
                paliLookupCloseButton.click();
                event.preventDefault();
                return;
            }
        }

        // --- 3. Close the Quick Modal (Cattāri Ariyasaccāni) ---
        // We check if the quick modal is open by looking for its overlay.
        const quickOverlayElement = document.querySelector('.quick-overlay-element');
        if (quickOverlayElement && quickOverlayElement.style.opacity === '1') {
            // If the modal is open, we call its close function.
            // This assumes toggleQuickModal handles closing if it's already open.
             if (typeof toggleQuickModal === 'function') {
                toggleQuickModal(); // This will close it if it's open.
                event.preventDefault();
                return;
            }
        }


        const closeBtnElements = document.querySelectorAll('.btn-close');
        if (closeBtnElements.length > 0) {
            closeBtnElements.forEach(button => {
                if (button.offsetParent !== null) {
                    button.click();
                }
            });
            event.preventDefault();
            return; 
        }
    }
 }, true);





    // Добавляем обработчик сочетания клавиш Alt + Space (физическая клавиша)
document.addEventListener("keydown", (event) => {
    if ((event.altKey && event.code === "Space") || (event.altKey && event.code === "KeyZ")) {
        const languageButton = document.getElementById("language-button");
      if (languageButton) {
       event.preventDefault();
       // Имитируем клик по кнопке
      languageButton.click();
      }
    }
 
    // Обработчик для Alt+P в любой раскладке
  // Проверяем Alt и физическое расположение клавиши P (код KeyP)
  if (event.altKey && event.code === "KeyP") {
    event.preventDefault();
    toggleQuickModal();
  }

//Ctrl + ArrowRight navigate to next sutta
  if (shouldIgnoreKeyEvent()) return;

  if (event.ctrlKey && event.code === "ArrowRight") {
    const nextDiv = document.getElementById("next");
    if (nextDiv) {
      const link = nextDiv.querySelector("a");
      if (link) {
        history.pushState(null, "", link.href);
        location.href = link.href;
      }
    }
  } else if (event.ctrlKey && event.code === "ArrowLeft") {
    const prevDiv = document.getElementById("previous");
    if (prevDiv) {
      const link = prevDiv.querySelector("a");
      if (link) {
        history.pushState(null, "", link.href);
        location.href = link.href;
      }
    }
  }

//open Dict.Dhamma.Gift New Window
  if (event.altKey && event.code === "KeyN") {
    const inputEl = document.getElementById('paliauto');
    const inputVal = inputEl?.value.trim() || '';

    const urlParams = new URLSearchParams(window.location.search);
    const paramQ = urlParams.get('q')?.trim() || '';
    const paramS = urlParams.get('s')?.trim() || '';

    let q = '';

    if (inputVal === paramQ) {
      q = paramS || paramQ;
    } else if (inputVal) {
      q = inputVal;
    } else if (paramS) {
      q = paramS;
    } else {
      q = paramQ;
    }

    const path = window.location.pathname.toLowerCase();
    let langPrefix = '';

    if (path.includes('/ru/') || path.includes('/r/')) {
      langPrefix = '/ru';
    } else if (path.includes('/ml/')) {
      langPrefix = '/ml';
    }

    const baseUrl = 'https://dict.dhamma.gift' + langPrefix;

    const url = q
      ? baseUrl + '/search_html?source=pwa&q=' + encodeURIComponent(q)
      : baseUrl + '/';

    openDictionaryWindow(url);
  }

//Help + Settings + History
  if (event.altKey && event.code === "KeyH") {
    // Имитируем клик по кнопке
    helpButton.click();
  }

    if (event.altKey && event.code === "KeyS") {
      // Имитируем клик по кнопке
      settingsButton.click();
    }
  
//alt + G history toggle
 function handleHistoryToggle() {
  const currentUrl = window.location.pathname;
  let historyPhpPath, historyHtmlPath;

  // Если URL содержит языковой префикс (/ru/, /r/, /ml/)
  if (currentUrl.match(/\/(ru|r|ml)\//)) {
    const langPrefix = currentUrl.split('/')[1] + '/';
    historyPhpPath = `/${langPrefix}history.php`;
    historyHtmlPath = `/${langPrefix}assets/common/history.html`;
  } 
  // Если URL содержит /assets/common/ (но без языкового префикса)
  else if (currentUrl.includes('/assets/common/')) {
    historyPhpPath = '/history.php';  // Переход в корень
    historyHtmlPath = '/assets/common/history.html';
  }
  // Все остальные случаи (корень сайта или другие пути)
  else {
    historyPhpPath = '/history.php';
    historyHtmlPath = '/assets/common/history.html';
  }

  // Переключение между history.php и history.html
  if (currentUrl.endsWith('history.php')) {
    window.location.href = historyHtmlPath;
  } 
  else if (currentUrl.endsWith('history.html')) {
    window.location.href = historyPhpPath;
  }
  // Если не на странице истории, идём на history.php
  else {
    window.location.href = historyPhpPath;
  }
}

  if (event.altKey && event.code === "KeyG") {
    event.preventDefault(); // отключаем стандартное действие
    handleHistoryToggle();
  }
 
 //Language Alt + L
  if (event.altKey && event.code === "KeyL") {
    event.preventDefault(); // Предотвращаем стандартное поведение

    const scriptOptions = ['ISOPali', 'devanagari', 'thai']; // Доступные скрипты
    const url = new URL(window.location.href);
    let currentScript = url.searchParams.get('script') || 'ISOPali';

    // Получаем следующий скрипт в списке
    let nextIndex = (scriptOptions.indexOf(currentScript) + 1) % scriptOptions.length;
    let nextScript = scriptOptions[nextIndex];
 
    localStorage.removeItem('selectedScript');

    // Обновляем URL
    if (nextScript === 'ISOPali') {
      url.searchParams.delete('script'); // Удаляем параметр для ISOPali
    } else {
      url.searchParams.set('script', nextScript);
    }

    window.location.href = url.toString(); // Перезагружаем страницу
  }
 
  // Для отладки: смотри, что нажимается
//  console.log('Pressed:', event.code);

  if (event.altKey && (event.code === 'Period' || event.code === 'KeyM')) {
    event.preventDefault();

    const currentValue = localStorage.getItem("removePunct") === "true";
    localStorage.setItem("removePunct", currentValue ? "false" : "true");

    location.reload();
  }


  if (event.altKey && (event.code === 'Period' || event.code === 'KeyQ')) {
    event.preventDefault();

openDictionaries(event);
  }
});

  
  //setup dictionary 
  
// Загрузка сохраненного значения из localStorage
const savedDict = localStorage.getItem('selectedDict');

if (savedDict && [...dictSelect.options].some(opt => opt.value === savedDict)) {
  dictSelect.value = savedDict; // Устанавливаем только если значение есть в списке
} else {
  
if (window.location.href.includes('/r/') || window.location.href.includes('/ml/') || window.location.href.includes('/ru/')) {
dictSelect.value = 'standaloneru'; // Значение по умолчанию standaloneru
//  localStorage.setItem('selectedDict', 'dpdCompactRu');
} else if (window.location.href.includes('/d/')) {
dictSelect.value = 'dpdFull'; // Значение по умолчанию standaloneru
//  localStorage.setItem('selectedDict', 'dpdCompactRu');
} else {
  dictSelect.value = 'standalone'; // Значение по умолчанию
//  localStorage.setItem('selectedDict', 'standalone');
}
}

  
    // Загрузка сохраненного значения из localStorage
  const savedScript = localStorage.getItem('selectedScript');

    // Установка сохраненного значения в select при загрузке страницы
if (savedScript) {
  scriptSelect.value = savedScript;
} else {
  scriptSelect.value = 'ISOPali'; // Значение по умолчанию, если ничего не сохранено
localStorage.setItem('selectedScript', 'ISOPali');
}



if (applyButton) {
  applyButton.addEventListener('click', function() {
    // Сохраняем все выбранные настройки
    localStorage.setItem('selectedScript', scriptSelect.value);
    localStorage.setItem('selectedDict', dictSelect.value);
    
    // Сохраняем состояние чекбокса removePunct (если он есть на странице)
    const removePunctCheckbox = document.querySelector('.setting-checkbox[data-key="removePunct"]');
    if (removePunctCheckbox) {
      localStorage.setItem('removePunct', removePunctCheckbox.checked);
    }
    
    localStorage.setItem("firstVisitShowSettingsClosed", "true");
    
    // Перезагружаем страницу для применения всех изменений
    location.reload();
  });
}

  // Функция для применения сохраненного значения
function applySavedDict(dict) {
  localStorage.setItem('selectedDict', dict);
    localStorage.setItem('dictionaryVisible', 'true');
      location.reload();  // Перезагрузка, если изменился словарь
}

  // Функция для применения сохраненного значения
  function applySavedScript(script) {
    const url = new URL(window.location.href);

    if (script === 'ISOPali') {
      localStorage.setItem('selectedScript', 'ISOPali');
      url.searchParams.delete('script');
    } else {
      url.searchParams.set('script', script.toLowerCase());
    }

    // Перезагрузка страницы с новым URL
    if (window.location.href !== url.toString()) {
      window.location.href = url.toString();
    }
  }

if (resetButton) {
  resetButton.addEventListener('click', function () {
    // Определяем текущий язык
    const path = window.location.pathname;
    const language =
      localStorage.getItem('siteLanguage') ||
      (/^\/(ru|r|ml)\//.test(path) ? 'ru' : 'en');

    const messages = {
      ru: {
        confirm: 'Вы уверены, что хотите сбросить ВСЕ настройки?',
        success: 'Настройки сброшены'
      },
      en: {
        confirm: 'Are you sure you want to reset ALL settings?',
        success: 'Reset successful'
      }
    };

    // Показываем подтверждение
    if (!confirm(messages[language].confirm)) return;

    const notificationText = messages[language].success;

    // Удаляем значения из localStorage для всех чекбоксов
    document.querySelectorAll('.setting-checkbox').forEach(checkbox => {
      const key = checkbox.dataset.key;
      if (key) localStorage.removeItem(key);
    });

    // Проверяем, существует ли функция clearFdgPopupParams()
    if (typeof clearFdgPopupParams === 'function') {
      clearFdgPopupParams();
    }

    // Ключи для удаления
    const keysToRemove = [
      'selectedScript', 'selectedDict', 'defaultReader', 'paliToggleRu',
      'viewMode', 'quotePopupEnabled', 'localSearchHistory', 'lightMode',
      'dark', 'pli-rus', 'popupHeight', 'popupLeft', 'popupTop', 'popupWidth',
      'removePunct', 'theme', 'themeButtonAction', 'visitCount',
      'windowHeight', 'windowWidth', 'isFirstDrag'
    ];

    localStorage.clear();
    sessionStorage.clear();

    keysToRemove.forEach(key => localStorage.removeItem(key));

    // Установка значений по умолчанию
    localStorage.setItem('variantVisibility', 'hidden');

    // Удаляем параметр 'script' из URL
    const url = new URL(window.location.href);
    url.searchParams.delete('script');

    // Показ уведомления
    if (typeof showBubbleNotification === 'function') {
      showBubbleNotification(notificationText);
    } else {
      alert(notificationText); // fallback
    }

    // Перезагрузка с задержкой
    setTimeout(() => {
      // Если URL изменился — идём по нему, иначе принудительно перезагружаем
      if (url.toString() !== window.location.href) {
        window.location.href = url.toString();
      } else {
        window.location.reload();
      }
    }, 1000);
  });
}
 


// Получаем все радиокнопки
var readerRadios = document.querySelectorAll('input[name="reader"]');

// Устанавливаем обработчики событий при изменении состояния радиокнопок
readerRadios.forEach(function(radio) {
    radio.addEventListener('change', function() {
        if (this.checked) {
            // Устанавливаем значение в localStorage
            localStorage.setItem("defaultReader", this.value);
        }
    });
});

// Проверяем значение в localStorage при загрузке страницы и устанавливаем состояние радиокнопок
var savedReader = localStorage.getItem("defaultReader");
if (savedReader) {
    document.querySelector('input[name="reader"][value="' + savedReader + '"]').checked = true;
}

// Сохраняем текущие значения параметров
const initialBaseUrl = getBaseUrl();
const initialDefaultReader = localStorage.defaultReader;

// Функция для получения текущего baseUrl
function getBaseUrl() {
    let baseUrl;
    if (window.location.href.includes('/ru') || (localStorage.siteLanguage && localStorage.siteLanguage === 'ru')) {
        baseUrl = window.location.origin + "/r/";
    } else {
        baseUrl = window.location.origin + "/read/";
    }

    if (localStorage.defaultReader === 'ml') {
        baseUrl = window.location.origin + "/ml/";
    } else if (localStorage.defaultReader === 'rv') {
        baseUrl = window.location.origin + "/rev/";
    } else if (localStorage.defaultReader === 'd') {
        baseUrl = window.location.origin + "/d/";
    } else if (localStorage.defaultReader === 'mem') {
        baseUrl = window.location.origin + "/memorize/";
    } else if (localStorage.defaultReader === 'fr') {
        baseUrl = window.location.origin + "/frev/";
    }

    return baseUrl;
}

// Функция для обновления URL
function updateUrl() {
    const currentBaseUrl = getBaseUrl();
    const url = new URL(window.location.href);

    // Извлекаем путь из currentBaseUrl
    const newPath = new URL(currentBaseUrl).pathname;

    // Обновляем путь в текущем URL
    url.pathname = newPath;

    // Сохраняем новый URL
    window.location.href = url.toString();
}
const initialRemovePunct = localStorage.getItem("removePunct");
// Функция для проверки изменений и обновления URL
function checkAndUpdateUrl() {
    const currentBaseUrl = getBaseUrl();
    const currentDefaultReader = localStorage.defaultReader;
    const currentRemovePunct = localStorage.getItem("removePunct"); // Новая проверка

    // Если параметры изменились, обновляем URL
    if (currentBaseUrl !== initialBaseUrl || 
        currentDefaultReader !== initialDefaultReader || 
        currentRemovePunct !== initialRemovePunct) { // Добавлено
        updateUrl();
    }
}

// end of default reader part

// open current url in demo mode

// Функция для извлечения параметров из URL
function getQueryParams() {
  const params = {};
  const queryString = window.location.search.substring(1);
  const pairs = queryString.split('&');
  pairs.forEach(pair => {
    const [key, value] = pair.split('=');
    if (key && value) {
      params[key] = value;
    }
  });
  return params;
}

// Функция для обновления ссылок
function updateDemoLinks() {
  const params = getQueryParams();
  const queryString = Object.keys(params).map(key => `${key}=${params[key]}`).join('&');
  const hash = window.location.hash;

  // Проверяем, есть ли цифры в параметре q
const hasNumbersInQ = params.q && (/\d/.test(params.q) || /(bupm|bu-pm|bipm|bi-pm)/.test(params.q));

if (!hasNumbersInQ && !window.location.pathname.match(/\/(ml|d|memorize|rev|frev)\//)) {
  return;
}

  // Определяем базовый URL в зависимости от языка
  let baseUrl;
  if (window.location.href.includes('/ru/') || window.location.href.includes('/r/') || (localStorage.siteLanguage && localStorage.siteLanguage === 'ru')) {
    baseUrl = window.location.origin + "/r/"; // Для русского языка
  } else if (window.location.href.includes('/th') || (localStorage.siteLanguage && localStorage.siteLanguage === 'th')) {
    baseUrl = window.location.origin + "/th/read/"; // Для тайского языка
  } else {
    baseUrl = window.location.origin + "/read/"; // Для других языков
  }

  // Ссылки для демо-режимов
  const demoLinks = {
    stDemo: baseUrl, // Используем baseUrl для stDemo
    mlDemo: window.location.origin + "/ml/",
    dDemo: window.location.origin + "/d/",
    memDemo: window.location.origin + "/memorize/",
    rvDemo: window.location.origin + "/rev/",
    frDemo: window.location.origin + "/frev/"
  };

  // Обновляем ссылки
  Object.keys(demoLinks).forEach(id => {
    const linkElement = document.getElementById(id);
    if (linkElement) {
      const baseUrl = demoLinks[id];
      const newUrl = `${baseUrl}?${queryString}${hash}`;
      linkElement.href = newUrl; // Обновляем атрибут href
    }
  });
}

// Вызываем функцию обновления ссылок при загрузке страницы
window.onload = updateDemoLinks;
  //end 


//remove punctuation checkbox
    document.querySelectorAll(".setting-checkbox").forEach(checkbox => {
        const key = checkbox.dataset.key; // Берём ключ из data-key
        checkbox.checked = localStorage.getItem(key) === "true";

        checkbox.addEventListener("change", () => {
            localStorage.setItem(key, checkbox.checked);
        });
    });



//end of DOMContentLoaded

});


//Горячие кнопки от 1 до Х

document.addEventListener("keydown", (event) => {
  if (event.altKey && event.code === "Digit1") { // Проверяем, что нажаты Alt и 7
    event.preventDefault();

    let currentUrl = window.location.href; // Получаем текущий URL
    let urlWithoutParams = currentUrl.split('?')[0]; // Удаляем всё после ?

    let newUrl;
    let defaultLanguage = localStorage.getItem('siteLanguage') || "en"; // Получаем язык из localStorage или используем "en" по умолчанию

    let defaultLanguageLinkPart;
        if (defaultLanguage === "ru") {
          defaultLanguageLinkPart = "/r/";
        } else if (defaultLanguage === "th") {
          defaultLanguageLinkPart = "/th/read/";
        } else {
          defaultLanguageLinkPart = "/read/";
        }


    // Проверяем, содержит ли URL /r/
    if (urlWithoutParams.endsWith("/r/")) {
      newUrl = urlWithoutParams.replace("/r/", "/read/"); // Меняем на /read/
    } else if (urlWithoutParams.endsWith("/th/read/")) {
      newUrl = urlWithoutParams.replace("/th/read/", defaultLanguageLinkPart); // Меняем на /read/
    } else if (urlWithoutParams.endsWith("/read/")) {
      newUrl = urlWithoutParams.replace("/read/", "/r/"); // Меняем на /r/
    } 
    else {
      // Если URL не содержит ни /r/, ни /read/, выбираем начальный вариант
      if (localStorage.siteLanguage && localStorage.siteLanguage === 'ru') {
        newUrl = window.location.origin + "/r/";
      } else {
        newUrl = window.location.origin + "/read/";
      }
    }


    // Добавляем параметры обратно, если они были
let params = currentUrl.split('?')[1] || '';
newUrl = params ? `${newUrl}?${params}` : `${newUrl}?q=sn56.11`;

    if (newUrl !== currentUrl) { // Проверяем, изменился ли URL
      history.pushState(null, "", newUrl); // Добавляем запись в историю
      location.href = newUrl; // Принудительно переходим по новому URL
      location.reload();
    }
  }
  
});


// Объект, связывающий цифры от 1 до 6 с id ссылок
const demoLinks = {
 // 1: "stDemo", // Alt + 1
  2: "mlDemo", // Alt + 2
  3: "dDemo",  // Alt + 3
  4: "memDemo", // Alt + 4
  5: "rvDemo", // Alt + 5
  6: "frDemo"  // Alt + 6
};

// Обработчик события нажатия клавиш
document.addEventListener("keydown", (event) => {
  // Проверяем, что нажата клавиша Alt и одна из цифр от 1 до 6
  if (event.altKey && event.code.startsWith("Digit")) {
              event.preventDefault();
    // Извлекаем цифру из event.code (например, "Digit1" -> 1)
    const digit = parseInt(event.code.replace("Digit", ""), 10);
    // Проверяем, что цифра находится в диапазоне от 1 до 6
    if (digit >= 2 && digit <= 6) {
      // Получаем id ссылки из объекта demoLinks
      const linkId = demoLinks[digit];

      // Находим ссылку по id
      const linkElement = document.getElementById(linkId);

      // Если ссылка найдена, имитируем клик
      if (linkElement) {
        linkElement.click(); // Программный клик по ссылке
      } else {
        console.error(`Ссылка с id "${linkId}" не найдена!`);
      }
    }
  }
});

document.addEventListener("keydown", (event) => {
  if (event.altKey && event.code === "Digit7") { // Проверяем, что нажаты Alt и 7
          event.preventDefault();
    let currentUrl = window.location.href; // Получаем текущий URL

    // Шаг 1: Удаляем всё после первого / (оставляем базовую часть)
    let base = currentUrl.split('/')[0] + '//' + currentUrl.split('/')[2];

    // Шаг 2: Удаляем всё перед ? (оставляем параметры, если они есть)
    let params = currentUrl.split('?')[1] || '';

    // Шаг 3: Собираем новый URL
    let newUrl = `${base}/th/read/${params ? `?${params}` : ''}`;

    if (newUrl !== currentUrl) { // Проверяем, изменился ли URL
      history.pushState(null, "", newUrl); // Добавляем запись в историю
      location.href = newUrl; // Принудительно переходим по новому URL
    }
  }
});

document.addEventListener("keydown", (event) => {
  if (event.altKey && event.code === "Digit8") { // Проверяем, что нажаты Alt и 7
            event.preventDefault();
    let currentUrl = window.location.href; // Получаем текущий URL

    // Шаг 1: Удаляем всё после первого / (оставляем базовую часть)
    let base = currentUrl.split('/')[0] + '//' + currentUrl.split('/')[2];

    // Шаг 2: Удаляем всё перед ? (оставляем параметры, если они есть)
    let params = currentUrl.split('?')[1] || '';

    // Шаг 3: Собираем новый URL
    let newUrl = `${base}/mlth/${params ? `?${params}` : ''}`;

    if (newUrl !== currentUrl) { // Проверяем, изменился ли URL
      history.pushState(null, "", newUrl); // Добавляем запись в историю
      location.href = newUrl; // Принудительно переходим по новому URL
    }
  }
});


document.addEventListener('keydown', function(event) {
  if (event.ctrlKey && event.code === 'Digit3') {
    event.preventDefault();

    const currentUrl = window.location.href;
    const currentParams = window.location.search; // включает всё после '?', включая '?'

    let targetUrl;

    if (currentUrl.includes('/ru/') || currentUrl.includes('/r/') || currentUrl.includes('/ml/')) {
      targetUrl = 'https://dict.dhamma.gift/ru/';
    } else {
      targetUrl = 'https://dict.dhamma.gift/';
    }

    // Добавляем параметры, если есть
    if (currentParams) {
      targetUrl += currentParams;
    }

    window.location.href = targetUrl;
  }
});

document.addEventListener("keydown", function (event) {
  const isCtrlPressed = event.ctrlKey || event.metaKey;
  const currentPath = window.location.pathname;
  const baseUrl = window.location.origin;

  const key = "preferredLanguage";
  const savedLang = localStorage.getItem(key);
  const isRuCurrent = currentPath.includes("/ru/") || currentPath.includes("/r/");

  // Функция: получить URL для заданного языка и страницы
  function makeUrl(lang, isHomepage) {
    if (isHomepage) {
      return lang === "ru" ? `${baseUrl}/ru/` : `${baseUrl}/`;
    } else {
      return lang === "ru" ? `${baseUrl}/ru/read.php` : `${baseUrl}/read.php`;
    }
  }

  // Функция: определить, нужно ли переключать язык или использовать сохранённый
  function determineTargetUrl(isHomepage) {
    const isCurrentTarget =
      (isHomepage && (currentPath === "/" || currentPath === "/ru/")) ||
      (!isHomepage && (currentPath === "/read.php" || currentPath === "/ru/read.php"));

    let nextLang;

    if (isCurrentTarget) {
      // Уже на целевой странице — делаем toggle
      nextLang = isRuCurrent ? "en" : "ru";
      localStorage.setItem(key, nextLang);
    } else {
      // С других страниц — просто используем сохранённое предпочтение
      nextLang = savedLang || (isRuCurrent ? "ru" : "en");
      if (!savedLang) localStorage.setItem(key, nextLang); // сохранить при первом запуске
    }

    return makeUrl(nextLang, isHomepage);
  }

  // === Ctrl + 1: Переход на домашнюю страницу ===
  if (isCtrlPressed && event.key === "1") {
    event.preventDefault();
    const targetUrl = determineTargetUrl(true);
    window.location.href = targetUrl;
  }

  // === Ctrl + 2: Переход на read.php ===
  if (isCtrlPressed && event.key === "2") {
    event.preventDefault();
    const targetUrl = determineTargetUrl(false);
    window.location.href = targetUrl;
  }
});

document.addEventListener("keydown", function (event) {
//  console.log("event.key:", event.key);
//  console.log("event.code:", event.code);
//  console.log("Ctrl:", event.ctrlKey, "Shift:", event.shiftKey);

  if (event.ctrlKey && event.shiftKey && event.code === "Digit1") {
    event.preventDefault();
    console.log("Сочетание Ctrl+Shift+1 поймано!");

    const url = new URL(window.location.href);
    let path = url.pathname;

    console.log("Текущий путь:", path);

    let newUrlStr;

    if (path.startsWith("/ru/")) {
      // Убираем /ru/
      path = path.replace("/ru/", "/");
      newUrlStr = url.origin + path + url.search + url.hash;
      console.log("Убираем /ru/, новый путь:", newUrlStr);
    } else {
      // Добавляем /ru/
      path = "/ru" + path;
      newUrlStr = url.origin + path + url.search + url.hash;
      console.log("Добавляем /ru/, новый путь:", newUrlStr);
    }

    console.log("Переходим по:", newUrlStr);
    window.location.href = newUrlStr;
  }
});

let quickModalIsOpen = false;
let quickOverlay = null;
let quickModal = null;

function createQuickModal() {
  let currentUrl = window.location.href;
  let urlWithoutParams = currentUrl.split('?')[0];
  let queryBase = urlWithoutParams.endsWith("/ru/") || urlWithoutParams.endsWith("/r/") 
    ? "/r/?q=" 
    : "/read/?q=";
  
  const isDark = document.body.classList.contains("dark");
  const bgColor = isDark ? "#1a252f" : "#ffffff";
  const textColor = isDark ? "#ffffff" : "#212529";
  const linkColorPrimary = "#859900";
  const linkColorSuccess = "#2aa198";
  const linkColorWarning = "#cb4b16";
  const linkColorDanger = "#dc322f";
  const formAction = window.location.pathname.match(/\/(ru|r)\//) ? '/ru/' : '/';

  // Оверлей
  quickOverlay = document.createElement("div");
  quickOverlay.className = "quick-overlay-element";
  quickOverlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 9999;
    background-color: rgba(0, 0, 0, 0.7);
    opacity: 0;
    transition: opacity 0.4s ease;
  `;

  // Модалка
  quickModal = document.createElement("div");
  quickModal.className = "quick-modal-container";
  quickModal.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) scale(0.95);
    z-index: 10000;
    opacity: 0;
    transition: opacity 0.4s ease, transform 0.4s ease;
    width: 95%;
    max-width: 600px;
    max-height: 90vh;
    overflow-y: auto;
  `;

  // Стили для мобильных устройств
  const styleTag = document.createElement("style");
  styleTag.textContent = `
    @media (max-width: 500px) {
      .quick-modal-container {
        top: 0 !important;
        left: 0 !important;
        transform: none !important;
        width: 100% !important;
        height: 100% !important;
        max-width: none !important;
        max-height: none !important;
        border-radius: 0 !important;
      }
      .quick-modal-content-wrapper {
        width: 100% !important;
        height: 100% !important;
        border-radius: 0 !important;
        padding: 1rem !important;
        overflow-y: auto; /* Добавлено для скролла внутри контента */
      }
      .quick-links-container {
        flex-direction: column !important;
        gap: 0.5rem !important;
      }
      .quick-links-column {
        flex: 1 1 100% !important;
        min-width: 100% !important;
      }
    }
  `;
  document.head.appendChild(styleTag);

  quickModal.innerHTML = `
    <div class="quick-modal-content-wrapper" style="
      background-color: ${bgColor};
      color: ${textColor};
      padding: 1.5rem;
      max-width: 600px;
      width: 100%;
      border-radius: 1rem;
      box-shadow: 0 8px 24px rgba(0,0,0,0.3);
      font-family: sans-serif;
      position: relative;
    ">
      <button id="quickCloseModalBtn" class="quick-close-button" style="
        position: absolute;
        top: 12px;
        right: 12px;
        background-color: #9e1c19;
        color: #fff;
        border: none;
        width: 28px;
        height: 28px;
        border-radius: 50%;
        font-size: 1.1rem;
        font-weight: bold;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
        box-shadow: 0 2px 6px rgba(0,0,0,0.2);
        z-index: 10;
      " title="(Esc)">×</button>

      <h5 class="quick-modal-title" style="
        text-align:center;
        margin-bottom: 1.2rem;
        color: #93a1a1;
        font-size: 1.2rem;
        font-weight: 600;
      ">Cattāri Ariyasaccāni</h5>

      <form id="quickSearchForm" action="${formAction}" method="GET" style="display: flex; gap: 8px; margin-bottom: 1.5rem; position: relative;">
          <input type="search" name="q" id="quickSearchInput" placeholder="e.g. Kāyagatā or sn56.11" autocomplete="off" style="
              flex-grow: 1;
              border: 1px solid ${isDark ? '#444' : '#ccc'};
              background-color: ${isDark ? '#2c3a47' : '#f8f9fa'};
              color: ${textColor};
              padding: 10px 14px;
              border-radius: 20px;
              font-size: 0.95rem;
              outline: none;
              transition: border-color 0.2s;
          ">
          <button type="submit" id="quickSearchBtn" style="
              background-color: #025242;
              color: white;
              border: none;
              width: 40px;
              height: 40px;
              border-radius: 50%;
              cursor: pointer;
              display: flex;
              align-items: center;
              justify-content: center;
              transition: background-color 0.2s;
              flex-shrink: 0;
          ">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          </button>
      </form>
      <div class="quick-links-container" style="display: flex; gap: 1.2rem; flex-wrap: wrap; justify-content: space-between;">
      <div class="quick-links-column" style="flex: 1 1 45%; min-width: 200px;">
        <p><strong>1st priority:</strong></p>
        <ul style="padding-left: 1rem; font-size: 0.9rem;">
          <li><a href="${queryBase}sn56.11" target="_blank" style="color: ${linkColorPrimary}; text-decoration: none;">SN 56.11</a></li>
          <li><a href="${queryBase}dn22" target="_blank" style="color: ${linkColorPrimary}; text-decoration: none;">DN 22</a></li>
          <li><a href="${queryBase}sn12.2" target="_blank" style="color: ${linkColorPrimary}; text-decoration: none;">SN 12.2</a></li>
        </ul>
      </div>

      <div class="quick-links-column" style="flex: 1 1 45%; min-width: 200px;">
        <p><strong>Clarify 5 khandha:</strong></p>
        <ul style="padding-left: 1rem; font-size: 0.9rem;">
          <li><a href="${queryBase}sn22.56" target="_blank" style="color: ${linkColorSuccess}; text-decoration: none;">SN 22.56</a></li>
          <li><a href="${queryBase}sn22.79" target="_blank" style="color: ${linkColorSuccess}; text-decoration: none;">SN 22.79</a></li>
          <li><a href="${queryBase}sn22.85" target="_blank" style="color: ${linkColorSuccess}; text-decoration: none;">SN 22.85</a></li>
          <li><a href="${queryBase}sn22" target="_blank" style="color: ${linkColorSuccess}; text-decoration: none;">SN 22</a></li>       
        </ul>
      </div>

      <div class="quick-links-column" style="flex: 1 1 45%; min-width: 200px;">
        <p><strong>Clarify 6 ajjhattāyatana:</strong></p>
        <ul style="padding-left: 1rem; font-size: 0.9rem;">
          <li><a href="${queryBase}sn35.228" target="_blank" style="color: ${linkColorWarning}; text-decoration: none;">SN 35.228</a></li>
          <li><a href="${queryBase}sn35.229" target="_blank" style="color: ${linkColorWarning}; text-decoration: none;">SN 35.229</a></li>
          <li><a href="${queryBase}sn35.236" target="_blank" style="color: ${linkColorWarning}; text-decoration: none;">SN 35.236</a></li>
          <li><a href="${queryBase}sn35.238" target="_blank" style="color: ${linkColorWarning}; text-decoration: none;">SN 35.238</a></li>
          <li><a href="${queryBase}sn35" target="_blank" style="color: ${linkColorWarning}; text-decoration: none;">SN 35</a></li>
        </ul>
      </div>

      <div class="quick-links-column" style="flex: 1 1 45%; min-width: 200px;">
        <p><strong>Clarify 4-6-X Dhātu:</strong></p>
        <ul style="padding-left: 1rem; font-size: 0.9rem;">
          <li><a href="${queryBase}mn28" target="_blank" style="color: ${linkColorDanger}; text-decoration: none;">MN 28</a></li>
          <li><a href="${queryBase}mn115" target="_blank" style="color: ${linkColorDanger}; text-decoration: none;">MN 115</a></li>
          <li><a href="${queryBase}mn140" target="_blank" style="color: ${linkColorDanger}; text-decoration: none;">MN 140</a></li>
          <li><a href="${queryBase}sn14" target="_blank" style="color: ${linkColorDanger}; text-decoration: none;">SN 14</a></li>
        </ul>
      </div>

      <div class="quick-links-column" style="flex: 1 1 45%; min-width: 200px;">
        <p><strong>Dukkaṁ so abhinandati:</strong></p>
        <ul style="padding-left: 1rem; font-size: 0.9rem;">
          <li><a href="${queryBase}sn14.35" target="_blank" style="color: ${linkColorPrimary}; text-decoration: none;">SN 14.35</a></li>
          <li><a href="${queryBase}sn22.29" target="_blank" style="color: ${linkColorPrimary}; text-decoration: none;">SN 22.29</a></li>
          <li><a href="${queryBase}sn35.19" target="_blank" style="color: ${linkColorPrimary}; text-decoration: none;">SN 35.19</a></li>
          <li><a href="${queryBase}sn35.20" target="_blank" style="color: ${linkColorPrimary}; text-decoration: none;">SN 35.20</a></li>
        </ul>
      </div>

      <div class="quick-links-column" style="flex: 1 1 45%; min-width: 200px;">
        <p><strong>Extra</strong></p>
        <ul style="padding-left: 1rem; font-size: 0.9rem;">
          <li><a href="${queryBase}an3.70" target="_blank" style="color: ${linkColorDanger}; text-decoration: none;">AN 3.70</a></li>
          <li><a href="${queryBase}an8.9" target="_blank" style="color: ${linkColorDanger}; text-decoration: none;">AN 8.9</a></li>
          <li><a href="${queryBase}an10.46" target="_blank" style="color: ${linkColorPrimary}; text-decoration: none;">AN 10.46</a></li>
          <li><a href="${queryBase}an10.176" target="_blank" style="color: ${linkColorPrimary}; text-decoration: none;">AN 10.176</a></li>
          <li><a href="${queryBase}snp3.2" target="_blank" style="color: ${linkColorPrimary}; text-decoration: none;">Snp 3.2</a></li>
          <li><a href="${queryBase}iti61" target="_blank" style="color: ${linkColorPrimary}; text-decoration: none;">Iti 61</a></li>
          <li><a href="${queryBase}an4.199" target="_blank" style="color: ${linkColorPrimary}; text-decoration: none;">an4.199</a></li>
        </ul>
      </div>
    </div>
  </div>
`;

  document.body.appendChild(quickOverlay);
  document.body.appendChild(quickModal);

  // Плавное появление
  requestAnimationFrame(() => {
    quickOverlay.style.opacity = "1";
    quickModal.style.opacity = "1";
    quickModal.style.transform = "translate(-50%, -50%) scale(1)";
    document.getElementById('quickSearchInput').focus(); // Auto-focus the new input
  });

  // Закрытие
  const closeQuickModal = () => {
    quickOverlay?.style && (quickOverlay.style.opacity = "0");
    quickModal?.style && (quickModal.style.opacity = "0");
    quickModal?.style && (quickModal.style.transform = "translate(-50%, -50%) scale(0.95)");

    setTimeout(() => {
      quickOverlay?.remove();
      quickModal?.remove();
      quickOverlay = null;
      quickModal = null;
      quickModalIsOpen = false;
    }, 300);
  };

  quickOverlay.addEventListener("click", (e) => e.target === quickOverlay && closeQuickModal());
  quickModal.querySelector("#quickCloseModalBtn").addEventListener("click", closeQuickModal);

  // ADDED: Event listener for the new search form
  const quickSearchForm = document.getElementById('quickSearchForm');
  const quickSearchInput = document.getElementById('quickSearchInput');
  
  quickSearchForm.addEventListener('submit', function(e) {
    if (!quickSearchInput.value.trim()) {
        e.preventDefault(); // Prevent submitting an empty form
        quickSearchInput.style.borderColor = '#dc322f';
    }
    // Form submission proceeds as normal if input is not empty
  });

  quickSearchInput.addEventListener('focus', () => {
      quickSearchInput.style.borderColor = '#859900';
  });
  quickSearchInput.addEventListener('blur', () => {
      quickSearchInput.style.borderColor = isDark ? '#444' : '#ccc';
  });

  // Удаляем старый скрипт, если он был добавлен ранее, чтобы избежать дублирования
  const existingScript = document.getElementById('autopali-modal-script');
  if (existingScript) {
    existingScript.remove();
  }

  // Создаем и добавляем новый тег script для модального окна
  const script = document.createElement('script');
  script.id = 'autopali-modal-script'; // Даем ID для возможности его удаления
  script.src = '/assets/js/autopali_modal.js?v=' + new Date().getTime(); // Добавляем параметр для обхода кэша
  document.body.appendChild(script);

}

function toggleQuickModal() {
  if (quickModalIsOpen) {
    const closeEvent = new Event('click');
    quickOverlay.dispatchEvent(closeEvent);
  } else {
    createQuickModal();
    quickModalIsOpen = true;
  }
}

/*
const openQuickModalBtn = document.createElement("button");
openQuickModalBtn.innerText = "≡"; // или иконку по желанию
openQuickModalBtn.setAttribute("aria-label", "Открыть окно Cattāri Ariyasaccāni");
openQuickModalBtn.style.cssText = `
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 10001;
  background-color: #859900;
  color: #fff;
  border: none;
  border-radius: 50%;
  width: 48px;
  height: 48px;
  font-size: 1.5rem;
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  cursor: pointer;
`;

openQuickModalBtn.addEventListener("click", toggleQuickModal);
document.body.appendChild(openQuickModalBtn);

if (!document.getElementById("openQuickModalBtn")) {
  const openQuickModalBtn = document.createElement("button");
  openQuickModalBtn.addEventListener("click", toggleQuickModal);
}

<button onclick="toggleQuickModal()" aria-label="Открыть Cattāri Ariyasaccāni" style="
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 10001;
  background-color: #859900;
  color: #fff;
  border: none;
  border-radius: 50%;
  width: 48px;
  height: 48px;
  font-size: 1.5rem;
  font-weight: bold;
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  cursor: pointer;
">
  ≡
</button>
*/