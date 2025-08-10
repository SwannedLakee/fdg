
  // Проверка поддержки localStorage
  function storageAvailable(type) {
    try {
      var storage = window[type],
          x = '__storage_test__';
      storage.setItem(x, x);
      storage.removeItem(x);
      return true;
    } catch (e) {
      return false;
    }
  }

  // Сохранение настроек
  function savePreferences() {
  //  console.log("Сохраняем настройки...");
    var pOptions = document.getElementById("pOptions");
    var extraOptions = document.getElementById("extraOptions");
    var onlCheckbox = document.getElementById("onlCheckbox");
    var laCheckbox = document.getElementById("laCheckbox");

    var preferences = {
      p: pOptions.value,
      extra: extraOptions.value,
      onl: onlCheckbox.checked,
      la: laCheckbox.checked
    };
 //   console.log("Настройки к сохранению:", preferences);
    try {
      if (storageAvailable('localStorage')) {
        localStorage.setItem("userPreferences", JSON.stringify(preferences));
   //     console.log("Настройки успешно сохранены.");
        $('#copyPopup').modal('show');
      } else {
        console.warn("localStorage недоступен.");
      }
    } catch (e) {
      console.error("Ошибка при сохранении в localStorage:", e);
    }
  }

  // Сброс настроек
  function resetPreferences() {
 //   console.log("Сброс настроек...");
    try {
      localStorage.removeItem("userPreferences");
      localStorage.removeItem("defaultReader");
      localStorage.removeItem("localSearchHistory");
  // Дополнительные параметры, которые нужно очистить
  localStorage.removeItem('selectedScript');
  localStorage.removeItem('selectedDict');
  localStorage.removeItem("defaultReader");
  localStorage.removeItem('paliToggleRu');
  localStorage.removeItem('viewMode');
  localStorage.removeItem("quotePopupEnabled");
  localStorage.removeItem("localSearchHistory");
  localStorage.setItem("variantVisibility", "hidden");




      document.querySelectorAll("select").forEach(select => {
        select.selectedIndex = 0;
      });

      document.querySelectorAll("input[type='radio']").forEach(radio => {
        radio.checked = radio.defaultChecked;
      });

      document.querySelectorAll("input[type='checkbox']").forEach(checkbox => {
        checkbox.checked = checkbox.defaultChecked;
      });


 const keysToRemove = [
    'lightMode',
    'dark',
    'paliToggleRu',
    'pli-rus',
    'popupHeight',
    'popupLeft',
    'popupTop',
    'popupWidth',
    'removePunct',
    'selectedDict',
    'selectedScript',
    'theme',
    'themeButtonAction',
    'visitCount',
    'windowHeight',
    'windowWidth',
    'isFirstDrag'
  ];

  keysToRemove.forEach(key => {
    localStorage.removeItem(key);
  });


    // Проверяем, существует ли функция clearFdgPopupParams()
    if (typeof clearFdgPopupParams === 'function') {
        clearFdgPopupParams(); // Вызываем, если функция объявлена
    }
    
      if (typeof resetForm === 'function') {
        resetForm();
      }

      $('#copyPopup').modal('show');
  //    console.log("Сброс завершён.");
    } catch (e) {
      console.error("Ошибка при сбросе настроек:", e);
    }
  }

  // Загрузка настроек
  function loadPreferences() {
 //   console.log("Загрузка настроек...");
    try {
      var storedPreferences = localStorage.getItem("userPreferences");
      if (storedPreferences) {
        var preferences = JSON.parse(storedPreferences);
    //    console.log("Загруженные настройки:", preferences);

        document.getElementById("pOptions").value = preferences.p || "";
        document.getElementById("extraOptions").value = preferences.extra || "";
        document.getElementById("onlCheckbox").checked = preferences.onl || false;
        document.getElementById("laCheckbox").checked = preferences.la || false;
      } else {
   //     console.warn("Настройки не найдены в localStorage.");
        document.getElementById("extraOptions").value = "";
      }
    } catch (e) {
      console.error("Ошибка при загрузке настроек:", e);
    }
  }

  // Загрузка при старте
document.addEventListener("DOMContentLoaded", function () {
  //console.log("DOM полностью загружен");
  loadPreferences();
});