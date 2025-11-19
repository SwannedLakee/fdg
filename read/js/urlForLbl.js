document.addEventListener("DOMContentLoaded", () => {
    const q = new URLSearchParams(window.location.search).get("q");

    // --- Общий обработчик q-link ---
    document.querySelectorAll('.q-link').forEach(el => {
        el.addEventListener('click', (e) => {
            e.preventDefault();

            const baseUrl = el.getAttribute("data-href");
            if (!baseUrl) return;

            let finalUrl = baseUrl;
            if (q) {
                finalUrl += (baseUrl.includes('?') ? '&' : '?') + 'q=' + encodeURIComponent(q);
            }

            window.location.href = finalUrl;
        });
    });

    // --- Обработчик /assets/diff ---
    const diffLink = document.querySelector('a[href="/assets/diff"]');
    if (diffLink) {
        diffLink.addEventListener('click', (e) => {
            e.preventDefault();
            const finalUrl = `/assets/diff/?one=${encodeURIComponent(q)}&two=${encodeURIComponent(q)}`;
            window.location.href = finalUrl;
        });
    }

    const chapterBtn = document.querySelector('#chapter-button a');

    if (chapterBtn && q) {
        const href = chapterBtn.getAttribute("href");

        // Проверяем, подходит ли ссылка
        if (href === "/ru/r.php" || href === "/r.php") {

            chapterBtn.addEventListener("click", (e) => {
                e.preventDefault();

                // base = первые буквы + цифры перед точкой
                // sn12.55 → sn12
                // an1.1-10 → an1
                const match = q.match(/^([a-z]+[0-9]+)/i);
                const base = match ? match[1] : q;

                const finalUrl =
                    `${href}?q=${encodeURIComponent(base)}#${encodeURIComponent(q)}`;

                window.location.href = finalUrl;
            });
        }
    }
});
