/**
 * Подсвечивает элемент по его ID вместе со всеми потомками равномерно
 * С красивой анимацией через обертку и интеграцией TTS
 * @param {string} elementId - ID элемента для подсветки
 */
function highlightAllById(elementId) {
    // 1. Находим элемент по ID
    const elementToHighlight = document.getElementById(elementId);
    
    // 2. Если элемент не существует, ничего не делаем
    if (!elementToHighlight) {
        console.log(`[Highlight] Элемент с ID "${elementId}" не найден.`);
        return;
    }

    // 3. Сохраняем оригинальные стили
    const originalBgColor = elementToHighlight.style.backgroundColor;
    const originalTransition = elementToHighlight.style.transition;
    
    // 4. Применяем стили для анимации ко всему блоку
    elementToHighlight.style.transition = 'background-color 0.45s ease-in-out';
    
    let blinkCount = 0;
    const maxBlinks = 4;
    const intervalDuration = 500;
    
    // 5. Создаем временный элемент-обертку для равномерной подсветки
    const highlightWrapper = document.createElement('div');
    highlightWrapper.style.position = 'relative';
    
    // 6. Клонируем содержимое элемента
    // (Это позволяет подсветить фон поверх текста, не перекрывая его)
    const contentClone = elementToHighlight.cloneNode(true);
    
    // 7. Настраиваем слой подсветки
    const highlightEffect = document.createElement('div');
    highlightEffect.style.position = 'absolute';
    highlightEffect.style.top = '0';
    highlightEffect.style.left = '0';
    highlightEffect.style.width = '100%';
    highlightEffect.style.height = '100%';
    highlightEffect.style.zIndex = '0';
    highlightEffect.style.pointerEvents = 'none'; // Чтобы клики проходили сквозь подсветку
    highlightEffect.style.transition = 'background-color 0.45s ease-in-out';
    
    // 8. Вставляем элементы в DOM (заменяем содержимое на обертку)
    highlightWrapper.appendChild(highlightEffect);
    highlightWrapper.appendChild(contentClone);
    elementToHighlight.innerHTML = '';
    elementToHighlight.appendChild(highlightWrapper);
    
    // 9. Запускаем анимацию мигания
    const blinkInterval = setInterval(() => {
        highlightEffect.style.backgroundColor = blinkCount % 2 === 0 
            ? 'rgba(26, 188, 156, 0.2)' // Красивый бирюзовый цвет
            : 'transparent';
        
        blinkCount++;

        // 10. По окончании (когда мигнуло нужное количество раз)
        if (blinkCount >= maxBlinks) {
            clearInterval(blinkInterval);
            
            setTimeout(() => {
                // А. Возвращаем оригинальное содержимое (убираем обертки)
                elementToHighlight.innerHTML = '';
                elementToHighlight.appendChild(contentClone);
                elementToHighlight.style.backgroundColor = originalBgColor;
                elementToHighlight.style.transition = originalTransition;
                
                // Б. --- ИНТЕГРАЦИЯ ТТС (НОВОЕ) ---
                // Теперь, когда структура восстановлена, вызываем логику из voice.js
                // Это добавит класс .active-word и покажет кнопку Play
                if (typeof window.activateSegmentForTTS === 'function') {
                    window.activateSegmentForTTS(elementToHighlight);
                } else {
                    // Если voice.js вдруг не загружен, просто подсветим желтым
                    elementToHighlight.classList.add('active-word');
                }

            }, intervalDuration);
        }
    }, intervalDuration);
}

// Функция для выделения элемента по ID (без подсветки дочерних элементов)
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
    const maxBlinks = 4; 
    let isWide = false;

    // Функция для мерцания
    const blinkInterval = setInterval(function() {
        // Подсветка ТОЛЬКО основного элемента (рамкой/тенью)
        element.style.boxShadow = isWide ? '0 0 0 2px grey' : '0 0 0 4px grey';
        
        isWide = !isWide;
        blinkCount++;

        // Останавливаем после 3 мерцаний
        if (blinkCount >= maxBlinks) {
            clearInterval(blinkInterval);
            
            // Возвращаем оригинальные стили
            setTimeout(() => {
                element.style.boxShadow = originalBoxShadow;
                element.style.transition = originalTransition;
                element.style.borderRadius = originalBorderRadius;
                
                // --- ИНТЕГРАЦИЯ ТТС ЗДЕСЬ ТОЖЕ ---
                if (typeof window.activateSegmentForTTS === 'function') {
                    window.activateSegmentForTTS(element);
                } else {
                    element.classList.add('active-word');
                }

            }, 300);
        }
    }, 500);
}

function highlightMultipleById(ids) {
    ids.forEach(highlightById);
}

// Эта функция будет периодически проверять наличие элемента на странице
function intelligentScrollToHash() {
    const hash = window.location.hash;
    if (!hash) return; // Если якоря нет, ничего не делаем

    const hashContent = hash.substring(1);

    // ПРОВЕРКА: Если в хеше есть запятая, значит, это список ID для подсветки
    if (hashContent.includes(',')) {
        const ids = hashContent.split(','); // Разделяем строку на массив ID
        highlightMultipleById(ids); 
        
        // Скроллим к первому элементу
        const firstElement = document.getElementById(ids[0]);
        if (firstElement) {
             firstElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }

    // ИНАЧЕ: работаем по старой логике с одним элементом
    } else {
        const elementId = hashContent;
        
        const checkInterval = 250; // Проверять каждые 250 мс
        const totalWaitTime = 10000; // Ждем до 10 сек (мобильные сети бывают медленными)
        let timeElapsed = 0;
        
        const pollingInterval = setInterval(() => {
            const element = document.getElementById(elementId);

            // 1. УСПЕХ: Элемент найден
            if (element) {
                clearInterval(pollingInterval); // Останавливаем проверку
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                highlightAllById(elementId); // Запускаем красивую анимацию + ТТС
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
}

// Запускаем интеллектуальную прокрутку при начальной загрузке страницы...
window.addEventListener('DOMContentLoaded', intelligentScrollToHash);

// ...и при каждом изменении якоря в URL.
window.addEventListener('hashchange', intelligentScrollToHash);


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
