// [ДОБАВИТЬ В НАЧАЛО ФАЙЛА]

// Глобальное состояние для Audio
const audioState = {
  audio: null,
  currentUrl: null,
  isPlaying: false,
  notification: null,
  currentButton: null
};

// Инициализация Media Session API
function initMediaSession() {
  if ('mediaSession' in navigator) {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: 'Sutta TTS',
      artist: 'Dhamma Reader',
      artwork: [
        { src: '/assets/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
        { src: '/assets/icons/icon-512.png', sizes: '512x512', type: 'image/png' }
      ]
    });

    navigator.mediaSession.setActionHandler('play', () => {
      if (audioState.audio) {
        audioState.audio.play();
        updateNotification('playing');
      }
    });

    navigator.mediaSession.setActionHandler('pause', () => {
      if (audioState.audio) {
        audioState.audio.pause();
        updateNotification('paused');
      }
    });

    navigator.mediaSession.setActionHandler('stop', () => {
      stopAudioPlayback();
    });

    navigator.mediaSession.setActionHandler('seekbackward', () => {
      if (audioState.audio) {
        audioState.audio.currentTime = Math.max(0, audioState.audio.currentTime - 10);
      }
    });

    navigator.mediaSession.setActionHandler('seekforward', () => {
      if (audioState.audio) {
        audioState.audio.currentTime = Math.min(
          audioState.audio.duration,
          audioState.audio.currentTime + 10
        );
      }
    });
  }
}

// Обновить уведомление
function updateNotification(state) {
  if (!('Notification' in window)) return;

  if (state === 'playing') {
    if (audioState.notification) {
      audioState.notification.close();
    }

    if (Notification.permission === 'granted') {
      audioState.notification = new Notification('Sutta TTS', {
        body: 'Сутта воспроизводится',
        icon: '/assets/icons/icon-192.png',
        badge: '/assets/icons/icon-96.png',
        tag: 'sutta-tts',
        silent: true,
        requireInteraction: false
      });

      audioState.notification.onclick = () => {
        window.focus();
        audioState.notification.close();
      };
    }
  } else if (state === 'paused' && audioState.notification) {
    audioState.notification.close();
    audioState.notification = null;
  }
}

// Остановить воспроизведение
function stopAudioPlayback() {
  if (audioState.audio) {
    audioState.audio.pause();
    audioState.audio = null;
  }
  audioState.isPlaying = false;
  audioState.currentUrl = null;
  
  if (audioState.notification) {
    audioState.notification.close();
    audioState.notification = null;
  }
  
  if (audioState.currentButton) {
    setButtonIcon(audioState.currentButton, 'play');
    audioState.currentButton = null;
  }
  
  if ('mediaSession' in navigator) {
    navigator.mediaSession.playbackState = 'none';
  }
  
  resetAllIcons();
}

// Создать аудио из TTS
async function createAudioFromTTS(text, langType, button) {
  // Если уже играет этот же текст - пауза/продолжение
  if (audioState.isPlaying && audioState.currentButton === button) {
    if (!audioState.audio.paused) {
      audioState.audio.pause();
      audioState.isPlaying = false;
      updateNotification('paused');
      setButtonIcon(button, 'play');
    } else {
      audioState.audio.play();
      audioState.isPlaying = true;
      updateNotification('playing');
      setButtonIcon(button, 'pause');
    }
    return;
  }

  // Остановить предыдущее воспроизведение
  stopAudioPlayback();
  window.speechSynthesis.cancel();

  // Обновить состояние
  audioState.currentButton = button;
  audioState.isPlaying = true;
  resetAllIcons();
  setButtonIcon(button, 'pause');

  try {
    // Создаем SpeechSynthesis для TTS
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Настройка языка (существующая логика)
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

    // Для длинных текстов используем Web Audio API
    if (text.length > 500) {
      await playLongTextWithWebAudio(utterance, button);
    } else {
      // Для коротких текстов используем стандартный TTS с уведомлениями
      await playShortTextWithNotifications(utterance, button);
    }
  } catch (error) {
    console.error('Audio playback error:', error);
    setButtonIcon(button, 'play');
    audioState.isPlaying = false;
  }
}

// Воспроизведение короткого текста
function playShortTextWithNotifications(utterance, button) {
  return new Promise((resolve) => {
    utterance.onstart = () => {
      audioState.isPlaying = true;
      updateNotification('playing');
      
      if ('mediaSession' in navigator) {
        navigator.mediaSession.playbackState = 'playing';
      }
    };

    utterance.onend = () => {
      stopAudioPlayback();
      resolve();
    };

    utterance.onerror = (e) => {
      if (e.error !== 'interrupted') {
        console.error('TTS Error:', e);
      }
      stopAudioPlayback();
      resolve();
    };

    window.speechSynthesis.speak(utterance);
  });
}

// Воспроизведение длинного текста через Web Audio API
async function playLongTextWithWebAudio(utterance, button) {
  // Создаем AudioContext для более контролируемого воспроизведения
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  const audioContext = new AudioContext();
  
  // Создаем источник для SpeechSynthesis
  utterance.volume = 1;
  utterance.rate = 1;
  utterance.pitch = 1;
  
  // Запускаем TTS
  window.speechSynthesis.speak(utterance);
  
  // Создаем медиа-уведомление
  updateNotification('playing');
  
  if ('mediaSession' in navigator) {
    navigator.mediaSession.playbackState = 'playing';
  }
  
  // Обработчики событий
  utterance.onend = () => {
    stopAudioPlayback();
    audioContext.close();
  };
  
  utterance.onerror = () => {
    stopAudioPlayback();
    audioContext.close();
  };
}

// Обновить функцию toggleSpeech для использования новой системы
function toggleSpeech(text, langType, button) {
  // Всегда используем новую систему с уведомлениями
  createAudioFromTTS(text, langType, button);
}

// Обновить инициализацию
document.addEventListener('DOMContentLoaded', () => {
  document.addEventListener('click', handleSuttaClick);
  
  // Запросить разрешение на уведомления
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
  
  // Инициализировать Media Session
  initMediaSession();
  
  // Обработка видимости страницы
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && audioState.isPlaying) {
      // Страница в фоне, но воспроизведение продолжается
      if (audioState.notification) {
        audioState.notification.close();
        audioState.notification = null;
      }
    }
  });
});

