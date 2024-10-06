const Sccopy = "/suttacentral.net";
const suttaArea = document.getElementById("sutta");
const homeButton = document.getElementById("home-button");
const fdgButton = document.getElementById("fdg-button");
const bodyTag = document.querySelector("body");
const previous = document.getElementById("previous");
const next = document.getElementById("next");
const previous2 = document.getElementById("previous2");
const next2 = document.getElementById("next2");
const form = document.getElementById("form");
const citation = document.getElementById("paliauto");
const pathLang = "en";

citation.focus();
let language = "pli-eng";

homeButton.addEventListener("click", () => {
  document.location.search = "";
});



// pressing enter will "submit" the citation and load
form.addEventListener("submit", e => {
  e.preventDefault();
  if (citation.value) {
    buildSutta(citation.value.replace(/\s+/g, " "));
    history.pushState({ page: citation.value.replace(/\s+/g, " ") }, "", `?q=${citation.value.replace(/\s+/g, " ")}`);
  }
});

function buildSutta(slug) {
  let translator = "";
  let texttype = "sutta";
  let slugArray = slug.split("&");
  slug = slugArray[0];
  if (slugArray[1]) {
    translator = slugArray[1];
  } else {
    translator = "sujato";
  }
  slug = slug.toLowerCase();

  if ((!slug.match("bu-pm")) && (!slug.match("bi-pm")) && (slug.match(/bu-|bi-|kd|pvr/))) {
    translator = "brahmali";
    texttype = "vinaya";
    slug = slug.replace(/bu([psan])/, "bu-$1");
    slug = slug.replace(/bi([psn])/, "bi-$1");
    if (!slug.match("pli-tv-")) {
      slug = "pli-tv-" + slug;
    }
    if (!slug.match("vb-")) {
      slug = slug.replace("bu-", "bu-vb-");
    }
    if (!slug.match("vb-")) {
      slug = slug.replace("bi-", "bi-vb-");
    }
  }

  if (slug.match(/bu-pm|bi-pm/)) {
    texttype = "vinaya";
    slug = slug.replace(/bu([psan])/, "bu-$1");
    slug = slug.replace(/bi([psan])/, "bi-$1");
    if (!slug.match("pli-tv-")) {
      slug = "pli-tv-" + slug;
    }
  }

console.log('texttype ' + texttype + ' translator ' + translator);

  let html = `<div class="button-area"><button id="language-button" class="hide-button">Pāḷi Eng</button></div>`;
  
  const slugReady = parseSlug(slug);
  console.log("slugReady is " + slugReady + " slug is " + slug); 

var rootpath = `${Sccopy}/sc-data/sc_bilara_data/root/pli/ms/${texttype}/${slugReady}_root-pli-ms.json`
   var htmlpath = `${Sccopy}/sc-data/sc_bilara_data/html/pli/ms/${texttype}/${slugReady}_html.json`;
   
    if (slug.match(/ja/)) {
  let language = "pli";
    var trnpath = `${Sccopy}/sc-data/sc_bilara_data/root/pli/ms/${texttype}/${slugReady}_root-pli-ms.json`;
    console.log('ja case ', rootpath, trnpath, htmlpath);
} else if (slug.match(/bu-pm|bi-pm/)) {
    //let translator = "thanissaro+o";
    let translator = "thanissaro";
    texttype === "vinaya";
      let language = "pli";
    var rootpath = `/assets/texts/${texttype}/${slug}_root-pli-ms.json`;
    var trnpath = `/assets/texts/${texttype}/${slug}_translation-en-thanissaro.json`;
    var htmlpath = `/assets/texts/${texttype}/${slug}_html.json`;
    console.log(rootpath, trnpath, htmlpath);
} else {
  var trnpath = `${Sccopy}/sc-data/sc_bilara_data/translation/${pathLang}/${translator}/${texttype}/${slugReady}_translation-${pathLang}-${translator}.json`;
}

  const rootResponse = fetch(rootpath)
    .then(response => response.json());
   
  const translationResponse = fetch(trnpath).then(response => response.json());
  const htmlResponse = fetch(htmlpath).then(response => response.json());
  Promise.all([rootResponse, translationResponse, htmlResponse]).then(responses => {
    const [paliData, transData, htmlData] = responses;

    Object.keys(htmlData).forEach(segment => {
      if (transData[segment] === undefined) {
        transData[segment] = "";
      }
      let [openHtml, closeHtml] = htmlData[segment].split(/{}/);
      /* openHtml = openHtml.replace(/^<span class='verse-line'>/, "<br><span class='verse-line'>"); inputscript-IASTPali 
      Roman (IAST)     	IAST
Roman (IAST: Pāḷi)     	IASTPali
Roman (IPA)            	IPA
Roman (ISO 15919)      	ISO
Roman (ISO 15919: Pāḷi)	ISOPali */
// ISOPali ISO IASTPali IAST

let startIndex = segment.indexOf(':') + 1;
let anchor = segment.substring(startIndex);

if (slug.includes('-') && (slug.includes('an') || slug.includes('sn') || slug.includes('dhp'))) {
anchor = segment;
}

var fullUrlWithAnchor = window.location.href.split('#')[0] + '#' + anchor;

let params = new URLSearchParams(document.location.search);
  let finder = params.get("s");
  //finder = finder.replace(/\\b/g, '');
  console.log("finder ", finder);
if (finder && finder.trim() !== "") {
    let regex = new RegExp(finder, 'gi'); // 'gi' - игнорировать регистр
    paliData[segment] = paliData[segment].replace(regex, match => `<b class="match finder">${match}</b>`);
    transData[segment] = transData[segment].replace(regex, match => `<b class="match finder">${match}</b>`);
    
}

if (paliData[segment] !== undefined && transData[segment] !== undefined) {
        html += `${openHtml}<span id="${anchor}">
      <span class="pli-lang inputscript-ISOPali" lang="pi">${paliData[segment].trim()}<a class="text-decoration-none" style="cursor: pointer;" onclick="copyToClipboard('${fullUrlWithAnchor}')">&nbsp;</a></span><span class="rus-lang" lang="ru">${transData[segment]}</span>
      </span>${closeHtml}\n\n`;
} else if (paliData[segment] !== undefined) {
  html += openHtml + '<span id="' + anchor + '"><span class="pli-lang inputscript-ISOPali" lang="pi">' + paliData[segment] + '</span></span>' + closeHtml + '\n\n';
} else if (transData[segment] !== undefined) {
  html += openHtml + '<span id="' + anchor + '"><span class="rus-lang" lang="ru">' + transData[segment] + '</span></span>' + closeHtml + '\n\n';
}


    });


console.log('texttype ' + texttype + ' translator ' + translator);
if (translator === "sv") {
  translatorforuser = 'SV theravada.ru';
} else if ((translator === "" && texttype === "sutta" ) || (translator === "sujato" )) {
  translatorforuser = 'Bhikkhu Sujato';
} else if ((translator === "" && texttype === "vinaya") || (translator === "brahmali" ))  {
  translatorforuser = 'Bhikkhu Brahmali';
} else if (translator === "syrkin" ) {
  translatorforuser = 'А.Я. Сыркин';
} else if (translator === "syrkin+o" ) {
  translatorforuser = 'А.Я. Сыркин, ред. о';
} else if (translator === "sv+edited+o" ) {
  translatorforuser = 'SV theravada.ru, ред. о';
} else if (translator === "o+in+progress" ) {
  translatorforuser = 'о, в процессе';
} else {
	translatorforuser = translator ;
}
console.log('texttype ' + texttype + ' translator ' + translator);

//const translatorCapitalized = translator.charAt(0).toUpperCase() + translator.slice(1);

          const translatorByline = `<div class="byline">
     <p>
    <span class="eng-lang" lang="en">
     Translated by ${translatorforuser}
    </span>
     </p>
     </div>`;
     
      const scButton = `<a href="https://suttacentral.net/${slug}/en/${translator}">Read on SC.net</a>`;
      
      
      $.ajax({
      url: "/sc/extralinks.php?fromjs=" +slug
    }).done(function(data) {
      const linksArray = data.split(",");
   


const enUrl = window.location.href;

const ruUrl = enUrl.replace("/sc/", "/ru/sc/");

let scLink = `<p class="sc-link"><a href="${ruUrl}">Ru</a>&nbsp;`;
 
//dpr
if (texttype !== "vinaya") {
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
  
  return "Запись не найдена";
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

let textUrl = getTextUrl(slug);
console.log("Ссылка на", slug + ":", textUrl);
if (textUrl) {
scLink += `<a target="" href="${textUrl}">DPR</a>&nbsp;`;
}
}
//dpr end

scLink += `<a target="" href="https://suttacentral.net/${slug}/en/${translator}">SC.net</a>&nbsp;`;
      
//<a href="/legacy.suttacentral.net/sc/pi/${slug}.html">legacy.SC</a>&nbsp; <a target="" href="https://voice.suttacentral.net/scv/index.html?#/sutta?search=${slug}">Voice.SC</a> 
      if (linksArray[0].length >= 4) {
        scLink += linksArray[0];
        //    console.log("extralinks " + linksArray[0]);
      } 
      scLink += "</p>"; 

const origUrl = window.location.href;
let rvUrl = origUrl.replace("/ru/sc/", "/sc/");
rvUrl = rvUrl.replace("ml.html", "");
rvUrl = rvUrl.replace("/sc/", "/sc/rv.html");


const warning = "<p class='warning' >Warning!<br>Translations made not by the Blessed One.<br>Cross-check with Pali in 4 main nikayas.<a class='text-decoration-none' target='' href='" + rvUrl + "'>&nbsp;</a></p>";

suttaArea.innerHTML =  scLink + warning + translatorByline + html + translatorByline + warning + scLink ;  
 
 const pageTitleElement = document.querySelector("h1");
let pageTitleText = pageTitleElement.textContent;
pageTitle = pageTitleText.replace(/[0-9.]/g, '');

slug = slug.replace(/pli-tv-|vb-/g, '');
document.title = `${slug} ${pageTitle}`;
    
var metaDescription = document.createElement('meta');
metaDescription.name = 'description';
metaDescription.content = document.title;
document.head.appendChild(metaDescription);

var ogDescriptionMeta = document.createElement('meta');
ogDescriptionMeta.property = 'og:description';
ogDescriptionMeta.content = document.title;
document.head.appendChild(ogDescriptionMeta);


      toggleThePali();
      
      $.ajax({
      url: "/sc/api.php?fromjs=" +texttype +"/" +slugReady +"&type=A"
    }).done(function(data) {
      let nextArray = data.split(" ");
      let nextSlug = nextArray[0];
      let nextSlugPrint = nextSlug.replace(/pli-tv-|b[ui]-vb-/g, "");
let nextName = nextArray.slice(1).join(" ");
nextName = nextName.replace(/[0-9.]/g, '');
     if (nextName === undefined) {
      var nextPrint = nextSlugPrint;
      } else {
     var nextPrint = nextSlugPrint +' ' +nextName;
     }
      
         next.innerHTML = nextSlug
        ? `<a href="?q=${nextSlug}">${nextPrint}<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" id="body_1" width="15" height="11">

      <g transform="matrix(0.021484375 0 0 0.021484375 2 -0)">
        <g>
              <path d="M202.1 450C 196.03278 449.9987 190.56381 446.34256 188.24348 440.73654C 185.92316 435.13055 187.20845 428.67883 191.5 424.39L191.5 424.39L365.79 250.1L191.5 75.81C 185.81535 69.92433 185.89662 60.568687 191.68266 54.782654C 197.46869 48.996624 206.82434 48.91536 212.71 54.6L212.71 54.6L397.61 239.5C 403.4657 245.3575 403.4657 254.8525 397.61 260.71L397.61 260.71L212.70999 445.61C 209.89557 448.4226 206.07895 450.0018 202.1 450z" stroke="none" fill="#8f8f8f" fill-rule="nonzero" />
        </g>
      </g>
      </svg></a>`
        : "";
        next2.innerHTML = next.innerHTML;
    }
    );
  
  $.ajax({
      url: "/sc/api.php?fromjs=" +texttype +"/" +slugReady +"&type=B"
    }).done(function(data) {
      const prevArray = data.split(" ");
      let prevSlug = prevArray[0];
      let prevSlugPrint = prevSlug.replace(/pli-tv-|b[ui]-vb-/g, "");
let prevName = prevArray.slice(1).join(" ");
prevName = prevName.replace(/[0-9.]/g, '');
      
    if (prevName === undefined) {
    var prevPrint = prevSlugPrint;
      } else {
        var prevPrint = prevSlugPrint +' ' +prevName;
     }
    
      previous.innerHTML = prevSlug
        ? `<a href="?q=${prevSlug}&lang=${language}"><svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" id="body_1" width="15" height="11">

      <g transform="matrix(0.021484375 0 0 0.021484375 2 -0)">
        <g>
              <path d="M353 450C 349.02106 450.0018 345.20444 448.4226 342.39 445.61L342.39 445.61L157.5 260.71C 151.64429 254.8525 151.64429 245.3575 157.5 239.5L157.5 239.5L342.39 54.6C 346.1788 50.809414 351.70206 49.328068 356.8792 50.713974C 362.05634 52.099876 366.10086 56.14248 367.4892 61.318974C 368.87753 66.49547 367.3988 72.01941 363.61002 75.81L363.61002 75.81L189.32 250.1L363.61 424.39C 367.90283 428.6801 369.18747 435.13425 366.8646 440.74118C 364.5417 446.34808 359.06903 450.00275 353 450z" stroke="none" fill="#8f8f8f" fill-rule="nonzero" />
        </g>
      </g>
      </svg>${prevPrint}</a>`
        : ""; 
        previous2.innerHTML = previous.innerHTML;
      }
      );
    }
    );
    })
    
    .catch(error => {
  console.log('error:not found');

  var xhr = new XMLHttpRequest();
  xhr.open("GET", "/?q=" + encodeURIComponent(slug), true);
  xhr.send();

  // Обработка ответа
  xhr.onreadystatechange = function() {
    if (xhr.readyState == 4) {
      if (xhr.status == 200) {
        // Обработка успешного ответа
        console.log(xhr.responseText);
                window.location.reload(true);
        window.location.href = "/?q=" + encodeURIComponent(slug);

      } else {
        // Обработка ошибки
        console.log('Error sending request to /?q=');
      }
    }
  };

  // Обновление сообщения об ошибке на странице
        suttaArea.innerHTML = `<p>Searching for "${decodeURIComponent(slug)}". Please wait.</p>
              <div class="spinner-border" role="status">
                <span class="visually-hidden">Loading...</span>
                  </div>
    <br><br>
  <p>  Note: <br>
More search options available from the main page.</p>`;
});
}

// initialize the whole app
if (document.location.search) {
  let params = new URLSearchParams(document.location.search);
  let slug = params.get("q");
  let lang = params.get("lang");
  citation.value = slug;
  buildSutta(slug);
if (lang) {
    language = lang;
    console.log("in the initializing " + lang);
    setLanguage(lang);
  } else if  (localStorage.paliToggle) {
    	language = localStorage.paliToggle; 
		  console.log('read from ls ' + language);
setLanguage(language);
  }
} else {
  suttaArea.innerHTML = `<div class="instructions">
  <p>For navigation texts should conatin text numbers. E.g.: <span class="abbr">sn35.28</span> <span class="abbr">an1.1-10</span> <span class="abbr">bu-as1-7</span> or <span class="abbr">bi-pj1</span>.<br>
  Dn, mn, sn, an, some kn books, both patimokkhas and vinaya vibhanga are available. </p>
  <div class="lists">

  <div class="suttas">
  <h2>Main Suttas</h2>
  <ul>
      <li><span class="abbr">dn</span> Dīgha-nikāya</li>
      <li><span class="abbr">mn</span> Majjhima-nikāya</li>
      <li><span class="abbr">sn</span> Saṁyutta-nikāya</li>
      <li><span class="abbr">an</span> Aṅguttara-nikāya</li>
  </ul>
  </div><div>
  <!-- <h2>Vinaya</h2> -->
  <div class="vinaya">
  <div>
  <h3>Bhikkhu Vinaya</h3>
<ul>
<li><span class="abbr">bu-pm</span> <a href="/assets/texts/pm.php"> Bhikkhunīpātimokkha</a></li>
<li><span class="abbr">bu-pj</span> Pārājikā</li>
<li><span class="abbr">bu-ss</span> Saṅghādisesā</li>
<li><span class="abbr">bu-ay</span> Aniyatā</li>
<li><span class="abbr">bu-np</span> Nissaggiyā-pācittiyā</li>
<li><span class="abbr">bu-pc</span> Pācittiyā</li>
<li><span class="abbr">bu-pd</span> Pāṭidesanīyā</li>
<li><span class="abbr">bu-sk</span> Sekhiyā</li>
<li><span class="abbr">bu-as</span> Adhikarana-samatha</li>
</ul>
</div><div>
<h3>Bhikkhuni Vinaya</h3>
<ul>
<li><span class="abbr">bi-pm</span> <a href="/assets/texts/bipm.php"> Bhikkhunīpātimokkha</a></li>
<li><span class="abbr">bi-pj</span> Pārājikā</li>
<li><span class="abbr">bi-ss</span> Saṅghādisesā</li>
<li><span class="abbr">bi-np</span> Nissaggiyā-pācittiyā</li>
<li><span class="abbr">bi-pc</span> Pācittiyā</li>
<li><span class="abbr">bi-pd</span> Pāṭidesanīyā</li>
<li><span class="abbr">bi-sk</span> Sekhiyā</li>
<li><span class="abbr">bi-as</span> Adhikarana-samatha</li>
</ul>
</div>
<ul>
<li><span class="abbr">kd</span> Khandhakas</li>
<li><span class="abbr">pvr</span> Parivāra</li>
</ul>
</div>
  </div></div>
  <h2>Other Texts</h2>
  <ul>
      <li><span class="abbr">ud</span> Udāna</li>
      <li><span class="abbr">iti</span> Itivuttaka (1–112)</li>
      <li><span class="abbr">dhp</span> Dhammapada</li>
      <li><span class="abbr">snp</span> Sutta-nipāta</li>
      <li><span class="abbr">thag</span> Theragāthā</li>
      <li><span class="abbr">thig</span> Therīgāthā</li>
	  <li><span class="abbr">kp</span> Khuddakapāṭha</li>
  </ul>
  </div><div>
</div>
`;
}

function setLanguage(language) {
  if (language === "pli-eng") {
    showPaliEnglish();
  } else if (language === "eng") {
    showEnglish();
  } else if (language === "pli") {
    showPali();
  }
}

function showPaliEnglish() {
  console.log("showing pali eng");
  suttaArea.classList.remove("hide-pali");
  suttaArea.classList.remove("hide-english");
  suttaArea.classList.remove("hide-russian");
}
function showEnglish() {
  console.log("showing eng");
  suttaArea.classList.add("hide-pali");
  suttaArea.classList.remove("hide-english");
  suttaArea.classList.remove("hide-russian");
}
function showPali() {
  console.log("showing pali");
  suttaArea.classList.add("hide-english");
    suttaArea.classList.remove("hide-pali");
      suttaArea.classList.add("hide-russian");
  
}

function toggleThePali() {
  const languageButton = document.getElementById("language-button");

	 // initial state
 if (!localStorage.paliToggle) {
    localStorage.paliToggle = "pli-eng";
  }   

  languageButton.addEventListener("click", () => {
    if (language === "pli") {
      showPaliEnglish();
      language = "pli-eng";
      localStorage.paliToggle = "pli-eng";
    } else if (language === "pli-eng") {
      showEnglish();
      language = "eng";
      localStorage.paliToggle = "eng";
    } else if (language === "eng") {
      showPali();
      language = "pli";
      localStorage.paliToggle = "pli";
    }
  });
}

function parseSlug(slug) {
if (
  slug === 'bu-as' ||
  slug === 'bu-vb-as1-7' ||
  slug === 'pli-tv-bu-vb-as1-7' ||
  slug === 'bi-as' ||
  slug === 'bi-vb-as1-7' ||
  slug === 'pli-tv-bi-vb-as1-7'
) {
  const slugParts = slug.match(/^([a-z]+)-([a-z]+)-([a-z]+)-([a-z]+)-([a-z]+)*(\d*)/);
  console.log('as case');
  const fixforbivb = slug.replace(/(\d+)-(\d+)/g, '');
  const bookWithoutNumber = fixforbivb.replace(/(\d+)/g, '');
  const fixforbivb2 = slug.replace(/-([a-z]+)\d+/g, '');
  const bookWithoutNumberAndRule = fixforbivb2.replace(/-\d+$/g, '');
  const firstNum = slugParts[6];
  
  return `${bookWithoutNumberAndRule}/${bookWithoutNumber}1-7`;
} else if ( slug.match(/^([a-z]+)-([a-z]+)-([a-z]+)-([a-z]+)-([a-z]+)*(\d*)/)) {
    const slugParts = slug.match(/^([a-z]+)-([a-z]+)-([a-z]+)-([a-z]+)-([a-z]+)*(\d*)/);
  const fixforbivb = slug.replace(/(\d+)-(\d+)/g, '');
  const bookWithoutNumber = fixforbivb.replace(/(\d+)/g, '');
  const fixforbivb2 = slug.replace(/-([a-z]+)\d+/g, '');
  const bookWithoutNumberAndRule = fixforbivb2.replace(/-\d+$/g, '');
  const firstNum = slugParts[6];
  return `${bookWithoutNumberAndRule}/${bookWithoutNumber}/${slug}`;
}
else if  (slug.match(/^([a-z]+)-([a-z]+)-([a-z]+)*(\d*)/)){
  const bookWithoutNumber = slug.replace(/(\d+|\.)/g, '');
  return `${bookWithoutNumber}/${slug}`;
}

  const slugParts = slug.match(/^([a-z]+)(\d*)\.*(\d*)/);
  const book = slugParts[1];
  const firstNum = slugParts[2];
console.log(book,firstNum );
  if (book === "dn" || book === "mn") {
    return `${book}/${slug}`;
  } else if (book === "sn" || book === "an") {
    return `${book}/${book}${firstNum}/${slug}`;
  } else if (book === "kp") {
    return `kn/kp/${slug}`;
  } else if (book === "dhp") {
    return `kn/dhp/${slug}`;
  } else if (book === "ud") {
    return `kn/ud/vagga${firstNum}/${slug}`;
  } else if (book === "iti") {
    return `kn/iti/vagga${findItiVagga(firstNum)}/${slug}`;
  } else if (book === "snp") {
    return `kn/snp/vagga${firstNum}/${slug}`;
  } else if (book === "thag" || book === "thig") {
    return `kn/${book}/${slug}`;
  } else if (book === "ja") {
   return `kn/ja/${slug}`;
  }
}

function findItiVagga(suttaNumber) {
  if (suttaNumber >= 1 && suttaNumber <= 10) {
    return "1";
  } else if (suttaNumber >= 11 && suttaNumber <= 20) {
    return "2";
  } else if (suttaNumber >= 21 && suttaNumber <= 27) {
    return "3";
  } else if (suttaNumber >= 28 && suttaNumber <= 37) {
    return "4";
  } else if (suttaNumber >= 38 && suttaNumber <= 49) {
    return "5";
  } else if (suttaNumber >= 50 && suttaNumber <= 59) {
    return "6";
  } else if (suttaNumber >= 60 && suttaNumber <= 69) {
    return "7";
  } else if (suttaNumber >= 70 && suttaNumber <= 79) {
    return "8";
  } else if (suttaNumber >= 80 && suttaNumber <= 89) {
    return "9";
  } else if (suttaNumber >= 90 && suttaNumber <= 99) {
    return "10";
  } else if (suttaNumber >= 100 && suttaNumber <= 112) {
    return "11";
  }
}


// clicking an abbreviation on the home page will replace the input field with that abbreviation
const abbreviations = document.querySelectorAll("span.abbr");
abbreviations.forEach(book => {
  book.addEventListener("click", e => {
    citation.value = e.target.innerHTML;
    // form.input.setSelectionRange(10, 10);
    citation.focus();
  });
});

