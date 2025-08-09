
// --- НАЧАЛО: КОД ДЛЯ POPUP ОКНА (адаптировано из paliLookup.js) ---

function createFdgPopup() {
    const overlay = document.createElement('div');
    overlay.className = 'fdg-overlay';
    overlay.style.display = 'none';
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.backgroundColor = 'rgba(0,0,0,0.5)';
    overlay.style.zIndex = '9998';

    const popup = document.createElement('div');
    popup.className = 'fdg-popup';
    popup.style.display = 'none';
    popup.style.position = 'fixed';
    popup.style.width = '80%';
    popup.style.height = '80%';
    popup.style.maxWidth = '1200px';
    popup.style.maxHeight = '90%';
    popup.style.top = '50%';
    popup.style.left = '50%';
    popup.style.transform = 'translate(-50%, -50%)';
    popup.style.backgroundColor = '#fff';
    popup.style.border = '1px solid #ccc';
    popup.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
    popup.style.zIndex = '9999';
    popup.style.overflow = 'hidden';
    popup.style.resize = 'both';


    const header = document.createElement('div');
    header.className = 'fdg-popup-header';
    header.style.height = '30px';
    header.style.backgroundColor = '#f1f1f1';
    header.style.cursor = 'move';
    header.style.display = 'flex';
    header.style.justifyContent = 'flex-end';
    header.style.alignItems = 'center';
    header.style.padding = '0 10px';


    const closeBtn = document.createElement('button');
    closeBtn.className = 'fdg-close-btn';
    closeBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" width="17" height="17" fill="currentColor">
            <path d="M342.6 150.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L192 210.7 86.6 105.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L146.7 256 41.4 361.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L192 301.3 297.4 406.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L237.3 256 342.6 150.6z"/>
        </svg>
    `;
    closeBtn.style.border = 'none';
    closeBtn.style.background = 'transparent';
    closeBtn.style.cursor = 'pointer';
    closeBtn.style.fontSize = '20px';


    const iframe = document.createElement('iframe');
    iframe.className = 'fdg-iframe';
    iframe.src = '';
    iframe.style.width = '100%';
    iframe.style.height = 'calc(100% - 30px)'; // 30px for header
    iframe.style.border = 'none';

    header.appendChild(closeBtn);
    popup.appendChild(header);
    popup.appendChild(iframe);
    document.body.appendChild(overlay);
    document.body.appendChild(popup);

    // Drag and Resize logic
    let isDragging = false;
    let isResizing = false;
    let startX, startY, initialLeft, initialTop, startWidth, startHeight;

    header.addEventListener('mousedown', (e) => {
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        initialLeft = popup.offsetLeft;
        initialTop = popup.offsetTop;
        iframe.style.pointerEvents = 'none';
        e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
        if (isDragging) {
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            popup.style.left = `${initialLeft + dx}px`;
            popup.style.top = `${initialTop + dy}px`;
        }
    });

    document.addEventListener('mouseup', () => {
        isDragging = false;
        iframe.style.pointerEvents = 'auto';
    });
    
    // --- Close logic ---
    const closePopup = () => {
        popup.style.display = 'none';
        overlay.style.display = 'none';
        iframe.src = ''; // Clear iframe content
    };

    closeBtn.addEventListener('click', closePopup);
    overlay.addEventListener('click', closePopup);


    return { overlay, popup, closeBtn, iframe };
}

const { overlay: fdgOverlay, popup: fdgPopup, iframe: fdgIframe } = createFdgPopup();


// --- КОНЕЦ: КОД ДЛЯ POPUP ОКНА ---


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
            link.target = "_blank";
        }
    });
});

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
        return; // Если выключено, ничего не делаем
    }

    // 2. Находим ближайшую ссылку-родителя, если клик был по вложенному элементу
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
