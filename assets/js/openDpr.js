// Константа для базового URL
const DPR_BASE_URL = "https://www.digitalpalireader.online/_dprhtml/index.html?loc=";

// Карта для быстрого поиска ссылок
let dprMap = null;

document.addEventListener("DOMContentLoaded", function() {
    // Инициализируем карту при загрузке страницы, если данные доступны
    initDprMap();

    const dprLinks = document.querySelectorAll('.dprLink');
    dprLinks.forEach(link => {
        const slug = link.getAttribute('data-slug');
        const textUrl = getTextUrl(slug);
        
        if (!textUrl) {
            // Скрываем ссылку, если адрес не найден
            link.style.display = 'none';
            console.warn(`DPR Link not found for slug: ${slug}`);
        } else {
            // Устанавливаем ссылку
            link.href = textUrl;
            link.target = "_blank";
        }
    });
});

// Функция для открытия DPR из JS (например, по кнопке)
function openDpr(slug) {
    initDprMap(); // Убеждаемся, что карта инициализирована
    
    let textUrl = getTextUrl(slug);
    if (textUrl) {
        window.open(textUrl, "_blank");
    } else {
        console.log("Ссылка не найдена для:", slug);
    }
}

// Вспомогательная функция инициализации карты данных
function initDprMap() {
    if (dprMap) return; // Уже инициализировано

    if (typeof dprLinksData !== 'undefined') {
        // Преобразуем массив пар [ключ, значение] в Map для быстрого поиска O(1)
        dprMap = new Map(dprLinksData);
    } else {
        console.error("Ошибка: dprLinksData не найден. Убедитесь, что файл linksdpr.js подключен перед openDpr.js");
    }
}

// Основная функция получения полного URL
function getTextUrl(slug) {
    if (!dprMap || !slug) return null;
    
    // Ищем точное совпадение ключа (например, "dn1", "SN1.1")
    const code = dprMap.get(slug);
    
    if (code) {
        return DPR_BASE_URL + code;
    }
    
    return null;
}


