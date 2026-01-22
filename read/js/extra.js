// --- Глобальное состояние ---
const ttsState = {
  segments: [],
  currentIndex: 0,
  button: null,
  speaking: false,
  paused: false,
  utterance: null,
  langSettings: null,
  userRate: 1.0 // Базовая скорость
};

let screenWakeLock = null;
const synth = window.speechSynthesis;

// --- 1. Wake Lock (Блокировка экрана) - ПЕРЕНЕСЕНО И УЛУЧШЕНО ---
async function requestWakeLock() {
  if ('wakeLock' in navigator) {
    try { screenWakeLock = await navigator.wakeLock.request('screen'); } 
    catch (err) { console.warn('Wake Lock failed:', err); }
  }
}

function releaseWakeLock() {
  if (screenWakeLock !== null) {
    screenWakeLock.release().then(() => { screenWakeLock = null; });
  }
}

document.addEventListener("visibilitychange", async () => {
  if (screenWakeLock !== null && document.visibilityState === "visible") {
    if (ttsState.speaking && !ttsState.paused) requestWakeLock();
  }
});

// --- 2. Управление UI Меню Скорости (ПЕРЕНЕСЕНО ОТ ВАС) ---

function toggleSpeedMenu() {
    const menu = document.getElementById('speedMenu');
    if (!menu) return;
    
    if (menu.style.display === 'block') {
        menu.style.display = 'none';
        document.removeEventListener('click', closeSpeedMenuOutside);
    } else {
        menu.style.display = 'block';
        document.addEventListener('click', closeSpeedMenuOutside);
    }
}

function closeSpeedMenuOutside(event) {
    const menu = document.getElementById('speedMenu');
    const btn = document.getElementById('speedToggleBtn');
    
    if (!menu || !btn) return;

    if (!menu.contains(event.target) && !btn.contains(event.target)) {
        menu.style.display = 'none';
        document.removeEventListener('click', closeSpeedMenuOutside);
    }
}

function updateSpeedLabel(val) {
    const btn = document.getElementById('speedToggleBtn');
    if (btn) btn.innerText = val + 'x';
}

// Инициализация контролов (Ползунок + Кнопка меню)
function initTTSControls() {
  const rateInput = document.getElementById('rateRange');
  const toggleBtn = document.getElementById('speedToggleBtn');

  // 1. Логика ползунка
  if (rateInput) {
    rateInput.value = ttsState.userRate;
    updateSpeedLabel(ttsState.userRate);

    rateInput.addEventListener('input', (e) => {
      const newRate = parseFloat(e.target.value);
      ttsState.userRate = newRate;
      updateSpeedLabel(newRate);

      // Если речь идет — перезапускаем текущий кусок с новой скоростью
      if (ttsState.speaking && !ttsState.paused) {
          synth.cancel();
          // Откатываемся на 1 назад, чтобы playNextSegment начал этот же кусок заново
          if(ttsState.currentIndex > 0) ttsState.currentIndex--; 
          playNextSegment();
      }
    });
  }

  // 2. Логика кнопки меню (открыть/закрыть)
  if (toggleBtn) {
      // Удаляем старые обработчики (на всякий случай) и ставим новый
      toggleBtn.onclick = (e) => {
          e.preventDefault();
          toggleSpeedMenu();
      };
  }
}


// --- 3. Вспомогательные функции UI ---
function resetUI() {
  const pauseIcons = document.querySelectorAll('img[src*="pause-grey.svg"]');
  pauseIcons.forEach(img => {
    img.src = '/assets/svg/play-grey.svg';
    img.alt = 'Play';
    const btn = img.closest('a') || img.closest('button');
    if (btn) btn.classList.remove('playing');
  });
  document.querySelectorAll('.tts-active').forEach(el => el.classList.remove('tts-active'));
}

function setButtonIcon(button, type) {
  if (!button) return;
  const img = button.querySelector('img');
  if (!img) return;
  if (type === 'pause') { 
    img.src = '/assets/svg/pause-grey.svg';
    img.alt = 'Pause';
    button.classList.add('playing');
  } else { 
    img.src = '/assets/svg/play-grey.svg';
    img.alt = 'Play';
    button.classList.remove('playing');
  }
}

function cleanTextForTTS(text) {
  return text
    .replace(/\{.*?\}/g, '')
    .replace(/\[.*?\]/g, '')
    .replace(/\(.*?\)/g, '')
    .replace(/[0-9]/g, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/_/g, '')
    .trim();
}

// --- 4. Логика TTS ---
function startSegmentedPlayback(elements, langType, button) {
  stopPlayback();
  ttsState.segments = Array.from(elements);
  ttsState.currentIndex = 0;
  ttsState.button = button;
  ttsState.speaking = true;
  ttsState.paused = false;
  ttsState.langSettings = langType;

  resetUI();
  setButtonIcon(button, 'pause');
  requestWakeLock();
  playNextSegment();
}

function playNextSegment() {
  if (ttsState.currentIndex >= ttsState.segments.length || !ttsState.speaking) {
    stopPlayback();
    return;
  }

  const el = ttsState.segments[ttsState.currentIndex];
  
  // Клонируем и чистим
  const clone = el.cloneNode(true);
  clone.querySelectorAll('.variant, .not_translate, sup, .ref').forEach(v => v.remove());
  const textToRead = cleanTextForTTS(clone.textContent);

  if (!textToRead || textToRead.length < 2) { 
    ttsState.currentIndex++;
    playNextSegment();
    return;
  }

  // Подсветка
  document.querySelectorAll('.tts-active').forEach(e => e.classList.remove('tts-active'));
  el.classList.add('tts-active');
  el.scrollIntoView({ behavior: 'smooth', block: 'center' });

  const utterance = new SpeechSynthesisUtterance(textToRead);
  const langType = ttsState.langSettings;
  const voices = synth.getVoices();
  const userRate = ttsState.userRate;

  // Настройки языков
  if (langType === 'ru') {
    utterance.lang = 'ru-RU';
    const ruVoice = voices.find(v => v.lang === 'ru-RU' && v.name.includes('Google'));
    if (ruVoice) utterance.voice = ruVoice;
    utterance.rate = userRate;
  } 
  else if (langType === 'th') {
    utterance.lang = 'th-TH';
    utterance.rate = userRate * 0.8; 
  } 
  else if (langType === 'pi') {
    const isDevanagari = /[\u0900-\u097F]/.test(textToRead);
    if (isDevanagari) {
       utterance.lang = 'hi-IN';
       utterance.rate = userRate * 0.8; 
    } else {
       const indoVoice = voices.find(v => v.lang === 'id-ID');
       const italianVoice = voices.find(v => v.lang === 'it-IT');
       if (indoVoice) {
           utterance.voice = indoVoice;
           utterance.lang = 'id-ID';
           utterance.rate = userRate * 0.85; 
       } else if (italianVoice) {
           utterance.voice = italianVoice;
           utterance.lang = 'it-IT';
           utterance.rate = userRate * 0.9;
       } else {
           utterance.lang = 'en-US';
           utterance.rate = userRate * 0.8; 
       }
    }
  } 
  else {
    utterance.lang = 'en-US';
    utterance.rate = userRate;
  }

  utterance.onend = function() {
    if (ttsState.speaking && !ttsState.paused) {
      ttsState.currentIndex++;
      playNextSegment();
    }
  };

  utterance.onerror = function(e) {
    if (e.error !== 'interrupted' && e.error !== 'canceled') {
      ttsState.currentIndex++;
      playNextSegment();
    }
  };

  ttsState.utterance = utterance;
  synth.speak(utterance);
}

function stopPlayback() {
  synth.cancel();
  ttsState.speaking = false;
  ttsState.paused = false;
  ttsState.segments = [];
  ttsState.currentIndex = 0;
  if (ttsState.button) setButtonIcon(ttsState.button, 'play');
  resetUI();
  releaseWakeLock();
}

function toggleSpeech(elements, langType, button) {
  if (ttsState.button === button) {
    if (ttsState.speaking && !ttsState.paused) {
      synth.pause();
      ttsState.paused = true;
      setButtonIcon(button, 'play'); 
      releaseWakeLock();
      return;
    }
    if (ttsState.paused) {
      synth.resume();
      ttsState.paused = false;
      setButtonIcon(button, 'pause');
      requestWakeLock();
      return;
    }
  }
  startSegmentedPlayback(elements, langType, button);
}

// --- Обработчик кликов ---
function handleSuttaClick(e) {
  const target = e.target.closest('.copy-pali, .copy-translation, .open-pali, .open-translation, .play-pali, .play-translation');
  if (!target) return;

  e.preventDefault();

  const isPlay = target.classList.contains('play-pali') || target.classList.contains('play-translation');
  const isOpen = target.classList.contains('open-pali') || target.classList.contains('open-translation');
  const isCopy = target.classList.contains('copy-pali') || target.classList.contains('copy-translation');
  
  const isPaliTarget = target.classList.contains('play-pali') || target.classList.contains('copy-pali') || target.classList.contains('open-pali');
  const textSelector = isPaliTarget ? '.pli-lang' : '.rus-lang';

  const container = target.closest('.sutta-container') || target.closest('.text-block') || target.closest('section') || target.closest('div');
  const elements = container ? container.querySelectorAll(textSelector) : document.querySelectorAll(textSelector);
  
  if (elements.length === 0) return;

  if (isOpen || isCopy) {
    let combinedText = "";
    elements.forEach(el => {
      const clone = el.cloneNode(true);
      clone.querySelectorAll('.variant, sup, .ref').forEach(v => v.remove());
      combinedText += cleanTextForTTS(clone.textContent) + "\n\n";
    });
    if (!combinedText.trim()) return;
    if (isOpen) openInNewTab(combinedText, isPaliTarget);
    else if (isCopy) copyToClipboard(combinedText).then(success => showNotification(success ? "Copied" : "Failed"));
    return;
  }

  if (isPlay) {
    let langType = 'en'; 
    const path = window.location.pathname;
    if (isPaliTarget) langType = 'pi';
    else if (path.includes('/th/') || path.includes('/thml/')) langType = 'th';
    else if (path.includes('/ru/') || path.includes('/r/') || path.includes('/ml/')) langType = 'ru';
    
    toggleSpeech(elements, langType, target);
  } 
}

// --- Старые функции ---
function showNotification(message) {
  const n = document.createElement('div');
  n.className = 'bubble-notification';
  n.innerText = message;
  document.body.appendChild(n);
  setTimeout(() => n.classList.add('show'), 10);
  setTimeout(() => { n.classList.remove('show'); setTimeout(() => n.remove(), 300); }, 2000);
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
  const inputs = { title: generatePageTitle(isPali), content: content, lang: isPali ? 'pi' : 'ru' };
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
  try { await navigator.clipboard.writeText(text); return true; } 
  catch (err) { return false; }
}

if (speechSynthesis.onvoiceschanged !== undefined) {
  speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
}
document.addEventListener('DOMContentLoaded', () => {
  document.addEventListener('click', handleSuttaClick);
  initTTSControls(); // Запускаем поиск ползунка и кнопки
});
