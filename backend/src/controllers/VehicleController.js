export class VehicleController {
  constructor(vehicleService) {
    this.vehicleService = vehicleService;
  }

  getAll = async (req, res, next) => {
    try {
      const vehicles = this.vehicleService.getAllVehicles();
      return res.status(200).json(vehicles);
    } catch (err) {
      next(err);
    }
  };

  search = async (req, res, next) => {
    try {
      const { make, model, category, min_price, max_price } = req.query;
      const vehicles = this.vehicleService.searchVehicles({
        make,
        model,
        category,
        min_price,
        max_price,
      });
      return res.status(200).json(vehicles);
    } catch (err) {
      next(err);
    }
  };
}
