//change icons svg
function switchIcon(x) {
  
  var imgElement = document.querySelector(".changesvg"); 
   if (localStorage.theme === "dark") {
     console.log(localStorage.theme);
  

  
        x.classList.remove("fa-moon");
  x.classList.remove("fa-sun");
     x.classList.add("fa-circle-half-stroke");  
  
  if (imgElement) {
  imgElement.src = "/assets/svg/sun.svg";
  }
   } else if (localStorage.theme === "light") {
     console.log(localStorage.theme);

    x.classList.remove("fa-circle-half-stroke");
  x.classList.remove("fa-sun");
  x.classList.add("fa-moon");      

  if (imgElement) {
  imgElement.src = "/assets/svg/moon.svg";
  }

   } else if (localStorage.theme === "auto") {
     console.log(localStorage.theme);

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
      
      //for TBW
   localStorage.setItem("lightMode", "light");
    } else if (theme === "dark") {
      bodyTag.classList.add("dark");
      document.documentElement.setAttribute("data-bs-theme", "dark");
          localStorage.setItem("darkSwitch", "dark");
      document.body.setAttribute("data-theme", "dark");
      localStorage.setItem("theme", "dark");
      localStorage.setItem("themeButtonAction", "darkManual");
      
            //for TBW
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
  }
//document.addEventListener("DOMContentLoaded", function () {
  window.addEventListener("load", function () {
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

        setTheme(newTheme);
        localStorage.theme = newTheme;

      });
      
            // Добавляем обработчик сочетания клавиш Alt + S (физическая клавиша)
  document.addEventListener("keydown", (event) => {
    if (event.altKey && event.code === "KeyT") {
      // Имитируем клик по кнопке
      themeButton.click();
    }
  });
    }
  });

  function updateTheme() {
    const darkModeMediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    if (darkModeMediaQuery.matches) {
      setTheme("dark");
      localStorage.theme = "auto";

    } else {
      setTheme("light");
      localStorage.theme = "auto";
    }
  }
  

  
}

toggleThemeManually();

var themeValue = localStorage.theme;
console.log("Значение theme:", themeValue);