import { isValidEmail } from '@/utils/validators/emailValidator';

describe('isValidEmail', () => {
  it('should return true for a valid email', () => {
    expect(isValidEmail('test@example.com')).toBe(true);
  });

  it('should return false for an email without an @ symbol', () => {
    expect(isValidEmail('testexample.com')).toBe(false);
  });

  it('should return false for an email without a domain', () => {
    expect(isValidEmail('test@')).toBe(false);
  });

  it('should return false for an email without a top-level domain', () => {
    expect(isValidEmail('test@example')).toBe(false);
  });

  it('should return false for an empty string', () => {
    expect(isValidEmail('')).toBe(false);
  });

  it('should return false for a null value', () => {
    // @ts-expect-error
    expect(isValidEmail(null)).toBe(false);
  });

  it('should return false for an undefined value', () => {
    // @ts-expect-error
    expect(isValidEmail(undefined)).toBe(false);
  });
});
