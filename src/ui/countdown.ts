/* The words of a countdown: "1:24:07" for an hour, twenty-four minutes and seven seconds. */

/** Null when there is nothing left to count (zero or past), so the screen shows nothing rather than "0:00:00". */
export function countdownText(ms: number): string | null {
  if (!(ms > 0)) return null;
  const total = Math.ceil(ms / 1000);
  const two = (n: number) => String(n).padStart(2, '0');
  return `${Math.floor(total / 3600)}:${two(Math.floor((total % 3600) / 60))}:${two(total % 60)}`;
}
