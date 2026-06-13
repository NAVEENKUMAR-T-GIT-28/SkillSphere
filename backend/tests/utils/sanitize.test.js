const { sanitizeField } = require('../../utils/sanitize');

describe('sanitizeField utility', () => {
  test('strips HTML tags from string', () => {
    expect(sanitizeField('<script>alert("xss")</script>Hello')).toBe('Hello');
  });

  test('removes anchor tags', () => {
    expect(sanitizeField('<a href="evil.com">click me</a>')).toBe('click me');
  });

  test('returns non-string values unchanged', () => {
    expect(sanitizeField(42)).toBe(42);
    expect(sanitizeField(null)).toBe(null);
    expect(sanitizeField(undefined)).toBe(undefined);
    expect(sanitizeField({ a: 1 })).toEqual({ a: 1 });
  });

  test('returns clean text unchanged', () => {
    expect(sanitizeField('Hello World')).toBe('Hello World');
  });

  test('strips nested/complex HTML', () => {
    const input = '<div><b>Bold</b> and <i>italic</i></div>';
    expect(sanitizeField(input)).toBe('Bold and italic');
  });
});
