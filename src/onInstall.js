chrome.runtime.onInstalled.addListener(function (details) {
    if (details.reason === 'install' && !chrome.extension.inIncognitoContext) {
        chrome.tabs.create({
            url: chrome.extension.getURL('skin/onInstalled/onInstalled.html')
        });
    } else if ((details.reason === 'update') &&
            (chrome.runtime.getManifest().version  === '2.0.2')) {
        chrome.tabs.create({
            url: chrome.extension.getURL('skin/onInstalled/updateV2.0.0.html')
        });
    }
});

