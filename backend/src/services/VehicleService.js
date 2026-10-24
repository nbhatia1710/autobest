import crypto from 'crypto';
import {
  validateVehicleInput,
  isValidPositiveInteger,
  isValidVehicleId,
} from '../utils/validators.js';

const PERMITTED_VEHICLE_FIELDS = [
  'make',
  'model',
  'year',
  'category',
  'price',
  'quantity',
  'image',
  'fuel',
  'transmission',
  'mileage',
  'color',
  'description',
];

export class VehicleService {
  constructor(vehicleRepository) {
    this.vehicleRepository = vehicleRepository;
  }

  getAllVehicles() {
    return this.vehicleRepository.findAll();
  }

  searchVehicles(filters = {}) {
    let minPriceNum = null;
    let maxPriceNum = null;

    if (filters.min_price != null && filters.min_price !== '') {
      minPriceNum = Number(filters.min_price);
      if (Number.isNaN(minPriceNum) || minPriceNum < 0) {
        const error = new Error('Minimum price must be a non-negative number.');
        error.statusCode = 400;
        error.code = 'INVALID_PRICE_FILTER';
        throw error;
      }
    }

    if (filters.max_price != null && filters.max_price !== '') {
      maxPriceNum = Number(filters.max_price);
      if (Number.isNaN(maxPriceNum) || maxPriceNum < 0) {
        const error = new Error('Maximum price must be a non-negative number.');
        error.statusCode = 400;
        error.code = 'INVALID_PRICE_FILTER';
        throw error;
      }
    }

    if (minPriceNum !== null && maxPriceNum !== null && minPriceNum > maxPriceNum) {
      const error = new Error('Minimum price cannot exceed maximum price.');
      error.statusCode = 400;
      error.code = 'INVALID_PRICE_RANGE';
      throw error;
    }

    const sanitizedFilters = {
      make: typeof filters.make === 'string' ? filters.make.trim().slice(0, 100) : '',
      model: typeof filters.model === 'string' ? filters.model.trim().slice(0, 100) : '',
      category: typeof filters.category === 'string' ? filters.category.trim().slice(0, 100) : '',
      min_price: minPriceNum,
      max_price: maxPriceNum,
    };

    return this.vehicleRepository.search(sanitizedFilters);
  }

  getVehicleById(id) {
    if (!isValidVehicleId(id)) {
      const error = new Error('Invalid vehicle ID format.');
      error.statusCode = 400;
      error.code = 'INVALID_ID';
      throw error;
    }

    const vehicle = this.vehicleRepository.findById(id);
    if (!vehicle) {
      const error = new Error('Vehicle not found.');
      error.statusCode = 404;
      error.code = 'NOT_FOUND';
      throw error;
    }
    return vehicle;
  }

  createVehicle(data) {
    const validation = validateVehicleInput(data, false);
    if (!validation.isValid) {
      const error = new Error('Check the vehicle details.');
      error.statusCode = 400;
      error.code = 'VALIDATION_ERROR';
      error.details = validation.errors;
      throw error;
    }

    const numPrice = Math.round(Number(data.price) * 100) / 100;
    const numQuantity = Number(data.quantity);
    const numYear = data.year != null ? Number(data.year) : new Date().getFullYear();
    const id = data.id && isValidVehicleId(data.id) ? data.id : `ab-${crypto.randomUUID().slice(0, 8)}`;

    const vehicle = {
      id,
      make: data.make.trim(),
      model: data.model.trim(),
      category: data.category.trim(),
      price: numPrice,
      quantity: numQuantity,
      year: numYear,
      image: (data.image && typeof data.image === 'string' && data.image.trim()) || '/media/porsche.jpg',
      fuel: typeof data.fuel === 'string' ? data.fuel.trim().slice(0, 30) : null,
      transmission: typeof data.transmission === 'string' ? data.transmission.trim().slice(0, 30) : null,
      mileage: data.mileage != null && data.mileage !== '' ? Number(data.mileage) : null,
      color: typeof data.color === 'string' ? data.color.trim().slice(0, 50) : null,
      description: typeof data.description === 'string' ? data.description.trim().slice(0, 2000) : null,
    };

    return this.vehicleRepository.create(vehicle);
  }

  updateVehicle(id, data) {
    if (!isValidVehicleId(id)) {
      const error = new Error('Invalid vehicle ID format.');
      error.statusCode = 400;
      error.code = 'INVALID_ID';
      throw error;
    }

    const existing = this.vehicleRepository.findById(id);
    if (!existing) {
      const error = new Error('Vehicle not found.');
      error.statusCode = 404;
      error.code = 'NOT_FOUND';
      throw error;
    }

    const validation = validateVehicleInput(data, true);
    if (!validation.isValid) {
      const error = new Error('Check the vehicle details.');
      error.statusCode = 400;
      error.code = 'VALIDATION_ERROR';
      error.details = validation.errors;
      throw error;
    }

    // Filter to only permitted fields
    const sanitizedUpdate = {};
    for (const field of PERMITTED_VEHICLE_FIELDS) {
      if (data[field] !== undefined) {
        if (field === 'price') {
          sanitizedUpdate.price = Math.round(Number(data.price) * 100) / 100;
        } else if (field === 'quantity') {
          sanitizedUpdate.quantity = Number(data.quantity);
        } else if (field === 'year') {
          sanitizedUpdate.year = Number(data.year);
        } else if (field === 'mileage') {
          sanitizedUpdate.mileage = data.mileage != null && data.mileage !== '' ? Number(data.mileage) : null;
        } else if (typeof data[field] === 'string') {
          sanitizedUpdate[field] = data[field].trim();
        } else {
          sanitizedUpdate[field] = data[field];
        }
      }
    }

    return this.vehicleRepository.update(id, sanitizedUpdate);
  }

  deleteVehicle(id) {
    if (!isValidVehicleId(id)) {
      const error = new Error('Invalid vehicle ID format.');
      error.statusCode = 400;
      error.code = 'INVALID_ID';
      throw error;
    }

    const existing = this.vehicleRepository.findById(id);
    if (!existing) {
      const error = new Error('Vehicle not found.');
      error.statusCode = 404;
      error.code = 'NOT_FOUND';
      throw error;
    }

    return this.vehicleRepository.delete(id);
  }

  purchaseVehicle(id, quantity = 1, customer, userId) {
    if (!isValidVehicleId(id)) {
      const error = new Error('Invalid vehicle ID format.');
      error.statusCode = 400;
      error.code = 'INVALID_ID';
      throw error;
    }

    if (!isValidPositiveInteger(quantity, 100)) {
      const error = new Error('Purchase quantity must be a positive whole integer between 1 and 100.');
      error.statusCode = 400;
      error.code = 'INVALID_QUANTITY';
      throw error;
    }

    const details = {};
    const errors = {};
    for (const [field, max] of Object.entries({ name: 120, email: 254, address: 1000 })) {
      const value = typeof customer?.[field] === 'string' ? customer[field].trim() : '';
      if (!value || value.length > max) errors[field] = `Enter a valid ${field} (up to ${max} characters).`;
      details[field] = value;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(details.email)) errors.email = 'Enter a valid email address.';
    if (Object.keys(errors).length) {
      const error = new Error('Please enter your name, email and address.');
      error.statusCode = 400;
      error.code = 'VALIDATION_ERROR';
      error.details = errors;
      throw error;
    }
    details.email = details.email.toLowerCase();
    const numQuantity = Number(quantity);
    const result = this.vehicleRepository.recordPurchase(id, numQuantity, details, userId);
    if (result.status === 'NOT_FOUND') {
      const error = new Error('Vehicle not found.');
      error.statusCode = 404;
      error.code = 'NOT_FOUND';
      throw error;
    }

    if (result.status === 'OUT_OF_STOCK') {
      const error = new Error('This vehicle just sold out. Please choose another vehicle.');
      error.statusCode = 409;
      error.code = 'OUT_OF_STOCK';
      throw error;
    }

    return result.vehicle;
  }

  restockVehicle(id, quantity) {
    if (!isValidVehicleId(id)) {
      const error = new Error('Invalid vehicle ID format.');
      error.statusCode = 400;
      error.code = 'INVALID_ID';
      throw error;
    }

    if (!isValidPositiveInteger(quantity, 100000)) {
      const error = new Error('Restock quantity must be a positive whole number between 1 and 100,000.');
      error.statusCode = 400;
      error.code = 'INVALID_QUANTITY';
      throw error;
    }

    const numQuantity = Number(quantity);
    const result = this.vehicleRepository.atomicRestock(id, numQuantity);
    if (result.status === 'NOT_FOUND') {
      const error = new Error('Vehicle not found.');
      error.statusCode = 404;
      error.code = 'NOT_FOUND';
      throw error;
    }

    return result.vehicle;
  }
}
