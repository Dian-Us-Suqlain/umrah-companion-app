/* The letters shown in a person's circle (their "avatar") in member lists. */

/** Up to two letters for a name: the first letter of the first word and of the last word, so
    "Aisha Khan" gives "AK" and "Muhammad Bilal Ahmed" gives "MA" (many people share a first name;
    the family name tells them apart). One word gives one letter. An empty string means "no letters":
    the circle then shows a person icon instead. */
export function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '';
  // `[...word][0]` takes a whole character, where `word[0]` could cut one made of two parts in half.
  const first = (word: string) => [...word][0].toUpperCase();
  return words.length === 1 ? first(words[0]) : first(words[0]) + first(words[words.length - 1]);
}
