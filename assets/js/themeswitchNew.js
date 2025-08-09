// --- НОВЫЙ КОД ---
// Функция для получения текста уведомления о смене темы на нужном языке
function getThemeNotificationText(theme) {
  // Определяем язык по URL
  const path = window.location.pathname;
  const isRussian = path.includes('/ru') || path.includes('/r/') || path.includes('/ml/');
  const lang = isRussian ? 'ru' : 'en';

  // Словари для переводов
  const translations = {
    light: { en: "Light Theme", ru: "Светлая тема" },
    dark: { en: "Dark Theme", ru: "Темная тема" },
    auto: { en: "Auto Theme", ru: "Авто-тема" }
  };

  // Возвращаем нужный текст или пустую строку, если тема неизвестна
  return translations[theme] ? translations[theme][lang] : "";
}
// --- КОНЕЦ НОВОГО КОДА ---


//change icons svg
function switchIcon(x) {
  var imgElement = document.querySelector(".changesvg"); 
  if (localStorage.theme === "dark") {
    x.classList.remove("fa-moon");
    x.classList.remove("fa-sun");
    x.classList.add("fa-circle-half-stroke");  
    if (imgElement) {
      imgElement.src = "/assets/svg/sun.svg";
    }
  } else if (localStorage.theme === "light") {
    x.classList.remove("fa-circle-half-stroke");
    x.classList.remove("fa-sun");
    x.classList.add("fa-moon");      
    if (imgElement) {
      imgElement.src = "/assets/svg/moon.svg";
    }
  } else if (localStorage.theme === "auto") {
    x.classList.remove("fa-circle-half-stroke");
    x.classList.remove("fa-moon");
    x.classList.add("fa-sun");
    if (imgElement) {
      imgElement.src = "/assets/svg/circle-half-stroke.svg"; 
    }
  }
} 

//theme control
function toggleThemeManually() {
  const bodyTag = document.body;
  const themeButton = document.getElementById("theme-button");

  function setTheme(theme) {
    if (theme === "light") {
      bodyTag.classList.remove("dark");
      document.documentElement.setAttribute("data-bs-theme", "light");
      localStorage.removeItem("darkSwitch");
      document.body.removeAttribute("data-theme");
      localStorage.setItem("theme", "light");
      localStorage.setItem("themeButtonAction", "lightManual");
      localStorage.setItem("lightMode", "light");
    } else if (theme === "dark") {
      bodyTag.classList.add("dark");
      document.documentElement.setAttribute("data-bs-theme", "dark");
      localStorage.setItem("darkSwitch", "dark");
      document.body.setAttribute("data-theme", "dark");
      localStorage.setItem("theme", "dark");
      localStorage.setItem("themeButtonAction", "darkManual");
      localStorage.setItem("lightMode", "dark");
    } else {
      // Handle "auto" theme
      localStorage.setItem("theme", "auto");
      localStorage.setItem("themeButtonAction", "autoFollowOS");
      const darkModeMediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      if (darkModeMediaQuery.matches) {
        bodyTag.classList.add("dark");
        document.documentElement.setAttribute("data-bs-theme", "dark");
        localStorage.setItem("darkSwitch", "dark");
        document.body.setAttribute("data-theme", "dark");
      } else {
        bodyTag.classList.remove("dark");
        document.documentElement.setAttribute("data-bs-theme", "light");
        localStorage.removeItem("darkSwitch");
        document.body.removeAttribute("data-theme");
      }
    }
    
    // --- ИЗМЕНЕНО ---
    // Показываем уведомление о смене темы
    // Проверяем, что функция showBubbleNotification существует (загружена из другого файла)
    if (typeof showBubbleNotification === 'function') {
      const notificationText = getThemeNotificationText(theme);
      if (notificationText) {
        showBubbleNotification(notificationText);
      }
    }
    // --- КОНЕЦ ИЗМЕНЕНИЯ ---
  }

  window.addEventListener("load", function () {
    // --- НОВЫЙ КОД ---
    // Гарантируем, что HTML-элемент для уведомлений создан.
    // Проверяем, существует ли функция initCopyNotification (из copyToClipboard.js)
    if (typeof initCopyNotification === 'function') {
      initCopyNotification();
    }
    // --- КОНЕЦ НОВОГО КОДА ---

    if (localStorage.theme && localStorage.theme !== "auto") {
      setTheme(localStorage.theme);
    } else {
      updateTheme();
    }

    const darkModeMediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    darkModeMediaQuery.addEventListener("change", updateTheme);

    if (themeButton) {
      themeButton.addEventListener("click", () => {
        const currentTheme = localStorage.theme;
        let newTheme;

        if (currentTheme === "light") {
          newTheme = "dark";
        } else if (currentTheme === "dark") {
          newTheme = "auto";
        } else {
          newTheme = "light";
        }
        
        // --- ИЗМЕНЕНО ---
        // Логика установки темы уже содержит вызов уведомления,
        // поэтому здесь дополнительных изменений не нужно.
        setTheme(newTheme);
        localStorage.theme = newTheme;
      });
      
      document.addEventListener("keydown", (event) => {
        if (event.altKey && event.code === "KeyT") {
          themeButton.click();
        }
      });
    }
  });

  function updateTheme() {
    const darkModeMediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const isDark = darkModeMediaQuery.matches;

    // --- ИЗМЕНЕНО ---
    // Мы не вызываем setTheme здесь напрямую, чтобы избежать показа
    // уведомления "Авто-тема" при каждой загрузке страницы.
    // Логика ниже просто обновит классы, как и раньше.
    if (isDark) {
      document.body.classList.add("dark");
      document.documentElement.setAttribute("data-bs-theme", "dark");
      document.body.setAttribute("data-theme", "dark");
    } else {
      document.body.classList.remove("dark");
      document.documentElement.setAttribute("data-bs-theme", "light");
      document.body.removeAttribute("data-theme");
    }
    localStorage.theme = "auto";
  }
}

// Функция для обновления выпадающих меню
function updateDropdownMenus() {
  const isDarkTheme = document.documentElement.getAttribute('data-bs-theme') === 'dark' || 
                     document.body.classList.contains('dark');
  
  document.querySelectorAll('.dropdown-menu').forEach(menu => {
    if (isDarkTheme) {
      menu.classList.add('dropdown-menu-dark');
    } else {
      menu.classList.remove('dropdown-menu-dark');
    }
  });
}

updateDropdownMenus();
toggleThemeManually();

if (!window.themeObserver) {
  window.themeObserver = new MutationObserver((mutations) => {
    mutations.forEach(mutation => {
      if (mutation.attributeName === 'data-bs-theme') {
        updateDropdownMenus();
      }
    });
  });
  window.themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-bs-theme']
  });
}
