// Set extension locale
const defaultExtLocale = 'en_US';
const extLocale = chrome.i18n.getMessage('@@ui_locale');

// Set JS locale
const defaultLocale = 'en-US';
const locale = getLocale();

// Figure JS locale
function getLocale() {
    // Chrome extension locales use '_' while JS locales use '-'
    var locale = extLocale.replace('_', '-');

    // If toLocaleDateString doesn't work, use the default locale
    // Possibly unnecessary and not robust enough
    try {
        new Date().toLocaleDateString(locale);
    } catch (err) {
        console.error(chrome.i18n.getMessage('localeError', locale));
        return defaultLocale;
    }

    return locale;
}

// GitHub date attribute formatted YYYY-MM-DD
// Explode on '-' to create Date object
function explodeDate(dateStr) {
    var [year, month, day] = dateStr.split('-');

    return new Date(year, month - 1, day);
}

// Formats "short date" using toLocaleDateString
// en-US: MMM DD
function createShortDate(startDate, optEndDate) {
    var localeOpts = { month: "long", day: "numeric", year: undefined };

    var dateStr = startDate.toLocaleDateString(locale, localeOpts);
    if (optEndDate) {
        dateStr += ' – ' +
                optEndDate.toLocaleDateString(locale, localeOpts);
    }

    return dateStr;
}

// Formats "long date" using toLoacleDateString
// en-US: MM DD, YYYY
function createLongDate(startDate, optEndDate) {
    var localeOpts = { month: "short", day: "numeric", year: "numeric" };

    var dateStr = startDate.toLocaleDateString(locale, localeOpts);
    if (optEndDate) {
        dateStr += ' – ' +
                optEndDate.toLocaleDateString(locale, localeOpts);
    }

    return dateStr;
}

// Calculates the number of whole months between two dates
function monthDiff(startDate, endDate) {
    var months = ((endDate.getFullYear() - startDate.getFullYear()) * 12) +
            endDate.getMonth() -
            startDate.getMonth();
    if (startDate.getDate() > endDate.getDate()) {
        months--;
    }

    return months;
}

// Determines if a value is singular or plural based on extension locale
function valSingPlur(val) {
    switch (extLocale) {
        case 'en_US':
        default:
            if (val === 1) {
                return 'sing';
            } else {
                return 'plur';
            }
            break;
    }
    // Fall back using 'plur'
    return 'plur';
}

// Helper function to select proper contrib day message (sing/plur)
function daySingPlur(val) {
    if (valSingPlur(val) === 'sing') {
        return chrome.i18n.getMessage('daysSing');
    }
    return chrome.i18n.getMessage('daysPlur', val.toLocaleString(locale));
}

// Calculate the total contrib, longest streak, and current streak counts
function calcContribCounts() {
    // Initialize total contribution variables
    var totalContributions = 0;
    var totalContributionsStart = totalContributionsEnd = '';

    // Initialize longest streak variables
    var longestStreak = 0;
    var longestStreakStart = longestStreakEnd = '';

    // Initialize current streak variables
    var currentStreak = 0;
    var currentStreakStart = currentStreakEnd = '';

    // Iterate over each column of the contribution calendar
    // The high number of child levels is to assure proper elements are
    // selected. This is because 'contributions-calendar' is the closest id
    $('#contributions-calendar')
            .children('.js-calendar-graph')
            .children('.js-calendar-graph-svg')
            .children('g')
            .children('g')
            .each(function (col) {
        // Iterate over each day of a contribution column
        $(this).children('.day').each(function (day) {
            if (!totalContributionsStart) {
                // Set the total contrib start date to the first date we see
                totalContributionsStart = $(this).attr('data-date');
            } else {
                // Continuously update the contrib end date to the current day
                // Will eventually end on the last day
                totalContributionsEnd = $(this).attr('data-date');
            }

            // The 'data-count' attribute is the number of contributions for
            // that day.
            // The attribute is a string, parseInt assures casting to integer
            var dayCount = parseInt($(this).attr('data-count'), 10);

            if (dayCount > 0) {
                // If the number of contributions for that day is greater than
                // 0, (i.e. not 0)

                if (currentStreak === 0) {
                    // If the current streak is 0 days, this is the beginning
                    // of a new streak
                    // Set/reset the current streak dates
                    currentStreakStart = currentStreakEnd =
                            $(this).attr('data-date');
                } else {
                    // If the current streak is not 0 days (i.e. greater than
                    // 0), set the current streak end to this date.
                    // This will continuously update until we reach a
                    // non-contribution day or the end of the calendar
                    currentStreakEnd = $(this).attr('data-date');
                }

                // Increment the length of the current streak
                currentStreak++;
                // Increase the total number of contributions
                totalContributions += dayCount;
            } else if (currentStreak > 0) {
                // If the number of contributions for the day is not greater
                // than 0 (i.e. 0), and the current streak is greater than 0
                // (i.e. we  have a running streak), we broke the streak on
                // this day.

                // Check if the current streak is longer than the longest
                // streak. If it is, update the longest streak info
                if (currentStreak > longestStreak) {
                    longestStreak      = currentStreak;
                    longestStreakStart = currentStreakStart;
                    longestStreakEnd   = currentStreakEnd;
                }

                // Reset the current streak to 0
                currentStreak = 0;
            }
        });
    });

    // Final check in the case the longest streak isn't 'terminated' by a
    // non-contribution day
    if (currentStreak > longestStreak) {
        longestStreak      = currentStreak;
        longestStreakStart = currentStreakStart;
        longestStreakEnd   = currentStreakEnd;
    }

    // Return all contrib and date values in a JSON object
    return {
        totalContributions:      totalContributions,
        totalContributionsStart: totalContributionsStart,
        totalContributionsEnd:   totalContributionsEnd,
        longestStreak:           longestStreak,
        longestStreakStart:      longestStreakStart,
        longestStreakEnd:        longestStreakEnd,
        currentStreak:           currentStreak,
        currentStreakStart:      currentStreakStart,
        currentStreakEnd:        currentStreakEnd
    };
}

// Format date ranges from contrib calender iteration
function calcDates(counts) {
    // Explode date strings to Date objects
    var totalContributionsStartDate =
            explodeDate(counts.totalContributionsStart);
    var totalContributionsEndDate   = explodeDate(counts.totalContributionsEnd);
    var longestStreakStartDate      = explodeDate(counts.longestStreakStart);
    var longestStreakEndDate        = explodeDate(counts.longestStreakEnd);
    var currentStreakStartDate      = explodeDate(counts.currentStreakStart);
    var currentStreakEndDate        = explodeDate(counts.currentStreakEnd);

    // Usage/format of dates extrapolated by looking at GitHub profiles
    // from web.archive.org

    // Format total contrib long date
    var totalContributionsDate = createLongDate(totalContributionsStartDate,
            totalContributionsEndDate);
    // Format longest streak short date
    var longestStreakDate = createShortDate(longestStreakStartDate,
            longestStreakEndDate);
    // Create proper format for current streak
    var currentStreakDate;
    if (counts.currentStreak === 0) {
        // There isn't a current streak. Determine format for last contrib

        // Calculate date difference
        var streakDiff = monthDiff(currentStreakEndDate,
                totalContributionsEndDate);
        if (streakDiff === 0) {
            // There isn't a whole month difference from latest contrib

            // Format current streak long date
            currentStreakDate = chrome.i18n.getMessage('lastContribDate',
                    createLongDate(currentStreakEndDate));
        } else if (valSingPlur(streakDiff) === 'sing') {
            // There is 1 month difference from latest contrib
            currentStreakDate = chrome.i18n.getMessage('lastContribMonthSing');
        } else {
            // There is a 2+ month difference from latest contrib
            currentStreakDate = chrome.i18n.getMessage('lastContribMonthPlur',
                    streakDiff.toLocaleString(locale));
        }
    } else {
        // There's a current streak. Format current streak short date
        currentStreakDate = createShortDate(currentStreakStartDate,
                currentStreakEndDate)
    }

    // Return formatted dates in JSON object
    return {
        totalContributionsDate: totalContributionsDate,
        longestStreakDate:      longestStreakDate,
        currentStreakDate:      currentStreakDate
    };
}

// Replace contrib title text
function replaceContribTitleText(msg) {
    // Set default message if msg isn't given
    msg = msg || 'Contributions';

    // Remove contrib title text without removing child elements
    // Append msg HTML/text
    // This is so the 'Contribution settings' isn't removed while looking
    // at your own GitHub profile
    $('#contributions-calendar')
            .parent()
            .children('h3')
            .first()
            .contents()
            .filter(function () {
                return this.nodeType === 3;
            })
            .remove()                           // Only remove text node types
            .end()
            .end()
            .append(msg);
}

// Create custom modern HTML
function createModernMsg(counts, dates, items) {
    // HTML to create new lines
    const breakStr = '<br>';

    var msg = '';

    if (items.modernContrib) {
        if (valSingPlur(counts.totalContributions) === 'sing') {
            msg += chrome.i18n.getMessage('modernContribMsgSing');
        } else {
            msg += chrome.i18n.getMessage('modernContribMsgPlur',
                    counts.totalContributions.toLocaleString(locale));
        }

        if (items.modernDates) {
            msg += ` (${dates.totalContributionsDate})`;
        }
    }
    if (items.modernLongStreak) {
        if (msg) {
            msg += breakStr;
        }

        if (valSingPlur(counts.longestStreak) === 'sing') {
            msg += chrome.i18n.getMessage('modernLongStreakMsgSing');
        } else {
            msg += chrome.i18n.getMessage('modernLongStreakMsgPlur',
                    counts.longestStreak.toLocaleString(locale));
        }

        if (items.modernDates) {
            msg += ` (${dates.longestStreakDate})`;
        }
    }
    if (items.modernCurrStreak) {
        if (msg) {
            msg += breakStr;
        }

        if (valSingPlur(counts.currentStreak) === 'sing') {
            msg += chrome.i18n.getMessage('modernCurrStreakMsgSing');
        } else {
            msg += chrome.i18n.getMessage('modernCurrStreakMsgPlur',
                    counts.currentStreak.toLocaleString(locale));
        }

        if (items.modernDates) {
            msg += ` (${dates.currentStreakDate})`;
        }
    }

    return msg;
}

// Create custom classic HTML
function createClassicMsg(counts, dates, items) {
    var msg = '';

    if (items.classicContrib) {
        msg += 
            `<div class="contrib-column contrib-column-first table-column">
                <span class="text-muted">
                    ${chrome.i18n.getMessage('classicContribMsg')}
                </span>
                <span class="contrib-number">
                    ${counts.totalContributions.toLocaleString(locale)}
                </span>
                <span class="text-muted">
                    ${dates.totalContributionsDate}
                </span>
            </div>`;
    }
    if (items.classicLongStreak) {
        msg +=
            `<div class="contrib-column ${((msg) ? '' : 'contrib-column-first')} table-column">
                <span class="text-muted">
                    ${chrome.i18n.getMessage('classicLongStreakMsg')}
                </span>
                <span class="contrib-number">
                    ${daySingPlur(counts.longestStreak)}
                </span>
                <span class="text-muted">
                    ${dates.longestStreakDate}
                </span>
            </div>`;
    }
    if (items.classicCurrStreak) {
        msg +=
            `<div class="contrib-column ${((msg) ? '' : 'contrib-column-first')} table-column">
                <span class="text-muted">
                    ${chrome.i18n.getMessage('classicCurrStreakMsg')}
                </span>
                <span class="contrib-number">
                    ${daySingPlur(counts.currentStreak)}
                </span>
                <span class="text-muted">
                    ${dates.currentStreakDate}
                </span>
            </div>`;
    }

    return msg;
}

// Perform proper replacements based on extension settings
function modifyContribView() {
    // Fetch preferences. When first param is null, fetches everything
    chrome.storage.sync.get(null, function (items) {
        switch (items.mode) {
            case 'modern':
                var counts = calcContribCounts();
                var dates  = calcDates(counts);
                var msg    = createModernMsg(counts, dates, items);

                if (msg) {
                    replaceContribTitleText(msg);
                } else {
                    // If msg is falsy (i.e. all options are unchecked)
                    // just replace with 'Contributions'
                    replaceContribTitleText();
                }

                break;
            case 'classic':
                var counts = calcContribCounts();
                var dates  = calcDates(counts);
                var msg    = createClassicMsg(counts, dates, items);

                replaceContribTitleText();
                if (msg) {
                    $('#contributions-calendar').append(msg);
                }

                break;
            case 'disable':
                if (items.disableCalendar) {
                    $('#contributions-calendar').parent().remove();
                }
                if (items.disableActivity) {
                    $('.js-contribution-activity').remove();
                }

                break;
            case 'nothing':
            default:
                // No action
                break;
        }
    });
}

// Execute view modifications once DOM is ready
$(document).ready(modifyContribView);

