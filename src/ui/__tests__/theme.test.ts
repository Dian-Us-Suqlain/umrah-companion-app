import { contrast } from '../contrast';
import { countdownText } from '../countdown';
import { MAIN_BUTTON, MIN_TARGET, size, textPairs, themes } from '../theme';
import { TUTORIAL_SEEN_KEY, tutorialDecision } from '../tutorial';

describe('colours', () => {
  test('the formula agrees with the standard’s own examples', () => {
    expect(contrast('#000000', '#FFFFFF')).toBeCloseTo(21, 5);
    expect(contrast('#FFFFFF', '#FFFFFF')).toBe(1);
    expect(contrast('#777777', '#FFFFFF')).toBeCloseTo(4.48, 2); // the well-known "just fails" grey
  });

  for (const mode of ['light', 'dark'] as const) {
    test.each(textPairs)(`${mode}: %s on %s can be read (4.5 to 1 or better)`, (text, background) => {
      expect(contrast(themes[mode][text], themes[mode][background])).toBeGreaterThanOrEqual(4.5);
    });
  }

  test('light and dark define the same colours', () => {
    expect(Object.keys(themes.dark).sort()).toEqual(Object.keys(themes.light).sort());
  });
});

describe('the countdown', () => {
  test('hours, minutes and seconds, rounded up so it never shows less time than there is', () => {
    expect(countdownText(5_047_000)).toBe('1:24:07');
    expect(countdownText(3_600_000)).toBe('1:00:00');
    expect(countdownText(59_001)).toBe('0:01:00');
    expect(countdownText(1)).toBe('0:00:01');
  });
  test('nothing at zero, in the past, or for a time that is not a number', () => {
    expect(countdownText(0)).toBeNull();
    expect(countdownText(-5000)).toBeNull();
    expect(countdownText(NaN)).toBeNull();
  });
});

describe('sizes', () => {
  test('targets are larger than the platform minimums, and no text is smaller than 13', () => {
    expect(MIN_TARGET).toBeGreaterThanOrEqual(48);
    expect(MAIN_BUTTON).toBeGreaterThanOrEqual(MIN_TARGET);
    expect(Math.min(...Object.values(size))).toBeGreaterThanOrEqual(13);
  });
});

describe('when the tutorial opens by itself', () => {
  test('waits until the phone has said whether it was seen and whether someone is signed in', () => {
    expect(tutorialDecision(null, true, false)).toBe('wait');
    expect(tutorialDecision(false, false, false)).toBe('wait');
  });
  test('signing out and erasing the phone’s data, which remove every `uc.` key, leave the flag alone', () => {
    expect(TUTORIAL_SEEN_KEY.startsWith('uc.')).toBe(false);
  });
  test('shows once to a guest, never again, and never to someone signed in', () => {
    expect(tutorialDecision(false, true, false)).toBe('show');
    expect(tutorialDecision(true, true, false)).toBe('skip');
    expect(tutorialDecision(true, false, false)).toBe('skip');
    expect(tutorialDecision(false, true, true)).toBe('skip');
  });
});
