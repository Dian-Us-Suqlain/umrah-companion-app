import { initials } from '../initials';

describe('initials', () => {
  test('nothing to take letters from gives no letters, so the person icon is shown', () => {
    expect(initials('')).toBe('');
    expect(initials('   ')).toBe('');
  });
  test('two words give two letters', () => {
    expect(initials('Aisha Khan')).toBe('AK');
  });
  test('one word gives one letter', () => {
    expect(initials('Yusuf')).toBe('Y');
  });
  test('three or more words: the first and the last, because many people share a first name', () => {
    expect(initials('Muhammad Bilal Ahmed')).toBe('MA');
  });
  test('a name in Urdu or Arabic script keeps its own letters', () => {
    expect(initials('عائشہ خان')).toBe('عخ');
  });
  test('extra spaces and lower case', () => {
    expect(initials('  aisha   khan ')).toBe('AK');
  });
  test('a character made of two parts is kept whole', () => {
    expect(initials('😀mile Zed')).toBe('😀Z');
  });
});
