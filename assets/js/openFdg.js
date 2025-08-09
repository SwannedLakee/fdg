// --- НАЧАЛО: УТИЛИТЫ ДЛЯ POPUP ---

function saveFdgPopupState(popup) {
    localStorage.setItem('fdgPopupWidth', popup.style.width);
    localStorage.setItem('fdgPopupHeight', popup.style.height);
    localStorage.setItem('fdgPopupTop', popup.style.top);
    localStorage.setItem('fdgPopupLeft', popup.style.left);
}

function clearFdgPopupParams() {
    const keys = ['fdgPopupWidth', 'fdgPopupHeight', 'fdgPopupTop', 'fdgPopupLeft', 'fdgWindowWidth', 'fdgWindowHeight', 'isFdgFirstDrag'];
    keys.forEach(key => localStorage.removeItem(key));
}

// --- КОНЕЦ: УТИЛИТЫ ДЛЯ POPUP ---


// --- НАЧАЛО: КОД ДЛЯ СОЗДАНИЯ POPUP ОКНА ---

function createFdgPopup() {
    const popup = document.createElement('div');
    popup.className = 'fdg-popup';
    popup.style.cssText = `
        display: none;
        position: fixed;
        background-color: #eaf0f0;
        border-radius: 8px;
        box-shadow: 0 5px 20px rgba(0, 0, 0, 0.25);
        border: 1px solid #b0b0b0;
        overflow: hidden;
        z-index: 9999;
    `;

    const isMobile = window.innerWidth <= 768;
    const isFirstDrag = localStorage.getItem('isFdgFirstDrag') === null;

    // --- Логика позиционирования в зависимости от устройства ---
    if (isMobile) {
        // На мобильных: по умолчанию на весь экран
        popup.style.width = '100%';
        popup.style.height = '100%';
        popup.style.top = '0';
        popup.style.left = '0';
        popup.style.borderRadius = '0';
    } else {
        // Проверяем сохраненные параметры для десктопа
        const savedWidth = localStorage.getItem('fdgPopupWidth');
        const savedHeight = localStorage.getItem('fdgPopupHeight');
        const savedTop = localStorage.getItem('fdgPopupTop');
        const savedLeft = localStorage.getItem('fdgPopupLeft');

        if (savedWidth && !isFirstDrag) {
            // Восстанавливаем, если есть сохраненные данные
            popup.style.width = savedWidth;
            popup.style.height = savedHeight;
            popup.style.top = savedTop;
            popup.style.left = savedLeft;
        } else {
            // По умолчанию для десктопа: справа
            popup.style.width = '45%';
            popup.style.height = '80%';
            popup.style.top = '10%';
            popup.style.left = '53%';
        }
    }

    // "Невидимый" хедер для перетаскивания
    const header = document.createElement('div');
    header.className = 'fdg-popup-header';
    header.style.cssText = 'height: 30px; cursor: move; position: absolute; top: 0; left: 0; width: 100%; z-index: 1; background: transparent;';

    // Общие стили для кнопок
    const buttonStyle = `
        position: absolute;
        top: 8px;
        width: 28px;
        height: 28px;
        border: none;
        border-radius: 50%;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background-color 0.2s;
        z-index: 2;
    `;

    // Кнопка "Закрыть"
    const closeBtn = document.createElement('button');
    closeBtn.className = 'fdg-close-btn';
    closeBtn.style.cssText = buttonStyle + 'right: 8px; background-color: #e04040; color: #fff;';
    closeBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" width="14" height="14" fill="currentColor"><path d="M342.6 150.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L192 210.7 86.6 105.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L146.7 256 41.4 361.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L192 301.3 297.4 406.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L237.3 256 342.6 150.6z"/></svg>`;
    closeBtn.onmouseover = () => { closeBtn.style.backgroundColor = 'rgba(206, 5, 32, 0.6)'; };
    closeBtn.onmouseout = () => { closeBtn.style.backgroundColor = 'rgba(206, 5, 32, 0.6)'; };

    // Кнопка "Открыть в новом окне"
    const openNewWindowBtn = document.createElement('a');
    openNewWindowBtn.className = 'fdg-open-new-window-btn';
    openNewWindowBtn.target = '_blank';
    openNewWindowBtn.title = 'Открыть в новом окне';
    openNewWindowBtn.style.cssText = buttonStyle + 'right: 40px; background-color: rgba(45, 62, 80, 0.6); color: #fff;';
    openNewWindowBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="14" height="14" fill="currentColor"><path d="M432 320H400a16 16 0 0 0-16 16v96H64V128h96a16 16 0 0 0 16-16V80a16 16 0 0 0-16-16H48A48 48 0 0 0 0 112v352a48 48 0 0 0 48 48h352a48 48 0 0 0 48-48V336a16 16 0 0 0-16-16zm88-256V24a24 24 0 0 0-24-24H368c-21.4 0-32.1 25.9-17 41l35.7 35.7L150.3 307.7a24 24 0 0 0 0 34L174.6 366a24 24 0 0 0 34 0L445.7 128.9l35.7 35.7c15.1 15.1 41 4.5 41-17z"/></svg>`;
    openNewWindowBtn.onmouseover = () => { openNewWindowBtn.style.backgroundColor = 'rgba(45, 62, 80, 0.8)'; };
    openNewWindowBtn.onmouseout = () => { openNewWindowBtn.style.backgroundColor = 'rgba(45, 62, 80, 0.6)'; };

    // Iframe для контента
    const iframe = document.createElement('iframe');
    iframe.className = 'fdg-iframe';
    iframe.src = '';
    iframe.style.cssText = 'width: 100%; height: 100%; border: none; background-color: #eaf0f0;';

    // Уголок для изменения размера
    const resizeHandle = document.createElement('div');
    resizeHandle.className = 'fdg-resize-handle';
    resizeHandle.style.cssText = 'position: absolute; right: 0; bottom: 0; width: 20px; height: 20px; cursor: nwse-resize; z-index: 10; background-color: transparent;';
    resizeHandle.innerHTML = `
        <style>
            .fdg-resize-handle::after {
                content: "";
                position: absolute;
                right: 3px;
                bottom: 3px;
                width: 0;
                height: 0;
                border-style: solid;
                border-width: 0 0 12px 12px;
                border-color: transparent transparent #666 transparent;
            }
        </style>
    `;

    // Сборка попапа
    popup.appendChild(iframe);
    popup.appendChild(header);
    popup.appendChild(openNewWindowBtn);
    popup.appendChild(closeBtn);
    popup.appendChild(resizeHandle);
    document.body.appendChild(popup);

    // --- Логика перетаскивания и изменения размера ---
    let isDragging = false, isResizing = false;
    let startX, startY, initialLeft, initialTop, startWidth, startHeight, startResizeX, startResizeY;

    function startDrag(e) {
        if (isFirstDrag) {
            localStorage.setItem('isFdgFirstDrag', 'false');
        }
        isDragging = true;
        iframe.style.pointerEvents = 'none';
        const touch = e.touches ? e.touches[0] : e;
        startX = touch.clientX;
        startY = touch.clientY;
        initialLeft = popup.offsetLeft;
        initialTop = popup.offsetTop;
        e.preventDefault();
    }

    function moveDrag(e) {
        if (isDragging) {
            const touch = e.touches ? e.touches[0] : e;
            const deltaX = touch.clientX - startX;
            const deltaY = touch.clientY - startY;
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
        if (isMobile) {
            popup.style.borderRadius = '8px'; // Возвращаем скругление при изменении размера
        }
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

    // *** ИЗМЕНЕНИЕ ***: Убрана проверка `if (!isMobile)`.
    // Теперь обработчики событий назначаются на всех устройствах.
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

    return { popup, closeBtn, openNewWindowBtn, iframe };
}

// Глобальная инициализация попапа
const { popup: fdgPopup, closeBtn: fdgCloseBtn, openNewWindowBtn: fdgOpenNewWindowBtn, iframe: fdgIframe } = createFdgPopup();


// --- КОНЕЦ: КОД ДЛЯ СОЗДАНИЯ POPUP ОКНА ---


// --- Логика закрытия попапа ---
const closeFdgPopup = () => {
    fdgPopup.style.display = 'none';
    fdgIframe.src = 'about:blank';
};

fdgCloseBtn.addEventListener('click', closeFdgPopup);
fdgOpenNewWindowBtn.addEventListener('click', () => {
    setTimeout(closeFdgPopup, 100);
});

// --- Логика работы со ссылками (без изменений) ---


document.addEventListener('DOMContentLoaded', function() {
  const checkbox = document.getElementById('quotePopupCheckbox');
  const storageKey = 'quotePopupEnabled';

  if (checkbox) {
    checkbox.checked = localStorage.getItem(storageKey) !== 'false';
    checkbox.addEventListener('change', function() {
      localStorage.setItem(storageKey, this.checked);
    });
  }
  
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
        }
    });
});

// Оригинальная функция для создания URL
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


// --- Обработчик кликов (без изменений) ---
document.addEventListener('click', function(event) {
    const popupEnabled = localStorage.getItem('quotePopupEnabled') !== 'false';
    if (!popupEnabled) {
        const link = event.target.closest('a.fdgLink');
        if (link) {
            link.target = "_blank";
        }
        return;
    }

    const link = event.target.closest('a.fdgLink');

    if (link && link.closest('.quote')) {
        event.preventDefault();
        event.stopPropagation();

        const url = link.href;

        if (fdgIframe && fdgPopup) {
            fdgIframe.src = url;
            fdgOpenNewWindowBtn.href = url;
            fdgPopup.style.display = 'block';
        }
    }
}, true);


// --- Проверка localStorage.defaultReader (без изменений) ---
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