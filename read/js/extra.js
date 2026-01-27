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

    // 1. Клик по ссылке "Voice" — переключаем класс .active
    if (voiceLink) {
        e.preventDefault();
        e.stopPropagation();
        const parent = voiceLink.closest('.voice-dropdown');
        const isActive = parent.classList.contains('active');
        
        document.querySelectorAll('.voice-dropdown.active').forEach(el => el.classList.remove('active'));
        
        if (!isActive) {
            parent.classList.add('active');
            // Опционально: автостарт при открытии
            if (!ttsState.speaking && !ttsState.paused) {
                const mode = modeSelect ? modeSelect.value : (localStorage.getItem(MODE_STORAGE_KEY) || 'pi');
                const container = voiceLink.closest('.sutta-container') || document;
                let elements = mode === 'pi' ? container.querySelectorAll('.pli-lang') : container.querySelectorAll('.rus-lang');
                startPlaybackProcess(elements, mode, voiceLink, voiceLink.dataset.slug, 0, container);
            }
        }
        return;
    }

    // 2. Закрытие по крестику
    if (closeBtn) {
        e.preventDefault();
        e.stopPropagation();
        document.querySelectorAll('.voice-dropdown.active').forEach(el => el.classList.remove('active'));
        return;
    }

    // 3. Остановка всплытия кликов внутри окна (чтобы не закрывалось)
    if (playerWindow) {
        e.stopPropagation();
    }

    // 4. Логика кнопок навигации
    if (navBtn) {
        e.preventDefault();
        const direction = navBtn.classList.contains('next-main-button') ? 'next' : 'prev';
        changeSegment(direction); // Смена индекса + немедленный перезапуск
        return;
    }

    // 5. Логика Play/Pause
    if (playBtn) {
        e.preventDefault();
        const mode = modeSelect?.value || localStorage.getItem(MODE_STORAGE_KEY) || 'pi';
        const container = playBtn.closest('.sutta-container') || document;

        if (ttsState.button && (ttsState.button === playBtn || ttsState.button.classList.contains('play-main-button'))) {
            if (ttsState.speaking && !ttsState.paused) {
                synth.cancel();
                ttsState.paused = true;
                setButtonIcon(playBtn, 'play');
                return;
            }
            if (ttsState.paused) {
                if (ttsState.langSettings !== mode) {
                    saveProgress();
                    startPlaybackProcess(null, mode, playBtn, playBtn.dataset.slug, 0, container);
                } else {
                    ttsState.paused = false;
                    ttsState.speaking = true;
                    setButtonIcon(playBtn, 'pause');
                    playNextSegment();
                }
                return;
            }
        }
        
        let elements = mode === 'pi' ? container.querySelectorAll('.pli-lang') : container.querySelectorAll('.rus-lang');
        startPlaybackProcess(elements, mode, playBtn, playBtn.dataset.slug, 0, container);
    }
}



document.addEventListener('DOMContentLoaded', () => {
  document.addEventListener('click', handleSuttaClick);
  window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
});
