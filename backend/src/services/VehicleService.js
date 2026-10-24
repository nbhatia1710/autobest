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
}
