import crypto from 'crypto';

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
    const { make, model, category, price, quantity, year, image } = data;

    if (!make || !model || !category || price == null || quantity == null) {
      const error = new Error('Missing required vehicle fields (make, model, category, price, quantity).');
      error.statusCode = 400;
      error.code = 'VALIDATION_ERROR';
      throw error;
    }

    const numPrice = Number(price);
    if (Number.isNaN(numPrice) || numPrice <= 0) {
      const error = new Error('Price must be a positive number.');
      error.statusCode = 400;
      error.code = 'INVALID_PRICE';
      throw error;
    }

    const numQuantity = Number(quantity);
    if (!Number.isInteger(numQuantity) || numQuantity < 0) {
      const error = new Error('Quantity must be a non-negative whole integer.');
      error.statusCode = 400;
      error.code = 'INVALID_QUANTITY';
      throw error;
    }

    const numYear = year != null ? Number(year) : new Date().getFullYear();
    const id = data.id || `ab-${crypto.randomUUID().slice(0, 8)}`;

    const vehicle = {
      ...data,
      id,
      price: numPrice,
      quantity: numQuantity,
      year: numYear,
      image: image || '/media/porsche.jpg',
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

    if (data.price != null) {
      const numPrice = Number(data.price);
      if (Number.isNaN(numPrice) || numPrice <= 0) {
        const error = new Error('Price must be a positive number.');
        error.statusCode = 400;
        error.code = 'INVALID_PRICE';
        throw error;
      }
      data.price = numPrice;
    }

    if (data.quantity != null) {
      const numQuantity = Number(data.quantity);
      if (!Number.isInteger(numQuantity) || numQuantity < 0) {
        const error = new Error('Quantity must be a non-negative whole integer.');
        error.statusCode = 400;
        error.code = 'INVALID_QUANTITY';
        throw error;
      }
      data.quantity = numQuantity;
    }

    return this.vehicleRepository.update(id, data);
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
}
