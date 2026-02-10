<?php
header("Content-Type:text/plain");
error_reporting(E_ERROR | E_PARSE);

// Использование __DIR__ гарантирует правильный путь независимо от того, как вызван скрипт
$configPath = __DIR__ . '/../../config/config.php';
if (file_exists($configPath)) {
    include($configPath);
}

function getAudioLink($fromjs) {
    // ОБЯЗАТЕЛЬНО объявляем переменную из config.php глобальной
    global $basedir; 

    if (!$basedir) return ""; // Если конфиг не подгрузился, выходим

    $nikaya = strtolower(preg_replace("/[0-9-.]/i","","$fromjs"));
    $book = "";
    if (preg_match("/(an|sn)/i",$nikaya)) {
        $book = "/" . preg_replace("/\..*/i","","$fromjs") ;
    }

    $hasAudio = false;
    $voicefile = "";

    // Логика поиска (оставляем вашу без изменений, но проверяем пути)
    if (strpos($fromjs, "bu-vb") !== false || strpos($fromjs, "bi-vb") !== false) {
        $parts = explode("-", $fromjs);
        $pmtype = (strpos($fromjs, "bu") !== false) ? "bu" : "bi";
        $vbIndex = array_search("vb", $parts);
        $rule = $vbIndex !== false && isset($parts[$vbIndex + 1]) ? implode("-", array_slice($parts, $vbIndex + 1)) : "";
        
        $rule = (strpos($fromjs, 'bi-') !== false) ? "Bi-" . $rule : ucfirst($rule);
        
        $fullpathvoicefile = $basedir . "/assets/audio/" . $pmtype . "-pm" . "/" . $rule . ".m4a";
    } else {
        $fullpathvoicefile = $basedir . "/assets/audio/" . $nikaya . $book . "/" . $fromjs . "_*";
    }

    $voicematches = glob($fullpathvoicefile);
    if (!empty($voicematches)) {
        $voicefilename = basename($voicematches[0]);
        // Формируем путь для ссылки (от корня сайта)
        if (strpos($fromjs, "bu-vb") !== false || strpos($fromjs, "bi-vb") !== false) {
            $voicefile = "/assets/audio/" . $pmtype . "-pm/" . $voicefilename;
        } else {
            $voicefile = "/assets/audio/" . $nikaya . $book . "/". $voicefilename;
        }
        return "&nbsp;<a class='tts-link' href='$voicefile'>File</a>";
    }

    return "";
}

if (isset($_GET['fromjs'])) {
    echo getAudioLink($_GET['fromjs']);
}
?>