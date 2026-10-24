import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { getDatabase, closeDatabase } from './connection.js';
import { initializeSchema } from './schema.js';

dotenv.config();

export const initialVehicles = [
  {
    id: 'ab-001',
    make: 'Porsche',
    model: 'Panamera',
    year: 2024,
    category: 'Sedan',
    price: 119900,
    quantity: 3,
    image: '/media/porsche.jpg',
    fuel: 'Petrol',
    transmission: 'Automatic',
    mileage: 4200,
    color: 'Black',
    description:
      'An unmistakable silhouette. An extraordinary drive. The Panamera pairs everyday refinement with the spirit of a true sports car.',
  },
  {
    id: 'ab-002',
    make: 'Mercedes-Benz',
    model: 'AMG GT',
    year: 2023,
    category: 'Coupe',
    price: 98500,
    quantity: 1,
    image: '/media/mercedes.jpg',
    fuel: 'Petrol',
    transmission: 'Automatic',
    mileage: 8100,
    color: 'Silver',
    description:
      'Sculpted proportions and effortless presence. A grand tourer made for the long way home.',
  },
  {
    id: 'ab-003',
    make: 'BMW',
    model: 'M5 Competition',
    year: 2024,
    category: 'Sedan',
    price: 86400,
    quantity: 4,
    image: '/media/bmw.jpg',
    fuel: 'Petrol',
    transmission: 'Automatic',
    mileage: 2800,
    color: 'Alpine White',
    description:
      'Precision with personality. A focused performance sedan with comfort for every day.',
  },
  {
    id: 'ab-004',
    make: 'Honda',
    model: 'CR-V',
    year: 2023,
    category: 'SUV',
    price: 72900,
    quantity: 2,
    image: '/media/defender.jpg',
    fuel: 'Diesel',
    transmission: 'Automatic',
    mileage: 12400,
    color: 'White',
    description:
      'Go beyond the familiar. The CR-V brings a confident stance and space for your next adventure.',
  },
  {
    id: 'ab-005',
    make: 'Audi',
    model: 'RS 7 Sportback',
    year: 2022,
    category: 'Sedan',
    price: 142000,
    quantity: 0,
    image: '/media/audi.jpg',
    fuel: 'Petrol',
    transmission: 'Automatic',
    mileage: 6900,
    color: 'Daytona Grey',
    description:
      'A statement in engineering and design. A performance grand tourer that makes every journey an occasion.',
  },
  {
    id: 'ab-006',
    make: 'Tesla',
    model: 'Model 3',
    year: 2024,
    category: 'Sedan',
    price: 38900,
    quantity: 5,
    image: '/media/tesla.jpg',
    fuel: 'Electric',
    transmission: 'Automatic',
    mileage: 1500,
    color: 'Pearl White',
    description:
      'A quieter kind of exhilaration. Clean design and all-electric driving for a different perspective on the road.',
  },
];

export async function seedDatabase(db) {
  initializeSchema(db);

  // Seed default administrator
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@autobest.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'AdminSecurePass123!';
  const existingAdmin = db.prepare('SELECT id FROM users WHERE email = ?').get(adminEmail);

  if (!existingAdmin) {
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(adminPassword, salt);
    db.prepare(`
      INSERT INTO users (id, email, password, role)
      VALUES (?, ?, ?, 'admin')
    `).run('admin-default-id', adminEmail, hashedPassword);
  }

  // Seed initial vehicles
  const insertVehicle = db.prepare(`
    INSERT OR IGNORE INTO vehicles (
      id, make, model, year, category, price, quantity, image,
      fuel, transmission, mileage, color, description
    ) VALUES (
      @id, @make, @model, @year, @category, @price, @quantity, @image,
      @fuel, @transmission, @mileage, @color, @description
    )
  `);

  const insertMany = db.transaction((vehicles) => {
    for (const vehicle of vehicles) {
      insertVehicle.run(vehicle);
    }
  });

  insertMany(initialVehicles);
}

// Direct execution support
if (process.argv[1] && process.argv[1].endsWith('seed.js')) {
  const db = getDatabase();
  console.log('Seeding database at:', process.env.DATABASE_PATH || 'data/autobest.sqlite');
  await seedDatabase(db);
  console.log('Seeding completed successfully.');
  closeDatabase(db);
}
