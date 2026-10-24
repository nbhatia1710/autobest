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

  create = async (req, res, next) => {
    try {
      const vehicle = this.vehicleService.createVehicle(req.body);
      return res.status(201).json(vehicle);
    } catch (err) {
      next(err);
    }
  };

  update = async (req, res, next) => {
    try {
      const vehicle = this.vehicleService.updateVehicle(req.params.id, req.body);
      return res.status(200).json(vehicle);
    } catch (err) {
      next(err);
    }
  };

  remove = async (req, res, next) => {
    try {
      this.vehicleService.deleteVehicle(req.params.id);
      return res.status(204).send();
    } catch (err) {
      next(err);
    }
  };

  purchase = async (req, res, next) => {
    try {
      const quantity = req.body?.quantity !== undefined ? req.body.quantity : 1;
      const vehicle = this.vehicleService.purchaseVehicle(req.params.id, quantity);
      return res.status(200).json(vehicle);
    } catch (err) {
      next(err);
    }
  };

  restock = async (req, res, next) => {
    try {
      const quantity = req.body?.quantity;
      const vehicle = this.vehicleService.restockVehicle(req.params.id, quantity);
      return res.status(200).json(vehicle);
    } catch (err) {
      next(err);
    }
  };
}
