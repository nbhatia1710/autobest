export class VehicleRepository {
  constructor(db) {
    this.db = db;
  }

  findAll() {
    const stmt = this.db.prepare('SELECT * FROM vehicles ORDER BY rowid ASC');
    return stmt.all();
  }

  findById(id) {
    const stmt = this.db.prepare('SELECT * FROM vehicles WHERE id = ?');
    return stmt.get(id);
  }

  search({ make, model, category, min_price, max_price } = {}) {
    let query = 'SELECT * FROM vehicles WHERE 1=1';
    const params = [];

    if (make && make.trim() !== '') {
      query += ' AND LOWER(make) LIKE ?';
      params.push(`%${make.trim().toLowerCase()}%`);
    }

    if (model && model.trim() !== '') {
      query += ' AND LOWER(model) LIKE ?';
      params.push(`%${model.trim().toLowerCase()}%`);
    }

    if (category && category.trim() !== '') {
      query += ' AND LOWER(category) LIKE ?';
      params.push(`%${category.trim().toLowerCase()}%`);
    }

    if (min_price != null && min_price !== '') {
      const min = Number(min_price);
      if (!Number.isNaN(min)) {
        query += ' AND price >= ?';
        params.push(min);
      }
    }

    if (max_price != null && max_price !== '') {
      const max = Number(max_price);
      if (!Number.isNaN(max)) {
        query += ' AND price <= ?';
        params.push(max);
      }
    }

    query += ' ORDER BY rowid ASC';
    const stmt = this.db.prepare(query);
    return stmt.all(...params);
  }

  create(vehicle) {
    const stmt = this.db.prepare(`
      INSERT INTO vehicles (
        id, make, model, year, category, price, quantity, image,
        fuel, transmission, mileage, color, description, created_at, updated_at
      ) VALUES (
        @id, @make, @model, @year, @category, @price, @quantity, @image,
        @fuel, @transmission, @mileage, @color, @description,
        CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      )
    `);

    stmt.run({
      id: vehicle.id,
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      category: vehicle.category,
      price: vehicle.price,
      quantity: vehicle.quantity,
      image: vehicle.image,
      fuel: vehicle.fuel || null,
      transmission: vehicle.transmission || null,
      mileage: vehicle.mileage != null ? vehicle.mileage : null,
      color: vehicle.color || null,
      description: vehicle.description || null,
    });

    return this.findById(vehicle.id);
  }

  update(id, updates) {
    const existing = this.findById(id);
    if (!existing) return null;

    const merged = {
      ...existing,
      ...updates,
      id, // Preserve ID
    };

    const stmt = this.db.prepare(`
      UPDATE vehicles SET
        make = @make,
        model = @model,
        year = @year,
        category = @category,
        price = @price,
        quantity = @quantity,
        image = @image,
        fuel = @fuel,
        transmission = @transmission,
        mileage = @mileage,
        color = @color,
        description = @description,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = @id
    `);

    stmt.run({
      id,
      make: merged.make,
      model: merged.model,
      year: merged.year,
      category: merged.category,
      price: merged.price,
      quantity: merged.quantity,
      image: merged.image,
      fuel: merged.fuel || null,
      transmission: merged.transmission || null,
      mileage: merged.mileage != null ? merged.mileage : null,
      color: merged.color || null,
      description: merged.description || null,
    });

    return this.findById(id);
  }

  delete(id) {
    const stmt = this.db.prepare('DELETE FROM vehicles WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }
}
