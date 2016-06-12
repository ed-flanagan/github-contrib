function saveOptions() {
    var mode = document.getElementById('mode').value;

    var modernContrib    = document.getElementById('modernContrib').checked;
    var modernLongStreak = document.getElementById('modernLongStreak').checked;
    var modernCurrStreak = document.getElementById('modernCurrStreak').checked;
    var modernDates      = document.getElementById('modernDates').checked;

    var classicContrib    = document.getElementById('classicContrib').checked;
    var classicLongStreak = document.getElementById('classicLongStreak').checked;
    var classicCurrStreak = document.getElementById('classicCurrStreak').checked;

    var disableCalendar = document.getElementById('disableCalendar').checked;
    var disableActivity = document.getElementById('disableActivity').checked;

    chrome.storage.sync.set({
        mode: mode,

        modernContrib:    modernContrib,
        modernLongStreak: modernLongStreak,
        modernCurrStreak: modernCurrStreak,
        modernDates:      modernDates,

        classicContrib:    classicContrib,
        classicLongStreak: classicLongStreak,
        classicCurrStreak: classicCurrStreak,

        disableCalendar: disableCalendar,
        disableActivity: disableActivity
    }, function () {
        var state = document.getElementById('status');
        state.textContent = 'Options saved.';
        setTimeout(function () {
            state.textContent = '';
        }, 1000);
    });
}

function restoreOptions() {
    chrome.storage.sync.get({
        mode: 'nothing',

        modernContrib:    true,
        modernLongStreak: false,
        modernCurrStreak: false,
        modernDates:      false,

        classicContrib:    true,
        classicLongStreak: true,
        classicCurrStreak: true,

        disableCalendar: true,
        disableActivity: false
    }, function (items) {
        var mode = document.getElementById('mode');
        mode.value = items.mode;
        mode.addEventListener('change', changeOptions);

        document.getElementById('modernContrib').checked    = items.modernContrib;
        document.getElementById('modernLongStreak').checked = items.modernLongStreak;
        document.getElementById('modernCurrStreak').checked = items.modernCurrStreak;
        document.getElementById('modernDates').checked      = items.modernDates;

        document.getElementById('classicContrib').checked    = items.classicContrib;
        document.getElementById('classicLongStreak').checked = items.classicLongStreak;
        document.getElementById('classicCurrStreak').checked = items.classicCurrStreak;

        document.getElementById('disableCalendar').checked = items.disableCalendar;
        document.getElementById('disableActivity').checked = items.disableActivity;

        changeOptions();
    });
}

function changeOptions() {
    var options = document.getElementsByClassName('options');
    for (var i = 0; i < options.length; i++) {
        options[i].style.display = 'none';
    }

    var mode     = document.getElementById('mode');
    var modeOpts = document.getElementById(mode.value + 'Opts');
    modeOpts.style.display = 'block';
}

document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('save').addEventListener('click', saveOptions);

