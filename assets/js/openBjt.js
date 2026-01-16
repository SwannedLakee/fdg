// openBjt.js

document.addEventListener("DOMContentLoaded", function() {
    runOpenBjt();
});

// Функция, которую можно вызвать повторно при ajax-подгрузке
function runOpenBjt() {
    const bjtLinks = document.querySelectorAll('.bjtLink');
    
    // Проверяем, загружен ли массив данных
    let datasetBjt = typeof bjtLinksData !== 'undefined' ? bjtLinksData : [];

    if (!datasetBjt.length) return;

    bjtLinks.forEach(link => {
        // Если ссылка уже обработана и показана, пропускаем
        if (link.style.display !== 'none') return;

        const slug = link.getAttribute('data-slug');
        const bjtCode = findBjtCode(slug, datasetBjt);

        if (bjtCode) {
            // Формируем ссылку: https://open.tipitaka.lk/latn/{CODE}
            link.href = "https://open.tipitaka.lk/latn/" + bjtCode;
            link.style.display = 'inline'; // Показываем ссылку
            link.target = "_blank";
        }
    });
}

function findBjtCode(slug, dataset) {
    if (dataset && dataset.length) {
        // Ищем совпадение по первому элементу массива ["dn1", "dn-1-1"]
        const item = dataset.find(item => Array.isArray(item) ? item[0] === slug : item === slug);
        if (item && item[1]) {
            return item[1];
        }
    }
    return null;
}

// Запускаем сразу на случай, если скрипт вставлен динамически
runOpenBjt();
