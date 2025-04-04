 document.addEventListener('DOMContentLoaded', function() {
    function loadMainPageAssets() {
        let loadedCSS = false, loadedJS = false;

        function checkAndShowPage() {
            if (loadedCSS && loadedJS) {
                document.body.style.visibility = "visible";
                document.body.style.opacity = "1";
            }
        }

        // Загрузка CSS
        const css = document.createElement("link");
        css.rel = "stylesheet";
        css.href = "/assets/css/bootstrap.5.3.1.min.css"; // Укажите путь к вашему основному CSS
        css.onload = function() { 
            loadedCSS = true; 
            checkAndShowPage();
        };
        document.head.appendChild(css);

        // Загрузка JS
        const script = document.createElement("script");
        script.src = "/assets/js/themeswitch.js"; // Укажите путь к вашему основному JS
        script.onload = function() { 
            loadedJS = true; 
            checkAndShowPage();
        };
        document.body.appendChild(script);

        checkAndShowPage(); // На случай, если что-то загрузится мгновенно
    }
  
    loadMainPageAssets();
});