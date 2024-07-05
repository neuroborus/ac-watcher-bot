async function sleep (ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function maximizeDate(date) {
  const newDate = date;
  newDate.setHours(23);
  newDate.setMinutes(59);
  newDate.setSeconds(59);
  newDate.setMilliseconds(999);
  return newDate;
}

const weekInMs = 1000 * 60 * 60 * 24 * 7;
const daysInMs = (daysInMonth) => 1000 * 60 * 60 * 24 * daysInMonth;
function daysInMonth (month, year) {
  return new Date(year, month, 0).getDate();
}

function dateToTimezone(date, targetTimezone) {
  const enGB = date.toLocaleString('en-GB', { timeZone: targetTimezone });

  const [dateStr, timeStr] = enGB.split(', ');
  const [day, month, year] = dateStr.split('/');

  return `${year}-${month}-${day}T${timeStr}`;
}

module.exports = {
  sleep,
  maximizeDate,
  weekInMs,
  daysInMs,
  daysInMonth,
  dateToTimezone,
};
