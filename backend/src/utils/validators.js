const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email) {
  if (typeof email !== 'string') return false;
  return EMAIL_REGEX.test(email.trim());
}

export function isValidPassword(password, minLength = 6) {
  if (typeof password !== 'string') return false;
  return password.length >= minLength;
}
