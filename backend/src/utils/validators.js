const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email) {
  if (typeof email !== 'string') return false;
  return EMAIL_REGEX.test(email.trim());
}

export function isValidPassword(password, minLength = 6) {
  if (typeof password !== 'string') return false;
  return password.length >= minLength;
}

export function isValidPositiveInteger(value) {
  if (value == null || typeof value === 'string' && value.trim() === '') return false;
  const num = Number(value);
  return Number.isInteger(num) && num > 0;
}

export function validateVehicleInput(data, isUpdate = false) {
  const errors = {};

  if (!isUpdate || data.make !== undefined) {
    if (!data.make || typeof data.make !== 'string' || !data.make.trim()) {
      errors.make = 'Make is required.';
    }
  }

  if (!isUpdate || data.model !== undefined) {
    if (!data.model || typeof data.model !== 'string' || !data.model.trim()) {
      errors.model = 'Model is required.';
    }
  }

  if (!isUpdate || data.category !== undefined) {
    if (!data.category || typeof data.category !== 'string' || !data.category.trim()) {
      errors.category = 'Category is required.';
    }
  }

  if (!isUpdate || data.price !== undefined) {
    const numPrice = Number(data.price);
    if (data.price == null || Number.isNaN(numPrice) || numPrice <= 0) {
      errors.price = 'Price must be a positive number.';
    }
  }

  if (!isUpdate || data.quantity !== undefined) {
    const numQuantity = Number(data.quantity);
    if (data.quantity == null || !Number.isInteger(numQuantity) || numQuantity < 0) {
      errors.quantity = 'Quantity must be a non-negative whole integer.';
    }
  }

  if (data.year !== undefined && data.year !== null) {
    const numYear = Number(data.year);
    if (Number.isNaN(numYear) || numYear < 1900 || numYear > 2100) {
      errors.year = 'Manufacture year must be a realistic year.';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
