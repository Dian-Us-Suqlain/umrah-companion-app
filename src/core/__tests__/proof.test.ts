// Temporary: proves that a failing test fails the pull request check. Removed in the next commit.
test('deliberately broken', () => {
  expect(1 + 1).toBe(3);
});
