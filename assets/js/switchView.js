// Функция для обновления текста кнопки в зависимости от режима
function updateButtonText(isColumnView) {
  const toggleLink = document.getElementById('toggle-mode');
  if (!toggleLink) return;
  toggleLink.innerHTML = isColumnView
    ? '<img src="/assets/svg/align-left.svg" class="common-size-icon4"></img>'
    : '<img src="/assets/svg/align-right.svg" class="common-size-icon4"></img>';
}

// Функция для переключения режима с жесткой фиксацией позиции
function toggleViewMode() {
  const suttaElement = document.querySelector('#sutta, .sutta');
  if (!suttaElement) return;

  // 1. ЗАПОМИНАЕМ ТОЧНУЮ ПОЗИЦИЮ (ЯКОРЬ)
  // Ищем первый видимый ID, который сейчас находится на экране
  const segments = suttaElement.querySelectorAll('[id]');
  let anchorElement = null;
  let anchorOffset = 0;

  for (let seg of segments) {
    const rect = seg.getBoundingClientRect();
    // Находим первый элемент, который виден пользователю (верхняя граница в пределах вьюпорта)
    if (rect.top > -50 && rect.top < window.innerHeight) {
      anchorElement = seg;
      anchorOffset = rect.top; // Сохраняем расстояние от верха экрана до элемента
      break;
    }
  }

  // 2. ПОДГОТОВКА К ПРЫЖКУ (Отключаем плавность)
  const html = document.documentElement;
  const prevScrollBehavior = html.style.scrollBehavior;
  html.style.scrollBehavior = 'auto'; // Выключаем smooth scroll

  // 3. ПЕРЕКЛЮЧАЕМ РЕЖИМ
  showPaliEnglish();
  const isColumnView = suttaElement.classList.toggle('column-view');
  localStorage.setItem('viewMode', isColumnView ? 'columns' : 'alternate');
  updateButtonText(isColumnView);

  // 4. ВОССТАНАВЛИВАЕМ ПОЗИЦИЮ (МГНОВЕННО)
  if (anchorElement) {
    // Новая позиция = Текущий Y элемента в документе - сохраненный отступ от верха экрана
    const targetY = (window.pageYOffset + anchorElement.getBoundingClientRect().top) - anchorOffset;
    window.scrollTo(0, targetY);

    // Контрольный прогон через кадр анимации (как в smoothScroll.js)
    requestAnimationFrame(() => {
        const correctedY = (window.pageYOffset + anchorElement.getBoundingClientRect().top) - anchorOffset;
        window.scrollTo(0, correctedY);
        // Возвращаем настройки скролла
        html.style.scrollBehavior = prevScrollBehavior;
    });
  } else {
    html.style.scrollBehavior = prevScrollBehavior;
  }
}

document.addEventListener('DOMContentLoaded', function() {
  const savedMode = localStorage.getItem('viewMode') || 'alternate';
  const suttaElement = document.querySelector('#sutta, .sutta');
  const isColumnView = (savedMode === 'columns');

  if (isColumnView && suttaElement) {
    showPaliEnglish();
    suttaElement.classList.add('column-view');
  }

  updateButtonText(isColumnView);

  const toggleBtn = document.getElementById('toggle-mode');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', function(e) {
        e.preventDefault();
        toggleViewMode();
    });
  }

  document.addEventListener('keydown', (event) => {
    if (event.altKey && event.code === 'KeyC') {
      toggleViewMode();
    }
  });  
});

function showPaliEnglish() {
  const suttaA = document.getElementById("sutta");
  if (!suttaA) return;
  suttaA.classList.remove("hide-pali", "hide-english", "hide-russian");
}
