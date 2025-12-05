// Функция определения языка
function detectLanguage() {
    if (typeof lang !== 'undefined') {
        return lang;
    }
    const urlParams = new URLSearchParams(window.location.search);
    const type = urlParams.get('type');
    if (type === 'pali') return 'pi';

    const path = window.location.pathname.toLowerCase();
    if (path.includes('/ru/') || path.includes('/r/') || path.includes('/ml/')) return 'ru';
    
    const translator = urlParams.get('translator');
    if (translator === 'bs') return 'en-sujato';
    
    return 'en-bodhi'; 
}

function updateLinks(lang) {
    const readLink = document.getElementById('readLink');
    const homeLink = document.getElementById('homeLink');
    const ttsLink = document.getElementById('ttsLink'); // Ищем кнопку TTS

    // Получаем текущий q параметр
    const urlParams = new URLSearchParams(window.location.search);
    const qParam = urlParams.get('q');

    // --- Логика для кнопок чтения и домой ---
    if (readLink && homeLink) {
        if (lang === 'ru') {
            readLink.href = '/r';
            if (homeLink.getAttribute('href') !== '/') homeLink.href = '/ru/read.php';
        } else if (lang && lang.startsWith('en')) {
            readLink.href = '/read';
            if (homeLink.getAttribute('href') !== '/') homeLink.href = '/read.php';
        } else {
            readLink.href = '/read';
        }

        if (qParam) {
            const separator = readLink.href.includes('?') ? '&' : '?';
            readLink.href += `${separator}q=${encodeURIComponent(qParam)}`;
        }
    }

    // --- Логика для кнопки TTS ---
    // Проверка: "Если кнопка существует И есть параметр q"
    if (ttsLink && qParam) {
        const separator = ttsLink.href.includes('?') ? '&' : '?';
        ttsLink.href += `${separator}q=${encodeURIComponent(qParam)}`;
        
        // Опционально: передача типа языка в TTS
        /*
        if (lang === 'pi') {
             ttsLink.href += '&type=pali';
        } else if (lang === 'ru') {
             ttsLink.href += '&type=trn'; // Русский определится по URL /ru/
        } else {
             ttsLink.href += '&type=trn';
        }
        */
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const currentLang = detectLanguage();
    
    if (typeof updateLanguageSwitcher === 'function') {
        updateLanguageSwitcher(currentLang);
    }
    
    updateLinks(currentLang);

    const darkSwitch = document.getElementById('darkSwitch');
    if (darkSwitch) {
        darkSwitch.addEventListener('change', function() {
            document.body.classList.toggle('dark-mode');
        });
    }
    
    const scriptBtn = document.getElementById('script-toggle');
    if (scriptBtn) {
        scriptBtn.addEventListener('click', function(e) {
            e.preventDefault(); 
            const url = new URL(window.location.href);
            if (url.searchParams.get('script') === 'dev') {
                url.searchParams.delete('script');
            } else {
                url.searchParams.set('script', 'dev');
            }
            window.location.href = url.toString();
        });
    }
});