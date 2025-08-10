// --- НАЧАЛО: УТИЛИТЫ ДЛЯ POPUP ---

/**
 * Сохраняет текущие размеры и положение попапа в localStorage.
 * @param {HTMLElement} popup - Элемент попапа.
 */
function saveFdgPopupState(popup) {
    localStorage.setItem('fdgPopupWidth', popup.style.width);
    localStorage.setItem('fdgPopupHeight', popup.style.height);
    localStorage.setItem('fdgPopupTop', popup.style.top);
    localStorage.setItem('fdgPopupLeft', popup.style.left);
}

/**
 * Очищает сохраненные параметры попапа из localStorage.
 * Это полезно при изменении размера окна браузера.
 */
function clearFdgPopupParams() {
    const keys = ['fdgPopupWidth', 'fdgPopupHeight', 'fdgPopupTop', 'fdgPopupLeft', 'fdgWindowWidth', 'fdgWindowHeight', 'isFdgFirstDrag'];
    keys.forEach(key => localStorage.removeItem(key));
}


// --- КОНЕЦ: УТИЛИТЫ ДЛЯ POPUP ---


// --- НАЧАЛО: КОД ДЛЯ СОЗДАНИЯ POPUP ОКНА (адаптировано из paliLookup.js) ---

/**
 * Создает и настраивает перетаскиваемое и изменяемое по размеру окно popup.
 * @returns {object} - Объект с элементами popup: overlay, popup, closeBtn, openNewWindowBtn, iframe.
 */
function createFdgPopup() {
    const overlay = document.createElement('div');
    overlay.className = 'fdg-overlay';
    overlay.style.cssText = 'display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0,0,0,0.5); z-index: 9998;';

    const popup = document.createElement('div');
    popup.className = 'fdg-popup';
    popup.style.cssText = 'display: none; position: fixed; max-width: 100%; max-height: 1200px; overflow: hidden; background: #fff; border: 1px solid #ccc; box-shadow: 0 4px 8px rgba(0,0,0,0.1); z-index: 9999;';

    // Проверка и сброс параметров при изменении размера окна браузера
    const currentWindowWidth = window.innerWidth;
    const currentWindowHeight = window.innerHeight;
    const savedWindowWidth = localStorage.getItem('fdgWindowWidth');
    const savedWindowHeight = localStorage.getItem('fdgWindowHeight');

    if (savedWindowWidth && savedWindowHeight && (parseInt(savedWindowWidth, 10) !== currentWindowWidth || parseInt(savedWindowHeight, 10) !== currentWindowHeight)) {
        clearFdgPopupParams();
    }
    localStorage.setItem('fdgWindowWidth', currentWindowWidth);
    localStorage.setItem('fdgWindowHeight', currentWindowHeight);

    // Восстановление сохраненных размеров и позиции
    const savedWidth = localStorage.getItem('fdgPopupWidth');
    const savedHeight = localStorage.getItem('fdgPopupHeight');
    const savedTop = localStorage.getItem('fdgPopupTop');
    const savedLeft = localStorage.getItem('fdgPopupLeft');

    if (savedWidth) popup.style.width = savedWidth;
    if (savedHeight) popup.style.height = savedHeight;
    if (savedTop) popup.style.top = savedTop;
    if (savedLeft) popup.style.left = savedLeft;

    // --- Создание кнопок и элементов управления ---

    const header = document.createElement('div');
    header.className = 'fdg-popup-header';
    header.style.cssText = 'cursor: move; height: 30px; display: flex; align-items: center; padding: 0 10px; background-color: #f1f1f1; position: relative;';

    const closeBtn = document.createElement('button');
    closeBtn.className = 'fdg-close-btn';
    closeBtn.style.cssText = 'position: absolute; top: 50%; right: 10px; transform: translateY(-50%); background: transparent; border: none; cursor: pointer; padding: 5px;';
    closeBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" width="17" height="17" fill="currentColor"><path d="M342.6 150.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L192 210.7 86.6 105.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L146.7 256 41.4 361.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L192 301.3 297.4 406.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L237.3 256 342.6 150.6z"/></svg>`;
    
    const openNewWindowBtn = document.createElement('a');
    openNewWindowBtn.className = 'fdg-open-new-window-btn';
    openNewWindowBtn.target = '_blank';
    openNewWindowBtn.title = 'Открыть в новом окне';
    openNewWindowBtn.style.cssText = 'position: absolute; top: 50%; right: 45px; transform: translateY(-50%); cursor: pointer; padding: 5px; display: flex; align-items: center; justify-content: center;';
    openNewWindowBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="17" height="17" fill="currentColor"><path d="M432 320H400a16 16 0 0 0-16 16v96H64V128h96a16 16 0 0 0 16-16V80a16 16 0 0 0-16-16H48A48 48 0 0 0 0 112v352a48 48 0 0 0 48 48h352a48 48 0 0 0 48-48V336a16 16 0 0 0-16-16zm88-256V24a24 24 0 0 0-24-24H368c-21.4 0-32.1 25.9-17 41l35.7 35.7L150.3 307.7a24 24 0 0 0 0 34L174.6 366a24 24 0 0 0 34 0L445.7 128.9l35.7 35.7c15.1 15.1 41 4.5 41-17z"/></svg>`;

    const iframe = document.createElement('iframe');
    iframe.className = 'fdg-iframe';
    iframe.src = '';
    iframe.style.cssText = 'width: 100%; height: calc(100% - 30px); border: none;';

    const resizeHandle = document.createElement('div');
    resizeHandle.className = 'fdg-resize-handle';
    resizeHandle.style.cssText = 'position: absolute; right: 0; bottom: 0; width: 20px; height: 20px; cursor: nwse-resize; z-index: 10;';
    
    header.appendChild(openNewWindowBtn);
    header.appendChild(closeBtn);
    popup.appendChild(header);
    popup.appendChild(iframe);
    popup.appendChild(resizeHandle);

    document.body.appendChild(overlay);
    document.body.appendChild(popup);

    // --- Логика перетаскивания и изменения размера ---
    let isDragging = false, isResizing = false;
    let startX, startY, initialLeft, initialTop, startWidth, startHeight;
    let isFirstDrag = localStorage.getItem('isFdgFirstDrag') === 'false' ? false : true;

    if (isFirstDrag) {
        popup.style.top = '50%';
        popup.style.left = '50%';
        popup.style.width = '80%';
        popup.style.height = '80%';
        popup.style.transform = 'translate(-50%, -50%)';
    }

    function startDrag(e) {
        isDragging = true;
        iframe.style.pointerEvents = 'none';
        
        if (isFirstDrag) {
            const rect = popup.getBoundingClientRect();
            popup.style.transform = 'none';
            popup.style.top = `${rect.top}px`;
            popup.style.left = `${rect.left}px`;
            isFirstDrag = false;
            localStorage.setItem('isFdgFirstDrag', 'false');
        }

        startX = e.clientX || e.touches[0].clientX;
        startY = e.clientY || e.touches[0].clientY;
        initialLeft = popup.offsetLeft;
        initialTop = popup.offsetTop;
        e.preventDefault();
    }

    function moveDrag(e) {
        if (isDragging) {
            const deltaX = (e.clientX || e.touches[0].clientX) - startX;
            const deltaY = (e.clientY || e.touches[0].clientY) - startY;
            popup.style.left = `${initialLeft + deltaX}px`;
            popup.style.top = `${initialTop + deltaY}px`;
        }
    }

    function stopDrag() {
        if (isDragging) {
            isDragging = false;
            iframe.style.pointerEvents = 'auto';
            saveFdgPopupState(popup);
        }
    }

    function startResize(e) {
        isResizing = true;
        iframe.style.pointerEvents = 'none';
        startWidth = parseInt(document.defaultView.getComputedStyle(popup).width, 10);
        startHeight = parseInt(document.defaultView.getComputedStyle(popup).height, 10);
        const touch = e.touches ? e.touches[0] : e;
        startResizeX = touch.clientX;
        startResizeY = touch.clientY;
        e.preventDefault();
        e.stopPropagation();
    }

    function doResize(e) {
        if (!isResizing) return;
        const touch = e.touches ? e.touches[0] : e;
        const newWidth = startWidth + (touch.clientX - startResizeX);
        const newHeight = startHeight + (touch.clientY - startResizeY);
        popup.style.width = `${Math.max(300, newWidth)}px`;
        popup.style.height = `${Math.max(200, newHeight)}px`;
    }

    function stopResize() {
        if (isResizing) {
            isResizing = false;
            iframe.style.pointerEvents = 'auto';
            saveFdgPopupState(popup);
        }
    }

    // Назначение обработчиков событий
    header.addEventListener('mousedown', startDrag);
    document.addEventListener('mousemove', moveDrag);
    document.addEventListener('mouseup', stopDrag);
    header.addEventListener('touchstart', startDrag, { passive: false });
    document.addEventListener('touchmove', moveDrag, { passive: false });
    document.addEventListener('touchend', stopDrag);
    
    resizeHandle.addEventListener('mousedown', startResize);
    document.addEventListener('mousemove', doResize);
    document.addEventListener('mouseup', stopResize);
    resizeHandle.addEventListener('touchstart', startResize, { passive: false });
    document.addEventListener('touchmove', doResize, { passive: false });
    document.addEventListener('touchend', stopResize);

    return { overlay, popup, closeBtn, openNewWindowBtn, iframe };
}

// Глобальная инициализация попапа
const { overlay: fdgOverlay, popup: fdgPopup, closeBtn: fdgCloseBtn, openNewWindowBtn: fdgOpenNewWindowBtn, iframe: fdgIframe } = createFdgPopup();

// --- КОНЕЦ: КОД ДЛЯ СОЗДАНИЯ POPUP ОКНА ---


// --- Логика закрытия попапа ---
const closeFdgPopup = () => {
    fdgPopup.style.display = 'none';
    fdgOverlay.style.display = 'none';
    fdgIframe.src = 'about:blank'; // Очищаем iframe для остановки загрузки
};

fdgCloseBtn.addEventListener('click', closeFdgPopup);
fdgOverlay.addEventListener('click', closeFdgPopup);
// Также закрываем попап после клика на "открыть в новом окне"
fdgOpenNewWindowBtn.addEventListener('click', () => {
    // Небольшая задержка, чтобы браузер успел обработать открытие новой вкладки
    setTimeout(closeFdgPopup, 100);
});


document.addEventListener("DOMContentLoaded", function() {
    const urlParams = new URLSearchParams(window.location.search);
    const sParam = urlParams.get('s');
 
    let keyword;
    let keywordElement = document.querySelector('.keyword');
    if (keywordElement) {
        keyword = keywordElement.textContent.trim();
    } else {
        keyword = "";
    }

    let searchValue = sParam && sParam.trim() !== "" ? sParam : keyword;

    let baseUrl;
    if (window.location.href.includes('/ru') || (localStorage.siteLanguage && localStorage.siteLanguage === 'ru')) {
        baseUrl = window.location.origin + "/r/";
    } else if (window.location.href.includes('/th') || (localStorage.siteLanguage && localStorage.siteLanguage === 'th')) {
        baseUrl = window.location.origin + "/th/read/";
    } else {
        baseUrl = window.location.origin + "/read/";
    }

    if (localStorage.defaultReader === 'ml') {
        baseUrl = window.location.origin + "/ml/";
    } else if (localStorage.defaultReader === 'rv') {
        baseUrl = window.location.origin + "/rv/";
    } else if (localStorage.defaultReader === 'd') {
        baseUrl = window.location.origin + "/d/";
    } else if (localStorage.defaultReader === 'mem') {
        baseUrl = window.location.origin + "/memorize/";
    } else if (localStorage.defaultReader === 'fr') {
        baseUrl = window.location.origin + "/frev/";
    } 

    const fdgLinks = document.querySelectorAll('.fdgLink');
    fdgLinks.forEach(link => {
        const slug = link.getAttribute('data-slug');
        const filter = link.getAttribute('data-filter');
        const textUrl = findFdgTextUrl(slug, filter || searchValue, baseUrl);
        if (!textUrl) {
            link.style.display = 'none';
        } else {
            link.href = textUrl;
            // Target убран отсюда, так как он управляется обработчиком клика
        }
    });
});

// !!! ВОССТАНОВЛЕННАЯ ОРИГИНАЛЬНАЯ ФУНКЦИЯ !!!
function findFdgTextUrl(slug, searchValue, baseUrl) {
    const exceptions = ["bv", "ja", "ne", "pv[0-9]", "cnd", "mil", "pe", "thi-ap", "tha-ap", "cp", "kp", "mnd", "ps", "vv", 'ds', 'dt', 'kv', 'patthana', 'pp', 'ya'];
    const isSuttaCentral = 
      exceptions.some(ex => slug.includes(ex)) ||
      /^vb\d*$/.test(slug);

    const url = isSuttaCentral ? `https://suttacentral.net/${slug}` : baseUrl;

    let scUrl = `${baseUrl}?s=${searchValue ? searchValue : ""}&q=${slug}`;

    if (scUrl.endsWith('#')) {
        scUrl = scUrl.replace(/#$/, '');
    }
     
    return isSuttaCentral ? url : scUrl;
}


// --- НАЧАЛО: НОВЫЙ ОБРАБОТЧИК КЛИКОВ ---

document.addEventListener('click', function(event) {
    // 1. Проверяем флаг в localStorage
    const popupEnabled = localStorage.getItem('quotePopupEnabled') !== 'false';
    if (!popupEnabled) {
        // Если попап выключен, ссылкам нужно вернуть стандартное поведение
        const link = event.target.closest('a.fdgLink');
        if (link) {
            link.target = "_blank";
        }
        return; // Продолжаем стандартное поведение
    }

    // 2. Находим ближайшую ссылку-родителя
    const link = event.target.closest('a.fdgLink');

    // 3. Проверяем, что ссылка найдена и ее родитель имеет класс 'quote'
    if (link && link.closest('.quote')) {
        
        // 4. Предотвращаем стандартное поведение ссылки
        event.preventDefault();
        event.stopPropagation();

        const url = link.href;

        // 5. Открываем popup и загружаем контент
        if (fdgIframe && fdgPopup && fdgOverlay) {
            fdgIframe.src = url;
            fdgOpenNewWindowBtn.href = url; // Устанавливаем ссылку для кнопки "открыть в новом окне"
            fdgPopup.style.display = 'block';
            fdgOverlay.style.display = 'block';
        }
    }
}, true); // Используем capturing phase, чтобы перехватить событие раньше

// --- КОНЕЦ: НОВЫЙ ОБРАБОТЧИК КЛИКОВ ---


// Проверяем значение localStorage.defaultReader (старый код)
if (localStorage.defaultReader === 'rv') {
    var elements = document.querySelectorAll('.right-text-hide.reverse-order-hide');
    elements.forEach(element => {
        element.classList.remove('right-text-hide', 'reverse-order-hide');
        element.classList.add('right-text', 'reverse-order');
    });
} else {
    var elements = document.querySelectorAll('.right-text.reverse-order');
    elements.forEach(element => {
        element.classList.add('right-text-hide', 'reverse-order-hide');
        element.classList.remove('right-text', 'reverse-order');
    });
}
