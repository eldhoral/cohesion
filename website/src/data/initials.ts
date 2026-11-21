/** First letter of the first and last name; titles and degrees are skipped. */
const TITLES = /^(dr|drs|dra|ir|prof|h|hj)\.?$/i;

export function initials(fullName: string): string {
  const words = fullName
    .replace(/,.*$/, '')
    .split(/\s+/)
    .filter((w) => w && !TITLES.test(w));
  if (words.length === 0) return '';
  const first = words[0][0];
  const last = words.length > 1 ? words[words.length - 1][0] : '';
  return (first + last).toUpperCase();
}
