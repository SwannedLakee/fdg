  function openDpr(slug) {

        console.log("Открывается DPR для:", slug);
        let textUrl = getTextUrl(slug);
        if (textUrl) {
            console.log("Ссылка найдена:", textUrl);
            window.open(textUrl, "_blank");
        } else {
            console.log("Ссылка не найдена");
        }
    }

    function getTextUrl(slug) {
      let nikaya = slug.match(/[a-zA-Z]+/)[0]; // Получаем название никаи из строки
      let textnum;

      if (slug.includes(".")) {
        let match = slug.match(/([a-zA-Z]+)(\d+)\.(\d+)/);
        if (match) {
          let [, nikaya, subdivision, textnum] = match;
          let textUrl = findTextUrl(nikaya, parseInt(subdivision), parseInt(textnum));
          if (textUrl) {
            return textUrl;
          }
        }
      } else {
        textnum = parseInt(slug.match(/[a-zA-Z](\d+)/)[1]); // Получаем цифры после букв
        let textUrl = findTextUrl(nikaya, null, textnum);
        if (textUrl) {
          return textUrl;
        }
      }

      return null;
    }

    function findTextUrl(nikaya, subdivision, textnum) {
      if (subdivision !== null) {
        if (digitalPaliReader[nikaya].available[subdivision]) {
          let item = digitalPaliReader[nikaya].available[subdivision].find(item => {
            if (Array.isArray(item)) {
              if (item.length === 3) {
                return textnum >= item[0] && textnum <= item[1];
              } else if (item.length === 2) {
                return textnum === item[0];
              }
            }
            return false;
          });

          if (item) {
            return digitalPaliReader.constants.rootUrl + item[item.length - 1];
          }
        }
      } else {
        let item = digitalPaliReader[nikaya].available.find(item => Array.isArray(item) ? item[0] === textnum : item === textnum);
        if (item) {
          return digitalPaliReader.constants.rootUrl + item[1];
        }
      }

      return null;
    }