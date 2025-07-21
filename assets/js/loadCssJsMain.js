document.addEventListener('DOMContentLoaded', function() {
    // Скрываем страницу перед загрузкой
    document.body.style.visibility = 'hidden';
    document.body.style.opacity = '0';
    document.body.style.transition = 'opacity 0.3s ease';

    // Проверка готовности стилей и скриптов
    function isPageReady() {
        const stylesReady = Array.from(document.styleSheets).every(sheet => {
            return !sheet.href || sheet.cssRules;
        });

        const scriptsReady = Array.from(document.scripts).every(script => {
            return !script.src || script.readyState === 'loaded' || script.readyState === 'complete';
        });

        return stylesReady && scriptsReady;
    }

    // Показ страницы с однократным фокусом
    function showPage() {
        document.body.style.visibility = 'visible';
        document.body.style.opacity = '1';
        
        // Установка фокуса с гарантированным срабатыванием
        requestAnimationFrame(() => {
            const searchInput = document.getElementById('paliauto');
            if (searchInput) {
                // Проверяем, не находится ли уже в фокусе (чтобы избежать лишних действий)
                if (document.activeElement !== searchInput) {
                    searchInput.focus({
                        preventScroll: true // Предотвращаем нежелательную прокрутку
                    });
                }
            }
        });
    }

    // Триггеры для показа страницы:
    const readyCheckInterval = setInterval(() => {
        if (isPageReady()) {
            clearInterval(readyCheckInterval);
            showPage();
        }
    }, 100);

    // Резервные триггеры:
    window.addEventListener('load', () => {
        clearInterval(readyCheckInterval);
        showPage();
    });

    // Максимальное время ожидания (fallback)
    setTimeout(() => {
        clearInterval(readyCheckInterval);
        showPage();
    }, 3000);
});