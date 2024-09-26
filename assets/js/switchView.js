  // Функция для обновления текста кнопки в зависимости от режима
function updateButtonText(isColumnView) {
  const toggleLink = document.getElementById('toggle-mode');
  toggleLink.innerHTML = isColumnView 
    ? '<img src="/assets/svg/align-left.svg" class="common-size-icon4"></img>' 
    : '<img src="/assets/svg/align-right.svg" class="common-size-icon4"></img>';
}

  // Функция для переключения режима
  function toggleViewMode() {
    const suttaElement = document.getElementById('sutta');
    const isColumnView = suttaElement.classList.toggle('column-view'); // Переключаем класс 'column-view'
    localStorage.setItem('viewMode', isColumnView ? 'columns' : 'alternate'); // Сохраняем режим в localStorage
    updateButtonText(isColumnView); // Обновляем текст кнопки
  }

  // Проверяем сохранённый режим при загрузке страницы
  window.onload = function() {
    const savedMode = localStorage.getItem('viewMode') || 'alternate'; // Получаем сохранённое значение или 'alternate' по умолчанию
    const suttaElement = document.getElementById('sutta');
    const isColumnView = (savedMode === 'columns');
    
    // Применяем сохранённый режим
    if (isColumnView) {
      suttaElement.classList.add('column-view');
    }

    updateButtonText(isColumnView); // Устанавливаем правильный текст кнопки
  };

  // Назначаем обработчик события для кнопки переключения
  document.getElementById('toggle-mode').addEventListener('click', toggleViewMode);
