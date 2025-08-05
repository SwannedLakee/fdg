// Функция для подсветки всех элементов с указанным ID с прозрачным фоном
// Функция для подсветки всех элементов с указанным ID с плавным мерцанием и прозрачным фоном
function highlightAllById(elementId) {
    // Используем тот же селектор, чтобы найти родительский элемент и всех его потомков
    const elements = document.querySelectorAll(`[id="${elementId}"], [id="${elementId}"] *`);

    if (elements.length === 0) return;

    elements.forEach(element => {
        // Сохраняем оригинальные стили, чтобы вернуть их после анимации
        const originalBgColor = element.style.backgroundColor;
        const originalTransition = element.style.transition;

        let blinkCount = 0;
        const maxBlinks = 6; // 3 полных мерцания (вкл/выкл)
        const intervalDuration = 500; // Длительность каждого состояния (полсекунды)

        // Добавляем плавный переход для свойства background-color.
        // Анимация будет длиться 0.45с с эффектом плавного начала и конца.
        element.style.transition = 'background-color 0.45s ease-in-out';

        const blinkInterval = setInterval(function() {
            // Чередуем цвет подсветки и оригинальный цвет
            // Благодаря 'transition' смена будет плавной
            element.style.backgroundColor = blinkCount % 2 === 0
                ? 'rgba(26, 188, 156, 0.2)' // Более прозрачный цвет подсветки
                : originalBgColor || 'transparent'; // Возвращаемся к оригиналу или к полной прозрачности

            blinkCount++;

            if (blinkCount >= maxBlinks) {
                clearInterval(blinkInterval);

                // После завершения мерцаний плавно возвращаем исходный цвет фона.
                // Переход 'transition' все еще активен, поэтому это будет плавно.
                element.style.backgroundColor = originalBgColor || '';

                // Ждем, пока завершится последняя анимация затухания (500мс),
                // и только потом убираем наш стиль transition, чтобы не мешать другим скриптам.
                setTimeout(() => {
                    element.style.transition = originalTransition;
                }, intervalDuration);
            }
        }, intervalDuration);
    });
}

// Smooth scroll to anchor with highlighting for all matching elements
window.addEventListener('DOMContentLoaded', function() {
    var hash = window.location.hash;
    const isLocalhost = window.location.hostname.match(/localhost|127\.0\.0\.1/);
    const timeout = isLocalhost ? 1000 : 2500; 
    
    if (hash) {
        setTimeout(function() {
            var elementId = hash.substring(1);
            var elements = document.querySelectorAll(`[id="${elementId}"]`);
            
            if (elements.length > 0) {
                elements[0].scrollIntoView({ behavior: 'smooth' });
                highlightAllById(elementId);
            }
        }, timeout);
    }
});

// Handle hash changes
window.addEventListener('hashchange', function() {
    var hash = window.location.hash;
    if (hash) {
        var elementId = hash.substring(1);
        var elements = document.querySelectorAll(`[id="${elementId}"]`);
        
        if (elements.length > 0) {
            elements[0].scrollIntoView({ behavior: 'smooth' });
            highlightAllById(elementId);
        }
    }
});

// Остальной код остается без изменений
document.addEventListener('DOMContentLoaded', function() {
    // Создаем элемент кнопки
    var scrollToTopBtn = document.createElement('button');
    scrollToTopBtn.id = 'scrollToTopBtn';
    scrollToTopBtn.className = 'btn btn-secondary rounded-pill hide-button';
    scrollToTopBtn.style.display = 'none';

    // Создаем элемент изображения
    var img = document.createElement('img');
    img.id = 'arrowImg';
    img.src = '/assets/svg/arrow-up.svg';
    img.alt = 'To top';
    scrollToTopBtn.appendChild(img);
    
    if (localStorage.theme === "dark") { 
        img.src = '/assets/svg/arrow-up.svg';
    } else if (localStorage.theme === "light") { 
        img.src = '/assets/svg/arrow-up-dark.svg';
    } else { 
        img.src = '/assets/svg/arrow-up.svg';
    }
    
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

    scrollToTopBtn.addEventListener('click', function(event) {
        event.preventDefault();
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
});

// Обработчик для кнопки смены темы
const themeButton = document.getElementById("theme-button");
if (themeButton) {
    themeButton.addEventListener('click', function() {
        setTimeout(() => {
            const arrowImg = document.getElementById('arrowImg');
            if (arrowImg) {
                const isDark = document.documentElement.classList.contains('dark') || 
                               localStorage.theme === 'dark' ||
                               (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
                
                arrowImg.src = isDark ? '/assets/svg/arrow-up.svg' : '/assets/svg/arrow-up-dark.svg';
            }
        }, 50);
    });
}

//scroll by s params
document.addEventListener("DOMContentLoaded", function() {
    let params = new URLSearchParams(document.location.search);
    let finder = params.get("s");
    let query = params.get("q");
    let url = document.location.href;

    if (finder && finder.trim() !== "" && query && url.indexOf("#") === -1) {
        let regex = new RegExp(finder, 'gi');
        let match = document.body.innerText.match(regex);

        if (match && match.length > 0) {
            let firstMatchElement = document.querySelector(`*:contains(${match[0]})`);

            if (firstMatchElement) {
                firstMatchElement.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });
            }
        }
    }
});

// Функция для выделения элемента по ID (старая версия)
function highlightById(elementId) {
    const element = document.getElementById(elementId);
    if (!element) return;

    const originalTransition = element.style.transition;
    const originalBorderRadius = element.style.borderRadius;
    const originalBoxShadow = element.style.boxShadow;

    element.style.borderRadius = '10px';
    element.style.transition = 'box-shadow 0.3s ease-in-out';
    let blinkCount = 0;
    const maxBlinks = 6;
    let isWide = false;

    const icons = element.querySelectorAll('.menu-icon, i.fa-solid, img');

    const blinkInterval = setInterval(function() {
        element.style.boxShadow = isWide ? '0 0 0 2px grey' : '0 0 0 4px grey';
        
        icons.forEach(icon => {
            icon.style.transition = 'box-shadow 0.3s ease-in-out';
            icon.style.boxShadow = isWide ? '0 0 0 2px grey' : '0 0 0 4px grey';
        });

        isWide = !isWide;
        blinkCount++;

        if (blinkCount >= maxBlinks) {
            clearInterval(blinkInterval);
            
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
    ids.forEach(id => highlightAllById(id));
}

function observeAndHighlightElements(classNames) {
    const classes = Array.isArray(classNames) ? classNames : [classNames];
    
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                highlightElement(entry.target);
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);
    
    classes.forEach(className => {
        document.querySelectorAll(`.${className}`).forEach(element => {
            observer.observe(element);
        });
    });
}

function highlightElement(element) {
    if (!element) return;
    
    element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    
    const originalTransition = element.style.transition;
    const originalBorderRadius = element.style.borderRadius;
    const originalBoxShadow = element.style.boxShadow;
    
    element.style.borderRadius = '10px';
    element.style.transition = 'box-shadow 0.3s ease-in-out';
    let isWide = false;
    
    const blinkInterval = setInterval(() => {
        element.style.boxShadow = isWide ? '0 0 0 2px grey' : '0 0 0 4px grey';
        isWide = !isWide;
    }, 500);
    
    setTimeout(() => {
        clearInterval(blinkInterval);
        element.style.boxShadow = '0 0 0 0 grey';
        
        setTimeout(() => {
            element.style.transition = originalTransition;
            element.style.borderRadius = originalBorderRadius;
            element.style.boxShadow = originalBoxShadow;
        }, 300);
    }, 3000);
}

function checkHashAndHighlight() {
    const hash = window.location.hash;

    if (hash) {
        const elementId = hash.substring(1);
        highlightAllById(elementId);
    }
}

window.addEventListener('hashchange', checkHashAndHighlight);

document.addEventListener("DOMContentLoaded", function () {
    checkHashAndHighlight();
});