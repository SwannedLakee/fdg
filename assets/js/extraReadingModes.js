// Обновленная функция для определения текущего языка и переводчика
function detectLanguage() {
    const urlParams = new URLSearchParams(window.location.search);
    const type = urlParams.get('type');
    const translator = urlParams.get('translator');

    if (type === 'pali' || type === null) return 'pi';

    const currentUrl = window.location.pathname.toLowerCase();
    if (currentUrl.includes('/ru/') || currentUrl.includes('/r/') || currentUrl.includes('/ml/')) return 'ru';

    // Теперь, если это английский, мы смотрим на параметр translator
    if (translator === 'bs') {
        return 'en-sujato';
    }
    // По умолчанию 'en-bodhi'
    return 'en-bodhi';
}


function updateLinks(lang) {
    const readLink = document.getElementById('readLink');
    const homeLink = document.getElementById('homeLink');

    // извлекаем q-параметр из текущего URL
    const urlParams = new URLSearchParams(window.location.search);
    const qParam = urlParams.get('q');

    if (lang === 'ru') {
        readLink.href = '/r';
        homeLink.href = '/ru/read.php';
    } else if (lang.startsWith('en')) {
        readLink.href = '/read';
        homeLink.href = '/read.php';
    } else {
        lang = 'en';
        readLink.href = '/read';
        homeLink.href = '/read.php';
    }
    
    
    if (qParam) {
        const separator = readLink.href.includes('?') ? '&' : '?';
        readLink.href += `${separator}q=${encodeURIComponent(qParam)}`;
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const lang = detectLanguage();
    updateLanguageSwitcher(lang);
    updateLinks(lang);

    document.getElementById('darkSwitch').addEventListener('change', function() {
        document.body.classList.toggle('dark-mode');
    });
});


    const scriptBtn = document.getElementById('script-toggle');
    
    if (scriptBtn) {
        scriptBtn.addEventListener('click', function(e) {
            e.preventDefault(); // Отменяем стандартный переход по ссылке

            // Парсим текущий URL
            const url = new URL(window.location.href);

            // Проверяем, включен ли сейчас режим dev
            if (url.searchParams.get('script') === 'dev') {
                // Если включен -> удаляем параметр (возврат к латинице)
                url.searchParams.delete('script');
            } else {
                // Если выключен -> добавляем параметр (переход к деванагари)
                url.searchParams.set('script', 'dev');
            }

            // Перезагружаем страницу с обновленным URL
            window.location.href = url.toString();
        });
    }



