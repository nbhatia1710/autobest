export function validateVehicle(v) {
  const errors = {};
  for (const key of ['make', 'model', 'category']) if (!String(v[key] ?? '').trim()) errors[key] = 'This field is required.';
  if (!Number.isFinite(Number(v.price)) || Number(v.price) <= 0) errors.price = 'Enter a price greater than zero.';
  if (v.quantity === '' || !Number.isSafeInteger(Number(v.quantity)) || Number(v.quantity) < 0) errors.quantity = 'Enter a whole number of zero or more.';
  if (!Number.isInteger(Number(v.year)) || Number(v.year) < 1886 || Number(v.year) > new Date().getFullYear() + 1) errors.year = 'Enter a valid manufacture year.';
  if (v.image && !/^(https:\/\/|\/media\/)/.test(v.image)) errors.image = 'Use an HTTPS image URL or a local /media/ path.';
  return errors;
}
export function validateFilters(f) {
  if (['min_price','max_price'].some(k => f[k] !== '' && f[k] != null && (!Number.isFinite(Number(f[k])) || Number(f[k]) < 0))) return 'Prices must be zero or more.';
  if (f.min_price !== '' && f.max_price !== '' && f.min_price != null && f.max_price != null && Number(f.min_price) > Number(f.max_price)) return 'Minimum price must not exceed maximum price.';
  return '';
}
export function validateAuth(v, register) {
  const errors = {};
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email)) errors.email = 'Enter a valid email address.';
  if (!v.password || (register && v.password.length < 8)) errors.password = register ? 'Use at least 8 characters.' : 'Enter your password.';
  if (register && v.confirm !== v.password) errors.confirm = 'Passwords do not match.';
  return errors;
}
