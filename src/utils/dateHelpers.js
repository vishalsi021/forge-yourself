function padDatePart(value) {
  return String(value).padStart(2, '0');
}

export function getTodayDateString(date = new Date()) {
  return `${date.getFullYear()}-${padDatePart(date.getMonth() + 1)}-${padDatePart(date.getDate())}`;
}

export function getLocalTimeZone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
}

export function addDays(dateString, days) {
  const date = new Date(`${dateString}T00:00:00`);
  date.setDate(date.getDate() + days);
  return getTodayDateString(date);
}

export function formatLongDate(dateString) {
  return new Intl.DateTimeFormat('en-IN', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(new Date(`${dateString}T00:00:00`));
}

export function getWeekNumber(dayNumber = 1) {
  return Math.max(1, Math.ceil(dayNumber / 7));
}

export function getCompletionPercent(dayNumber = 1) {
  return Math.min(100, Math.round((dayNumber / 60) * 100));
}

export function isSunday(dateString = getTodayDateString()) {
  return new Date(`${dateString}T00:00:00`).getDay() === 0;
}

export function getDateRangeForWeek(dayNumber, startDate = getTodayDateString()) {
  const weekNumber = getWeekNumber(dayNumber);
  const weekStart = addDays(startDate, (weekNumber - 1) * 7 * -1);
  const weekEnd = addDays(weekStart, 6);
  return { weekNumber, weekStart, weekEnd };
}

export function sortTasksForDisplay(tasks = []) {
  return [...tasks].sort((a, b) => Number(a.done) - Number(b.done));
}
