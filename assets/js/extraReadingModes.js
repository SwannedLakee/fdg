// Функция определения языка (Добавлена, чтобы работать на r.php и других страницах)
function detectLanguage() {
    // 1. Если на странице уже есть глобальная переменная lang (как в r.php), используем её
    if (typeof lang !== 'undefined') {
        return lang;
    }

    // 2. Иначе определяем язык по URL (логика для tts.php и других)
    const urlParams = new URLSearchParams(window.location.search);
    const type = urlParams.get('type');
    
    if (type === 'pali') return 'pi';

    const path = window.location.pathname.toLowerCase();
    if (path.includes('/ru/') || path.includes('/r/') || path.includes('/ml/')) return 'ru';
    
    // Проверяем переводчика
    const translator = urlParams.get('translator');
    if (translator === 'bs') return 'en-sujato';
    
    return 'en-bodhi'; // Default
}

function updateLinks(lang) {
    const readLink = document.getElementById('readLink');
    const homeLink = document.getElementById('homeLink');

    if (!readLink || !homeLink) return; // Защита от ошибок, если элементов нет

    // извлекаем q-параметр из текущего URL
    const urlParams = new URLSearchParams(window.location.search);
    const qParam = urlParams.get('q');

    if (lang === 'ru') {
        readLink.href = '/r';
        if (homeLink.getAttribute('href') !== '/') { // Не перезаписывать, если это ссылка на корень
             homeLink.href = '/ru/read.php';
        }
    } else if (lang && lang.startsWith('en')) {
        readLink.href = '/read';
         if (homeLink.getAttribute('href') !== '/') {
            homeLink.href = '/read.php';
         }
    } else {
        // Fallback
        readLink.href = '/read';
    }
    
    // Добавляем параметр q, если он есть
    if (qParam) {
        // Проверяем, есть ли уже параметры в ссылке
        const separator = readLink.href.includes('?') ? '&' : '?';
        readLink.href += `${separator}q=${encodeURIComponent(qParam)}`;
    }
}

document.addEventListener('DOMContentLoaded', function() {
    // Теперь эта функция гарантированно существует
    const currentLang = detectLanguage();
    
    // Проверяем существование функции перед вызовом (т.к. в r.php её может не быть)
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
    
    // Логика переключения скрипта (Devanagari/Latin)
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