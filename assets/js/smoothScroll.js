/**
 * ===================================================================
 * ОБЩИЕ ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
 * ===================================================================
 */

// Функция для подсветки элемента и всех его дочерних элементов
function highlightAllById(elementId) {
    const elements = document.querySelectorAll(`[id="${elementId}"], [id="${elementId}"] *`);
    if (elements.length === 0) return;

    elements.forEach(element => {
        const originalBgColor = element.style.backgroundColor;
        const originalTransition = element.style.transition;
        element.style.transition = 'background-color 0.45s ease-in-out';

        let blinkCount = 0;
        const maxBlinks = 6;
        const intervalDuration = 500;
        
        const blinkInterval = setInterval(() => {
            element.style.backgroundColor = blinkCount % 2 === 0 ? 'rgba(26, 188, 156, 0.2)' : originalBgColor || 'transparent';
            blinkCount++;
            if (blinkCount >= maxBlinks) {
                clearInterval(blinkInterval);
                element.style.backgroundColor = originalBgColor || '';
                setTimeout(() => {
                    element.style.transition = originalTransition;
                }, intervalDuration);
            }
        }, intervalDuration);
    });
}


// Функция для выделения элемента по ID
function highlightById(elementId) {
    const element = document.getElementById(elementId);
    if (!element) return;

    // Сохраняем оригинальные стили
    const originalTransition = element.style.transition;
    const originalBorderRadius = element.style.borderRadius;
    const originalBoxShadow = element.style.boxShadow;

    // Настройки анимации
    element.style.borderRadius = '10px';
    element.style.transition = 'box-shadow 0.3s ease-in-out';
    let blinkCount = 0;
    const maxBlinks = 6; // 3 мерцания (вкл/выкл)
    let isWide = false;

    // Находим все дочерние иконки
    const icons = element.querySelectorAll('.menu-icon, i.fa-solid, img');

    // Функция для мерцания
    const blinkInterval = setInterval(function() {
        // Подсветка основного элемента
        element.style.boxShadow = isWide ? '0 0 0 2px grey' : '0 0 0 4px grey';
        
        // Подсветка иконок
        icons.forEach(icon => {
            icon.style.transition = 'box-shadow 0.3s ease-in-out';
            icon.style.boxShadow = isWide ? '0 0 0 2px grey' : '0 0 0 4px grey';
        });

        isWide = !isWide;
        blinkCount++;

        // Останавливаем после 3 мерцаний (6 изменений состояния)
        if (blinkCount >= maxBlinks) {
            clearInterval(blinkInterval);
            
            // Возвращаем оригинальные стили
            setTimeout(() => {
                element.style.boxShadow = originalBoxShadow;
                element.style.transition = originalTransition;
                element.style.borderRadius = originalBorderRadius;
                
                icons.forEach(icon => {
                    icon.style.boxShadow = '';
                    icon.style.transition = '';
                });
            }, 300);
        }
    }, 500);
}


function highlightMultipleById(ids) {
    ids.forEach(highlightById);
}


/**
 * ===================================================================
 * ИНТЕЛЛЕКТУАЛЬНАЯ ПРОКРУТКА К ЯКОРЮ (#)
 * ===================================================================
 */

// Эта функция будет периодически проверять наличие элемента на странице
function intelligentScrollToHash() {
    const hash = window.location.hash;
    if (!hash) return; // Если якоря нет, ничего не делаем

    const elementId = hash.substring(1);
    
    const checkInterval = 500; // Проверять каждые 500 мс
    const totalWaitTime = 8500; // Общее время ожидания 
    let timeElapsed = 0;
    
//    console.log(`[Scroll] Начало поиска элемента: #${elementId}`);

    const pollingInterval = setInterval(() => {
        const element = document.getElementById(elementId);

        // 1. УСПЕХ: Элемент найден
        if (element) {
     //       console.log(`[Scroll] Элемент #${elementId} найден! Прокручиваем.`);
            clearInterval(pollingInterval); // Останавливаем проверку
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            highlightAllById(elementId);
            return;
        }

        // 2. ПРОДОЛЖЕНИЕ: Элемент еще не найден, проверяем время
        timeElapsed += checkInterval;
        
        // 3. ТАЙМ-АУТ: Время ожидания истекло
        if (timeElapsed >= totalWaitTime) {
            console.log(`[Scroll] Элемент #${elementId} не найден за ${totalWaitTime / 1000} секунд. Остановка поиска.`);
            clearInterval(pollingInterval); // Останавливаем проверку
        }
    }, checkInterval);
}

// Запускаем интеллектуальную прокрутку при начальной загрузке страницы...
window.addEventListener('DOMContentLoaded', intelligentScrollToHash);

// ...и при каждом изменении якоря в URL.
window.addEventListener('hashchange', intelligentScrollToHash);


/**
 * ===================================================================
 * КНОПКА "НАВЕРХ"
 * (Версия с одной иконкой, управляемой через CSS)
 * ===================================================================
 */

document.addEventListener('DOMContentLoaded', function() {
    // Создаем элемент кнопки
    var scrollToTopBtn = document.createElement('button');
    scrollToTopBtn.id = 'scrollToTopBtn';
    scrollToTopBtn.className = 'btn btn-secondary rounded-pill hide-button';
    scrollToTopBtn.style.display = 'none';

    // Создаем элемент изображения
    var img = document.createElement('img');
    img.id = 'arrowImg';
    img.alt = 'To top';
    // ВСЕГДА используем одну и ту же картинку - тёмную стрелку
    img.src = '/assets/svg/arrow-up-dark.svg';
    scrollToTopBtn.appendChild(img);
    
    // Добавляем кнопку на страницу
    document.body.appendChild(scrollToTopBtn);

    // Функция для проверки позиции прокрутки
    function checkScrollPosition() {
        if (window.scrollY > 600) {
            scrollToTopBtn.style.display = 'block';
        } else {
            scrollToTopBtn.style.display = 'none';
        }
    }

    checkScrollPosition();
    window.addEventListener('scroll', checkScrollPosition);

    // Плавная прокрутка наверх по клику
    scrollToTopBtn.addEventListener('click', function(event) {
        event.preventDefault();
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
});