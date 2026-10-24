import crypto from 'crypto';
import { validateVehicleInput } from '../utils/validators.js';

export class VehicleService {
  constructor(vehicleRepository) {
    this.vehicleRepository = vehicleRepository;
  }

  getAllVehicles() {
    return this.vehicleRepository.findAll();
  }

  searchVehicles(filters = {}) {
    const sanitizedFilters = {
      make: typeof filters.make === 'string' ? filters.make.trim() : '',
      model: typeof filters.model === 'string' ? filters.model.trim() : '',
      category: typeof filters.category === 'string' ? filters.category.trim() : '',
      min_price: filters.min_price != null && filters.min_price !== '' ? Number(filters.min_price) : null,
      max_price: filters.max_price != null && filters.max_price !== '' ? Number(filters.max_price) : null,
    };

    if (sanitizedFilters.min_price !== null && Number.isNaN(sanitizedFilters.min_price)) {
      sanitizedFilters.min_price = null;
    }
    if (sanitizedFilters.max_price !== null && Number.isNaN(sanitizedFilters.max_price)) {
      sanitizedFilters.max_price = null;
    }

    return this.vehicleRepository.search(sanitizedFilters);
  }

  getVehicleById(id) {
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

    const numPrice = Number(data.price);
    const numQuantity = Number(data.quantity);
    const numYear = data.year != null ? Number(data.year) : new Date().getFullYear();
    const id = data.id || `ab-${crypto.randomUUID().slice(0, 8)}`;

    const vehicle = {
      ...data,
      id,
      price: numPrice,
      quantity: numQuantity,
      year: numYear,
      image: data.image || '/media/porsche.jpg',
    };

    return this.vehicleRepository.create(vehicle);
  }

  updateVehicle(id, data) {
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

    const updatePayload = { ...data };
    if (updatePayload.price != null) updatePayload.price = Number(updatePayload.price);
    if (updatePayload.quantity != null) updatePayload.quantity = Number(updatePayload.quantity);
    if (updatePayload.year != null) updatePayload.year = Number(updatePayload.year);

    return this.vehicleRepository.update(id, updatePayload);
  }

  deleteVehicle(id) {
    const existing = this.vehicleRepository.findById(id);
    if (!existing) {
      const error = new Error('Vehicle not found.');
      error.statusCode = 404;
      error.code = 'NOT_FOUND';
      throw error;
    }

    return this.vehicleRepository.delete(id);
  }

  purchaseVehicle(id, quantity = 1) {
    const numQuantity = Number(quantity);
    if (!Number.isInteger(numQuantity) || numQuantity < 1) {
      const error = new Error('Purchase quantity must be a positive whole integer.');
      error.statusCode = 400;
      error.code = 'INVALID_QUANTITY';
      throw error;
    }

    const result = this.vehicleRepository.atomicPurchase(id, numQuantity);
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
    if (quantity == null || typeof quantity === 'string' && quantity.trim() === '') {
      const error = new Error('Restock quantity must be a positive whole number.');
      error.statusCode = 400;
      error.code = 'INVALID_QUANTITY';
      throw error;
    }

    const numQuantity = Number(quantity);
    if (!Number.isInteger(numQuantity) || numQuantity < 1) {
      const error = new Error('Restock quantity must be a positive whole number.');
      error.statusCode = 400;
      error.code = 'INVALID_QUANTITY';
      throw error;
    }

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
