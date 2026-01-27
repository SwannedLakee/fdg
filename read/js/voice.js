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
    .replace(/Pāḷi MS/g, 'पाऌइ महसङ्गीति') 
    .replace(/[Пп]ер\./g, 'Перевод') 
    .replace(/”/g, '')
    .replace(/ред\./g, 'отредактировано')
    .replace(/Англ/g, 'Английского')
    .replace(/Trn\./g, 'Translation')
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
    if (!response.ok) return null;

    const data = await response.json();

    Object.keys(data).forEach(k => {
      data[k] = data[k].replace(/”/g, '');
    });

    return data;
  } catch (e) {
    return null;
  }
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

  const currentPath = window.location.pathname;
  const isEnglishPath = currentPath.includes('/read/') || currentPath.includes('/b/');

  // Вспомогательная функция для поиска мужского голоса
  const findMaleVoice = (langCode, preferredNames) => {
    // 1. Сначала ищем по списку имен (мужских)
    let voice = voices.find(v => 
      v.lang.startsWith(langCode) && 
      preferredNames.some(name => v.name.includes(name))
    );
    // 2. Если не нашли, ищем любой голос Google для этого языка
    if (!voice) {
      voice = voices.find(v => v.lang.startsWith(langCode) && v.name.includes('Google'));
    }
    // 3. Если и так нет, берем первый попавшийся для языка
    if (!voice) {
      voice = voices.find(v => v.lang.startsWith(langCode));
    }
    return voice;
  };

  // --- ЛОГИКА ВЫБОРА ГОЛОСА ---

  if (isEnglishPath && item.lang !== 'pi') {
    utterance.lang = 'en-US';
    // Приоритетные мужские имена для EN: David, Guy, Male
    utterance.voice = findMaleVoice('en', ['David', 'Guy', 'Male', 'Microsoft James']);
  } 
  else if (item.lang === 'ru') {
    utterance.lang = 'ru-RU';
    // Приоритетные мужские имена для RU: Pavel, Dmitry, Male
    utterance.voice = findMaleVoice('ru', ['Pavel', 'Dmitry', 'Male', 'Microsoft Pavel']);
  } 
  else if (item.lang === 'th') {
    utterance.lang = 'th-TH';
    utterance.voice = findMaleVoice('th', ['Male', 'Niwat']); // Niwat - частый мужской голос в TH
  } 
  else if (item.lang === 'pi') {
    if (/[\u0900-\u097F]/.test(item.text)) {
       utterance.lang = 'sa-IN';
       utterance.rate = ttsState.userRate * 0.6;
    } else {
       const piVoice = voices.find(v => v.lang === 'id-ID') || voices.find(v => v.lang === 'it-IT');
       if (piVoice) utterance.voice = piVoice;
       utterance.lang = piVoice ? piVoice.lang : 'en-US';
    }
  } 
  else {
    utterance.lang = 'en-US';
  }

  utterance.onend = () => {
    if (ttsState.speaking && !ttsState.paused) {
      ttsState.currentIndex++;
      playNextSegment();
    }
  };

  utterance.onerror = (event) => {
    ttsState.currentIndex++;
    playNextSegment();
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
    const playBtn = e.target.closest('.play-main-button');
    const navBtn = e.target.closest('.prev-main-button, .next-main-button');

    // Новое: если окно открыто и клик вне него, ничего не делать (не закрывать)
    const activeDropdown = document.querySelector('.voice-dropdown.active');
    if (activeDropdown && !activeDropdown.contains(e.target)) {
        return;
    }

    // 1. Клик по ссылке "Voice"
    if (voiceLink) {
        e.preventDefault();
        e.stopPropagation();
        const parent = voiceLink.closest('.voice-dropdown');
        const isActive = parent.classList.contains('active');
        
        // Закрываем все другие открытые окна
        document.querySelectorAll('.voice-dropdown.active').forEach(el => {
            if (el !== parent) el.classList.remove('active');
        });
        
        // Если окно уже активно - НЕ закрываем его (только по крестику)
        // Если не активно - открываем
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

    // 2. Закрытие по крестику - ЕДИНСТВЕННЫЙ способ закрыть окно
    if (closeBtn) {
        e.preventDefault();
        e.stopPropagation();
        closeBtn.closest('.voice-dropdown')?.classList.remove('active');
        return;
    }

    // 3. Обработка навигации внутри окна
    if (navBtn) {
        e.preventDefault();
        e.stopPropagation();
        const direction = navBtn.classList.contains('next-main-button') ? 'next' : 'prev';
        changeSegment(direction);
        return;
    }

    // 4. Обработка Play/Pause
    if (playBtn) {
        e.preventDefault();
        e.stopPropagation();
        
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



// --- Интеграция с интерфейсом ---
function getTTSInterfaceHTML(texttype, slugReady, slug) {
    const path = window.location.pathname;
    const isMemorize = path.includes('/d/') || path.includes('/memorize/');
    const defaultMode = isMemorize ? 'pi' : 'trn';
    const savedMode = localStorage.getItem('tts_preferred_mode') || defaultMode;

    const modeLabels = {
        'pi': 'Pāḷi',
        'pi-trn': 'Pāḷi + Перевод',
        'trn': 'Перевод',
        'trn-pi': 'Перевод + Пали'
    };

    // Возвращаем HTML плеера + пустой span для доп. ссылок
    return `
    <span class='voice-dropdown'>
        <a data-slug="${texttype}/${slugReady}" data-root-slug="${slug}" href='javascript:void(0)' class='play-main-button voice-link fdgLink mainLink' title='TTS Options'>Voice</a>&nbsp;
        <span class='voice-player'>
            <a href="javascript:void(0)" class="close-tts-btn" style="float:right; margin-top:-15px; margin-right:-10px; font-size:24px; text-decoration:none; color:#888;">&times;</a>
            <a href="javascript:void(0)" title="Prev" class="prev-main-button tts-icon-btn"><img class="tts-mini-button" src="/assets/svg/backward-step.svg"></a>
            <a href="javascript:void(0)" title="Play/Pause" data-slug="${texttype}/${slugReady}" class="play-main-button tts-icon-btn large"><img class="tts-main-img" src="/assets/svg/play-grey.svg" style="width:34px; height:34px;"></a> 
            <a href="javascript:void(0)" title="Next" class="next-main-button tts-icon-btn"><img class="tts-mini-button" src="/assets/svg/forward-step.svg"></a>
            <br>
            <select id="tts-mode-select" class="tts-mode-select">
                ${Object.entries(modeLabels).map(([val, label]) => 
                    `<option value="${val}" ${savedMode === val ? 'selected' : ''}>${label}</option>`
                ).join('')}
            </select>
            <br>
            <a href="/tts.php${window.location.search}" class="tts-text-link">Open</a> | 
            <a title='sc-voice.net' href='https://www.sc-voice.net/?src=sc#/sutta/${slug}'>Alt</a>
    `; // Закрываем <p>, который открылся в scLink
}

/*
        </span>
    </span>
    <span id="extra-links-container"></span>
    </p>
    
*/
// Функция для загрузки внешних ссылок (бывший AJAX из ордера)
function loadExtraLinks(slug) {
    $.ajax({
        url: "/read/php/extralinksNew.php?fromjs=" + slug
    }).done(function(data) {
        const container = document.getElementById('extra-links-container');
        if (container && data.split(",")[0].length >= 4) {
            container.innerHTML = data.split(",")[0];
        }
    });
}
