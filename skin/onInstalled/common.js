function openExtOptions() {
    if (chrome.runtime.openOptionsPage) {
        chrome.runtime.openOptionsPage();
    } else {
        window.open(chrome.runtime.getURL('skin/options/options.html'));
    }
}

var optionLinks = document.getElementsByClassName('chromeOptLink');
for (var i = 0; i < optionLinks.length; i++) {
    optionLinks[i].addEventListener('click', openExtOptions);
}

