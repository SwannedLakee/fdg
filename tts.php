<?php
// Параметры запроса 
// allow pasting
// speechSynthesis.getVoices();
// http://localhost/tts.php?q=sn1.1&script=lat&debugVoices

$slug = strtolower($_GET['q'] ?? '');
$type = $_GET['type'] ?? 'pali'; // 'pali' или 'trn' (translation)

// Определяем язык по URL (новая логика)
$is_ru_url = (strpos($_SERVER['REQUEST_URI'], '/ru/') !== false) || 
             (strpos($_SERVER['REQUEST_URI'], '/r/') !== false) || 
             (strpos($_SERVER['REQUEST_URI'], '/ml/') !== false);

// Совмещаем старую и новую логику определения языка
if ($type === 'pali') {
    $lang = 'pi';
    $content_type = 'pali';
    $title_lang = 'Pali';
} elseif ($type === 'trn') {
    $lang = $is_ru_url ? 'ru' : 'en';
    $content_type = $is_ru_url ? 'ru' : 'en';
    $title_lang = $is_ru_url ? 'Russian' : 'English';
} else {
    // Старая логика по умолчанию (для обратной совместимости)
    $lang = 'ru';
    $content_type = 'ru';
    $title_lang = 'Translation';
}

// Заголовок страницы (сохраняем старый формат)
$title = htmlspecialchars(
    $slug
    ? ucfirst(str_replace(['-', '_'], ' ', $slug)) . ' (' .
      ($type === 'pali' ? 'Pali' : ($title_lang)) . ')'
    : 'TTS Page'
);

// Загрузка контента по slug (обновленная версия)
function loadContent($slug, $type) {
    include_once('config/config.php');
    
    $jq = 'jq -r \'to_entries[] | "<a id=\"\(.key)\"></a><span>\(.value)</span>"\' | sed "s/' . $slug . '://"';

    if (!in_array($type, ['pali', 'ru', 'en'])) {
        if ($type === 'trn') {
            return ['content' => "Это перевод для: $slug", 'file' => '', 'translator' => ''];
        }
        return ['content' => ($type === 'pali' ? "Это палийский текст для: $slug" : "Контент для: $slug"), 'file' => '', 'translator' => ''];
    }

    if ($type === 'pali') {
        $script = $_GET['script'] ?? 'dev';

        if ($script === 'lat') {
            $cmd = "find $basedir/suttacentral.net/sc-data/sc_bilara_data/root/pli/ms/ -name \"{$slug}_*\" -print -quit";
        } else {
            $cmd = "find $basedir/assets/texts/devanagari/root/pli/ms/ -name \"{$slug}_*\" -print -quit";
        }

        $file = shell_exec($cmd);
        $file = is_string($file) ? trim($file) : '';

        if (!$file) {
            return ['content' => "Pali text not found for: $slug", 'file' => '', 'translator' => ''];
        }

        $content = shell_exec("cat " . escapeshellarg($file) . " | $jq");

        // Обработка пунктуации
        if ($content && $type === 'pali') {
            $content = preg_replace_callback(
                '/(<a\b[^>]*>.*?<\/a>)|([-—–:;“”‘’",\'.?!])/u',
                function($matches) {
                    if (!empty($matches[1])) {
                        return $matches[1];
                    }
                    if (preg_match('/[.?!]/u', $matches[2])) {
                        return ' | ';
                    } elseif (preg_match('/[-—–]/u', $matches[2])) {
                        return ' ';
                    } else {
                        return '';
                    }
                },
                $content
            );
        }

        // Вычисляем translator из имени файла
        $basename = basename($file, '.json');
        $parts = explode('-', $basename);
        $translator = end($parts);

        return ['content' => $content, 'file' => $file, 'translator' => $translator];
    }
    elseif ($type === 'ru') {
        $cmd = "find $basedir/assets/texts/sutta ../assets/texts/vinaya -name \"{$slug}_*\" -print -quit";
        $file = trim(shell_exec($cmd));
        if (!$file) {
            return ['content' => "Russian translation not found for: $slug", 'file' => '', 'translator' => ''];
        }
        $content = shell_exec("cat " . escapeshellarg($file) . " | $jq");

        $basename = basename($file, '.json');
        $parts = explode('-', $basename);
        $translator = end($parts);

        return ['content' => $content, 'file' => $file, 'translator' => $translator];
    }
    else { // en
        $cmd = "find $basedir/suttacentral.net/sc-data/sc_bilara_data/translation/en/ -name \"{$slug}_*\" -print -quit";
        $file = trim(shell_exec($cmd));
        if (!$file) {
            return ['content' => "English translation not found for: $slug", 'file' => '', 'translator' => ''];
        }
        $content = shell_exec("cat " . escapeshellarg($file) . " | $jq");

        $basename = basename($file, '.json');
        $parts = explode('-', $basename);
        $translator = end($parts);

        return ['content' => $content, 'file' => $file, 'translator' => $translator];
    }
}

if ($slug) {
    $result = loadContent($slug, $content_type);
    $content = $result['content'];
    $translator = $result['translator'] ?: '';
} else {
    $content = htmlspecialchars($_POST['content'] ?? '');
    $translator = '';
}

// Формируем подпись
if ($lang === 'pi') {
    $sourceInfo = 'महासङ्गीति पाळि';

    $script = $_GET['script'] ?? 'dev';

        if ($script === 'lat') {
            $sourceInfo = 'Mahāsaṅgīti Pāḷi';
        } 
} else {
    $sourceInfo = $lang === 'ru' ? "Перевод: $translator" : "Translator: $translator";
}


// Если передан slug, загружаем контент автоматически
//$content = $slug ? loadContent($slug, $content_type) : htmlspecialchars($_POST['content'] ?? '');
?>
<!DOCTYPE html>
<html lang="<?= $lang ?>">
<head>
  <meta charset="UTF-8">
  <link rel="icon" type="image/png" sizes="32x32" href="https://dhamma.gift/assets/img/favico_black.png">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="/assets/css/bootstrap.5.3.1.min.css" rel="stylesheet" />
 <link href="/assets/css/styles.css" rel="stylesheet" />

  <link href="/assets/css/extrastyles.css" rel="stylesheet" />
  <link href="/assets/css/pages.css" rel="stylesheet" />
<link rel="stylesheet" href="/assets/css/jquery-ui.min.css">
<!-- -->
<link href="/assets/css/paliLookup.css" rel="stylesheet" />

<script src="/assets/js/jquery-3.7.0.min.js"></script>
<script src="/assets/js/jquery-ui.min.js"></script>
  <title><?= $title ?></title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.6;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      color: #333;
    }
    .text-content {
      white-space: pre-line;
      text-align: justify;
    }
  </style>
</head>
<body>
    <script>
function updateUrl(lang) {
    const currentUrl = new URL(window.location.href);
    const pathParts = currentUrl.pathname.split('/');
    const slug = currentUrl.searchParams.get('q') || '';
    
    // Очищаем путь от языковых префиксов
    let newPath = pathParts.filter(part => !['ru', 'r', 'ml', 'en'].includes(part)).join('/');
    
    // Добавляем нужный языковой префикс
    if (lang === 'ru') {
        newPath = newPath.replace(/^\//, '/ru/');
    } else if (lang === 'en') {
        newPath = newPath.replace(/^\/(ru|r|ml)\//, '/');
    }
    // Для pi не меняем путь
    
    // Обновляем параметры type
    currentUrl.searchParams.delete('type');
    if (lang === 'pi') {
        //currentUrl.searchParams.set('type', 'pali');
    } else {
        currentUrl.searchParams.set('type', 'trn');
    }
    
    // Собираем новый URL
    currentUrl.pathname = newPath;
    return currentUrl.toString();
}

function setLanguage(lang) {
    history.pushState({}, '', updateUrl(lang));
    location.reload(); // теперь безопасно
}

function togglePaliScript() {
    const current = localStorage.getItem('paliScript') || 'dev';
    const next = current === 'dev' ? 'lat' : 'dev';
    localStorage.setItem('paliScript', next);

    const url = new URL(window.location.href);
    if (next === 'dev') {
        url.searchParams.delete('script');
    } else {
        url.searchParams.set('script', 'lat');
    }

    window.location.href = url.toString();
}

function updateLanguageSwitcher(lang) {
    const switcher = document.querySelector('.lang-switcher');

    if (lang === 'ru') {
        switcher.innerHTML = `
             <a class="btn btn-sm btn-outline-secondary rounded-pill text-decoration-none " href="#" title="Devanagari / Roman Script" onclick="setLanguage('pi'); return false;">pi</a>
            <a class="btn btn-sm btn-outline-secondary rounded-pill text-decoration-none ms-1" title="English" href="#" onclick="setLanguage('en'); return false;">en</a>
            <a class="btn btn-sm btn-primary rounded-pill btn-outline-secondary active ms-1" title="Russian">ru</a>
        `;
    } 
    
    else if (lang === 'pi') {
        switcher.innerHTML = `
       <!-- <span class="btn btn-sm btn-primary rounded-pill ms-1">pi</span> -->
            <a class="btn btn-sm btn-primary rounded-pill btn-outline-secondary active" href="#" onclick="togglePaliScript(); return false;" title="Devanagari / Roman Script">pi</a>
            <a class="btn btn-sm btn-outline-secondary rounded-pill text-decoration-none ms-1" href="#" onclick="setLanguage('en'); return false;" title="English">en</a>
            <a class="btn btn-sm btn-outline-secondary rounded-pill text-decoration-none ms-1" href="#" onclick="setLanguage('ru'); return false;" title="Russian">ru</a>
        `;
    }
    else {
        switcher.innerHTML = `
            <a class="btn btn-sm btn-outline-secondary rounded-pill text-decoration-none " href="#" onclick="setLanguage('pi'); return false;" title="Devanagari / Roman Script">pi</a> 
            <span class="btn btn-sm btn-primary rounded-pill btn-outline-secondary active ms-1" title="English">en</span>
            <a class="btn btn-sm btn-outline-secondary rounded-pill text-decoration-none ms-1" href="#" onclick="setLanguage('ru'); return false;" title="Russian">ru</a>
        `;
    }
}

function detectLanguage() {
    const urlParams = new URLSearchParams(window.location.search);
    const type = urlParams.get('type');

    if (type === 'pali' || type === null) return 'pi'; // ← ключевой момент

    const currentUrl = window.location.pathname.toLowerCase();
    if (currentUrl.includes('/ru/') || currentUrl.includes('/r/') || currentUrl.includes('/ml/')) return 'ru';
    if (currentUrl.includes('/en/')) return 'en';

    return 'en';
}

const lang = '<?= $lang ?>'; // ← передаём PHP переменную

function updateLinks(lang) {
    const readLink = document.getElementById('readLink');
    const homeLink = document.getElementById('homeLink');

    if (lang === 'ru') {
        readLink.href = '/ru/read.php';
        homeLink.href = '/ru';
    } else if (lang === 'en') {
        readLink.href = '/read.php';
        homeLink.href = '/';
    }
    // Если pi — не менять ссылки
}

document.addEventListener('DOMContentLoaded', function() {
    updateLanguageSwitcher(detectLanguage());
    updateLinks(lang); // ← теперь lang определён

    document.getElementById('darkSwitch').addEventListener('change', function() {
        document.body.classList.toggle('dark-mode');
    });
});

</script>
<div class="container mt-3">
  <div class="d-flex flex-wrap align-items-center justify-content-between">

    <!-- Nav (order 1 всегда) -->
    <div class="d-flex align-items-center order-1 mb-2 mb-sm-0">
      <a id="readLink" href="/ru/read.php" title="Sutta and Vinaya reading" rel="noreferrer" class="me-1">
        <svg fill="#979797" xmlns="http://www.w3.org/2000/svg" height="26px" viewBox="0 0 547.596 547.596" stroke="#979797">
          <g><path d="M540.76,254.788L294.506,38.216c-11.475-10.098-30.064-10.098-41.386,0L6.943,254.788 c-11.475,10.098-8.415,18.284,6.885,18.284h75.964v221.773c0,12.087,9.945,22.108,22.108,22.108h92.947V371.067 c0-12.087,9.945-22.108,22.109-22.108h93.865c12.239,0,22.108,9.792,22.108,22.108v145.886h92.947 c12.24,0,22.108-9.945,22.108-22.108v-221.85h75.965C549.021,272.995,552.081,264.886,540.76,254.788z"></path></g>
        </svg>
      </a>

      <a id="homeLink" href="/ru" title="Sutta and Vinaya search" rel="noreferrer" class="me-1">
        <img width="24px" alt="dhamma.gift icon" class="me-1" src="/assets/img/gray-white.png">
      </a>

    <!-- Dictionary OnClick Popup -->
    <a alt="Onclick popup dictionary" title="Onclick popup dictionary (Alt+A)" class="toggle-dict-btn text-decoration-none text-black me-1">
      <img src="/assets/svg/comment.svg" class="dictIcon">
    </a>

<a href="#" 
   onclick="toggleSpeech('voiceTextContent'); return false;" 
   class="text-decoration-none text-black me-1" 
   id="speechToggleBtn">
  🔊
</a>

      <div class="ms-1 form-check form-switch">
        <input type="checkbox" class="form-check-input" id="darkSwitch">
      </div>
      <a href="/assets/common/ttsHelp.html" class="text-decoration-none text-muted ms-2">?</a>
    </div>

    <!-- Lang (order 2 на моб, order 3 на десктопе) -->
    <div class="d-inline-flex align-items-center lang-switcher order-2 order-sm-3 mb-2 mb-sm-0">
              <a class="btn btn-sm btn-outline-secondary rounded-pill text-decoration-none" href="#" onclick="setLanguage('pi'); return false;">pi</a>
      <span class="btn btn-sm btn-primary rounded-pill ms-1">en</span>
      <a class="btn btn-sm btn-outline-secondary rounded-pill text-decoration-none ms-1" href="#" onclick="setLanguage('ru'); return false;">ru</a>

    </div>

    <!-- Form (order 3 на моб, order 2 на десктопе) -->
<form id="slugForm" class="d-flex align-items-center flex-nowrap order-3 order-sm-2 mx-auto flex-grow-0" onsubmit="return goToSlug();" style="min-width: 140px; max-width: 250px;">
  <input type="search" class="form-control form-control-sm rounded-pill me-1 flex-grow-1" 
         id="paliauto" name="q" value="<?= htmlspecialchars($slug) ?>" 
         placeholder="e.g. an3.76" style="min-width: 100px;" autofocus>
  <button type="submit" class="btn btn-sm btn-outline-secondary rounded-circle p-1 flex-shrink-0">
    Go
  </button>
</form>


  </div>
</div>

<div class="text-end text-muted small mt-2">
  <?= htmlspecialchars($sourceInfo) ?>
</div>
<div class="text-content mt-3 pli-lang" id="voiceTextContent" lang="pi"><?= $content ?></div>

<!-- htmlspecialchars($content) -->
  <script src="/assets/js/dark-mode-switch/dark-mode-switch.js"></script>

  <script>
    function goToSlug() {
    const slug = document.getElementById('paliauto').value.trim();
    if (!slug) return false;

    const lang = detectLanguage();
    const url = new URL(window.location.href);

    // Обновляем параметры запроса
    url.searchParams.set('q', slug);

    if (lang === 'pi') {
        url.searchParams.set('type', 'pali');
    } else {
        url.searchParams.set('type', 'trn');
    }

    // Обновляем URL
    window.location.href = url.toString();
    return false; // не отправлять форму
}

  </script>
<script>
// Глобальные переменные для управления воспроизведением
let isSpeaking = false;
let isPaused = false;
let currentUtterance = null;
let pausedPosition = 0;

const pageLogger = {
  logs: [],
  maxLogs: 50,
  container: null,
  
  init: function(showByDefault = false) {
    // Создаем контейнер для логов
    this.container = document.createElement('div');
    this.container.id = 'pageLoggerContainer';
    this.container.style.position = 'fixed';
    this.container.style.bottom = '10px';
    this.container.style.left = '10px';
    this.container.style.right = '10px';
    this.container.style.maxHeight = '30vh';
    this.container.style.overflow = 'auto';
    this.container.style.zIndex = '9998';
    this.container.style.backgroundColor = 'var(--bs-body-bg)';
    this.container.style.color = 'var(--bs-body-color)';
    this.container.style.border = '1px solid var(--bs-border-color)';
    this.container.style.borderRadius = '5px';
    this.container.style.padding = '10px';
    this.container.style.fontFamily = 'monospace';
    this.container.style.fontSize = '12px';
    this.container.style.boxShadow = '0 0 10px rgba(0,0,0,0.2)';
    this.container.style.display = showByDefault ? 'block' : 'none';
    
    // Кнопка закрытия (вверху справа)
    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '×';
    closeBtn.style.position = 'absolute';
    closeBtn.style.top = '5px';
    closeBtn.style.right = '5px';
    closeBtn.style.background = 'transparent';
    closeBtn.style.border = 'none';
    closeBtn.style.color = 'var(--bs-body-color)';
    closeBtn.style.cursor = 'pointer';
    closeBtn.style.fontSize = '16px';
    closeBtn.style.fontWeight = 'bold';
    closeBtn.style.zIndex = '10000';
    closeBtn.onclick = () => {
      this.container.style.display = 'none';
      const toggleBtn = document.getElementById('loggerToggleBtn');
      if (toggleBtn) toggleBtn.textContent = '📜';
    };
    
    // Кнопка управления логгером (только если debugVoices в URL)
    if (new URLSearchParams(window.location.search).has('debugVoices')) {
      const toggleBtn = document.createElement('button');
      toggleBtn.id = 'loggerToggleBtn';
      toggleBtn.textContent = this.container.style.display === 'none' ? '📜' : '✕';
      toggleBtn.style.position = 'fixed';
      toggleBtn.style.bottom = '10px';
      toggleBtn.style.right = '10px';
      toggleBtn.style.zIndex = '9999';
      toggleBtn.style.width = '36px';
      toggleBtn.style.height = '36px';
      toggleBtn.style.borderRadius = '50%';
      toggleBtn.style.border = '1px solid var(--bs-border-color)';
      toggleBtn.style.backgroundColor = 'var(--bs-body-bg)';
      toggleBtn.style.color = 'var(--bs-body-color)';
      toggleBtn.style.cursor = 'pointer';
      toggleBtn.style.display = 'flex';
      toggleBtn.style.alignItems = 'center';
      toggleBtn.style.justifyContent = 'center';
      toggleBtn.style.fontSize = '16px';
      
      toggleBtn.addEventListener('click', () => {
        if (this.container.style.display === 'none') {
          this.container.style.display = 'block';
          toggleBtn.textContent = '✕';
        } else {
          this.container.style.display = 'none';
          toggleBtn.textContent = '📜';
        }
      });
      
      document.body.appendChild(toggleBtn);
    }
    
    this.container.appendChild(closeBtn);
    document.body.appendChild(this.container);
    
    // Перехватываем console.log
    const originalConsoleLog = console.log;
    console.log = (...args) => {
      this.addLog('log', ...args);
      originalConsoleLog.apply(console, args);
    };
    
    // Перехватываем console.error
    const originalConsoleError = console.error;
    console.error = (...args) => {
      this.addLog('error', ...args);
      originalConsoleError.apply(console, args);
    };
    
    // Перехватываем console.warn
    const originalConsoleWarn = console.warn;
    console.warn = (...args) => {
      this.addLog('warn', ...args);
      originalConsoleWarn.apply(console, args);
    };
  },
  
  addLog: function(type, ...args) {
    const logEntry = {
      type,
      timestamp: new Date().toISOString().substr(11, 12),
      messages: args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      )
    };
    
    this.logs.push(logEntry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }
    
    this.updateView();
  },
  
  updateView: function() {
    if (!this.container) return;
    
    this.container.innerHTML = this.logs.map(log => {
      const color = {
        log: 'inherit',
        warn: 'orange',
        error: 'red'
      }[log.type];
      
      return `
        <div style="margin-bottom: 5px; border-bottom: 1px solid var(--bs-border-color); padding-bottom: 5px;">
          <span style="color: ${color}; font-weight: bold;">${log.type.toUpperCase()}</span>
          <span style="color: #666; margin-left: 5px;">${log.timestamp}</span>
          <div style="white-space: pre-wrap; word-break: break-word;">${log.messages.join(' ')}</div>
        </div>
      `;
    }).join('');
    
    // Автоскролл к новым сообщениям
    this.container.scrollTop = this.container.scrollHeight;
  }
};

// Инициализируем логгер при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
  const showByDefault = new URLSearchParams(window.location.search).has('debugVoices');
  pageLogger.init(showByDefault);
  
  if (showByDefault) {
    console.log('Логгер инициализирован. Все console.log будут отображаться здесь.');
  }
});

// Функция для отображения доступных голосов в консоли и на странице
function debugVoices() {
  const voices = window.speechSynthesis.getVoices();
  
  // Выводим в логгер
  console.log('Доступные голоса:', voices.map(v => ({
    name: v.name,
    lang: v.lang,
    default: v.default,
    local: v.localService
  })));
  
  // Показываем логгер, если он скрыт
  if (pageLogger.container.style.display === 'none') {
    pageLogger.container.style.display = 'block';
    const toggleBtn = document.getElementById('loggerToggleBtn');
    if (toggleBtn) toggleBtn.textContent = '✕';
  }
  
  // Определяем текущую тему
  const isDarkMode = document.body.classList.contains('dark-mode') || 
                     document.body.getAttribute('data-theme') === 'dark';
  
  // Удаляем предыдущий debugDiv если он есть
  const oldDebug = document.querySelector('#voiceDebugContainer');
  if (oldDebug) oldDebug.remove();
  
  // Создаем основной контейнер
  const debugContainer = document.createElement('div');
  debugContainer.id = 'voiceDebugContainer';
  debugContainer.style.position = 'fixed';
  debugContainer.style.top = '10px';
  debugContainer.style.right = '10px';
  debugContainer.style.zIndex = '9999';
  debugContainer.style.width = '350px';
  debugContainer.style.maxWidth = '90vw';
  
  // Создаем кнопку закрытия (фиксированную в правом верхнем углу контейнера)
  const closeBtn = document.createElement('button');
  closeBtn.innerHTML = '×';
  closeBtn.style.position = 'absolute';
  closeBtn.style.top = '5px';
  closeBtn.style.right = '5px';
  closeBtn.style.background = isDarkMode ? '#333' : '#fff';
  closeBtn.style.border = 'none';
  closeBtn.style.borderRadius = '50%';
  closeBtn.style.width = '24px';
  closeBtn.style.height = '24px';
  closeBtn.style.display = 'flex';
  closeBtn.style.alignItems = 'center';
  closeBtn.style.justifyContent = 'center';
  closeBtn.style.color = isDarkMode ? '#eee' : '#333';
  closeBtn.style.cursor = 'pointer';
  closeBtn.style.fontSize = '16px';
  closeBtn.style.fontWeight = 'bold';
  closeBtn.style.zIndex = '10000';
  closeBtn.onclick = () => debugContainer.remove();
  
  // Создаем контентное окно
  const debugContent = document.createElement('div');
  debugContent.style.backgroundColor = isDarkMode ? '#222' : '#fff';
  debugContent.style.color = isDarkMode ? '#eee' : '#333';
  debugContent.style.border = '1px solid ' + (isDarkMode ? '#444' : '#ddd');
  debugContent.style.borderRadius = '5px';
  debugContent.style.padding = '15px 10px 10px 10px';
  debugContent.style.maxHeight = '80vh';
  debugContent.style.overflow = 'auto';
  debugContent.style.boxShadow = '0 2px 15px rgba(0,0,0,0.3)';
  
  // Добавляем заголовок и содержимое
  debugContent.innerHTML = `
    <h3 style="margin:0 0 10px 0;padding-right:20px;">Доступные голоса (${voices.length})</h3>
    <pre style="margin:0;white-space:pre-wrap;word-wrap:break-word;">${JSON.stringify(voices.map(v => ({
      name: v.name,
      lang: v.lang,
      default: v.default,
      local: v.localService
    })), null, 2)}</pre>
  `;
  
  // Собираем все вместе
  debugContainer.appendChild(closeBtn);
  debugContainer.appendChild(debugContent);
  document.body.appendChild(debugContainer);
  
  // Делаем окно перемещаемым
  let isDragging = false;
  let offsetX, offsetY;
  
  const header = debugContent.querySelector('h3');
  header.style.cursor = 'move';
  
  header.addEventListener('mousedown', (e) => {
    isDragging = true;
    offsetX = e.clientX - debugContainer.getBoundingClientRect().left;
    offsetY = e.clientY - debugContainer.getBoundingClientRect().top;
    debugContainer.style.userSelect = 'none';
  });
  
  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    debugContainer.style.left = (e.clientX - offsetX) + 'px';
    debugContainer.style.top = (e.clientY - offsetY) + 'px';
    debugContainer.style.right = 'auto';
  });
  
  document.addEventListener('mouseup', () => {
    isDragging = false;
    debugContainer.style.userSelect = '';
  });
}

// Проверяем GET-параметр
if (new URLSearchParams(window.location.search).has('debugVoices')) {
  // Ждём загрузки голосов
  const checkVoices = setInterval(() => {
    if (window.speechSynthesis.getVoices().length > 0) {
      clearInterval(checkVoices);
      debugVoices();
    }
  }, 100);
}

// Функция для тоггла воспроизведения с поддержкой паузы
function toggleSpeech(elementId) {
  if (isSpeaking && !isPaused) {
    // Пауза воспроизведения
    window.speechSynthesis.pause();
    isPaused = true;
    document.getElementById('speechToggleBtn').textContent = '▶️';
    console.log('На паузе');
  } 
  else if (isPaused) {
    // Продолжение воспроизведения
    window.speechSynthesis.resume();
    isPaused = false;
    document.getElementById('speechToggleBtn').textContent = '⏸️';
    console.log('Продолжено');
  }
  else {
    // Запуск нового воспроизведения
    window.speechSynthesis.cancel();
    currentUtterance = speakTextFromElement(elementId);
    if (currentUtterance) {
      isSpeaking = true;
      isPaused = false;
      document.getElementById('speechToggleBtn').textContent = '⏸️';
      
      // Обработчики событий для сброса состояния
      currentUtterance.onend = () => {
        isSpeaking = false;
        isPaused = false;
        document.getElementById('speechToggleBtn').textContent = '🔊';
        console.log('Воспроизведение завершено');
      };
      
      currentUtterance.onerror = () => {
        isSpeaking = false;
        isPaused = false;
        document.getElementById('speechToggleBtn').textContent = '🔊';
      };
    }
  }
}

// Функция для ожидания загрузки голосов
function loadVoices() {
  return new Promise(resolve => {
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      resolve(voices);
    } else {
      window.speechSynthesis.onvoiceschanged = () => {
        resolve(window.speechSynthesis.getVoices());
      };
    }
  });
}

// Основная функция озвучки
async function speakTextFromElement(elementId) {
  try {
    const element = document.getElementById(elementId);
    if (!element) {
      console.error('Элемент не найден:', elementId);
      return null;
    }

    const htmlLang = document.documentElement.getAttribute('lang') || 'en';
    const text = Array.from(element.querySelectorAll('span'))
      .map(span => span.textContent.trim())
      .filter(t => t.length > 0)
      .join(' ');

    if (!text) {
      alert('Не найден текст для озвучки');
      return null;
    }

    // Ожидаем загрузку голосов
    const voices = await loadVoices();
    
    let langCode;
    let selectedVoice = null;
    let rate = 1.0;

    switch (htmlLang) {
      case 'ru':
        langCode = 'ru-RU';
        // Гибкий поиск голоса Павла
        selectedVoice = voices.find(v => 
          v.lang === 'ru-RU' && 
          (v.name.includes('Pavel') || v.name.includes('Павел'))
        ) || 
        voices.find(v => v.lang === 'ru-RU');
        break;

      case 'pi':
        if (/[\u0900-\u097F]/.test(text)) {
          const saVoice = voices.find(v => v.lang === 'sa-IN');
          if (saVoice) {
            langCode = 'sa-IN';
            selectedVoice = saVoice;
          } else {
            langCode = 'hi-IN';
            selectedVoice = voices.find(v => v.lang === 'hi-IN');
            rate = 0.7;
          }
        } else {
          langCode = 'en-US';
          selectedVoice = voices.find(v => v.lang === 'en-US');
        }
        break;

      default:
        langCode = 'en-US';
        selectedVoice = voices.find(v => v.lang === 'en-US');
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = langCode;
    utterance.rate = rate;

    // Дополнительные настройки для пали
    if (langCode === 'hi-IN') {
      utterance.pitch = 0.9;
      utterance.volume = 0.9;
    }

    if (selectedVoice) {
      utterance.voice = selectedVoice;
      console.log('Используется голос:', selectedVoice.name);
    }

    utterance.onend = () => {
      isSpeaking = false;
      isPaused = false;
      document.getElementById('speechToggleBtn').textContent = '🔊';
      console.log('Воспроизведение завершено');
    };

    utterance.onerror = (event) => {
      console.error('Ошибка синтеза:', event);
      isSpeaking = false;
      isPaused = false;
      document.getElementById('speechToggleBtn').textContent = '🔊';
      
      if (langCode !== 'en-US') {
        utterance.lang = 'en-US';
        utterance.voice = null;
        utterance.rate = 1.0;
        window.speechSynthesis.speak(utterance);
      }
    };

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);

    return utterance;

  } catch (e) {
    console.error('Ошибка в speakTextFromElement:', e);
    return null;
  }
}

// Функция для тоггла воспроизведения с поддержкой паузы
async function toggleSpeech(elementId) {
  if (isSpeaking && !isPaused) {
    // Пауза воспроизведения
    window.speechSynthesis.pause();
    isPaused = true;
    document.getElementById('speechToggleBtn').textContent = '▶️';
    console.log('На паузе');
  } 
  else if (isPaused) {
    // Продолжение воспроизведения
    window.speechSynthesis.resume();
    isPaused = false;
    document.getElementById('speechToggleBtn').textContent = '⏸️';
    console.log('Продолжено');
  }
  else {
    // Запуск нового воспроизведения
    window.speechSynthesis.cancel();
    currentUtterance = await speakTextFromElement(elementId);
    if (currentUtterance) {
      isSpeaking = true;
      isPaused = false;
      document.getElementById('speechToggleBtn').textContent = '⏸️';
    }
  }
}

// Инициализация голосов при загрузке страницы
window.speechSynthesis.onvoiceschanged = function() {
  console.log('Доступные голоса:', window.speechSynthesis.getVoices());
};
</script>
  <script src="/assets/js/autopali.js" defer></script>
	  <script src="/assets/js/smoothScroll.js" defer></script>
      <script src="/assets/js/paliLookup.js"></script>
      <script src="/assets/js/settings.js"></script>
<!--      <script src="https://code.responsivevoice.org/responsivevoice.js?key=X8U4dR8x"></script> -->

</body>
</html>
