const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VEHICLE_ID_REGEX = /^[a-zA-Z0-9_-]{1,64}$/;

export const ALLOWED_CATEGORIES = [
  'Sedan',
  'SUV',
  'Coupe',
  'Hatchback',
  'Convertible',
  'Truck',
];

export function isValidEmail(email) {
  if (typeof email !== 'string') return false;
  return EMAIL_REGEX.test(email.trim()) && email.length <= 254;
}

export function isValidPassword(password, minLength = 6) {
  if (typeof password !== 'string') return false;
  return password.length >= minLength && password.length <= 128;
}

export function isValidVehicleId(id) {
  if (typeof id !== 'string') return false;
  return VEHICLE_ID_REGEX.test(id.trim());
}

export function isValidPositiveInteger(value, max = 1000000) {
  if (value == null || (typeof value === 'string' && value.trim() === '')) return false;
  const num = Number(value);
  return Number.isInteger(num) && num > 0 && num <= max;
}

export function isValidCurrencyPrice(value) {
  if (value == null || (typeof value === 'string' && value.trim() === '')) return false;
  const num = Number(value);
  if (!Number.isFinite(num) || num <= 0 || num > 1000000000) return false;
  // Ensure maximum 2 decimal places for currency precision
  return Math.round(num * 100) / 100 === num;
}

export function validateVehicleInput(data, isUpdate = false) {
  const errors = {};

  if (!isUpdate || data.make !== undefined) {
    if (!data.make || typeof data.make !== 'string' || !data.make.trim()) {
      errors.make = 'Make is required.';
    } else if (data.make.trim().length > 50) {
      errors.make = 'Make must not exceed 50 characters.';
    }
  }

  if (!isUpdate || data.model !== undefined) {
    if (!data.model || typeof data.model !== 'string' || !data.model.trim()) {
      errors.model = 'Model is required.';
    } else if (data.model.trim().length > 50) {
      errors.model = 'Model must not exceed 50 characters.';
    }
  }

  if (!isUpdate || data.category !== undefined) {
    if (!data.category || typeof data.category !== 'string' || !data.category.trim()) {
      errors.category = 'Category is required.';
    } else if (!ALLOWED_CATEGORIES.includes(data.category.trim())) {
      errors.category = `Category must be one of: ${ALLOWED_CATEGORIES.join(', ')}.`;
    }
  }

  if (!isUpdate || data.price !== undefined) {
    if (!isValidCurrencyPrice(data.price)) {
      errors.price = 'Price must be a positive number up to 1,000,000,000 with at most 2 decimal places.';
    }
  }

  if (!isUpdate || data.quantity !== undefined) {
    const numQuantity = Number(data.quantity);
    if (data.quantity == null || !Number.isInteger(numQuantity) || numQuantity < 0 || numQuantity > 1000000) {
      errors.quantity = 'Quantity must be a whole integer between 0 and 1,000,000.';
    }
  }

  if (data.year !== undefined && data.year !== null) {
    const numYear = Number(data.year);
    const maxYear = new Date().getFullYear() + 2;
    if (Number.isNaN(numYear) || !Number.isInteger(numYear) || numYear < 1900 || numYear > maxYear) {
      errors.year = `Manufacture year must be an integer between 1900 and ${maxYear}.`;
    }
  }

  if (data.image !== undefined && data.image !== null) {
    if (typeof data.image !== 'string' || !data.image.trim()) {
      errors.image = 'Image URL or path is required.';
    } else if (data.image.length > 500) {
      errors.image = 'Image path must not exceed 500 characters.';
    }
  }

  if (data.mileage !== undefined && data.mileage !== null && data.mileage !== '') {
    const numMileage = Number(data.mileage);
    if (!Number.isInteger(numMileage) || numMileage < 0 || numMileage > 2000000) {
      errors.mileage = 'Mileage must be an integer between 0 and 2,000,000.';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
