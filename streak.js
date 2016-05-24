$(document).ready(function addStreak() {
    // Initialize longest and current streak counts to 0
    var longestStreak = currentStreak = 0;

    // Iterate over each column of the contribution calendar
    // The high number of child levels is to assure proper elements are
    // selected. This is because 'contributions-calendar' is the closest id
    $('div#contributions-calendar')
            .children('div.js-calendar-graph')
            .children('svg.js-calendar-graph-svg')
            .children('g')
            .children('g')
            .each(function (col) {
        // Iterate over each day of a contribution column
        $(this).children('rect.day').each(function (day) {
            // data-count attribute: number of contributions for that day
            var dayCount = $(this).attr('data-count');
          
            if (dayCount > 0) {
                // If the number of contributions for that day is greater than
                // 0, increment the current streak
                currentStreak++;
            } else if (currentStreak > 0) {
                // If the number of contributes is not greater than 0 (i.e. 0),
                // and the current streak is greater than 0 (i.e. we have a
                // running streak), we broke the streak this day

                // Check if the current streak is longer than the
                // longest streak. If it is, update the longest streak
                if (currentStreak > longestStreak) {
                    longestStreak = currentStreak;
                }

                // 'Reset' the current streak to 0
                currentStreak = 0;
            }
        });
    });

    // Final check in case the longest streak isn't 'terminated' by a
    // non-contribution day
    if (currentStreak > longestStreak) {
        longestStreak = currentStreak;
    }

    // Insert the current streak text to the GitHub page
    var streakMsg = '\n<br>\nLongest streak of ' + longestStreak +
            ' day' + ((longestStreak == 1) ? '' : 's') + ' in the last year';
    $('div#contributions-calendar')
            .parent()
            .children('h3')
            .first()
            .append(streakMsg);
});

