<?php
header("Content-Type: text/plain");
error_reporting(E_ERROR | E_PARSE);

// Подключаем конфиг, чтобы получить $basedir
$configPath = __DIR__ . '/../../config/config.php';
if (file_exists($configPath)) {
    include($configPath);
}

// Функция поиска ссылки
function getAudioLink($fromjs) {
    global $basedir; 

    // Если конфиг не подключился или basedir пуст, пытаемся определить корень сервера
    if (empty($basedir)) {
        $basedir = $_SERVER['DOCUMENT_ROOT'];
    }

    if (empty($fromjs)) return "Debug: Empty slug";

    // Очистка slug от возможных путей типа "sutta/" если они всё же прошли
    $cleanSlug = basename($fromjs); 
    
    // Определяем никая и книгу для структуры папок
    $nikaya = strtolower(preg_replace("/[0-9-.]/i", "", $cleanSlug));
    $book = "";
    
    if (preg_match("/(an|sn)/i", $nikaya)) {
        // Для AN и SN есть подпапки (например, an1, sn56)
        $book = "/" . preg_replace("/\..*/i", "", $cleanSlug);
    }

    $voicefile = "";
    $searchPattern = "";
    $pmtype = "";

    // Логика для Винаи (Патимоккха и т.д.)
    if (strpos($cleanSlug, "bu-vb") !== false || strpos($cleanSlug, "bi-vb") !== false) {
        $parts = explode("-", $cleanSlug);
        $pmtype = (strpos($cleanSlug, "bu") !== false) ? "bu" : "bi";
        
        $vbIndex = array_search("vb", $parts);
        $rule = $vbIndex !== false && isset($parts[$vbIndex + 1]) ? implode("-", array_slice($parts, $vbIndex + 1)) : "";

        if (strpos($cleanSlug, 'bi-') !== false) {
            $rule = "Bi-" . $rule;
        } else {
            $rule = ucfirst($rule);
        }
        
        $searchPattern = $basedir . "/assets/audio/" . $pmtype . "-pm/" . $rule . ".m4a";
    } else { 
        // Логика для обычных сутт
        // Ищем .mp3, .m4a и т.д.
        $searchPattern = $basedir . "/assets/audio/" . $nikaya . $book . "/" . $cleanSlug . "_*";
    }

    // Ищем файлы
    $voicematches = glob($searchPattern);
    
    if (!empty($voicematches)) {
        $fullPath = $voicematches[0];
        $voicefilename = basename($fullPath);
        
        // Формируем веб-путь
        if (strpos($cleanSlug, "bu-vb") !== false || strpos($cleanSlug, "bi-vb") !== false) {
            $voicefile = "/assets/audio/" . $pmtype . "-pm/" . $voicefilename;
        } else {
            $voicefile = "/assets/audio/" . $nikaya . $book . "/" . $voicefilename;
        }
        
        // Возвращаем HTML ссылку. &nbsp; нужен для отступа от предыдущего элемента
        return "&nbsp;<a class='tts-link' href='$voicefile' target='_blank'>File</a>";
    }

    return "NOT_FOUND: tried " . $searchPattern;
}

// Запуск
if (isset($_GET['fromjs'])) {
    echo getAudioLink($_GET['fromjs']);
} else {
    echo "Debug: No fromjs param";
}
?>