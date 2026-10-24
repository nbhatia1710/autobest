export class VehicleService {
  constructor(vehicleRepository) {
    this.vehicleRepository = vehicleRepository;
  }

  getAllVehicles() {
    return this.vehicleRepository.findAll();
  }

  searchVehicles(filters) {
    return this.vehicleRepository.search(filters);
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
