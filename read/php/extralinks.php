<?php
header("Content-Type:text/plain");
error_reporting(E_ERROR | E_PARSE);
//include('../../config/config.php');



function extraLinks($fromjs) {
  
$playIcon = "<img src='/assets/svg/play-grey.svg' style='width: 17px; height: 17px; vertical-align: middle;' alt='Play'>";

  include_once('../../config/config.php');
  $forthru = str_replace(".", '_', $fromjs);
$cleaned = preg_replace('/\d.*$/', '', $fromjs);
$forbwpath = strtolower($cleaned);
  $bwfile = "$bwlocation/$forbwpath/$fromjs.html";

 
  if (file_exists($bwfile) ) {
      $bwlink = "$forbwpath/$fromjs.html";
  } else {
    $bwlink = "";
  }

 $texttype='sutta';
$forbbpath = strtolower($cleaned);


if (preg_match('/(dn|mn)/', $fromjs)) {
    // если $fromjs содержит 'dn', 'mn', 'sn' с цифрой или 'an'
    $bbfile = "$bblocation/$texttype/$forbbpath/{$fromjs}_root-pli-ms.json";
} else if (preg_match('/(sn[0-9]|an)/', $fromjs)) {
$booknum = preg_replace('/\..*$/', '', $fromjs);
    $bbfile = "$bblocation/$texttype/$forbbpath/$booknum/{$fromjs}_root-pli-ms.json";
} else {
    // если $fromjs не содержит ни одной из этих подстрок
    $bbfile = "$bblocation/$texttype/kn/$forbbpath/{$fromjs}_root-pli-ms.json";
}

 $bblink = '';

  if (strpos($_SERVER['REQUEST_URI'], '/b/') === false) {
      if (file_exists($bbfile)) {
          $bblink = "?q=$fromjs";
       if (isset($_GET['s'])) {
        $s_param = urlencode($_GET['s']);
            $bblink .= "&s=" . $s_param;
          }
      }
  }


$is_ru_referer = false;
  if (isset($_SERVER['HTTP_REFERER'])) {
      $is_ru_referer = (strpos($_SERVER['HTTP_REFERER'], '/ru/') !== false) ||
                       (strpos($_SERVER['HTTP_REFERER'], '/r/') !== false) ||
                       (strpos($_SERVER['HTTP_REFERER'], '/ml/') !== false);
  }

  // Формируем ссылки в зависимости от языка
  $pali_link = '/tts.php?q='.$fromjs;
  $trn_link = $is_ru_referer ? '/ru/tts.php?q='.$fromjs.'&type=trn' : '/tts.php?q='.$fromjs.'&type=trn';

  //th.ru and th.su part
  $locationrudn = $thsulocation;
  $nikaya = strtolower(preg_replace("/[0-9-.]/i","","$fromjs"));

  if (preg_match("/(an|sn)/i",$nikaya)) {
    $book = "/" . preg_replace("/\..*/i","","$fromjs") ;
  } else {
    $book = "";
  }

  $hasAudio = false;
  $playerHtml = "";
  $voiceLinkText = "Voice";

  if (strpos($fromjs, "bu-vb") !== false || strpos($fromjs, "bi-vb") !== false) {
      // Если $fromjs содержит *bu-vb* или *bi-vb*
      $parts = explode("-", $fromjs);

      // Определить pmtype (bu или bi)
      $pmtype = (strpos($fromjs, "bu") !== false) ? "bu" : ((strpos($fromjs, "bi") !== false) ? "bi" : "");
      $vbIndex = array_search("vb", $parts);
      $rule = $vbIndex !== false && isset($parts[$vbIndex + 1]) ? implode("-", array_slice($parts, $vbIndex + 1)) : "";

      if (strpos($fromjs, 'bi-') !== false) {
          $rule = "Bi-" . $rule;
      } else {
        $rule = ucfirst($rule);
      }

      $trnpath = shell_exec("echo $fromjs | awk -F'-' '{{OFS=\"-\"}
        if (NF == 5) {
          print $1,$2,$3,$4\"/\"$1,$2,$3,$4,substr($5,0,2)\"/\"$1,$2,$3,$4,$5
        } else if (NF == 6) {
          print $1,$2,$3,$4\"/\"$1,$2,$3,$4,substr($5,0,2)\"/\"$1,$2,$3,$4,$5,$6
        }
      }'");
      if (!empty($trnpath)) {
          $trnpath = str_replace(PHP_EOL, '', $trnpath);
          $finalRuling = shell_exec("grep -i 'Final ruling' $sctrntextlocation/en/brahmali/vinaya/{$trnpath}_translation-en-brahmali.json | awk -F':' '{print \$2}' | sed 's@\"@@g'");
      }

      if (!empty($finalRuling)) {
          $finalRuling = str_replace(PHP_EOL, '', $finalRuling);
          $final = "&nbsp;<a href='#$finalRuling'>Final</a>";
      } else {
        $finalRuling = "";
        $final = "";
      }

      $fullpathvoicefile = $basedir . "/assets/audio/" . $pmtype . "-pm" . "/" . $rule . ".m4a";
      $voicematches = glob($fullpathvoicefile);
      if (!empty($voicematches)) {
          $hasAudio = true;
          $voicefilename = basename($voicematches[0]);
          $voicefile = "/assets/audio/" . $pmtype . "-pm" . "/" . $voicefilename;

          $fileExt = pathinfo($voicefilename, PATHINFO_EXTENSION);
          $mimeType = ($fileExt === 'mp3') ? 'audio/mpeg' : 'audio/mp4; codecs="mp4a.40.2"';
      //    <button class='close-player' aria-label='Close player'>×</button>

$playerHtml = " <a class='tts-link' style='display:none;' href='$voicefile'>File</a>";
      }

} else {
    // Код для обычных случаев
    $fullpathvoicefile = $basedir . "/assets/audio/" . $nikaya . $book . "/" . $fromjs . "_*";
    $voicematches = glob($fullpathvoicefile);

    if (!empty($voicematches)) {
        $hasAudio = true;
        $voicefilename = basename($voicematches[0]);
        $voicefile = "/assets/audio/" . $nikaya . $book . "/". $voicefilename;

        $fileExt = strtolower(pathinfo($voicefilename, PATHINFO_EXTENSION));
        $mimeType = 'audio/mp4'; // По умолчанию для m4a

        if ($fileExt === 'mp3') {
            $mimeType = 'audio/mpeg';
        } elseif ($fileExt === 'm4a' || $fileExt === 'mp4') {
            $mimeType = 'audio/mp4; codecs="mp4a.40.2"';
        } elseif ($fileExt === 'aac') {
            $mimeType = 'audio/aac';
        } elseif ($fileExt === 'oga' || $fileExt === 'ogg') {
            $mimeType = 'audio/ogg; codecs="opus"';
        } elseif ($fileExt === 'wav') {
            $mimeType = 'audio/wav';
        }

$playerHtml = " <a class='tts-link' style='display:none;' href='$voicefile'>File
        </a>";
    }
}


  // Если аудио нет, используем простую ссылку
  if (!$hasAudio) {
$playerHtml = "";
  }

  if ($mode == "offline") {
    $output = shell_exec("
      ruslink=`cd $locationru ; ls . | grep -m1 \"{$forthru}-\" | sort -V | head -n1 2>/dev/null` ;
      ruslinkdn=`cd $locationrudn ; ls -R . | grep -m1 \"{$fromjs}.html\" ` ;

      echo -n \"{$final}{$playerHtml}\"
        [ ! -z $bblink ] && echo -n \"&nbsp;<a target='' title='BB and Other translations' href=/b/$bblink>BB</a>\"
        [ ! -z $bwlink ] && echo -n \"&nbsp;<a target='' title='TheBuddhasWords.net' href=$linktbw/$bwlink>TBW</a>\"
        [ ! -z \$ruslink ] && echo -n \"&nbsp;<a target='' title='Theravada.ru' href=$linkforthru/\$ruslink>Th.ru</a>\"
        [ ! -z \$ruslinkdn ] && echo -n \"&nbsp;<a title='Theravada.su' target='' href=/tipitaka.theravada.su/dn/\$ruslinkdn>Th.su</a>\"
      ");
  } else {
      // online
      if (strpos($fromjs, "bu-vb") !== false || strpos($fromjs, "bi-vb") !== false) {
          echo "";
      } else {
          //thsu part
          if (preg_match("/^(mn|dn)[0-9]{1,3}$/i",$fromjs)) {
              $forthsu = preg_replace("/s$/i","","$fromjs");
              $nikaya = preg_replace("/[0-9]/i","","$forthsu");
              $forthsu = preg_replace("/[a-z]/i","","$fromjs");

              switch (strtolower($nikaya)) {
                case "dn":
                  $sourcelink = "https://tipitaka.theravada.su/toc/translations/1098";
                  $sourcefile = "$locationTocThsu/dn_curl_toc.html";
                  $grepfor = "ДН";
                  $thsulink = shell_exec("cat $sourcefile | grep -m1 \"$grepfor $forthsu \" | grep translations | sed 's#href=\"/toc/translations/#href=\"https://tipitaka.theravada.su/node/table/#' |awk -F'\"' '{print \$2}' | tail -n1");
                  break;
                case "mn":
                  $sourcelink = "https://tipitaka.theravada.su/toc/translations/1549";
                  $sourcefile = "$locationTocThsu/mn_toc_thsu.txt";
                  $grepfor = "МН";
                  $thsulink = shell_exec("cat $sourcefile | grep -m1 -A3 \"$grepfor $forthsu \" | grep Таблица | sed 's#href=\"/node/table/#href=\"https://tipitaka.theravada.su/node/table/#' |awk -F'\"' '{print \$2}' | tail -n1");
                  break;
                case "sn":
                  $sourcelink = "https://tipitaka.theravada.su/toc/translations/1549";
                  $grepfor = "СН";
                case "an":
                  $sourcelink = "https://tipitaka.theravada.su/toc/translations/1549";
                  $grepfor = "СН";
                default:
                  echo "Your favorite color is neither red, blue, nor green! ";
                  echo $forthsu;
                  echo $nikaya;
              }
          }
          $thsulink = str_replace(PHP_EOL, '', $thsulink);

          $output = shell_exec("ruslink=`cd $locationru ; ls . | grep -m1 \"{$forthru}-\" | sort -V | head -n1` ; ruslinkdn=\"$thsulink\";

          echo -n \"{$final}{$playerHtml}\";

          [[ $bblink != \"\" ]]  && echo -n \"&nbsp;<a target='' title='BB and Other translations' href=/b/$bblink>BB</a>\"

          [[ $bwlink != \"\" ]] && echo -n \"&nbsp;<a target='' title='TheBuddhasWords.net' href='$linktbw/$bwlink'>TBW</a>\";

          [[ \$ruslink != \"\" ]] && echo -n \"&nbsp;<a title='Theravada.ru' target='' href='https://theravada.ru/Teaching/Canon/Suttanta/Texts/\$ruslink'>Th.ru</a>\";

          [ \${#ruslinkdn} -gt 5 ] && echo -n \"&nbsp;<a title='Theravada.su' target='' href='\$ruslinkdn'>Th.su</a>\";
          ");
      }
  }

  $result = str_replace(PHP_EOL, '', $output);
  return $output;
}

echo extraLinks($_GET['fromjs']);
?>


