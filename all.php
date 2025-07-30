<?php
// reader.php

// --- ПАРАМЕТРЫ ---
$slug = strtolower($_GET['q'] ?? '');
// Определяем, запрашивается ли целая коллекция (напр. 'dn', 'an')
$is_collection = !preg_match('/[0-9.-]/', $slug) && ctype_alpha($slug);


// --- ФУНКЦИЯ ЗАГРУЗКИ И КОМПОНОВКИ ДАННЫХ ---
function load_all_languages_interleaved($slug, $is_collection) {
    include_once('config/config.php');

    $data_sources = [
        'html' => [], 'pali' => [], 'en' => [], 'ru' => []
    ];

    $fetch_data_for_type = function($type) use ($slug, $is_collection, $basedir) {
        $aggregated_data = [];
        
        $paths_map = [
            'html' => "$basedir/suttacentral.net/sc-data/sc_bilara_data/html/pli/ms/sutta/",
            'pali' => "$basedir/suttacentral.net/sc-data/sc_bilara_data/root/pli/ms/sutta/",
            'en'   => "$basedir/suttacentral.net/sc-data/sc_bilara_data/translation/en/",
            'ru'   => "$basedir/assets/texts/sutta/",
        ];
        
        $base_path = $paths_map[$type];
        $search_slug = escapeshellarg($slug);
        $cmd = '';

        if ($is_collection) {
            if ($type === 'en') {
                $cmd = "find $base_path -path '*/sutta/$search_slug/*.json' | sort -V";
            } else {
                $cmd = "find $base_path$search_slug/ -name '*.json' 2>/dev/null | sort -V";
            }
        } else {
             if ($type === 'en') {
                 $cmd = "find $base_path -name \"{$slug}_*\" -print -quit";
             } else {
                 $suffix = ($type === 'html') ? '_html.json' : '_*.json';
                 $cmd = "find $base_path -name \"{$slug}$suffix\" -print -quit";
             }
        }

        $file_list_str = shell_exec($cmd);
        if (empty($file_list_str)) return [];

        $files = $is_collection ? array_filter(explode("\n", trim($file_list_str))) : [trim($file_list_str)];
        
        foreach ($files as $file) {
            if (empty($file)) continue;
            $json_content = shell_exec("cat " . escapeshellarg($file));
            $decoded = json_decode($json_content, true);
            if (is_array($decoded)) {
                $aggregated_data = array_merge($aggregated_data, $decoded);
            }
        }
        return $aggregated_data;
    };

    $data_sources['html'] = $fetch_data_for_type('html');
    $data_sources['pali'] = $fetch_data_for_type('pali');
    $data_sources['en']   = $fetch_data_for_type('en');
    $data_sources['ru']   = $fetch_data_for_type('ru');
    
    $all_keys = array_keys(
        $data_sources['html'] + $data_sources['pali'] + $data_sources['en'] + $data_sources['ru']
    );
    usort($all_keys, 'strnatcmp');

    // --- ГЕНЕРАЦИЯ HTML ---
    $html_output = '<div id="reader-container" class="line-by-line-container">';
    foreach ($all_keys as $key) {
        if (strpos($key, ':') === false) continue;
        
        $template = $data_sources['html'][$key] ?? '<p>{}</p>';
        
        $pali_text = $data_sources['pali'][$key] ?? '';
        $en_text   = $data_sources['en'][$key] ?? '';
        $ru_text   = $data_sources['ru'][$key] ?? '';
        
        $pali_col_html = str_replace('{}', $pali_text, $template);
        $en_col_html   = str_replace('{}', $en_text,   $template);
        $ru_col_html   = str_replace('{}', $ru_text,   $template);

        $html_output .= "<div class='segment' id='{$key}'>";
        $html_output .= "<div class='pali-text text-column pli-lang' lang='pi'>{$pali_col_html}</div>";
        $html_output .= "<div class='en-text text-column' lang='en'>{$en_col_html}</div>";
        $html_output .= "<div class='ru-text text-column' lang='ru'>{$ru_col_html}</div>";
        $html_output .= "</div>";
    }
    $html_output .= '</div>';

    return $html_output;
}

$content = $slug ? load_all_languages_interleaved($slug, $is_collection) : "Please provide a sutta ID, e.g., ?q=dn1";
$title = strtoupper($slug);

?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title><?= htmlspecialchars($title) ?> :: Parallel Reader</title>
  <link rel="icon" type="image/png" sizes="32x32" href="https://dhamma.gift/assets/img/favico_black.png">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
 <link href="/assets/css/bootstrap.5.3.1.min.css" rel="stylesheet" />
 <link href="/assets/css/styles.css" rel="stylesheet" />
<meta name="author" content="Pali or Translation" />

  <link href="/assets/css/extrastyles.css" rel="stylesheet" />
<link rel="stylesheet" href="/assets/css/jquery-ui.min.css">
<!-- -->
<link href="/assets/css/paliLookup.css" rel="stylesheet" />

<script src="/assets/js/jquery-3.7.0.min.js"></script>
<script src="/assets/js/jquery-ui.min.js"></script>

  <style>
    body {
        --border-color: #dee2e6;
    }
    body.dark-mode {
        --border-color: #495057;
    }
    .line-by-line-container {
        display: flex;
        flex-direction: column;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    }
    .segment {
        display: flex;
        border-bottom: 1px solid var(--border-color);
        transition: background-color 0.3s;
    }
    .segment:hover {
        background-color: rgba(128, 128, 128, 0.1);
    }
    .text-column {
        flex: 1;
        padding: 0.5rem;
        min-width: 0;
        text-align: justify;
        transition: all 0.3s;
        line-height: 1.6;
    }
    .text-column:not(:last-child) {
        border-right: 1px solid var(--border-color);
    }
    .text-column p {
        margin-bottom: 0;
    }
    #reader-container.hide-pali .pali-text,
    #reader-container.hide-en .en-text,
    #reader-container.hide-ru .ru-text {
        display: none;
    }
    #reader-container.hide-ru .en-text,
    #reader-container.hide-en .pali-text,
    #reader-container.hide-pali.hide-en .ru-text,
    #reader-container.hide-pali.hide-ru .en-text {
        border-right: none;
    }
    
    .controls-container {
        position: sticky;
        top: 0;
        background: var(--bs-body-bg);
        padding: 10px;
        border-bottom: 1px solid var(--border-color);
        z-index: 1000;
    }

[class$="-text"] { 
    word-break: break-word;
    overflow-wrap: break-word;
    hyphens: auto;
}
  </style>
</head>
<body>

<div class="container-fluid controls-container">
  <div class="d-flex flex-wrap align-items-center justify-content-between">
    
    <div class="d-flex align-items-center mb-2 mb-sm-0 me-auto">


      <a id="readLink" href="/read.php" title="Sutta and Vinaya reading" rel="noreferrer" class="me-1">
        <svg fill="#979797" xmlns="http://www.w3.org/2000/svg" height="26px" viewBox="0 0 547.596 547.596" stroke="#979797">
          <g><path d="M540.76,254.788L294.506,38.216c-11.475-10.098-30.064-10.098-41.386,0L6.943,254.788 c-11.475,10.098-8.415,18.284,6.885,18.284h75.964v221.773c0,12.087,9.945,22.108,22.108,22.108h92.947V371.067 c0-12.087,9.945-22.108,22.109-22.108h93.865c12.239,0,22.108,9.792,22.108,22.108v145.886h92.947 c12.24,0,22.108-9.945,22.108-22.108v-221.85h75.965C549.021,272.995,552.081,264.886,540.76,254.788z"></path></g>
        </svg>
      </a>


        <a href="/" title="Home" class="me-2"><img width="24px" alt="dhamma.gift icon" src="/assets/img/gray-white.png"></a>
        <form id="slugForm" class="d-flex align-items-center flex-nowrap me-2" onsubmit="goToSlug(); return false;">
            <input type="search" class="form-control form-control-sm rounded-pill" 
                   id="paliauto" name="q" value="<?= htmlspecialchars($slug) ?>" 
                   placeholder="e.g. dn9" style="width: 120px;" autofocus>
            <button type="submit" class="btn btn-sm btn-outline-secondary rounded-circle p-1 ms-1 flex-shrink-0" style="width:30px; height:30px;">Go</button>
        </form>
        
        <a alt="Onclick popup dictionary" title="Onclick popup dictionary (Alt+A)" class="toggle-dict-btn text-decoration-none text-dark me-2">
          <img src="/assets/svg/comment.svg" class="dictIcon" style="width: 20px; height: 20px;">
        </a>

        <a href="/tts.php" class="text-decoration-none text-dark me-2" title="Text-to-Speech Mode">🔊</a>
        <div class="form-check form-switch me-2">
            <input type="checkbox" class="form-check-input" id="darkSwitch">
        </div>
    </div>
    
    <div class="d-inline-flex align-items-center lang-toggle-group mb-2 mb-sm-0 ms-auto">
        <div class="btn-group btn-group-sm" role="group">
            <button type="button" class="btn btn-outline-primary active lang-toggle-btn" data-lang="pali">PI</button>
            <button type="button" class="btn btn-outline-primary active lang-toggle-btn" data-lang="en">EN</button>
            <button type="button" class="btn btn-outline-primary active lang-toggle-btn" data-lang="ru">RU</button>
        </div>
    </div>

  </div>
</div>

<div class="container-fluid">
    <div class="row">
        <div class="col-12 px-0">
            <?= $content ?>
        </div>
    </div>
</div>

  <script src="/assets/js/autopali.js" defer></script>
      <script src="/assets/js/smoothScroll.js" defer></script>

<script src="/assets/js/dark-mode-switch/dark-mode-switch.js"></script>
<script src="/assets/js/paliLookup.js"></script>
      <script src="/assets/js/settings.js"></script>

<script>
function goToSlug() {
    const slug = document.getElementById('paliauto').value.trim().toLowerCase();
    if (!slug) return false;
    window.location.search = `q=${slug}`;
    return false;
}

document.addEventListener('DOMContentLoaded', function() {
    const readerContainer = document.getElementById('reader-container');
    const langToggleButtons = document.querySelectorAll('.lang-toggle-btn');

    function updateVisibility() {
        if (!readerContainer) return;
        
        langToggleButtons.forEach(button => {
            const lang = button.dataset.lang;
            if (button.classList.contains('active')) {
                readerContainer.classList.remove(`hide-${lang}`);
            } else {
                readerContainer.classList.add(`hide-${lang}`);
            }
        });
    }

    langToggleButtons.forEach(button => {
        button.addEventListener('click', function() {
            this.classList.toggle('active');
            updateVisibility();
        });
    });

    // ИЗМЕНЕНИЕ: Возвращаем обработчик для переключателя темы
    const darkSwitch = document.getElementById('darkSwitch');
    if (darkSwitch) {
        darkSwitch.addEventListener('change', function() {
            document.body.classList.toggle('dark-mode');
        });
    }

    updateVisibility();
});

let isSpeaking = false;
let isPaused = false;
let currentUtterance = null;

function getActiveTtsLang() {
    if (document.querySelector('[data-lang="pali"]').classList.contains('active')) return 'pi';
    if (document.querySelector('[data-lang="en"]').classList.contains('active')) return 'en';
    if (document.querySelector('[data-lang="ru"]').classList.contains('active')) return 'ru';
    return 'pali';
}

async function speakText() {
  try {
    const lang = getActiveTtsLang();
    const selector = `.${lang}-text`;
    const elements = document.querySelectorAll(selector);

    if (!elements.length) {
      alert('Нет текста для озвучивания на выбранном языке.');
      return null;
    }
    
    const text = Array.from(elements)
      .filter(el => el.offsetParent !== null)
      .map(el => el.textContent.trim())
      .filter(t => t.length > 0)
      .join(' . ');

    if (!text) {
      alert('Нет видимого текста для озвучивания.');
      return null;
    }

    const voices = await new Promise(resolve => {
        let v = window.speechSynthesis.getVoices();
        if (v.length > 0) resolve(v);
        else window.speechSynthesis.onvoiceschanged = () => resolve(window.speechSynthesis.getVoices());
    });
    
    let langCode, selectedVoice = null, rate = 1.0;

    switch (lang) {
        case 'ru':
            langCode = 'ru-RU';
            selectedVoice = voices.find(v => v.lang === 'ru-RU' && v.name.includes('Pavel')) || voices.find(v => v.lang === 'ru-RU');
            break;
        case 'en':
            langCode = 'en-US';
            selectedVoice = voices.find(v => v.lang === 'en-US');
            break;
        case 'pi':
        default:
            langCode = 'hi-IN';
            selectedVoice = voices.find(v => v.lang === 'sa-IN') || voices.find(v => v.lang === 'hi-IN');
            rate = 0.8;
            break;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = langCode;
    utterance.rate = rate;
    if (selectedVoice) {
      utterance.voice = selectedVoice;
      console.log('Using voice:', selectedVoice.name);
    }

    utterance.onend = () => {
        isSpeaking = false; isPaused = false;
        document.getElementById('speechToggleBtn').textContent = '🔊';
    };
    utterance.onerror = (e) => {
        console.error('Speech synthesis error:', e);
        isSpeaking = false; isPaused = false;
        document.getElementById('speechToggleBtn').textContent = '🔊';
    };

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    return utterance;

  } catch (e) {
    console.error('Error in speakText:', e);
    return null;
  }
}

async function toggleSpeech() {
  if (isSpeaking && !isPaused) {
    window.speechSynthesis.pause();
    isPaused = true;
    document.getElementById('speechToggleBtn').textContent = '▶️';
  } else if (isPaused) {
    window.speechSynthesis.resume();
    isPaused = false;
    document.getElementById('speechToggleBtn').textContent = '⏸️';
  } else {
    window.speechSynthesis.cancel();
    currentUtterance = await speakText();
    if (currentUtterance) {
      isSpeaking = true;
      isPaused = false;
      document.getElementById('speechToggleBtn').textContent = '⏸️';
    }
  }
}
</script>

</body>
</html>