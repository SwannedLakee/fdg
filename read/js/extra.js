// --- Конфигурация путей ---
const makeJsonUrl = (slug) => {
  const basePath = '/assets/texts/devanagari/root/pli/ms/';
  const suffix = '_rootd-pli-ms.json';
  const cleanSlug = slug.replace(/pli-tv-|b[ui]-vb-/g, "");
  return `${basePath}${cleanSlug}${suffix}`;
};

// --- Глобальное состояние ---
const ttsState = {
  playlist: [], 
  currentIndex: 0,
  button: null,
  speaking: false,
  paused: false,
  utterance: null,
  langSettings: null,
  userRate: 1.0,
  currentSlug: null 
};

let screenWakeLock = null;
const synth = window.speechSynthesis;
const STORAGE_KEY = 'dhamma_tts_progress';
const MODE_STORAGE_KEY = 'tts_preferred_mode';

// --- Сохранение прогресса ---
function saveProgress() {
    if (!ttsState.speaking && !ttsState.paused) return;
    const item = ttsState.playlist[ttsState.currentIndex];
    const domId = item?.element?.id || item?.element?.closest('[id]')?.id;

    const data = {
        url: window.location.pathname,
        slug: ttsState.currentSlug,
        index: ttsState.currentIndex,
        lastId: domId,
        lang: ttsState.langSettings,
        timestamp: Date.now()
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function getSavedProgress() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        const data = JSON.parse(raw);
        if (data.url !== window.location.pathname) return null;
        return data;
    } catch (e) { return null; }
}

// --- Утилиты ---
function cleanTextForTTS(text) {
  if (!text) return "";
  return text
    .replace(/\bПер\.(?=\s)/g, 'Перевод') 
    .replace(/\bпер\.(?=\s)/g, 'перевод')
    .replace(/\{.*?\}/g, '').replace(/\[.*?\]/g, '').replace(/\(.*?\)/g, '')
    .replace(/[0-9]/g, '').replace(/[ \t]+/g, ' ').replace(/_/g, '').trim();
}

function setButtonIcon(button, type) {
  const allPlayButtons = document.querySelectorAll('.play-main-button');
  allPlayButtons.forEach(btn => {
    const img = btn.querySelector('img');
    if (!img) return;
    if (type === 'pause') { 
      img.src = '/assets/svg/pause-grey.svg';
      btn.classList.add('playing');
    } else { 
      img.src = '/assets/svg/play-grey.svg';
      btn.classList.remove('playing');
    }
  });
}

function resetUI() {
  document.querySelectorAll('.playing').forEach(btn => btn.classList.remove('playing'));
  document.querySelectorAll('img[src*="pause-grey.svg"]').forEach(img => {
    img.src = '/assets/svg/play-grey.svg';
  });
  document.querySelectorAll('.tts-active').forEach(el => el.classList.remove('tts-active'));
}

// --- Логика Данных ---
async function fetchSegmentsData(slug) {
    if (!slug) return null;
    try {
        const url = makeJsonUrl(slug);
        const response = await fetch(url);
        return response.ok ? await response.json() : null;
    } catch (e) { return null; }
}

function detectTranslationLang() {
    const path = window.location.pathname;
    return (path.includes('/th/') || path.includes('/thml/')) ? 'th' : 'ru';
}

async function preparePlaylist(elements, slug, forceLang = null) {
    let jsonData = (forceLang === 'pi' && slug) ? await fetchSegmentsData(slug) : null;
    let cleanJsonMap = {}; 
    if (jsonData) {
        Object.keys(jsonData).forEach(fullKey => {
            const parts = fullKey.split(':');
            cleanJsonMap[parts.length > 1 ? parts[1] : fullKey] = jsonData[fullKey];
        });
    }

    const playlist = [];
    elements.forEach((el) => {
        let textToRead = "";
        const domId = el.id || el.closest('[id]')?.id;
        
        if (forceLang === 'pi' && domId && cleanJsonMap[domId]) {
            textToRead = cleanJsonMap[domId].replace(/<[^>]*>/g, '');
        } else {
            const clone = el.cloneNode(true);
            clone.querySelectorAll('.variant, .not_translate, sup, .ref').forEach(v => v.remove());
            textToRead = cleanTextForTTS(clone.textContent);
        }

        if (textToRead.length > 1) {
            let itemLang = forceLang;
            if (itemLang === 'trn') itemLang = detectTranslationLang();
            playlist.push({ text: textToRead, element: el, lang: itemLang || 'pi' });
        }
    });
    return playlist;
}

async function prepareCombinedPlaylist(container, slug, order = 'pi-trn') {
    const paliElements = container.querySelectorAll('.pli-lang');
    const transElements = container.querySelectorAll('.rus-lang');
    const trnLang = detectTranslationLang();
    const paliPlaylist = await preparePlaylist(paliElements, slug, 'pi');
    const transPlaylist = await preparePlaylist(transElements, null, trnLang);

    const combined = [];
    const maxLength = Math.max(paliPlaylist.length, transPlaylist.length);
    for (let i = 0; i < maxLength; i++) {
        if (order === 'pi-trn') {
            if (paliPlaylist[i]) combined.push(paliPlaylist[i]);
            if (transPlaylist[i]) combined.push(transPlaylist[i]);
        } else {
            if (transPlaylist[i]) combined.push(transPlaylist[i]);
            if (paliPlaylist[i]) combined.push(paliPlaylist[i]);
        }
    }
    return combined;
}

// --- Ядро Проигрывателя ---
function playNextSegment() {
  if (ttsState.paused || !ttsState.speaking) return;
  if (synth.speaking) synth.cancel();

  if (ttsState.currentIndex >= ttsState.playlist.length) {
    stopPlayback(true);
    return;
  }

  saveProgress();
  const item = ttsState.playlist[ttsState.currentIndex];
  
  document.querySelectorAll('.tts-active').forEach(e => e.classList.remove('tts-active'));
  if (item.element) {
      item.element.classList.add('tts-active');
      item.element.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  const utterance = new SpeechSynthesisUtterance(item.text);
  const voices = synth.getVoices();
  utterance.rate = ttsState.userRate;

  // Логика выбора голоса
  if (item.lang === 'ru') {
    utterance.lang = 'ru-RU';
    const ruVoice = voices.find(v => v.lang === 'ru-RU' && v.name.includes('Google'));
    if (ruVoice) utterance.voice = ruVoice;
  } else if (item.lang === 'th') {
    utterance.lang = 'th-TH';
  } else if (item.lang === 'pi') {
    if (/[\u0900-\u097F]/.test(item.text)) {
       utterance.lang = 'sa-IN';
       utterance.rate = ttsState.userRate * 0.6;
    } else {
       const piVoice = voices.find(v => v.lang === 'id-ID') || voices.find(v => v.lang === 'it-IT');
       if (piVoice) utterance.voice = piVoice;
       utterance.lang = piVoice ? piVoice.lang : 'en-US';
    }
  }

  utterance.onend = () => {
    if (ttsState.speaking && !ttsState.paused) {
      ttsState.currentIndex++;
      playNextSegment();
    }
  };

  ttsState.utterance = utterance;
  synth.speak(utterance);
}

function stopPlayback(shouldClear = false) {
  synth.cancel();
  ttsState.speaking = false;
  ttsState.paused = false;
  setButtonIcon(null, 'play');
  resetUI();
  if (shouldClear) localStorage.removeItem(STORAGE_KEY);
}

// --- Навигация и Клики ---
function changeSegment(direction) {
    if (!ttsState.playlist.length) return;
    synth.cancel();
    ttsState.utterance = null;

    if (direction === 'next') {
        if (ttsState.currentIndex < ttsState.playlist.length - 1) ttsState.currentIndex++;
    } else if (direction === 'prev') {
        if (ttsState.currentIndex > 0) ttsState.currentIndex--;
    }

    saveProgress();
    const item = ttsState.playlist[ttsState.currentIndex];
    document.querySelectorAll('.tts-active').forEach(e => e.classList.remove('tts-active'));
    if (item?.element) {
        item.element.classList.add('tts-active');
        item.element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    if (ttsState.speaking && !ttsState.paused) {
        setTimeout(() => playNextSegment(), 50);
    }
}

async function startPlaybackProcess(elements, langType, button, slug, startIndex = 0, container = null) {
  const saved = getSavedProgress();
  stopPlayback(false); 
  
  let playlist = (langType.includes('-')) 
      ? await prepareCombinedPlaylist(container, slug, langType)
      : await preparePlaylist(elements, slug, langType);
  
  if (!playlist.length) return;

  ttsState.playlist = playlist;
  ttsState.currentSlug = slug;
  ttsState.langSettings = langType;
  ttsState.button = button;
  ttsState.speaking = true;

  if (saved && saved.lastId) {
      const foundIdx = playlist.findIndex(item => (item.element?.id || item.element?.closest('[id]')?.id) === saved.lastId);
      if (foundIdx !== -1) startIndex = foundIdx;
  }

  ttsState.currentIndex = startIndex < playlist.length ? startIndex : 0;
  setButtonIcon(button, 'pause');
  playNextSegment();
}

function handleSuttaClick(e) {
    const modeSelect = document.getElementById('tts-mode-select');
    const voiceLink = e.target.closest('.voice-link');
    const closeBtn = e.target.closest('.close-tts-btn');
    const playerWindow = e.target.closest('.voice-player');
    const playBtn = e.target.closest('.play-main-button');
    const navBtn = e.target.closest('.prev-main-button, .next-main-button');

    // 1. Клик по основной ссылке "Voice" — открыть/закрыть окно
    if (voiceLink) {
        e.preventDefault();
        e.stopPropagation();
        const parent = voiceLink.closest('.voice-dropdown');
        const isOpening = !parent.classList.contains('active');
        
        // Закрываем другие окна, если они открыты
        document.querySelectorAll('.voice-dropdown.active').forEach(el => el.classList.remove('active'));
        
        if (isOpening) {
            parent.classList.add('active');
            // Если музыка не играет, можно сразу запустить (опционально)
            if (!ttsState.speaking && !ttsState.paused) {
                const mode = modeSelect ? modeSelect.value : (localStorage.getItem(MODE_STORAGE_KEY) || 'pi');
                const slug = voiceLink.dataset.slug;
                const container = voiceLink.closest('.sutta-container') || document;
                let elements = mode === 'pi' ? container.querySelectorAll('.pli-lang') : 
                               mode === 'trn' ? container.querySelectorAll('.rus-lang') : null;
                startPlaybackProcess(elements, mode, voiceLink, slug, 0, container);
            }
        } else {
            parent.classList.remove('active');
        }
        return;
    }

    // 2. Клик по "крестику" (если добавлен) — закрыть окно
    if (closeBtn) {
        e.preventDefault();
        e.stopPropagation();
        document.querySelectorAll('.voice-dropdown.active').forEach(el => el.classList.remove('active'));
        return;
    }

    // 3. Выбор режима в выпадающем списке внутри окна
    if (e.target.id === 'tts-mode-select') {
        const newMode = e.target.value;
        localStorage.setItem(MODE_STORAGE_KEY, newMode);
        
        // Если уже слушаем — перезапускаем в новом режиме с того же места
        if (ttsState.speaking || ttsState.paused) {
            saveProgress();
            const btn = document.querySelector('.play-main-button');
            const slug = btn?.dataset.slug;
            const container = btn?.closest('.sutta-container') || document;
            startPlaybackProcess(null, newMode, btn, slug, 0, container);
        }
        return;
    }

    // 4. Кнопки навигации (Назад / Вперед)
    if (navBtn) {
        e.preventDefault();
        e.stopPropagation();
        const direction = navBtn.classList.contains('next-main-button') ? 'next' : 'prev';
        changeSegment(direction);
        return;
    }

    // 5. Кнопка Play/Pause внутри окна (или на самой ссылке)
    if (playBtn) {
        e.preventDefault();
        e.stopPropagation();
        
        const slug = playBtn.dataset.slug;
        const container = playBtn.closest('.sutta-container') || document;
        const mode = modeSelect ? modeSelect.value : (localStorage.getItem(MODE_STORAGE_KEY) || 'pi');

        // Если это та же кнопка — управляем паузой
        if (ttsState.button && (ttsState.button === playBtn || ttsState.button.classList.contains('play-main-button'))) {
            if (ttsState.speaking && !ttsState.paused) {
                synth.cancel();
                ttsState.paused = true;
                setButtonIcon(playBtn, 'play');
                return;
            }
            if (ttsState.paused) {
                // Если режим сменили за время паузы — пересобираем плейлист
                if (ttsState.langSettings !== mode) {
                    saveProgress();
                    startPlaybackProcess(null, mode, playBtn, slug, 0, container);
                } else {
                    ttsState.paused = false;
                    ttsState.speaking = true;
                    setButtonIcon(playBtn, 'pause');
                    playNextSegment();
                }
                return;
            }
        }

        // Запуск нового процесса воспроизведения
        let elements = mode === 'pi' ? container.querySelectorAll('.pli-lang') : 
                       mode === 'trn' ? container.querySelectorAll('.rus-lang') : null;
        startPlaybackProcess(elements, mode, playBtn, slug, 0, container);
        return;
    }

    // 6. Клик внутри окна плеера по любым другим местам (не закрываем окно)
    if (playerWindow) {
        e.stopPropagation();
        return;
    }

    // 7. Прочие кнопки (Copy, Open и т.д.)
    const otherBtn = e.target.closest('.copy-pali-btn, .tts-text-link');
    if (otherBtn) {
        // Здесь остается ваша стандартная логика
        return;
    }
}


document.addEventListener('DOMContentLoaded', () => {
  document.addEventListener('click', handleSuttaClick);
  window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
});
