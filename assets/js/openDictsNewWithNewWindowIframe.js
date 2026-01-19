const path = window.location.pathname;
const isRussianOrML = /^\/(r|ru|ml)\//.test(path);

// Глобальный объект со всеми словарями
const DICTIONARIES = {
  'PTS': {
    name: 'PTS',
    method: 'GET',
    base: 'https://dsal.uchicago.edu/cgi-bin/app/pali_query.py?matchtype=default&qs=',
    fallback: 'https://dsal.uchicago.edu/dictionaries/pali/',
    iframe: true
  },
  'Gandhari': {
    name: 'Gandhari',
    method: 'GET',
    base: 'https://gandhari.org/dictionary?section=dop&search=',
    fallback: 'https://gandhari.org/dop',
    iframe: true
  },
  'DPD': {
    name: 'DPD',
    method: 'GET',
    base: 'https://dict.dhamma.gift/?silent&source=pwa&q=',
    fallback: 'https://dict.dhamma.gift/?source=pwa',
    iframe: true
  },
  'DPR': {
    name: 'DPR',
    method: 'GET',
    base: 'https://www.digitalpalireader.online/_dprhtml/index.html?frombox=1&analysis=',
    fallback: 'https://www.digitalpalireader.online/_dprhtml/index.html',
    iframe: false
  },
  'CPD': {
    name: 'CPD',
    method: 'GET',
    base: 'https://cpd.uni-koeln.de/search?query=',
    fallback: 'https://cpd.uni-koeln.de/search',
    iframe: true
  },
  'Glosbe': {
    name: 'Glosbe',
    method: 'GET',
    base: 'https://glosbe.com/pi/sa/',
    fallback: 'https://glosbe.com/pi/sa/',
    iframe: false
  },
  'MWScan': {
    name: 'MWScan',
    method: 'GET',
    base: 'https://www.sanskrit-lexicon.uni-koeln.de/scans/MWScan/2020/web/webtc/indexcaller.php?transLit=roman&key=',
    fallback: 'https://www.sanskrit-lexicon.uni-koeln.de/scans/MWScan/2020/web/index.php',
    iframe: false
  },
  'APScan': {
    name: 'APScan',
    method: 'GET',
    base: 'https://www.sanskrit-lexicon.uni-koeln.de/scans/APScan/2020/web/webtc/indexcaller.php?transLit=roman&key=',
    fallback: 'https://www.sanskrit-lexicon.uni-koeln.de/scans/APScan/2020/web/index.php',
    iframe: false
  },
  'MDScan': {
    name: 'MDScan',
    method: 'GET',
    base: 'https://www.sanskrit-lexicon.uni-koeln.de/scans/MDScan/2020/web/webtc/indexcaller.php?transLit=roman&key=',
    fallback: 'https://www.sanskrit-lexicon.uni-koeln.de/scans/MDScan/2020/web/index.php',
    iframe: false
  },
  'SHSScan': {
    name: 'SHSScan',
    method: 'GET',
    base: 'https://www.sanskrit-lexicon.uni-koeln.de/scans/SHSScan/2020/web/webtc/indexcaller.php?transLit=roman&key=',
    fallback: 'https://www.sanskrit-lexicon.uni-koeln.de/scans/SHSScan/2020/web/index.php',
    iframe: false
  },
  'Wisdomlib': {
    name: 'Wisdomlib',
    method: 'GET',
    base: 'https://www.wisdomlib.org/index.php?type=search&division=glossary&item=&mode=text&input=',
    fallback: 'https://www.wisdomlib.org/',
    iframe: true
  }
};

/*
,
  'SkrDict': {
    name: 'SkrDict',
    method: 'GET',
    base: 'https://sanskritdictionary.com/?iencoding=iast&q=',
    fallback: 'https://sanskritdictionary.com/',
    iframe: false
  },
  'Learnskr': {
    name: 'Learnskr',
    method: 'GET',
    base: 'https://www.learnsanskrit.cc/translate?dir=au&search=',
    fallback: 'https://www.learnsanskrit.cc/',
    iframe: false
  }
*/

// Функция для получения настроек окна
function getWindowSettings() {
  const newWindowWidth = 500;
  const newWindowHeight = 500;
  const screenWidth = window.screen.availWidth;
  const screenHeight = window.screen.availHeight;
  const newWindowleft = screenWidth - newWindowWidth - 30;
  const newWindowTop = screenHeight - newWindowHeight - 50;
  
  return {
    width: newWindowWidth,
    height: newWindowHeight,
    left: newWindowleft,
    top: newWindowTop,
    features: `width=${newWindowWidth},height=${newWindowHeight},left=${newWindowleft},top=${newWindowTop},scrollbars=yes,resizable=yes`
  };
}



// Функция для открытия или переиспользования окна
function openOrFocusWindow(url, windowName) {
  const settings = getWindowSettings();
  let win = window.open('', windowName, settings.features);
  
  if (win && !win.closed) {
    win.location.href = url;
  } else {
    win = window.open(url, windowName, settings.features);
  }
  
  win.focus();
  return win;
}

// Основная функция для открытия группы словарей
function openDictionariesGroup(event, dictNames) {
  event.preventDefault();
  
  // Получаем запрос
  const query = document.getElementById('paliauto')?.value.trim().toLowerCase().replace(/ṁ/g, 'ṃ') || '';
  
  // Получаем объекты словарей по именам
  const dictionaries = dictNames.map(name => DICTIONARIES[name]).filter(Boolean);
  
  // Разделяем словари на iframe и non-iframe
  const iframeDicts = dictionaries.filter(d => d.iframe);
  const nonIframeDicts = dictionaries.filter(d => !d.iframe);
  
  // Открываем non-iframe словари в отдельных вкладках
  nonIframeDicts.forEach(dict => {
    const url = query ? dict.base + encodeURIComponent(query) : dict.fallback;
    window.open(url, '_blank');
  });
  


  // Обрабатываем iframe словари
  if (iframeDicts.length === 1) {
    // Если только один iframe словарь - открываем в новом окне без вкладок
    const dict = iframeDicts[0];
    const url = query ? dict.base + encodeURIComponent(query) : dict.fallback;
    openOrFocusWindow(url, 'dictWindow');
  } else if (iframeDicts.length > 1) {
    // Если несколько iframe словарей - открываем окно с вкладками
    openMultiIframeWindow(iframeDicts, query);
  }
}

// Функция для открытия окна с несколькими вкладками iframe
function openMultiIframeWindow(dictionaries, query) {
  const settings = getWindowSettings();
  
  // Пытаемся получить ссылку на существующее окно
  let win = window.open('', 'multiDict', settings.features);
  
  // Если окно уже было открыто и не закрыто, просто фокусируем его
  if (win && !win.closed) {
    // Очищаем содержимое окна перед записью нового
    win.document.write('');
    win.document.close();
  } else {
    // Если окно было закрыто или не существовало, открываем новое
    win = window.open('', 'multiDict', settings.features);
  }


  // Генерируем HTML для окна
  const htmlContent = `
    <html>
    <head>
      <title>Dictionaries</title>
      <style>
        body { font-family: sans-serif; margin: 0; padding: 0; }
        .tabs { display: flex; background: #333; color: white; }
        .tabs button {
          flex: 1;
          padding: 8px;
          border: none;
          background: #333;
          color: white;
          cursor: pointer;
          font-size: 13px;
        }
        .tabs button:hover { background: #555; }
        .tab-content { display: none; width: 100%; height: calc(100vh - 35px); }
        .tab-content.active { display: block; }
        iframe { width: 100%; height: 100%; border: none; }
      </style>
    </head>
    <body>
      <div class="tabs">
        ${dictionaries.map((d, i) => `<button onclick="showTab(${i})">${d.name}</button>`).join('')}
      </div>
      ${dictionaries.map((d, i) => {
        const url = query ? d.base + encodeURIComponent(query) : d.fallback;
        return `<div class="tab-content${i === 0 ? ' active' : ''}"><iframe src="${url}"></iframe></div>`;
      }).join('')}
      <script>
        function showTab(index) {
          document.querySelectorAll('.tab-content').forEach((tab, i) => {
            tab.classList.toggle('active', i === index);
          });
        }
      </script>
    </body>
    </html>
  `;
  
  // Записываем содержимое в окно
  win.document.write(htmlContent);
  win.document.close();
  win.focus();
}

// Функция для открытия одного словаря
function openWithQuery(event, dictName) {
  openDictionariesGroup(event, [dictName]);
}

// Функция для открытия нескольких словарей
function openWithQueryMulti(event, dictNames) {
    // Копируем в буфер обмена
  if (query) {

    const message = isRussianOrML 
    ? `Copied to clipboard`
    : `Скопировано`;

    showBubbleNotification(message);
    navigator.clipboard.writeText(query).catch(err => {
      console.warn('Clipboard copy failed:', err);
    });
  }
  openDictionariesGroup(event, dictNames);
}

// Функция для открытия всех словарей
function openDictionaries(event) {
  const numDicts = Object.keys(DICTIONARIES).length;
  
  const confirmMessage = isRussianOrML 
    ? `Будет открыто ${numDicts} вкладок. Продолжить?`
    : `This will open ${numDicts} tabs. Do you want to proceed?`;
  
  if (window.confirm(confirmMessage)) {
    openDictionariesGroup(event, Object.keys(DICTIONARIES));
  }
}

// Функция для открытия ссылки с возможностью управления окном
function openWithQueryLink(event, base = 'https://www.aksharamukha.com/converter?target=Devanagari&text={{q}}', options = {}) {
  // Получаем запрос
  const queryInput = document.getElementById('paliauto');
  const query = queryInput?.value.trim().toLowerCase().replace(/ṁ/g, 'ṃ') || '';
  
  // Формируем URL
  const url = base.replace('{{q}}', encodeURIComponent(query));
  const el = event.currentTarget;

  // Если указан флаг newWindow, открываем в новом окне с нашими параметрами
  if (options.newWindow) {
    event.preventDefault();
    const settings = getWindowSettings();
    openOrFocusWindow(url, 'linkWindow', settings.features);
    return false;
  }

  // Стандартное поведение (использует target из ссылки)
  el.href = url;
  return true;
}