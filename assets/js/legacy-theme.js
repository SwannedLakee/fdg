(function() {
    // === КОНФИГУРАЦИЯ ===
    const STORAGE_KEY = 'darkSwitch'; // Ключ совместимый с вашим tts.php
    const THEME_KEY = 'theme';
    const DARK_CLASS = 'legacy-dark-mode';

    // === 1. ВНЕДРЕНИЕ СТИЛЕЙ (CSS) ===
    const style = document.createElement('style');
    style.textContent = `
        /* Основная инверсия для тела страницы */
        body.${DARK_CLASS} {
            filter: invert(1) hue-rotate(180deg);
            background-color: #000 !important; /* Делаем фон нейтральным перед инверсией */
            color: #000 !important;
        }

        /* ИСКЛЮЧЕНИЯ: Инвертируем обратно, чтобы вернуть нормальный вид */
        body.${DARK_CLASS} img, 
        body.${DARK_CLASS} video, 
        body.${DARK_CLASS} iframe,
        body.${DARK_CLASS} canvas,
        body.${DARK_CLASS} .voice-player,      /* Плеер */
        body.${DARK_CLASS} .dynamic-tts-btn,   /* Кнопка Play */
        body.${DARK_CLASS} #legacy-theme-btn { /* Сама кнопка темы */
            filter: invert(1) hue-rotate(180deg);
        }

        /* Стиль кнопки переключения */
        #legacy-theme-btn {
            position: absolute;
            top: 20px;
            right: 20px;
            z-index: 10001; /* Поверх всего */
            width: 32px;
            height: 32px;
            background: #eee;
            border: 1px solid #999;
            border-radius: 50%;
            cursor: pointer;
            font-size: 18px;
            line-height: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            opacity: 0.6;
            transition: opacity 0.2s, transform 0.2s;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        }
        #legacy-theme-btn:hover {
            opacity: 1;
            transform: scale(1.1);
        }
    `;
    document.head.appendChild(style);

    // === 2. ПРИМЕНЕНИЕ ТЕМЫ ПРИ ЗАГРУЗКЕ ===
    // Делаем это сразу, не дожидаясь DOMContentLoaded, чтобы сайт не "мигал"
    if (localStorage.getItem(STORAGE_KEY) === 'dark') {
        document.body.classList.add(DARK_CLASS);
    }

    // === 3. СОЗДАНИЕ КНОПКИ (UI) ===
    function createButton() {
        if (document.getElementById('legacy-theme-btn')) return;

        const btn = document.createElement('button');
        btn.id = 'legacy-theme-btn';
        btn.innerHTML = '🌗'; // Иконка
        btn.title = 'Dark Mode / Светлая тема';
        btn.onclick = toggleTheme;
        
        document.body.appendChild(btn);
    }

    // === 4. ЛОГИКА ПЕРЕКЛЮЧЕНИЯ ===
    function toggleTheme() {
        const isDark = document.body.classList.toggle(DARK_CLASS);
        
        if (isDark) {
            localStorage.setItem(STORAGE_KEY, 'dark');
            localStorage.setItem(THEME_KEY, 'dark'); // Для совместимости с другими скриптами
        } else {
            localStorage.removeItem(STORAGE_KEY);
            localStorage.setItem(THEME_KEY, 'light');
        }
    }

    // Запускаем создание кнопки, когда DOM готов
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', createButton);
    } else {
        createButton();
    }
})();
