<?php
// reader.php

// --- ПАРАМЕТРЫ ---
// Получаем slug и очищаем его от возможных якорей (например, #ll)
$raw_slug = $_GET['q'] ?? '';
$slug = strtolower(preg_replace('/#.*$/', '', $raw_slug));

// --- ФУНКЦИЯ ЗАГРУЗКИ И КОМПОНОВКИ ДАННЫХ ---
/**
 * Загружает данные для всех языков на основе slug.
 * Динамически определяет, является ли slug директорией или файлом, и выполняет соответствующий поиск.
 *
 * @param string $slug Идентификатор сутты или коллекции (например, 'dn1', 'sn', 'pli-tv-bu-vb-pj').
 * @return array Сгенерированный HTML и заголовок.
 */
function load_all_languages_interleaved($slug) {
    // Подключаем конфигурацию, где определена переменная $basedir
    if (file_exists('config/config.php')) {
        include_once('config/config.php');
    } else {
        $basedir = '.'; // Установите значение по умолчанию, если конфиг отсутствует
    }

    // Возвращаем HTML-шаблоны для форматирования
    $data_sources = [
        'html' => [], 'pali' => [], 'en' => [], 'ru' => []
    ];

    $fetch_data_for_type = function($type) use ($slug, $basedir) {
        $aggregated_data = [];
        $base_paths = [
            'html' => [
                "$basedir/suttacentral.net/sc-data/sc_bilara_data/html/pli/ms/sutta/",
                "$basedir/suttacentral.net/sc-data/sc_bilara_data/html/pli/ms/vinaya/"
            ],
            'pali' => [
                "$basedir/suttacentral.net/sc-data/sc_bilara_data/root/pli/ms/sutta/",
                "$basedir/suttacentral.net/sc-data/sc_bilara_data/root/pli/ms/vinaya/"
            ],
            'en'   => [
                "$basedir/suttacentral.net/sc-data/sc_bilara_data/translation/en/"
            ],
            'ru'   => [
                "$basedir/assets/texts/sutta/",
                "$basedir/assets/texts/vinaya/"
            ],
        ];
        
        $search_paths = $base_paths[$type] ?? [];
        if (empty($search_paths)) return [];
        
        $escaped_search_paths = implode(' ', array_map('escapeshellarg', $search_paths));

        // Убрал -maxdepth для более глубокого поиска директорий
        $dir_check_cmd = "find $escaped_search_paths -type d -name " . escapeshellarg($slug) . " -print -quit";
        $found_dir = shell_exec($dir_check_cmd);
        
        $is_directory_search = !empty(trim($found_dir));
        
        $cmd = '';
        if ($is_directory_search) {
            $cmd = "find " . escapeshellarg(trim($found_dir)) . " -type f -name '*.json' | sort -V";
        } else {
            $file_pattern = '';
            switch ($type) {
                // ИСПРАВЛЕНИЕ: Шаблоны сделаны более точными, чтобы избежать частичных совпадений
                case 'html':
                    $file_pattern = "{$slug}_html.json";
                    break;
                case 'pali':
                    $file_pattern = "{$slug}_root-pli-ms.json";
                    break;
                case 'en':
                    $file_pattern = "{$slug}_translation-en-*.json";
                    break;
                case 'ru':
                    // Ищем по шаблону {slug}_*.json, как вы и предложили
                    $file_pattern = "{$slug}_*.json";
                    break;
            }
            if ($file_pattern) {
                $cmd = "find $escaped_search_paths -type f -name " . escapeshellarg($file_pattern);
            }
        }

        if (empty($cmd)) return [];

        $file_list_str = shell_exec($cmd);
        if (empty($file_list_str)) return [];

        $files = array_filter(explode("\n", trim($file_list_str)));
        
        foreach ($files as $file) {
            if (empty($file) || !is_file($file)) continue;
            $json_content = file_get_contents($file);
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
    
    $all_keys = array_keys($data_sources['pali'] + $data_sources['en'] + $data_sources['ru'] + $data_sources['html']);
    usort($all_keys, 'strnatcmp');

    // --- ГЕНЕРАЦИЯ HTML ТАБЛИЦЫ ---
    $html_output = '<div class="p-3"><table id="sutta-table" class="table table-striped table-bordered" style="width:100%">';
    $html_output .= '<thead><tr><th>ID</th><th>Pali</th><th>English</th><th>Russian</th></tr></thead>';
    $html_output .= '<tbody>';

    if (empty($all_keys) && !empty($slug)) {
        // Оставим пустым, DataTables покажет сообщение "No data available"
    } else {
        foreach ($all_keys as $key) {
            if (strpos($key, ':') === false) continue;
            
            $template = $data_sources['html'][$key] ?? '{}';

            $pali_text = htmlspecialchars($data_sources['pali'][$key] ?? '', ENT_QUOTES, 'UTF-8');
            $en_text   = htmlspecialchars($data_sources['en'][$key] ?? '', ENT_QUOTES, 'UTF-8');
            $ru_text   = htmlspecialchars($data_sources['ru'][$key] ?? '', ENT_QUOTES, 'UTF-8');

            $pali_col_html = str_replace('{}', $pali_text, $template);
            $en_col_html   = str_replace('{}', $en_text,   $template);
            $ru_col_html   = str_replace('{}', $ru_text,   $template);

            $html_output .= "<tr>";
            $html_output .= "<td>" . htmlspecialchars($key) . "</td>";
            $html_output .= "<td class='pali-text' lang='pi'>{$pali_col_html}</td>";
            $html_output .= "<td class='en-text' lang='en'>{$en_col_html}</td>";
            $html_output .= "<td class='ru-text' lang='ru'>{$ru_col_html}</td>";
            $html_output .= "</tr>";
        }
    }
    $html_output .= '</tbody></table></div>';

    // --- НАХОДИМ ЗАГОЛОВОК ДЛЯ СТРАНИЦЫ ---
    $found_title = '';
    foreach ($all_keys as $key) {
        if (preg_match('/:0\.2$/', $key)) {
            $pali_title = $data_sources['pali'][$key] ?? '';
            $en_title   = $data_sources['en'][$key] ?? '';
            $ru_title   = $data_sources['ru'][$key] ?? '';
            
            $title_parts = array_filter([strip_tags($pali_title), strip_tags($en_title), strip_tags($ru_title)]);
            if (!empty($title_parts)) {
                $found_title = implode(' / ', $title_parts);
                break;
            }
        }
    }

    return ['content' => $html_output, 'title' => $found_title];
}

$result = $slug ? load_all_languages_interleaved($slug) : [
    'content' => "<p class='p-3'>Пожалуйста, укажите идентификатор сутты в строке поиска, например, <strong>dn1</strong> или <strong>sn</strong>.</p>",
    'title' => ''
];

$content = $result['content'];
$title = !empty($result['title']) ? $result['title'] : strtoupper($slug);

?>
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <title><?= htmlspecialchars($title) ?> :: Parallel Reader</title>
  <link rel="icon" type="image/png" sizes="32x32" href="https://dhamma.gift/assets/img/favico_black.png">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  
  <!-- CSS -->
  <link href="/assets/css/bootstrap.5.3.1.min.css" rel="stylesheet" />  
  <link rel="stylesheet" type="text/css" href="/assets/js/datatables/datatables.min.css"/>

  <link href="/assets/css/styles.css" rel="stylesheet" />
  <link href="/assets/css/extrastyles.css" rel="stylesheet" />
  <link rel="stylesheet" href="/assets/css/jquery-ui.min.css">
  <link href="/assets/css/paliLookup.css" rel="stylesheet" />

  <style>
    /* --- ОБЩИЕ СТИЛИ --- */
    .controls-container {
        position: sticky;
        top: 0;
        background: var(--bs-body-bg, #fff);
        padding: 10px;
        border-bottom: 1px solid var(--bs-border-color, #dee2e6);
        z-index: 1020;
        transition: background-color 0.3s, border-color 0.3s;
    }
    #sutta-table td h1, 
    #sutta-table td h2, 
    #sutta-table td h3, 
    #sutta-table td h4 {
        font-size: 1.1rem;
        font-weight: bold;
        margin-top: 1rem;
        margin-bottom: 0.5rem;
    }

    /* --- СТИЛИ ДЛЯ ТЕМНОЙ ТЕМЫ --- */
    body.dark-mode {
        --bs-body-bg: #212529;
        --bs-body-color: #dee2e6;
        --bs-border-color: #495057;
        --bs-table-color: var(--bs-body-color);
        --bs-table-striped-color: var(--bs-body-color);
        color-scheme: dark;
    }
    body.dark-mode .controls-container {
        background-color: #2b3035;
    }
    body.dark-mode .table {
        color: var(--bs-body-color);
    }
    body.dark-mode .controls-container .form-control {
        background-color: #495057;
        color: #dee2e6;
        border-color: #6c757d;
    }
    body.dark-mode .controls-container .form-control::placeholder {
        color: #adb5bd;
    }
    body.dark-mode .controls-container .btn-outline-secondary {
        color: #dee2e6;
        border-color: #6c757d;
    }
    body.dark-mode .controls-container .btn-outline-secondary:hover {
        background-color: #495057;
    }
    body.dark-mode .controls-container svg {
        fill: #dee2e6;
    }
    body.dark-mode .controls-container .toggle-dict-btn img,
    body.dark-mode .controls-container a[href="/"] img {
        filter: invert(1) grayscale(100%) brightness(200%);
    }
     body.dark-mode .controls-container a.text-dark {
        color: #dee2e6 !important;
    }
    body.dark-mode .dataTables_wrapper .dataTables_length,
    body.dark-mode .dataTables_wrapper .dataTables_filter,
    body.dark-mode .dataTables_wrapper .dataTables_info,
    body.dark-mode .dataTables_wrapper .dataTables_paginate .paginate_button {
        color: #fff;
    }
    body.dark-mode .page-link {
        background-color: #343a40;
        border-color: #495057;
        color: #fff;
    }
    body.dark-mode .page-link:hover {
        background-color: #495057;
    }
    body.dark-mode .table-striped>tbody>tr:nth-of-type(odd)>* {
        --bs-table-accent-bg: rgba(255, 255, 255, 0.05);
    }
  </style>
</head>
<body>

<div class="container-fluid controls-container">
  <div class="d-flex flex-wrap align-items-center justify-content-between">
    <div class="d-flex align-items-center mb-2 mb-sm-0 me-auto">
      <a href="/read.php" title="Sutta and Vinaya reading" rel="noreferrer" class="me-1">
        <svg fill="#979797" xmlns="http://www.w3.org/2000/svg" height="26px" viewBox="0 0 547.596 547.596" stroke="#979797"><g><path d="M540.76,254.788L294.506,38.216c-11.475-10.098-30.064-10.098-41.386,0L6.943,254.788 c-11.475,10.098-8.415,18.284,6.885,18.284h75.964v221.773c0,12.087,9.945,22.108,22.108,22.108h92.947V371.067 c0-12.087,9.945-22.108,22.109-22.108h93.865c12.239,0,22.108,9.792,22.108,22.108v145.886h92.947 c12.24,0,22.108-9.945,22.108-22.108v-221.85h75.965C549.021,272.995,552.081,264.886,540.76,254.788z"></path></g></svg>
      </a>
      <a href="/" title="Home" class="me-2"><img width="24px" alt="dhamma.gift icon" src="/assets/img/gray-white.png"></a>
      <form id="slugForm" class="d-flex align-items-center flex-nowrap me-2" onsubmit="goToSlug(); return false;">
        <input type="search" class="form-control form-control-sm rounded-pill" id="paliauto" name="q" value="<?= htmlspecialchars($slug) ?>" placeholder="e.g. dn9" style="width: 120px;" autofocus>
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
  </div>
</div>

<div class="container-fluid">
    <div class="row">
        <div class="col-12">
            <?= $content ?>
        </div>
    </div>
</div>
  
  <!-- JS -->
  <script src="/assets/js/jquery-3.7.0.min.js"></script>
  <script src="/assets/js/jquery-ui.min.js"></script>
  <script src="/assets/js/bootstrap.5.3.1.bundle.min.js"></script>

  <!-- DataTables JS -->
<script type="text/javascript" src="/assets/js/datatables/datatables.js"></script>
<script type="text/javascript" src="/assets/js/natural.js"></script>
<script type="text/javascript" src="/assets/js/strip-html.js"></script>

  <!-- Custom Scripts -->
  <script src="/assets/js/autopali.js" defer></script>
  <script src="/assets/js/dark-mode-switch/dark-mode-switch.js"></script>
  <script src="/assets/js/paliLookup.js"></script>
  <script src="/assets/js/settings.js"></script>
  <script src="/assets/js/smoothScroll.js" defer></script>

<script>
function goToSlug() {
    const slug = document.getElementById('paliauto').value.trim().toLowerCase();
    if (!slug) return;
    window.location.search = `q=${slug}`;
}

$(document).ready(function() {
    $('#sutta-table').DataTable({
        stateSave: true,
        colReorder: true,
        ordering: false,
        columnDefs: [
            {
                targets: 0,
                visible: false
            }
        ],
        paging: false,
        dom: "<'row'<'col-sm-12 col-md-6'B><'col-sm-12 col-md-6'f>>" +
             "<'row'<'col-sm-12'tr>>" +
             "<'row'<'col-sm-12 col-md-5'i><'col-sm-12 col-md-7'p>>",
        buttons: [
            {
                extend: 'colvis',
                text: 'Колонки'
            }
        ],
        language: {
            search: "Поиск:",
            info: "Показано _TOTAL_ строк",
            infoEmpty: "Нет данных для отображения",
            infoFiltered: "(отфильтровано из _MAX_)",
            zeroRecords: "Совпадений не найдено",
            emptyTable: "Нет данных в таблице",
            buttons: {
                colvis: 'Видимость колонок'
            }
        }
    });
});
</script>

</body>
</html>
