const DAY = 86_400_000;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function startOfDay(t: number | Date = Date.now()) {
  const d = new Date(t);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function addDays(t: number, n: number) {
  const d = new Date(t);
  d.setDate(d.getDate() + n);
  return startOfDay(d);
}

/** Whole days from today (negative = past). */
export function dayDiff(t: number) {
  return Math.round((startOfDay(t) - startOfDay()) / DAY);
}

export function shortDate(t: number) {
  const d = new Date(t);
  return `${MONTHS[d.getMonth()]} ${d.getDate()}`;
}

export function relativeDay(t: number) {
  const diff = dayDiff(t);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff === -1) return 'Yesterday';
  if (diff > 1 && diff < 7) return WEEKDAYS[new Date(t).getDay()];
  return shortDate(t);
}

export function todayHeading() {
  const d = new Date();
  return `${WEEKDAYS[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}`;
}

export function greeting() {
  const h = new Date().getHours();
  if (h < 5) return 'Good night';
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}
