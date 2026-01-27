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
  userRate: parseFloat(localStorage.getItem('tts_preferred_rate')) || 1.0,
  currentSlug: null
};

const synth = window.speechSynthesis;
const MODE_STORAGE_KEY = 'tts_preferred_mode';
const RATE_STORAGE_KEY = 'tts_preferred_rate';
const LAST_SLUG_KEY = 'tts_last_slug';   
const LAST_INDEX_KEY = 'tts_last_index'; 

// --- Утилиты ---
function cleanTextForTTS(text) {
  if (!text) return "";
  return text
    .replace(/Pāḷi MS/g, 'पालि महासङ्गीति')
    .replace(/[Пп]ер\./g, 'Перевод') 
    .replace(/”/g, '')
    .replace(/\{.*?\}/g, '').replace(/\[.*?\]/g, '').replace(/\(.*?\)/g, '')
    .replace(/[0-9]/g, '').replace(/[ \t]+/g, ' ').replace(/_/g, '').trim();
}

function setButtonIcon(type) {
  const allImgs = document.querySelectorAll('.play-main-button img');
  allImgs.forEach(img => {
    img.src = (type === 'pause') ? '/assets/svg/pause-grey.svg' : '/assets/svg/play-grey.svg';
  });
}

function resetUI() {
  document.querySelectorAll('.tts-active').forEach(el => el.classList.remove('tts-active'));
}

// --- Логика данных ---
async function fetchSegmentsData(slug) {
  try {
    const response = await fetch(makeJsonUrl(slug));
    return response.ok ? await response.json() : null;
  } catch (e) { return null; }
}

function detectTranslationLang() {
    const path = window.location.pathname;
    if (path.includes('/th/') || path.includes('/thml/')) return 'th';
    if (path.includes('/en/') || path.includes('/read/')) return 'en';
    return 'ru';
}

async function preparePlaylist(elements, slug, forceLang = null) {
    let cleanJsonMap = {};
    if (forceLang === 'pi' && slug) {
        const jsonData = await fetchSegmentsData(slug);
        if (jsonData) {
            Object.keys(jsonData).forEach(k => {
                const cleanKey = k.split(':').pop();
                cleanJsonMap[cleanKey] = jsonData[k];
            });
        }
    }

    const playlist = [];
    elements.forEach((el) => {
        const domId = el.id || el.closest('[id]')?.id;
        let text = "";
        if (forceLang === 'pi' && domId && cleanJsonMap[domId]) {
            text = cleanJsonMap[domId].replace(/<[^>]*>/g, '');
        } else {
            const clone = el.cloneNode(true);
            clone.querySelectorAll('.variant, .not_translate, sup, .ref').forEach(v => v.remove());
            text = cleanTextForTTS(clone.textContent);
        }
        if (text.length > 0) {
            playlist.push({ text, element: el, lang: forceLang || detectTranslationLang(), id: domId });
        }
    });
    return playlist;
}

// --- Ядро ---
function playCurrentSegment() {
  if (ttsState.currentIndex < 0 || ttsState.currentIndex >= ttsState.playlist.length) {
    stopPlayback();
    return;
  }

  synth.cancel();
  resetUI();

  const item = ttsState.playlist[ttsState.currentIndex];
  
  // Сохраняем прогресс
  if (ttsState.currentSlug) {
      localStorage.setItem(LAST_SLUG_KEY, ttsState.currentSlug);
      localStorage.setItem(LAST_INDEX_KEY, ttsState.currentIndex);
  }
  
  // Подсветка активного элемента
  if (item.element) {
      // Удаляем маркер выбора пользователя, так как плеер пошел дальше
      document.querySelectorAll('.active-word').forEach(e => e.classList.remove('active-word'));
      
      item.element.classList.add('tts-active');
      item.element.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  const utterance = new SpeechSynthesisUtterance(item.text);
  const voices = synth.getVoices();
  let multiplier = 1.0;

  if (item.lang === 'ru') {
      utterance.lang = 'ru-RU';
  } else if (item.lang === 'th') { 
      utterance.lang = 'th-TH'; 
      multiplier = 0.6; 
  } else if (item.lang === 'en') {
      utterance.lang = 'en-US';
  } else if (item.lang === 'pi') {
    if (/[\u0900-\u097F]/.test(item.text)) {
       utterance.lang = 'sa-IN';
       multiplier = 0.6;
    } else {
       const v = voices.find(v => v.lang === 'id-ID' || v.lang === 'it-IT');
       if (v) utterance.voice = v;
       utterance.lang = v ? v.lang : 'en-US';
    }
  }

  utterance.rate = ttsState.userRate * multiplier;

  utterance.onend = () => {
    if (ttsState.speaking && !ttsState.paused) {
      ttsState.currentIndex++;
      playCurrentSegment();
    }
  };

  utterance.onerror = (e) => {
      console.error('TTS Error', e);
      if (ttsState.speaking && !ttsState.paused) {
          ttsState.currentIndex++;
          playCurrentSegment();
      }
  };
  
  ttsState.utterance = utterance;
  
  setTimeout(() => {
      if (!ttsState.paused && ttsState.speaking && ttsState.utterance === utterance) {
          synth.speak(utterance);
      }
  }, 50);
}

function stopPlayback() {
  synth.cancel();
  ttsState.speaking = false;
  ttsState.paused = false;
  if (ttsState.utterance) {
      ttsState.utterance.onend = null;
      ttsState.utterance = null;
  }
  setButtonIcon('play');
  resetUI();
}

async function startPlayback(container, mode, slug, startIndex = 0) {
    const paliEls = container.querySelectorAll('.pli-lang');
    const trnEls = container.querySelectorAll('.rus-lang, .tha-lang, .eng-lang');
    
    let list = [];
    if (mode === 'pi') {
        list = await preparePlaylist(paliEls, slug, 'pi');
    } else if (mode === 'trn') {
        list = await preparePlaylist(trnEls, null);
    } else {
        const pList = await preparePlaylist(paliEls, slug, 'pi');
        const tList = await preparePlaylist(trnEls, null);
        const max = Math.max(pList.length, tList.length);
        for (let i = 0; i < max; i++) {
            if (mode === 'pi-trn') {
                if (pList[i]) list.push(pList[i]);
                if (tList[i]) list.push(tList[i]);
            } else {
                if (tList[i]) list.push(tList[i]);
                if (pList[i]) list.push(pList[i]);
            }
        }
    }

    if (!list.length) return;
    
    // --- ПРИОРИТЕТ 1: Маркер .active-word ---
    const activeMarker = container.querySelector('.active-word');
    if (activeMarker) {
        const markerIndex = list.findIndex(item => 
            item.element && (item.element === activeMarker || item.element.contains(activeMarker))
        );
        if (markerIndex !== -1) {
            startIndex = markerIndex;
        }
    }
    
    stopPlayback();
    
    ttsState.playlist = list;
    ttsState.currentIndex = startIndex;
    ttsState.currentSlug = slug;
    ttsState.langSettings = mode;
    ttsState.speaking = true;
    ttsState.paused = false;
    
    setButtonIcon('pause');
    playCurrentSegment();
}

// --- Обработчики ---
async function handleSuttaClick(e) {
    const container = e.target.closest('.sutta-container') || document;
    
    // 1. ОБРАБОТКА КЛИКА ПО ТЕКСТУ (УСТАНОВКА active-word)
    const textSegment = e.target.closest('.pli-lang, .rus-lang, .tha-lang, .eng-lang');
    // Игнорируем клики внутри меню плеера
    if (textSegment && !e.target.closest('.voice-dropdown')) {
        // Убираем маркер с других мест
        document.querySelectorAll('.active-word').forEach(el => el.classList.remove('active-word'));
        // Ставим на текущий
        textSegment.classList.add('active-word');

        // Если плеер уже загружен и работает (или на паузе), переключаемся на этот кусок
        if (ttsState.playlist.length > 0) {
            const idx = ttsState.playlist.findIndex(item => item.element === textSegment);
            if (idx !== -1) {
                ttsState.currentIndex = idx;
                
                // Если сейчас идет воспроизведение — прыгаем сразу
                if (ttsState.speaking && !ttsState.paused) {
                    if (ttsState.utterance) {
                         ttsState.utterance.onend = null;
                    }
                    synth.cancel();
                    playCurrentSegment();
                }
                // Если пауза или стоп — просто обновили currentIndex (визуально обновится при нажатии Play)
            }
        }
        // Мы не делаем preventDefault, чтобы работало выделение текста браузером
        return; 
    }

    const modeSelect = document.getElementById('tts-mode-select');
    
    // Смена режима
    if (e.target.id === 'tts-mode-select') {
        e.preventDefault();
        const newMode = e.target.value;
        localStorage.setItem(MODE_STORAGE_KEY, newMode);
        
        if (ttsState.speaking || ttsState.paused) {
            const wasPaused = ttsState.paused;
            const currentId = ttsState.playlist[ttsState.currentIndex]?.id;
            const pausedIndex = ttsState.currentIndex;
            
            synth.cancel();
            
            const paliEls = container.querySelectorAll('.pli-lang');
            const trnEls = container.querySelectorAll('.rus-lang, .tha-lang, .eng-lang');
            
            let newList = [];
            // (Логика пересборки плейлиста такая же, как была...)
            if (newMode === 'pi') {
                newList = await preparePlaylist(paliEls, ttsState.currentSlug, 'pi');
            } else if (newMode === 'trn') {
                newList = await preparePlaylist(trnEls, null);
            } else {
                const pList = await preparePlaylist(paliEls, ttsState.currentSlug, 'pi');
                const tList = await preparePlaylist(trnEls, null);
                const max = Math.max(pList.length, tList.length);
                for (let i = 0; i < max; i++) {
                    if (newMode === 'pi-trn') {
                        if (pList[i]) newList.push(pList[i]);
                        if (tList[i]) newList.push(tList[i]);
                    } else {
                        if (tList[i]) newList.push(tList[i]);
                        if (pList[i]) newList.push(pList[i]);
                    }
                }
            }
            
            if (!newList.length) return;
            
            let newIndex = 0;
            if (currentId) {
                const foundIndex = newList.findIndex(item => item.id === currentId);
                if (foundIndex !== -1) newIndex = foundIndex;
            } else if (pausedIndex < newList.length) {
                newIndex = pausedIndex;
            }
            
            ttsState.playlist = newList;
            ttsState.currentIndex = newIndex;
            ttsState.langSettings = newMode;
            ttsState.speaking = true;
            ttsState.paused = wasPaused;
            
            if (!wasPaused) {
                setButtonIcon('pause');
                playCurrentSegment();
            } else {
                setButtonIcon('play');
                resetUI();
                const item = ttsState.playlist[ttsState.currentIndex];
                if (item && item.element) {
                    item.element.classList.add('tts-active');
                    item.element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }
        }
        return;
    }
    
    if (e.target.id === 'tts-rate-select') {
        e.preventDefault();
        ttsState.userRate = parseFloat(e.target.value);
        localStorage.setItem(RATE_STORAGE_KEY, e.target.value);
        if (ttsState.speaking && !ttsState.paused) {
            synth.cancel();
            playCurrentSegment();
        }
        return;
    }

    const voiceLink = e.target.closest('.voice-link');
    const playBtn = e.target.closest('.play-main-button');
    const navBtn = e.target.closest('.prev-main-button, .next-main-button');

    // Клик по ссылке "Voice"
    if (voiceLink) {
        e.preventDefault();
        const parent = voiceLink.closest('.voice-dropdown');
        parent.classList.add('active');
        if (!ttsState.speaking) {
            const mode = modeSelect?.value || localStorage.getItem(MODE_STORAGE_KEY) || (window.location.pathname.match(/\/d\/|\/memorize\//) ? 'pi' : 'trn');
            const targetSlug = voiceLink.dataset.slug;
            
            let startIndex = 0;
            const savedSlug = localStorage.getItem(LAST_SLUG_KEY);
            const savedIndex = parseInt(localStorage.getItem(LAST_INDEX_KEY), 10);
            
            // Если есть active-word, оно обработается внутри startPlayback.
            // Если нет, берем из памяти.
            const hasActive = container.querySelector('.active-word');
            if (!hasActive && savedSlug === targetSlug && !isNaN(savedIndex)) {
                startIndex = savedIndex;
            }

            startPlayback(container, mode, targetSlug, startIndex);
        }
        return;
    }

    // Навигация
    if (navBtn) {
        e.preventDefault();
        if (!ttsState.speaking || ttsState.playlist.length === 0) return;
        
        let direction = navBtn.classList.contains('prev-main-button') ? -1 : 1;
        let newIndex = ttsState.currentIndex + direction;

        if (newIndex < 0) newIndex = 0;
        if (newIndex >= ttsState.playlist.length) newIndex = ttsState.playlist.length - 1;

        if (!ttsState.paused) {
            if (ttsState.utterance) {
                ttsState.utterance.onend = null;
                ttsState.utterance.onerror = null;
            }
            synth.cancel();
            ttsState.currentIndex = newIndex;
            playCurrentSegment();
        } else {
            ttsState.currentIndex = newIndex;
            resetUI();
            const item = ttsState.playlist[ttsState.currentIndex];
            if (item && item.element) {
                item.element.classList.add('tts-active');
                item.element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
        return;
    }

    // Play/Pause
    if (playBtn && !e.target.classList.contains('voice-link')) {
        e.preventDefault();
        
        const hasActiveMarker = container.querySelector('.active-word');
        
        // Логика: если есть маркер, то мы форсируем старт с него, даже если была просто пауза
        // Но если мы УЖЕ говорим этот самый фрагмент, то не перезапускаем
        
        if (ttsState.speaking && !ttsState.paused && !hasActiveMarker) {
            ttsState.paused = true;
            synth.cancel();
            setButtonIcon('play');
        } else if (ttsState.paused && !hasActiveMarker) {
            ttsState.paused = false;
            setButtonIcon('pause');
            playCurrentSegment();
        } else {
            // Старт / Рестарт
            const mode = modeSelect?.value || localStorage.getItem(MODE_STORAGE_KEY) || (window.location.pathname.match(/\/d\/|\/memorize\//) ? 'pi' : 'trn');
            
            let targetSlug = playBtn.dataset.slug;
            if (!targetSlug) {
                const parentDropdown = playBtn.closest('.voice-dropdown');
                const siblingLink = parentDropdown ? parentDropdown.querySelector('.voice-link') : null;
                if (siblingLink) targetSlug = siblingLink.dataset.slug;
            }

            let startIndex = 0;
            const savedSlug = localStorage.getItem(LAST_SLUG_KEY);
            const savedIndex = parseInt(localStorage.getItem(LAST_INDEX_KEY), 10);
            
            // Если нет маркера, пытаемся восстановить. Если есть маркер, startPlayback сам его найдет.
            if (!hasActiveMarker && targetSlug && savedSlug === targetSlug && !isNaN(savedIndex)) {
                startIndex = savedIndex;
            }

            if (targetSlug) {
                startPlayback(container, mode, targetSlug, startIndex);
            }
        }
    }

    if (e.target.closest('.close-tts-btn')) {
        e.preventDefault();
        stopPlayback();
        e.target.closest('.voice-dropdown').classList.remove('active');
    }
}

window.speechSynthesis.onvoiceschanged = () => synth.getVoices();
document.addEventListener('click', handleSuttaClick);
document.addEventListener('DOMContentLoaded', () => { synth.getVoices(); });

// --- Интерфейс ---
function getTTSInterfaceHTML(texttype, slugReady, slug) {
    const isSpecialPath = window.location.pathname.match(/\/d\/|\/memorize\//);
    const defaultMode = isSpecialPath ? 'pi' : 'trn';
    const savedMode = localStorage.getItem(MODE_STORAGE_KEY) || defaultMode;
    const savedRate = localStorage.getItem(RATE_STORAGE_KEY) || "1.0";
    
    const modeLabels = { 'pi': 'Pāḷi', 'pi-trn': 'Pāḷi+Trn', 'trn': 'Trn', 'trn-pi': 'Tr+Pāḷi' };
    const rates = [0.25, 0.5, 1.0, 1.25, 1.5, 1.75, 2.0, 2.5, 3.0];

    return `
    <span class='voice-dropdown'>
        <a data-slug="${texttype}/${slugReady}" href='javascript:void(0)' class='voice-link'>Voice</a>&nbsp;
        <span class='voice-player'>
            <a href="javascript:void(0)" class="close-tts-btn" style="float:right; font-size:20px;">&times;</a>
            <a href="javascript:void(0)" class="prev-main-button tts-icon-btn"><img src="/assets/svg/backward-step.svg" style="width:20px;"></a>
            <a href="javascript:void(0)" class="play-main-button tts-icon-btn large"><img src="/assets/svg/play-grey.svg" style="width:34px;"></a> 
            <a href="javascript:void(0)" class="next-main-button tts-icon-btn"><img src="/assets/svg/forward-step.svg" style="width:20px;"></a>
            <br>
            <select id="tts-mode-select" class="tts-mode-select" style="font-size:14px;">
                ${Object.entries(modeLabels).map(([val, label]) => `<option value="${val}" ${savedMode === val ? 'selected' : ''}>${label}</option>`).join('')}
            </select>
            <select id="tts-rate-select" class="tts-rate-select" style="font-size:14px;">
                ${rates.map(r => `<option value="${r}" ${savedRate == r ? 'selected' : ''}>${r}x</option>`).join('')}
            </select>
            <br>
            <a href="/tts.php${window.location.search}" class="tts-text-link">Alt</a> |
<a title='sc-voice.net' href='https://www.sc-voice.net/?src=sc#/sutta/$fromjs'>Alt2</a> 
            `;
}
