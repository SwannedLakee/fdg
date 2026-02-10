<?php
header("Content-Type:text/plain");
error_reporting(E_ERROR | E_PARSE);

include('../../config/config.php');

function getAudioLink($fromjs) {
    global $basedir; 

    // Extract nikaya and book for audio path construction
    $nikaya = strtolower(preg_replace("/[0-9-.]/i","","$fromjs"));
    $book = "";
    if (preg_match("/(an|sn)/i",$nikaya)) {
        $book = "/" . preg_replace("/\..*/i","","$fromjs") ;
    }

    $hasAudio = false;
    $voicefile = "";

    // Logic for vinaya texts (bu-vb, bi-vb)
    if (strpos($fromjs, "bu-vb") !== false || strpos($fromjs, "bi-vb") !== false) {
        $parts = explode("-", $fromjs);
        $pmtype = (strpos($fromjs, "bu") !== false) ? "bu" : ((strpos($fromjs, "bi") !== false) ? "bi" : "");
        $vbIndex = array_search("vb", $parts);
        $rule = $vbIndex !== false && isset($parts[$vbIndex + 1]) ? implode("-", array_slice($parts, $vbIndex + 1)) : "";

        if (strpos($fromjs, 'bi-') !== false) {
            $rule = "Bi-" . $rule;
        } else {
            $rule = ucfirst($rule);
        }
        $fullpathvoicefile = $basedir . "/assets/audio/" . $pmtype . "-pm" . "/" . $rule . ".m4a";
        $voicematches = glob($fullpathvoicefile);
        if (!empty($voicematches)) {
            $hasAudio = true;
            $voicefilename = basename($voicematches[0]);
            $voicefile = "/assets/audio/" . $pmtype . "-pm" . "/" . $voicefilename;
        }
    } else { // Logic for suttas
        $fullpathvoicefile = $basedir . "/assets/audio/" . $nikaya . $book . "/" . $fromjs . "_*";
        $voicematches = glob($fullpathvoicefile);
        if (!empty($voicematches)) {
            $hasAudio = true;
            $voicefilename = basename($voicematches[0]);
            $voicefile = "/assets/audio/" . $nikaya . $book . "/". $voicefilename;
        }
    }

    if ($hasAudio) {
        return "&nbsp;<a class='tts-link' href='$voicefile'>File</a>";
    } else {
        return "";
    }
}

if (isset($_GET['fromjs'])) {
    echo getAudioLink($_GET['fromjs']);
}
?>