// --- Конфигурация путей ---
const makeJsonUrl = (slug) => {
  const basePath = '/assets/texts/devanagari/root/pli/ms/';
  const suffix = '_rootd-pli-ms.json';
  return `${basePath}${slug}${suffix}`;
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
    .replace(/[Рр]ед\./g, 'отнедактиновано') 
    .replace(/Trn:/g, 'Translated by') 
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
    
    // --- УНИВЕРСАЛЬНЫЙ ПОИСК ПО ID РОДИТЕЛЯ ---
    const activeMarker = container.querySelector('.active-word');
    if (activeMarker) {
        // Ищем id у самого элемента или у ближайшего родителя (например, <p> или <tr>)
        const parentWithId = activeMarker.closest('[id]');
        const targetId = parentWithId ? parentWithId.id : null;

        if (targetId) {
            // Ищем в плейлисте элемент с таким же ID
            const markerIndex = list.findIndex(item => item.id === targetId);

            if (markerIndex !== -1) {
                startIndex = markerIndex;
                console.log(`[TTS] Переход по ID: ${targetId}, индекс в плейлисте: ${markerIndex}`);
            } else {
                // Если в текущем режиме (например, "только пали") нет этого ID
                console.warn(`[TTS] ID ${targetId} не найден в текущем плейлисте (режим: ${mode})`);
            }
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
    
    const voiceLink = e.target.closest('.voice-link');
    const playBtn = e.target.closest('.play-main-button');
    const navBtn = e.target.closest('.prev-main-button, .next-main-button');

    // Инициализация при клике на Voice
    if (voiceLink) {
        e.preventDefault();
        const parent = voiceLink.closest('.voice-dropdown');
        parent.classList.add('active');
        if (!ttsState.speaking) {
            const modeSelect = document.getElementById('tts-mode-select');
            const mode = e.target.closest('.voice-dropdown')?.querySelector('#tts-mode-select')?.value 
                         || localStorage.getItem(MODE_STORAGE_KEY) 
                         || (window.location.pathname.match(/\/d\/|\/memorize\//) ? 'pi' : 'trn');
            const targetSlug = voiceLink.dataset.slug;
            
            // Если есть active-word, startPlayback сам вычислит startIndex
            startPlayback(container, mode, targetSlug, 0);
        }
        return;
    }

    // Кнопки навигации
    if (navBtn) {
        e.preventDefault();
        if (!ttsState.speaking || ttsState.playlist.length === 0) return;
        
        let direction = navBtn.classList.contains('prev-main-button') ? -1 : 1;
        let newIndex = ttsState.currentIndex + direction;
        if (newIndex < 0) newIndex = 0;
        if (newIndex >= ttsState.playlist.length) newIndex = ttsState.playlist.length - 1;

        if (!ttsState.paused) {
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

    // Основная кнопка Play/Pause
    if (playBtn && !e.target.classList.contains('voice-link')) {
        e.preventDefault();
        const activeMarker = container.querySelector('.active-word');
        
        // Если словарь выделил слово — всегда переходим к нему
        if (activeMarker) {
            const modeSelect = document.getElementById('tts-mode-select');
            const mode = modeSelect?.value || localStorage.getItem(MODE_STORAGE_KEY) || 'trn';
            let targetSlug = playBtn.dataset.slug || ttsState.currentSlug;
            
            startPlayback(container, mode, targetSlug, 0);
            return;
        }

        // Обычная логика паузы
        if (ttsState.speaking && !ttsState.paused) {
            ttsState.paused = true;
            synth.cancel();
            setButtonIcon('play');
        } else if (ttsState.paused) {
            ttsState.paused = false;
            setButtonIcon('pause');
            playCurrentSegment();
        } else {
            const modeSelect = document.getElementById('tts-mode-select');
            const mode = modeSelect?.value || localStorage.getItem(MODE_STORAGE_KEY) || 'trn';
            startPlayback(container, mode, playBtn.dataset.slug, 0);
        }
    }

    // Закрытие плеера
    if (e.target.closest('.close-tts-btn')) {
        e.preventDefault();
        stopPlayback();
        const dropdown = e.target.closest('.voice-dropdown');
        if (dropdown) dropdown.classList.remove('active');
    }
}


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
            <a href="/tts.php${window.location.search}" class="tts-text-link">TTS</a> |
<a title='sc-voice.net' href='https://www.sc-voice.net/?src=sc#/sutta/$fromjs'>VSC</a> 
            `;
}

// --- Отдельные обработчики для событий change ---
async function handleTTSSettingChange(e) {
    if (e.target.id === 'tts-mode-select' || e.target.id === 'tts-rate-select') {
        e.preventDefault();
        
        const container = document.querySelector('.sutta-container') || document;
        
        if (e.target.id === 'tts-mode-select') {
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
        }
        
        if (e.target.id === 'tts-rate-select') {
            ttsState.userRate = parseFloat(e.target.value);
            localStorage.setItem(RATE_STORAGE_KEY, e.target.value);
            if (ttsState.speaking && !ttsState.paused) {
                synth.cancel();
                playCurrentSegment();
            }
        }
    }
}

// Вешаем обработчик change на документ
document.addEventListener('change', handleTTSSettingChange);

// Инициализация voices и обработчиков остается прежней
window.speechSynthesis.onvoiceschanged = () => synth.getVoices();
document.addEventListener('click', handleSuttaClick);
document.addEventListener('DOMContentLoaded', () => { synth.getVoices(); });


document.addEventListener("click", function (e) {
  const word = e.target.closest(".pli-lang");

  // Если клик по слову
  if (word) {
    // 1. ПРОВЕРКА: Если слово уже активно (второй клик) -> снимаем выделение
    if (word.classList.contains("active-word")) {
      word.classList.remove("active-word");
      // Здесь также можно добавить закрытие попапа/iframe, если нужно
      return; 
    }

    // 2. Обычное поведение: сбрасываем старые и выделяем новое
    document
      .querySelectorAll(".pli-lang.active-word")
      .forEach(el => el.classList.remove("active-word"));

    word.classList.add("active-word");
    return;
  }

  // Если клик НЕ по слову — снять подсветку со всех
  document
    .querySelectorAll(".pli-lang.active-word")
    .forEach(el => el.classList.remove("active-word"));
});
