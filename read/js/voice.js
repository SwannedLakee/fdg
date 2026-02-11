/// --- Конфигурация путей ---
const makeJsonUrl = (slug) => {
  const basePath = '/assets/texts/devanagari/root/pli/ms/';
  const suffix = '_rootd-pli-ms.json';
  const fullPath = `${basePath}${slug}${suffix}`;
  return fullPath;
};

// --- Глобальное состояние и Константы ---
let wakeLock = null; 

const SCROLL_STORAGE_KEY = 'tts_auto_scroll'; 
const MODE_STORAGE_KEY = 'tts_preferred_mode';

const RATE_PALI_KEY = 'tts_rate_pali'; 
const RATE_TRN_KEY = 'tts_rate_trn';

const LAST_SLUG_KEY = 'tts_last_slug';   
const LAST_INDEX_KEY = 'tts_last_index'; 
const PALI_ALERT_KEY = 'tts_pali_alert_shown';

// --- Google TTS Config ---
const GOOGLE_KEY_STORAGE = 'tts_google_key';

const GOOGLE_VOICES = {
  'pi-dev': { languageCode: 'kn-IN', name: 'kn-IN-Standard-D' }, 
//  'pi-dev': { languageCode: 'hi-IN', name: 'hi-IN-Standard-C' }, 
  'ru':     { languageCode: 'ru-RU', name: 'ru-RU-Standard-D' }, 
  'en':     { languageCode: 'en-US', name: 'en-US-Standard-D' }, 
  'th':     { languageCode: 'th-TH', name: 'th-TH-Standard-A' }  
};

const PALI_RATIO = 0.6; 

const RATES_PALI = [0.25, 0.5, 0.6, 0.8, 1.0, 1.25, 1.5];
const RATES_TRN = [0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0, 2.5];

const ttsState = {
  playlist: [],
  currentIndex: 0,
  button: null,
  speaking: false,
  paused: false,
  utterance: null,   
  googleAudio: null, 
  langSettings: null,
  autoScroll: localStorage.getItem(SCROLL_STORAGE_KEY) !== 'false', 
  currentSlug: null,
  isNavigating: false 
};

const synth = window.speechSynthesis;

// --- Утилиты ---

function updateRateOptions(isPali, activeRate) {
  const rateSelect = document.getElementById('tts-rate-select');
  if (!rateSelect) return;

  const ratesToUse = isPali ? RATES_PALI : RATES_TRN;
  
  let displayRates = [...ratesToUse];
  if (!displayRates.includes(activeRate)) {
    displayRates.push(activeRate);
    displayRates.sort((a, b) => a - b);
  }

  const optionsHtml = displayRates.map(r => 
    `<option value="${r}" ${r === activeRate ? 'selected' : ''}>${r}x</option>`
  ).join('');

  if (rateSelect.innerHTML !== optionsHtml) {
    rateSelect.innerHTML = optionsHtml;
  }
  
  rateSelect.value = activeRate;
}

function getRateForLang(lang) {
  if (lang === 'pi-dev') {
    return parseFloat(localStorage.getItem(RATE_PALI_KEY)) || 1.0; 
  } else {
    return parseFloat(localStorage.getItem(RATE_TRN_KEY)) || 1.0; 
  }
}

async function requestWakeLock() {
  if ('wakeLock' in navigator) {
    try {
      wakeLock = await navigator.wakeLock.request('screen');
      wakeLock.addEventListener('release', () => {
        console.log('Wake Lock released');
      });
      console.log('Wake Lock active');
    } catch (err) {
      console.error(`${err.name}, ${err.message}`);
    }
  }
}

async function releaseWakeLock() {
  if (wakeLock !== null) {
    await wakeLock.release();
    wakeLock = null;
    console.log('Wake Lock released manually');
  }
}

function clearTtsStorage() {
  localStorage.removeItem(LAST_SLUG_KEY);
  localStorage.removeItem(LAST_INDEX_KEY);
  console.log('TTS Storage cleared (end of track reached)');
}

function cleanTextForTTS(text) {
  if (!text) return "";
  return text
    .replace(/[Пп]ер\./g, 'Перевод') 
    .replace(/Англ,/g, 'английского,') 
    .replace(/[Рр]ед\./g, 'отредактировано') 
    .replace(/Trn:/g, 'Translated by') 
    .replace(/Pāḷi MS/g, 'पालि महासङ्गीति')
    .replace(/”/g, '')
    .replace(/ पन[\.:, ]/g, 'पना ') 
    .replace(/स्स[\.:, ]/g, 'स्सा ')
    .replace(/स[\.:, ]/g, 'सा ')
    .replace(/म्म[\.:, ]/g, 'म्मा ')
    .replace(/म[\.:, ]/g, 'मा ')
    .replace(/फस्स/g, 'प्हस्स')
    .replace(/फ/g, 'प्ह')
    .replace(/…पे…/g, '…पेय्याल…')
    .replace(/’ति/g, 'ति')
    .replace(/\{.*?\}/g, '')
    .replace(/\(.*?\)/g, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/_/g, '').trim();
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
  } catch (e) { 
    console.warn(`Не удалось загрузить JSON для ${slug}`, e);
    return null; 
  }
}

function detectTranslationLang() {
  const path = window.location.pathname;
  if (path.includes('/th/') || path.includes('/thml/')) return 'th';
  if (path.includes('/en/') || path.includes('/b/') || path.includes('/read/')) return 'en';
  return 'ru';
}

function getElementId(el) {
  return el.id || el.closest('[id]')?.id;
}

// --- Google API Helper ---
async function fetchGoogleAudio(text, lang, rate, apiKey) {
  const voiceConfig = GOOGLE_VOICES[lang] || GOOGLE_VOICES['en'];
  const url = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`;
  
  const payload = {
    input: { text: text },
    voice: { languageCode: voiceConfig.languageCode, name: voiceConfig.name },
    audioConfig: { 
        audioEncoding: 'MP3',
        speakingRate: rate, 
        pitch: lang === 'pi-dev' ? -2.0 : 0 
    }
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    if (data.error) {
        throw new Error(data.error.message);
    }
    return data.audioContent; 
  } catch (e) {
    console.warn('Google TTS Fetch Error:', e);
    return null;
  }
}

// --- Подготовка данных ---
async function prepareTextData(slug) {
  const container = document.querySelector('.sutta-container') || document;
  
  const paliElements = container.querySelectorAll('.pli-lang');
  const translationElements = container.querySelectorAll('.rus-lang, .tha-lang, .eng-lang');
  
  const paliJsonData = await fetchSegmentsData(slug);
  const cleanJsonMap = {};
  const jsonKeys = []; 

  if (paliJsonData) {
    Object.keys(paliJsonData).forEach(key => {
      const cleanKey = key.split(':').pop();
      const rawText = paliJsonData[key].replace(/<[^>]*>/g, '').trim(); 
      cleanJsonMap[cleanKey] = cleanTextForTTS(rawText);
      jsonKeys.push(cleanKey); 
    });
  }

  const allIds = new Set();
  const allNodesInOrder = container.querySelectorAll('.pli-lang, .rus-lang, .tha-lang, .eng-lang');
  
  allNodesInOrder.forEach(el => {
    const id = getElementId(el);
    if (id) allIds.add(id);
  });
  
  const textData = [];
  
  allIds.forEach(id => {
    const paliElement = Array.from(paliElements).find(el => getElementId(el) === id);
    const translationElement = Array.from(translationElements).find(el => getElementId(el) === id);
    
    let paliDev = '';
    let translation = '';
    
    if (cleanJsonMap[id]) {
      paliDev = cleanJsonMap[id];
      const currentIndex = jsonKeys.indexOf(id);
      if (currentIndex !== -1) {
        let lookAheadIndex = currentIndex + 1;
        while (lookAheadIndex < jsonKeys.length) {
          const nextKey = jsonKeys[lookAheadIndex];
          if (allIds.has(nextKey)) break;
          const nextVal = cleanJsonMap[nextKey];
          if (nextVal) {
             const lowerNext = nextVal.charAt(0).toLowerCase() + nextVal.slice(1);
             paliDev += " " + lowerNext;
          }
          lookAheadIndex++;
        }
      }
    }
    
    if (translationElement) {
      const clone = translationElement.cloneNode(true);
      clone.querySelectorAll('.variant, .not_translate, sup, .ref').forEach(v => v.remove());
      translation = cleanTextForTTS(clone.textContent);
    }
    
    if (paliDev || translation) {
      textData.push({
        id: id,
        paliDev: paliDev,
        translation: translation,
        paliElement: paliElement || null,
        translationElement: translationElement || null
      });
    }
  });
  
  return textData;
}

function createPlaylistFromData(textData, mode) {
  const playlist = [];
  const translationLang = detectTranslationLang();
  
  textData.forEach(item => {
    const addPali = () => {
        if (item.paliDev) playlist.push({
          text: item.paliDev, lang: 'pi-dev', element: item.paliElement, id: item.id
        });
    };
    const addTrn = () => {
        if (item.translation) playlist.push({
          text: item.translation, lang: translationLang, element: item.translationElement, id: item.id
        });
    };

    if (mode === 'pi') { addPali(); }
    else if (mode === 'trn') { addTrn(); }
    else if (mode === 'pi-trn') { addPali(); addTrn(); }
    else if (mode === 'trn-pi') { addTrn(); addPali(); }
  });
  
  return playlist;
}

// --- Ядро TTS ---
async function playCurrentSegment() {
  if (ttsState.currentIndex < 0 || ttsState.currentIndex >= ttsState.playlist.length) {
    clearTtsStorage();
    stopPlayback();
    return;
  }

  if (!wakeLock && !ttsState.paused) {
    requestWakeLock();
  }

  if (ttsState.utterance) {
    ttsState.utterance.onend = null;
    ttsState.utterance.onerror = null;
  }
  
  synth.cancel();
  
  if (ttsState.googleAudio) {
      ttsState.googleAudio.pause();
      ttsState.googleAudio = null;
  }

  resetUI();

  const item = ttsState.playlist[ttsState.currentIndex];
  
  if (ttsState.currentSlug) {
    if (ttsState.currentIndex >= ttsState.playlist.length - 2) {
       clearTtsStorage(); 
    } else {
       localStorage.setItem(LAST_SLUG_KEY, ttsState.currentSlug);
       localStorage.setItem(LAST_INDEX_KEY, ttsState.currentIndex);
    }
  }
  
  if (item.element) {
    document.querySelectorAll('.active-word').forEach(e => e.classList.remove('active-word'));
    
    if (item.element.classList.contains('pli-lang')) {
      item.element.classList.add('active-word');
    }
    
    const segmentId = item.id;
    const segmentContainer = document.getElementById(segmentId);

    if (segmentContainer) {
        const connectedElements = segmentContainer.querySelectorAll('.pli-lang, .rus-lang, .tha-lang, .eng-lang');
        if (connectedElements.length > 0) {
            connectedElements.forEach(el => el.classList.add('tts-active'));
        } else {
            segmentContainer.classList.add('tts-active');
        }
    } else {
        item.element.classList.add('tts-active');
    }
    
    if (ttsState.autoScroll) {
      item.element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  let uiRate = 1.0;     
  let audioRate = 1.0;  
  let isPali = false;
  let targetLang = 'en';

  if (item.lang === 'ru') {
    uiRate = getRateForLang('ru');
    audioRate = uiRate;
    targetLang = 'ru';
  } else if (item.lang === 'th') { 
    uiRate = getRateForLang('th'); 
    audioRate = uiRate;
    targetLang = 'th';
  } else if (item.lang === 'en') {
    uiRate = getRateForLang('en');
    audioRate = uiRate;
    targetLang = 'en';
  } else if (item.lang === 'pi-dev') {
    isPali = true;
    targetLang = 'pi-dev';
    uiRate = getRateForLang('pi-dev');
    audioRate = uiRate * PALI_RATIO;
  }
  
  const rateSelect = document.getElementById('tts-rate-select');
  if (rateSelect) {
      updateRateOptions(isPali, uiRate);
      if (isPali) {
          rateSelect.style.borderStyle = '';
          rateSelect.title = "Скорость Пали (нормализована: 1.0 = медленно)";
      } else {
          rateSelect.style.borderStyle = 'dashed';
          rateSelect.title = "Скорость Перевода";
      }
  }

  // === ПРОВЕРКА: Использовать ли Google TTS? ===
  const googleKey = localStorage.getItem(GOOGLE_KEY_STORAGE);
  
  if (googleKey && googleKey.length > 10) {
      try {
          const audioContent = await fetchGoogleAudio(item.text, targetLang, audioRate, googleKey);
          
          if (audioContent) {
              const audio = new Audio("data:audio/mp3;base64," + audioContent);
              ttsState.googleAudio = audio;
              
              audio.onended = () => {
                  ttsState.googleAudio = null;
                  if (ttsState.speaking && !ttsState.paused) {
                      ttsState.currentIndex++;
                      playCurrentSegment();
                  }
              };
              
              audio.onerror = (err) => {
                  console.error("Google Audio playback error", err);
                  playBrowserTTS(item.text, targetLang, audioRate, isPali); 
              };

              if (!ttsState.paused) {
                  const playPromise = audio.play();
                  if (playPromise !== undefined) {
                      playPromise.catch(e => {
                          console.warn("Autoplay blocked or failed", e);
                          ttsState.paused = true; 
                          setButtonIcon('play');
                      });
                  }
              }
              return; 
          }
      } catch (e) {
          console.warn("Google TTS failed, falling back to browser", e);
      }
  }

  playBrowserTTS(item.text, targetLang, audioRate, isPali);
}

function playBrowserTTS(text, langKey, rate, isPali) {
  const utterance = new SpeechSynthesisUtterance(text);
  
  if (langKey === 'ru') utterance.lang = 'ru-RU';
  else if (langKey === 'th') utterance.lang = 'th-TH';
  else if (langKey === 'en') utterance.lang = 'en-US';
  else if (langKey === 'pi-dev') {
     utterance.lang = 'sa-IN'; 
     utterance._fallbackAttempt = 0; 
  }

  utterance.rate = rate;

  utterance.onend = () => {
    if (ttsState.speaking && !ttsState.paused) {
      ttsState.currentIndex++;
      playCurrentSegment();
    }
  };

  utterance.onerror = (e) => {
    console.error('Browser TTS Error', e);
    
    if (langKey === 'pi-dev') {
      const currentAttempt = utterance._fallbackAttempt || 0;
      
      if (currentAttempt === 0 && utterance.lang === 'sa-IN') {
        console.log('Sanskrit failed, trying Hindi...');
        utterance.lang = 'hi-IN';
        utterance._fallbackAttempt = 1;
        utterance.rate = rate; 
        setTimeout(() => { if (ttsState.speaking && !ttsState.paused) synth.speak(utterance); }, 1);
        return;
      }
      
      if (currentAttempt === 1 && utterance.lang === 'hi-IN') {
        console.log('Hindi failed, trying English...');
        utterance.lang = 'en-US';
        utterance._fallbackAttempt = 2;
        utterance.rate = rate;
        
        setTimeout(() => {
          if (ttsState.speaking && !ttsState.paused) {
            synth.speak(utterance);
            
            const pathLang = location.pathname.split('/')[1];
            const isRuLike = ['ru', 'r', 'ml'].includes(pathLang);
            const helpUrl = isRuLike ? '/assets/common/ttsHelp.html#tts-help-ru' : '/assets/common/ttsHelp.html#tts-help-en';
            const title = isRuLike ? 'TTS:' : 'TTS Hint:';
            const helpLink = `<a href="${helpUrl}" target="_blank" style="color: #4da6ff;">(?)</a>`;
            const message = isRuLike 
              ? `Не найдено модулей близких к Пали. Установлен Английский. См. помощь ${helpLink}.`
              : `No Pāḷi-friendly voices found. Using English. See help ${helpLink}.`;
            showVoiceHint(title, message, PALI_ALERT_KEY);
          }
        }, 1);
        return;
      }
    }
    
    if (document.hidden || e.error === 'interrupted') {
      ttsState.paused = true;
      setButtonIcon('play');
      return; 
    }

    if (ttsState.speaking && !ttsState.paused) {
      ttsState.currentIndex++;
      playCurrentSegment();
    }
  };
  
  ttsState.utterance = utterance;
  
  if (!ttsState.paused) {
    setTimeout(() => {
      if (ttsState.speaking && !ttsState.paused && ttsState.utterance === utterance) {
        synth.speak(utterance);
      }
    }, 50);
  }
}

// --- Обработчики событий ---
async function handleSuttaClick(e) {
  // --- 1. Обработка кнопки настроек (Анимация) ---
  if (e.target.closest('#tts-settings-toggle')) {
    e.preventDefault();
    const panel = document.getElementById('tts-settings-panel');
    const icon = document.getElementById('tts-settings-icon');
    
    if (panel) {
        // Переключаем класс видимости
        panel.classList.toggle('visible');
        
        // Вращаем иконку
        if (panel.classList.contains('visible')) {
            if (icon) icon.style.transform = 'rotate(90deg)';
        } else {
            if (icon) icon.style.transform = 'rotate(0deg)';
        }
    }
    return;
  }

  const container = e.target.closest('.sutta-container') || document;
  const voiceLink = e.target.closest('.voice-link');
  const playBtn = e.target.closest('.play-main-button');
  const navBtn = e.target.closest('.prev-main-button, .next-main-button');

  if (voiceLink) {
    e.preventDefault();
    const player = getOrBuildPlayer();
    
    const targetSlug = voiceLink.dataset.slug;
    const internalPlayBtn = player.querySelector('.play-main-button');
    if (internalPlayBtn && targetSlug) {
        internalPlayBtn.dataset.slug = targetSlug;
    }

    player.classList.add('active');
    
    if (!ttsState.speaking) {
      const mode = player.querySelector('#tts-mode-select')?.value 
                   || localStorage.getItem(MODE_STORAGE_KEY) 
                   || (window.location.pathname.match(/\/d\/|\/memorize\//) ? 'pi' : 'trn');
      
      startPlayback(container, mode, targetSlug, 0);
    }
    return;
  }

  if (navBtn) {
    e.preventDefault();
    if (!ttsState.speaking || ttsState.playlist.length === 0) return;
    
    let direction = navBtn.classList.contains('prev-main-button') ? -1 : 1;
    let newIndex = ttsState.currentIndex + direction;
    
    if (direction < 0 && newIndex < 0) newIndex = 0;
    else if (direction > 0 && newIndex >= ttsState.playlist.length) newIndex = ttsState.playlist.length - 1;
    
    if (newIndex === ttsState.currentIndex) return;
    
    synth.cancel();
    if (ttsState.googleAudio) {
        ttsState.googleAudio.pause();
        ttsState.googleAudio = null;
    }

    ttsState.currentIndex = newIndex;
    
    if (ttsState.paused) {
      resetUI();
      const item = ttsState.playlist[ttsState.currentIndex];
      if (item && item.element) {
        item.element.classList.add('tts-active');
        if (ttsState.autoScroll) {
          item.element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    } else {
      playCurrentSegment();
    }
    return;
  }

  if (playBtn && !e.target.classList.contains('voice-link')) {
    e.preventDefault();

    const activeWordElement = container.querySelector('.active-word');
    const activeId = activeWordElement ? getElementId(activeWordElement) : null;
    
    const currentItem = ttsState.playlist[ttsState.currentIndex];
    const currentId = currentItem ? currentItem.id : null;

    const shouldJump = activeId && (!ttsState.speaking || activeId !== currentId);

    if (shouldJump) {
      let mode = localStorage.getItem(MODE_STORAGE_KEY) || 'trn';
      if (mode !== 'pi-trn' && mode !== 'trn-pi') {
        mode = activeWordElement.classList.contains('pli-lang') ? 'pi' : 'trn';
        localStorage.setItem(MODE_STORAGE_KEY, mode);
        const modeSelect = document.getElementById('tts-mode-select');
        if (modeSelect) modeSelect.value = mode;
      }
      let targetSlug = playBtn.dataset.slug || ttsState.currentSlug;
      startPlayback(container, mode, targetSlug, 0);
      
    } else {
      if (ttsState.speaking) {
        if (ttsState.paused) {
          ttsState.paused = false;
          setButtonIcon('pause');
          
          if (ttsState.googleAudio) {
              ttsState.googleAudio.play();
          } else {
              playCurrentSegment(); 
          }
        } else {
          ttsState.paused = true;
          synth.cancel();
          if (ttsState.googleAudio) {
              ttsState.googleAudio.pause();
          }
          setButtonIcon('play');
        }
      } else {
        const mode = document.getElementById('tts-mode-select')?.value || localStorage.getItem(MODE_STORAGE_KEY) || 'trn';
        let targetSlug = playBtn.dataset.slug || ttsState.currentSlug;
        startPlayback(container, mode, targetSlug, 0);
      }
    }
    return;
  }

  if (e.target.closest('.close-tts-btn')) {
    e.preventDefault();
    stopPlayback();
  }
}

function stopPlayback() {
  synth.cancel();
  if (ttsState.googleAudio) {
      ttsState.googleAudio.pause();
      ttsState.googleAudio = null;
  }

  ttsState.speaking = false;
  ttsState.paused = false;
  ttsState.isNavigating = false;
  releaseWakeLock();

  const player = document.getElementById('voice-player-container');
  if (player) {
    player.classList.remove('active');
  }

  if (ttsState.utterance) {
    ttsState.utterance.onend = null;
    ttsState.utterance.onerror = null;
    ttsState.utterance = null;
  }
  setButtonIcon('play');
  resetUI();
}

async function startPlayback(container, mode, slug, startIndex = 0) {
  const textData = await prepareTextData(slug);
  if (!textData.length) {
    console.warn('Нет данных для воспроизведения');
    return;
  }
  
  const playlist = createPlaylistFromData(textData, mode);
  if (!playlist.length) {
    console.warn('Плейлист пуст для режима:', mode);
    return;
  }
  
  let actualStartIndex = startIndex;
  const activeWord = container.querySelector('.active-word');
  
  if (activeWord) {
    const activeId = getElementId(activeWord);
    if (activeId) {
      const foundIndex = playlist.findIndex(item => item.id === activeId);
      if (foundIndex !== -1) {
        actualStartIndex = foundIndex;
      } else {
        const sourceIndex = textData.findIndex(item => item.id === activeId);
        if (sourceIndex !== -1) {
          for (let i = sourceIndex + 1; i < textData.length; i++) {
            const nextId = textData[i].id;
            const nextInPlaylistIndex = playlist.findIndex(item => item.id === nextId);
            if (nextInPlaylistIndex !== -1) {
              actualStartIndex = nextInPlaylistIndex;
              break; 
            }
          }
        }
      }
    }
  } else {
    if (actualStartIndex === 0 && slug) {
      const lastSlug = localStorage.getItem(LAST_SLUG_KEY);
      const lastIndex = parseInt(localStorage.getItem(LAST_INDEX_KEY) || '0');
      if (lastSlug === slug && lastIndex < playlist.length) {
        actualStartIndex = lastIndex;
      }
    }
  }
  
  synth.cancel();
  if (ttsState.googleAudio) {
      ttsState.googleAudio.pause();
      ttsState.googleAudio = null;
  }
  
  ttsState.playlist = playlist;
  ttsState.currentIndex = actualStartIndex;
  ttsState.currentSlug = slug;
  ttsState.langSettings = mode;
  ttsState.speaking = true;
  ttsState.paused = false;
  ttsState.isNavigating = false;
  
  setButtonIcon('pause');
  playCurrentSegment();
}

function showVoiceHint(title, message, storageKey) {
  if (localStorage.getItem(storageKey)) return;
  if (document.getElementById('active-voice-hint')) return;

  const notification = document.createElement('div');
  notification.id = 'active-voice-hint'; 

  notification.innerHTML = `
      <div class="hint" style="display: flex; align-items: center; gap: 10px;">
          <div>💡 <strong>${title}</strong> ${message}</div>
          <button id="closeVoiceHintBtn" style="background: none; border: none; color: white; font-size: 16px; cursor: pointer; padding: 0 0 0 10px;" title="(Esc)">×</button>
      </div>
  `;

  Object.assign(notification.style, {
      position: 'fixed', top: '30%', left: '50%', transform: 'translateX(-50%)',
      backgroundColor: 'rgba(66, 66, 106, 1)', color: 'white',
      padding: '12px 20px', borderRadius: '8px', fontSize: '14px', zIndex: '9999',
      boxShadow: '0 4px 12px rgba(0,0,0,0.3)', animation: 'fadeInUp 0.5s ease-out',
      maxWidth: '600px', minWidth: '200px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.1)'
  });

  document.body.appendChild(notification);

  if (!document.getElementById('voice-hint-styles')) {
      const style = document.createElement('style');
      style.id = 'voice-hint-styles';
      style.textContent = `
          @keyframes fadeInUp { from { opacity: 0; transform: translate(-50%, 10px); } to { opacity: 1; transform: translate(-50%, 0); } }
          @keyframes fadeOut { from { opacity: 1; } to { opacity: 0; } }
          #closeVoiceHintBtn:hover { color: #ccc; }
      `;
      document.head.appendChild(style);
  }

  const closeBtn = notification.querySelector('#closeVoiceHintBtn');
  closeBtn.addEventListener('click', function() {
      notification.style.animation = 'fadeOut 0.3s ease-in';
      setTimeout(() => {
          notification.remove();
          localStorage.setItem(storageKey, 'true'); 
      }, 300);
  });
}

function getPlayerHtml() {
  const isSpecialPath = window.location.pathname.match(/\/d\/|\/memorize\//);
  const defaultMode = isSpecialPath ? 'pi' : 'trn';
  const savedMode = localStorage.getItem(MODE_STORAGE_KEY) || defaultMode;
  const savedKey = localStorage.getItem(GOOGLE_KEY_STORAGE) || ''; 
  
  let initialRate;
  let currentRatesList; 
  
  if (savedMode === 'pi') {
      initialRate = parseFloat(localStorage.getItem(RATE_PALI_KEY)) || 1.0;
      currentRatesList = RATES_PALI; 
  } else {
      initialRate = parseFloat(localStorage.getItem(RATE_TRN_KEY)) || 1.0;
      currentRatesList = RATES_TRN;  
  }

  if (!currentRatesList.includes(initialRate)) {
      currentRatesList = [...currentRatesList, initialRate].sort((a,b) => a - b);
  }

  const pathLang = location.pathname.split('/')[1];
  const isRuLike = ['ru', 'r', 'ml'].includes(pathLang);

  const helpUrl = isRuLike 
    ? '/assets/common/ttsHelp.html#tts-help-ru' 
    : '/assets/common/ttsHelp.html#tts-help-en';

  const modeLabels = isRuLike
    ? { 'pi': 'Пали', 'pi-trn': 'Пали + Рус', 'trn': 'Перевод', 'trn-pi': 'Рус + Пали' }
    : { 'pi': 'Pāḷi', 'pi-trn': 'Pāḷi + Trn', 'trn': 'Trn', 'trn-pi': 'Trn + Pāḷi' };
  
  const style = `
  <style>
    /* Настройки для Шестеренки и Закрытия 
    .tts-top-btn {
      position: absolute;
      top: 10px; 
      font-size: 20px;
      line-height: 1;
      cursor: pointer;
      color: #999;
      text-decoration: none !important;
      z-index: 10;
      transition: color 0.2s, transform 0.3s;
    }
	*/
    
    .tts-settings-btn { left: 15px; }
    .close-tts-btn    { right: 15px; }

    .tts-top-btn:hover { color: #333; }
    .dark .tts-top-btn { color: #bbb; }
    .dark .tts-top-btn:hover { color: #fff; }

    /* Контейнер кнопок управления: Центрирование и отступ от верха */
    .tts-controls-row {
        display: flex;
        justify-content: center;
        align-items: center;
        margin-top: 15px; /* Отступ от верхних кнопок */
        margin-bottom: 5px;
    }

    /* Анимация панели */
    #tts-settings-panel {
        max-height: 0;
        opacity: 0;
        overflow: hidden;
        transition: max-height 0.4s ease, opacity 0.4s ease, margin-top 0.4s ease;
        margin-top: 0;
    }
    
    #tts-settings-panel.visible {
        max-height: 500px; /* Достаточно места для контента */
        opacity: 1;
        margin-top: 10px;
        padding-top: 10px;
        border-top: 1px solid #444;
    }
	
	
	/* Выстраиваем всё в один ряд и центрируем по вертикали */
.tts-main-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    gap: 15px;
    height: 40px;
}

/* Навигация строго по центру */
.tts-controls-row {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
}

/* Сбрасываем абсолютное позиционирование для кнопок */
.tts-top-btn {
    position: static !important;
    color: #999; /* Нейтральный серый */
    font-size: 24px;
    text-decoration: none !important;
    line-height: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: color 0.2s;
}

.tts-top-btn:hover {
    color: #fff;
}

/* Фильтр для иконок навигации, чтобы не были слишком черными */
.tts-icon {
    filter: invert(0.5);
}

.close-tts-btn {
  transform: translate(-5px, -3px);
}

#google-api-key-input {
    width: 140px;
    background: #eee; /* Цвет для светлой темы */
    border: 1px solid #ccc;
    color: #333;
    border-radius: 4px;
    padding: 2px 5px;
    font-size: 11px;
    transition: background 0.3s, color 0.3s;
}

/* Стили для темной темы */
.dark #google-api-key-input {
    background: #333;
    border: 1px solid #555;
    color: #ccc;
}

  </style>
  `;

  return style + `
    <div style="text-align: center;">
   <div class="tts-main-row">
    <a href="javascript:void(0)" id="tts-settings-toggle" class="tts-top-btn tts-settings-btn" title="Settings">
        <svg id="tts-settings-icon" viewBox="0 0 24 24" width="18" height="18" fill="currentColor" style="transition: transform 0.3s ease;">
            <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.43-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/>
        </svg>
    </a>

    <div class="tts-controls-row">
        <a href="javascript:void(0)" class="prev-main-button tts-icon-btn">
            <img src="/assets/svg/backward-step.svg" class="tts-icon backward" width="20">
        </a>
        <a href="javascript:void(0)" class="play-main-button tts-icon-btn large">
            <img src="/assets/svg/play-grey.svg" class="tts-icon play" width="34">
        </a>
        <a href="javascript:void(0)" class="next-main-button tts-icon-btn">
            <img src="/assets/svg/forward-step.svg" class="tts-icon forward" width="20">
        </a>
    </div>

    <a href="javascript:void(0)" class="tts-top-btn close-tts-btn">&times;</a>
</div>
      <div id="tts-settings-panel">
          <select id="tts-mode-select" class="tts-mode-select">
            ${Object.entries(modeLabels).map(([val, label]) =>
              `<option value="${val}" ${savedMode === val ? 'selected' : ''}>${label}</option>`
            ).join('')}
          </select>

          <select id="tts-rate-select" class="tts-rate-select" title="${savedMode === 'pi' ? 'Speed (Pali)' : 'Speed (Translation)'}">
            ${currentRatesList.map(r =>
              `<option value="${r}" ${initialRate == r ? 'selected' : ''}>${r}x</option>`
            ).join('')}
          </select>
          
          <br>

          <label class="tts-checkbox-custom" style="margin-right: 3px;">
            <input type="checkbox" id="tts-scroll-toggle" ${ttsState.autoScroll ? 'checked' : ''}>
            Scroll
          </label>

          <a href="/tts.php${window.location.search}" class="tts-link tts-text-link" style="margin-right: 3px;">TTS</a>
          <a class="tts-link" title='sc-voice.net' href='https://www.sc-voice.net/?src=sc#/sutta/$fromjs' style="margin-right: 3px;">VSC</a>
          
          <span id="audio-file-link-placeholder" style="display: none; margin-right: 3px;"></span>
          
          <a href="${helpUrl}" target="_blank" class="tts-link" title="Help" style="text-decoration: none;">?</a>

          <div class="">
<input type="password" id="google-api-key-input" 
       value="${savedKey}" 
       placeholder="Google API Key (Optional)" 
       title="Enter Google Cloud TTS API Key for premium voices">
          </div>
      </div>
    </div>
    `;
}

function getOrBuildPlayer() {
    const playerId = 'voice-player-container';
    let playerContainer = document.getElementById(playerId);

    if (!playerContainer) {
        playerContainer = document.createElement('div');
        playerContainer.id = playerId;
        playerContainer.className = 'voice-dropdown'; 
        
        const player = document.createElement('div');
        player.className = 'voice-player';
        playerContainer.appendChild(player);
        document.body.appendChild(playerContainer);
    }
    
    const playerInner = playerContainer.querySelector('.voice-player');
    if (playerInner) {
        playerInner.innerHTML = getPlayerHtml();
    }

    const placeholder = playerContainer.querySelector('#audio-file-link-placeholder');
    const sourceLink = document.querySelector('span.tts-link[data-src]');

    if (sourceLink && placeholder) {
        const fileUrl = sourceLink.getAttribute('data-src');
        if (fileUrl) {
            placeholder.innerHTML = `<a class='tts-link' href='${fileUrl}' target='_blank'>File</a>`;
            placeholder.style.display = "inline"; 
        } else {
             placeholder.style.display = "none";
        }
    } else if (placeholder) {
        placeholder.style.display = "none";
    }

    return playerContainer;
}

// --- Интерфейс (для index.js) ---
function getTTSInterfaceHTML(texttype, slugReady, slug) {
  return `<a data-slug="${texttype}/${slugReady}" href="javascript:void(0)" title="Text-to-Speech (Alt+R)" class="voice-link">Voice</a>`;
}

// --- Обработчик изменения настроек ---
async function handleTTSSettingChange(e) {
  // Save API Key
  if (e.target.id === 'google-api-key-input') {
      const key = e.target.value.trim();
      localStorage.setItem(GOOGLE_KEY_STORAGE, key);
      return;
  }

  // 1. Mode
  if (e.target.id === 'tts-mode-select') {
    e.preventDefault();
    const newMode = e.target.value;
    localStorage.setItem(MODE_STORAGE_KEY, newMode);
      
    if (ttsState.speaking || ttsState.paused) {
      const wasPaused = ttsState.paused;
      const currentId = ttsState.playlist[ttsState.currentIndex]?.id;
      const pausedIndex = ttsState.currentIndex;
      
      synth.cancel();
      if (ttsState.googleAudio) {
          ttsState.googleAudio.pause();
          ttsState.googleAudio = null;
      }
      
      const textData = await prepareTextData(ttsState.currentSlug);
      const newPlaylist = createPlaylistFromData(textData, newMode);
      
      if (!newPlaylist.length) return;
      
      let newIndex = 0;
      if (currentId) {
        const foundIndex = newPlaylist.findIndex(item => item.id === currentId);
        if (foundIndex !== -1) newIndex = foundIndex;
      } else if (pausedIndex < newPlaylist.length) {
        newIndex = pausedIndex;
      }
      
      ttsState.playlist = newPlaylist;
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
          if (ttsState.autoScroll) {
            item.element.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }
      }
    }
  }
  
  // 2. Rate
  if (e.target.id === 'tts-rate-select') {
    const newRate = parseFloat(e.target.value);
    
    let targetKey = RATE_TRN_KEY; 
    if (ttsState.speaking && !ttsState.paused && ttsState.playlist[ttsState.currentIndex]) {
        const currentItem = ttsState.playlist[ttsState.currentIndex];
        if (currentItem.lang === 'pi-dev') {
            targetKey = RATE_PALI_KEY;
        }
    } else {
        const currentMode = localStorage.getItem(MODE_STORAGE_KEY);
        if (currentMode === 'pi') {
            targetKey = RATE_PALI_KEY;
        }
    }

    localStorage.setItem(targetKey, newRate);
    
    if (ttsState.speaking && !ttsState.paused) {
      synth.cancel();
      if (ttsState.googleAudio) {
          ttsState.googleAudio.pause();
          ttsState.googleAudio = null;
      }
      playCurrentSegment();
    }
  }

  // 3. Scroll
  if (e.target.id === 'tts-scroll-toggle') {
     ttsState.autoScroll = e.target.checked;
     localStorage.setItem(SCROLL_STORAGE_KEY, e.target.checked);
     if (ttsState.autoScroll && (ttsState.speaking || ttsState.paused)) {
        const item = ttsState.playlist[ttsState.currentIndex];
        if (item && item.element) {
           item.element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
     }
  }
}

document.addEventListener('change', handleTTSSettingChange);
window.speechSynthesis.onvoiceschanged = () => synth.getVoices();
document.addEventListener('click', handleSuttaClick);
document.addEventListener('DOMContentLoaded', () => { 

  document.addEventListener('contextmenu', function(e) {
    if (!e.target.closest('a.voice-link')) return;
    if (localStorage.getItem('ttsMode') === 'true') {
        e.preventDefault();
        e.stopImmediatePropagation();
        const currentSearch = window.location.search; 
        const ttsUrl = `${window.location.origin}/t2s.html${currentSearch}`;
        setTimeout(() => window.open(ttsUrl, '_blank'), 500);
    }
  }, { passive: false });

  synth.getVoices();
});

document.addEventListener('visibilitychange', async () => {
  if (wakeLock !== null && document.visibilityState === 'visible') {
    requestWakeLock();
  }
});

window.activateSegmentForTTS = function(element) {
  if (!element) return;
  
  let targetElement = element;
  if (!targetElement.matches(".pli-lang, .rus-lang, .eng-lang, .tha-lang")) {
      const childLang = targetElement.querySelector(".pli-lang, .rus-lang, .eng-lang, .tha-lang");
      if (childLang) {
          targetElement = childLang;
      } else {
          return;
      }
  }

  removeAllHighlights();
  targetElement.classList.add("active-word");
  
  const rowContainer = targetElement.closest("[id]") || targetElement;
  addTtsButton(rowContainer, targetElement);
};

document.addEventListener("click", function (e) {
  if (e.target.closest('.tts-ignore') || e.target.closest('.dynamic-tts-btn')) return;
  
  const clickedSegment = e.target.closest(".pli-lang, .rus-lang, .eng-lang, .tha-lang");

  if (clickedSegment) {
    if (clickedSegment.classList.contains("active-word")) {
      removeAllHighlights();
      return;
    }
    window.activateSegmentForTTS(clickedSegment);
    return;
  }

  if (
    !e.target.closest(".voice-player") &&
    !e.target.closest(".tts-mode-select") &&
    !e.target.closest(".tts-rate-select") &&
    !e.target.closest("#tts-scroll-toggle") && 
    !e.target.closest(".dynamic-tts-btn")
  ) {
    removeAllHighlights();
  }
});

function removeAllHighlights() {
    document.querySelectorAll(".active-word").forEach(el => el.classList.remove("active-word"));
    const oldBtn = document.querySelector('.dynamic-tts-btn');
    if (oldBtn) oldBtn.remove();
}

function addTtsButton(containerElement, specificElement) {
    if (ttsState.speaking || ttsState.paused) return;

    const oldBtn = document.querySelector('.dynamic-tts-btn');
    if (oldBtn) oldBtn.remove();

    const btnContainer = document.createElement('div');
    btnContainer.className = 'dynamic-tts-btn'; 
    btnContainer.innerHTML = `<img src="/assets/svg/play.svg" alt="Play">`;

    document.body.appendChild(btnContainer);

    btnContainer.addEventListener('click', (e) => {
        e.stopPropagation(); 
        e.preventDefault();

        let mode = localStorage.getItem(MODE_STORAGE_KEY) || 'trn';
        
        if (mode !== 'pi-trn' && mode !== 'trn-pi') {
            const targetEl = specificElement || containerElement; 
            mode = targetEl.classList.contains('pli-lang') ? 'pi' : 'trn';
            
            localStorage.setItem(MODE_STORAGE_KEY, mode);
            const modeSelect = document.getElementById('tts-mode-select');
            if (modeSelect) modeSelect.value = mode;
        }

        let slug = ttsState.currentSlug;
        if (!slug) {
            const mainPlayBtn = document.querySelector('a.voice-link[data-slug]');
            if (mainPlayBtn) {
                slug = mainPlayBtn.dataset.slug;
            }
        }
        
        if (!slug) {
            console.warn("TTS: Не удалось найти slug сутты.");
            return;
        }

        const player = getOrBuildPlayer();
        const internalPlayBtn = player.querySelector('.play-main-button');
        if (internalPlayBtn) internalPlayBtn.dataset.slug = slug;

        player.classList.add('active');
        startPlayback(document, mode, slug); 

        btnContainer.remove();
    });
}