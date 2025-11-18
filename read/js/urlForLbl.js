/**
 * Добавляет параметр "q" из URL к ссылке, показывает alert и переходит.
 * @param {string} linkHref - Исходная ссылка, к которой добавится параметр.
 */
/* function navigateWithQParam(linkHref) {
    // 1. Получаем параметр "q" из текущего URL
    const urlParams = new URLSearchParams(window.location.search);
    const qParam = urlParams.get('q');
    
    // 2. Если параметр есть — добавляем его к ссылке
    let finalUrl = linkHref;
    if (qParam) {
        finalUrl += (linkHref.includes('?') ? '&' : '?') + 'q=' + encodeURIComponent(qParam);
    }
    
    // 3. Показываем alert с итоговым URL
  //  alert(`Переход по ссылке:\n${finalUrl}`);
    
    // 4. Переходим
    window.location.href = finalUrl;
}

*/

document.addEventListener("DOMContentLoaded", () => {
            const q = new URLSearchParams(window.location.search).get("q");
     
	 document.querySelectorAll('.q-link').forEach(el => {
        el.addEventListener('click', (e) => {
            e.preventDefault(); // предотвращаем стандартный переход

            const baseUrl = el.getAttribute("data-href");
            if (!baseUrl) return;

            // Получаем q на момент клика
			//const q = document.getElementById('paliauto')?.value.trim().toLowerCase().replace(/ṁ/g, 'ṃ') || '';

            let finalUrl = baseUrl;
            if (q) {
                finalUrl += (baseUrl.includes('?') ? '&' : '?') + 'q=' + encodeURIComponent(q);
            }

            // Переход по ссылке
            window.location.href = finalUrl;
        });
    });

    // Если нужно для конкретной ссылки "/assets/diff"
    const diffLink = document.querySelector('a[href="/assets/diff"]');
    if (diffLink) {
        diffLink.addEventListener('click', (e) => {
            e.preventDefault();
            const finalUrl = `/assets/diff/?one=${encodeURIComponent(q)}&two=${encodeURIComponent(q)}`;
            window.location.href = finalUrl;
        });
    }

});
