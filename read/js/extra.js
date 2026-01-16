// Проверка загрузки
// alert("Extra.js with MediaSession LOADED");

// --- 1. Глобальное состояние и Тихий Трек ---

const ttsState = {
  text: null,       // Текущий текст
  button: null,     // Текущая активная кнопка
  speaking: false,
  paused: false,
  utterance: null
};

// Короткий MP3 файл тишины (ID3 + тишина), нужен для активации аудио-сессии в браузере
const silentAudio = new Audio("data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//OEAAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAAEAAABIADAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMD//////////////////////////////////////////////////////////////////wAAAP//OEAAAAAAAAAAAAAAAAAAAAAAAMKvAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//OEAAAAAAAAAAAAAAAAAAAAAAALhAAAAAAAAAAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq");
silentAudio.loop = true;

// --- 2. Вспомогательные функции UI ---

function resetAllIcons() {
  const pauseIcons = document.querySelectorAll('img[src*="pause-grey.svg"]');
  pauseIcons.forEach(img => {
    img.src = '/assets/svg/play-grey.svg';
    img.alt = 'Play';
  });
}

function setButtonIcon(button, type) {
  if (!button) return;
  const img = button.querySelector('img');
  if (!img) return;

  if (type === 'pause') { // Иконка "Пауза" (значит идет воспроизведение)
    img.src = '/assets/svg/pause-grey.svg';
    img.alt = 'Pause';
  } else { // Иконка "Play"
    img.src = '/assets/svg/play-grey.svg';
    img.alt = 'Play';
  }
}

function cleanTextForTTS(text) {
  return text
    .replace(/\{.*?\}/g, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// --- 3. Логика Media Session (Управление из шторки) ---

function setupMediaSession(text, langType) {
  if (!('mediaSession' in navigator)) return;

  // Метаданные для шторки
  navigator.mediaSession.metadata = new MediaMetadata({
    title: langType === 'pi' ? 'Pāli Recitation' : 'Translation Reading',
    artist: 'Dhamma.Gift',
    album: document.title || 'Sutta Study',
    artwork: [
      { src: '/assets/img/fav/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
      { src: '/assets/img/fav/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' }
    ]
  });

  // Обработчики нажатий в шторке
  navigator.mediaSession.setActionHandler('play', () => {
    // Пользователь нажал Play в шторке -> Возобновляем
    resumeTTS();
  });

  navigator.mediaSession.setActionHandler('pause', () => {
    // Пользователь нажал Pause в шторке -> Ставим на паузу
    pauseTTS();
  });
  
  // Можно добавить stop, seekbackward и т.д., но для TTS это сложнее
  navigator.mediaSession.setActionHandler('stop', () => {
    stopTTS();
  });
}

// --- 4. Управление воспроизведением (Controller) ---

function pauseTTS() {
  if (ttsState.speaking && !ttsState.paused) {
    window.speechSynthesis.pause();
    silentAudio.pause(); // Останавливаем тишину
    ttsState.paused = true;
    setButtonIcon(ttsState.button, 'play');
    
    // Сообщаем системе, что мы на паузе (меняется значок в шторке)
    if ('mediaSession' in navigator) navigator.mediaSession.playbackState = "paused";
  }
}

function resumeTTS() {
  if (ttsState.paused) {
    silentAudio.play().catch(e => console.warn("Audio resume blocked", e)); // Запускаем тишину
    window.speechSynthesis.resume();
    ttsState.paused = false;
    setButtonIcon(ttsState.button, 'pause');

    // Сообщаем системе, что мы играем
    if ('mediaSession' in navigator) navigator.mediaSession.playbackState = "playing";
  }
}

function stopTTS() {
  window.speechSynthesis.cancel();
  silentAudio.pause();
  silentAudio.currentTime = 0;
  
  ttsState.speaking = false;
  ttsState.paused = false;
  
  if (ttsState.button) setButtonIcon(ttsState.button, 'play');
  ttsState.text = null;
  ttsState.button = null;
  
  if ('mediaSession' in navigator) navigator.mediaSession.playbackState = "none";
}

// --- 5. Основная логика запуска (Speak) ---

function speakRawText(text, langType, button) {
  // Полный сброс
  stopTTS(); 
  
  // Обновляем состояние
  ttsState.text = text;
  ttsState.button = button;
  ttsState.speaking = true;
  ttsState.paused = false;

  // UI
  resetAllIcons();
  setButtonIcon(button, 'pause');

  // 1. Запуск тишины (для background mode)
  silentAudio.play().catch(err => {
    console.warn("Silent audio blocked (interaction needed first?):", err);
  });

  // 2. Настройка шторки
  setupMediaSession(text, langType);
  if ('mediaSession' in navigator) navigator.mediaSession.playbackState = "playing";

  // 3. Создание Utterance
  const utterance = new SpeechSynthesisUtterance(text);

  if (langType === 'ru') {
    utterance.lang = 'ru-RU';
  } else if (langType === 'th') {
    utterance.lang = 'th-TH';
    utterance.rate = 0.7;
  } else if (langType === 'pi') {
    utterance.lang = /[\u0900-\u097F]/.test(text) ? 'hi-IN' : 'en-US';
    if (utterance.lang === 'hi-IN') utterance.rate = 0.8;
  } else {
    utterance.lang = 'en-US';
  }

  // События
  utterance.onend = function() {
    stopTTS(); // Это само выключит тишину и обновит иконки
  };

  utterance.onerror = function(e) {
    if (e.error !== 'interrupted' && e.error !== 'canceled') {
      console.error('TTS Error:', e);
      stopTTS();
    }
  };

  ttsState.utterance = utterance;

  try {
    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.error("Speak error:", err);
    stopTTS();
  }
}

function toggleSpeech(text, langType, button) {
  // Логика переключения
  if (ttsState.speaking && !ttsState.paused && ttsState.text === text) {
    pauseTTS(); // Теперь вызывает централизованную функцию
  }
  else if (ttsState.paused && ttsState.text === text) {
    resumeTTS(); // Теперь вызывает централизованную функцию
  }
  else {
    speakRawText(text, langType, button);
  }
}


// --- 6. Обработчик кликов (Без изменений логики парсинга) ---

function handleSuttaClick(e) {
  const target = e.target.closest('.copy-pali, .copy-translation, .open-pali, .open-translation, .play-pali, .play-translation');
  if (!target) return;

  e.preventDefault();

  const isPlay = target.classList.contains('play-pali') || target.classList.contains('play-translation');
  const isOpen = target.classList.contains('open-pali') || target.classList.contains('open-translation');
  const isCopy = target.classList.contains('copy-pali') || target.classList.contains('copy-translation');
  const isPaliTarget = target.classList.contains('play-pali') || target.classList.contains('copy-pali') || target.classList.contains('open-pali');
  
  const textSelector = isPaliTarget ? '.pli-lang' : '.rus-lang';

  const container = target.closest('.sutta-container') || 
                    target.closest('.text-block') || 
                    target.closest('section') || 
                    target.closest('div');

  const elements = container ? container.querySelectorAll(textSelector) : document.querySelectorAll(textSelector);
  
  if (elements.length === 0) {
    console.warn("Text elements not found for selector: " + textSelector);
    return;
  }

  let combinedText = "";
  elements.forEach(el => {
    const clone = el.cloneNode(true);
    const variants = clone.querySelectorAll('.variant');
    variants.forEach(v => v.remove());
    combinedText += cleanTextForTTS(clone.textContent) + "\n\n";
  });

  if (!combinedText.trim()) return;

  if (isPlay) {
    let langType = 'en';
    const path = window.location.pathname;

    if (isPaliTarget) {
      langType = 'pi';
    } else {
      if (path.includes('/th/') || path.includes('/thml/') || path.includes('/mlth/')) {
        langType = 'th';
      } else if (path.includes('/ru/') || path.includes('/r/') || path.includes('/ml/')) {
        langType = 'ru';
      } else {
        langType = 'en';
      }
    }
    toggleSpeech(combinedText, langType, target);
  } 
  
  else if (isOpen) {
    openInNewTab(combinedText, isPaliTarget);
  } 
  
  else if (isCopy) {
    copyToClipboard(combinedText).then(success => {
      showNotification(success ? "Copied" : "Copy failed");
    });
  }
}

// --- Legacy (Copy/Open/Notify) ---

function showNotification(message) {
  const notification = document.createElement('div');
  notification.className = 'bubble-notification';
  notification.innerText = message;
  document.body.appendChild(notification);
  setTimeout(() => notification.classList.add('show'), 10);
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => notification.remove(), 300);
  }, 2000);
}

function generatePageTitle(isPali) {
  const path = window.location.pathname.replace(/^\//, '').replace(/\.html$/, '').replace(/\//g, '_');
  return `${path || 'text'}_${isPali ? 'pali' : 'translation'}_tts`;
}

function openInNewTab(content, isPali) {
  const form = document.createElement('form');
  form.method = 'POST';
  form.action = '/assets/render.php';
  form.target = '_blank';
  const inputs = {
    title: generatePageTitle(isPali),
    content: content,
    lang: isPali ? 'pi' : 'ru'
  };
  for (const [key, value] of Object.entries(inputs)) {
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = key;
    input.value = value;
    form.appendChild(input);
  }
  document.body.appendChild(form);
  form.submit();
  document.body.removeChild(form);
}

async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    try { return document.execCommand('copy'); } 
    catch (e) { return false; } 
    finally { document.body.removeChild(textarea); }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  document.addEventListener('click', handleSuttaClick);
});
