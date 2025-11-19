function updateLinks(lang) {
    const readLink = document.getElementById('readLink');
    const homeLink = document.getElementById('homeLink');

    // извлекаем q-параметр из текущего URL
    const urlParams = new URLSearchParams(window.location.search);
    const qParam = urlParams.get('q');

    if (lang === 'ru') {
        readLink.href = '/r';
        homeLink.href = '/ru/read.php';
    } else if (lang.startsWith('en')) {
        readLink.href = '/read';
        homeLink.href = '/read.php';
    } else {
        lang = 'en';
        readLink.href = '/read';
        homeLink.href = '/read.php';
    }
    
    
    if (qParam) {
        const separator = readLink.href.includes('?') ? '&' : '?';
        readLink.href += `${separator}q=${encodeURIComponent(qParam)}`;
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const lang = detectLanguage();
    updateLanguageSwitcher(lang);
    updateLinks(lang);

    document.getElementById('darkSwitch').addEventListener('change', function() {
        document.body.classList.toggle('dark-mode');
    });
});


  document.querySelectorAll('.mode-switch').forEach(btn => {
    btn.addEventListener('click', function(e) {
        e.preventDefault();

        const target = this.getAttribute('href');   // /r.php или /d.php
        const url = new URL(window.location.href);

        // меняем только имя файла
        url.pathname = url.pathname.replace(/(d|r)\.php$/, target.replace('/', ''));

        window.location.href = url.toString();
    });
});