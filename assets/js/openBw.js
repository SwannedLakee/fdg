document.addEventListener("DOMContentLoaded", function() {
    // Get the 's' parameter from the browser's URL
    const urlParams = new URLSearchParams(window.location.search);
    const sParam = urlParams.get('s');
 
    let keyword;

    // Check for the existence of an element with the class "keyword"
    let keywordElement = document.querySelector('.keyword');
    if (keywordElement) {
        keyword = keywordElement.textContent.trim();
    } else {
        keyword = ""; // Default value if the element is not found
    }

    // Use the value from the "s" parameter or "keyword"
    const searchValue = sParam && sParam.trim() !== "" ? sParam : keyword;

    const bwLinks = document.querySelectorAll('.bwLink');
    bwLinks.forEach(link => {
        const slug = link.getAttribute('data-slug');
        // Pass the searchValue to the URL generation function
        const textUrl = findBwTextUrl(slug, searchValue);
        if (!textUrl) {
            link.style.display = 'none';
        } else {
            // Set the value in the href attribute
            link.href = textUrl;
             link.target = "_blank";
        }
    });
});

function openBw(slug) {
    // Also get searchValue here for direct calls to this function
    const urlParams = new URLSearchParams(window.location.search);
    const sParam = urlParams.get('s');
    let keyword;
    const keywordElement = document.querySelector('.keyword');
    if (keywordElement) {
        keyword = keywordElement.textContent.trim();
    } else {
        keyword = "";
    }
    const searchValue = sParam && sParam.trim() !== "" ? sParam : keyword;

    let textUrl = findBwTextUrl(slug, searchValue);
    if (textUrl) {
        window.open(textUrl, "_blank");
    } else {
        console.log("Link not found for slug:", slug);
    }
}

function findBwTextUrl(slug, searchValue) {
    let datasetBw;
    let tbwRootUrl;
    let base; 

    if (window.location.host.includes('localhost') || window.location.host.includes('127.0.0.1')) {
        base = "/";
        tbwRootUrl = "b/?q="; 
    } else {
        base = "/";
        tbwRootUrl = "b/?q="; 
    }
  
    // Assumes tbwLinksData is available in the global scope
    datasetBw = typeof tbwLinksData !== 'undefined' ? tbwLinksData : [];
  
    if (datasetBw && datasetBw.length) {
        const item = datasetBw.find(item => Array.isArray(item) ? item[0] === slug : item === slug);
        if (item) {
            let finalUrl = base + tbwRootUrl + item[1];
            // If a searchValue exists, append it as the 's' parameter
            if (searchValue) {
                finalUrl += '&s=' + encodeURIComponent(searchValue);
            }
            return finalUrl;
        }
    }
    return null;
}