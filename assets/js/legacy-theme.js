(function() {
    // === КОНФИГУРАЦИЯ ===
    const STORAGE_KEY = 'darkSwitch';
    const THEME_KEY = 'theme';
    const DARK_CLASS = 'legacy-dark-mode';

    // === 1. ВНЕДРЕНИЕ СТИЛЕЙ (CSS) ===
    const style = document.createElement('style');
    style.textContent = `
        /* СОЗДАЕМ ЛИНЗУ С ЗАПАСОМ (Oversize)
           Мы делаем её 200% ширины и высоты и сдвигаем на -50%, 
           чтобы она гарантированно перекрывала любые "дергания" 
           интерфейса мобильного браузера и скрытие адресной строки.
        */
        body.${DARK_CLASS}::before {
            content: "";
            position: fixed;
            top: -50vh; 
            left: -50vw; 
            width: 200vw; 
            height: 200vh;
            z-index: 100; 
            
            /* Инверсия всего под слоем */
            backdrop-filter: invert(1) hue-rotate(180deg);
            -webkit-backdrop-filter: invert(1) hue-rotate(180deg);
            
            pointer-events: none; /* Клики проходят сквозь */
        }

        /* === ИСКЛЮЧЕНИЯ === */

        /* Картинки и видео инвертируем обратно, чтобы они выглядели нормально */
        body.${DARK_CLASS} img, 
        body.${DARK_CLASS} video, 
        body.${DARK_CLASS} iframe,
        body.${DARK_CLASS} canvas {
            filter: invert(1) hue-rotate(180deg);
        }

        /* Плеер лежит ПОВЕРХ линзы (z-index 999), поэтому инвертируем его вручную */
        body.${DARK_CLASS} .voice-player,      
        body.${DARK_CLASS} .dynamic-tts-btn {  
            filter: invert(1) hue-rotate(180deg);
        }

        /* Кнопка темы */
        #legacy-theme-btn {
            position: absolute; /* Теперь она прокручивается вместе со страницей */
            top: 20px;
            right: 20px;
            z-index: 10001; 
            width: 32px;
            height: 32px;
            background: #eee;
            border: 1px solid #999;
            border-radius: 50%;
            cursor: pointer;
            font-size: 18px;
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
        
        /* ВАЖНО: Мы убрали правило body.legacy-dark-mode #legacy-theme-btn { filter: invert... }
           Теперь иконка не меняется при смене темы. */
    `;
    document.head.appendChild(style);

    // === 2. ПРИМЕНЕНИЕ ТЕМЫ ПРИ ЗАГРУЗКЕ ===
    if (localStorage.getItem(STORAGE_KEY) === 'dark') {
        document.body.classList.add(DARK_CLASS);
    }

    // === 3. СОЗДАНИЕ КНОПКИ (UI) ===
    function createButton() {
        if (document.getElementById('legacy-theme-btn')) return;

        const btn = document.createElement('button');
        btn.id = 'legacy-theme-btn';
        btn.innerHTML = '🌗'; 
        btn.title = 'Dark Mode / Светлая тема';
        btn.onclick = toggleTheme;
        
        document.body.appendChild(btn);
    }

    // === 4. ЛОГИКА ПЕРЕКЛЮЧЕНИЯ ===
    function toggleTheme() {
        const isDark = document.body.classList.toggle(DARK_CLASS);
        
        // Фикс перерисовки плеера
        const player = document.querySelector('.voice-player');
        if (player) {
            player.style.display = 'none';
            player.offsetHeight; // trigger reflow
            player.style.display = '';
        }

        if (isDark) {
            localStorage.setItem(STORAGE_KEY, 'dark');
            localStorage.setItem(THEME_KEY, 'dark');
        } else {
            localStorage.removeItem(STORAGE_KEY);
            localStorage.setItem(THEME_KEY, 'light');
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', createButton);
    } else {
        createButton();
    }
})();
