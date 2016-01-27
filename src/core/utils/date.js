/**
 * @private
 * Patch JavaScript implementations lacking ISO-8601 date support.
 * http://jsfiddle.net/mplungjan/QkasD/
 */
export function fromISO8601(dateString) {
  const date = Date.parse(dateString);

  if (date) {
    return new Date(date);
  }

  const regex = /^(\d{4}\-\d\d\-\d\d([tT][\d:\.]*)?)([zZ]|([+\-])(\d\d):?(\d\d))?$/;
  const match = dateString.match(regex);
  if (match[1]) {
    let day = match[1].split(/\D/).map(function (segment) {
      return root.parseInt(segment, 10) || 0;
    });
    day[1] -= 1; // Months range 0–11.
    day = new Date(Date.UTC.apply(Date, day));

    if (match[5]) {
      let timezone = root.parseInt(match[5], 10) / 100 * 60;
      timezone += (match[6] ? root.parseInt(match[6], 10) : 0);
      timezone *= (match[4] === '+') ? -1 : 1;
      if (timezone) {
        day.setUTCMinutes(day.getUTCMinutes() * timezone);
      }
    }

    return day;
  }
  return NaN;
}
