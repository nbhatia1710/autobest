import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { getDatabase, closeDatabase } from './connection.js';
import { initializeSchema } from './schema.js';
import { DEFAULT_DEV_ADMIN_PASSWORD, DEFAULT_DEV_ADMIN_EMAIL } from '../config/index.js';

dotenv.config();

export const initialVehicles = [
  {
    id: 'ab-001',
    make: 'BMW',
    model: 'M340i xDrive',
    year: 2023,
    category: 'Sedan',
    price: 5225000,
    quantity: 3,
    image: '/media/bmw-m340i.jpg',
    fuel: 'Petrol',
    transmission: 'Automatic',
    mileage: 17500,
    color: 'Alpine White',
    description:
      '2023 Manufactured & Registered · Single Owner · 17,500 km. Loadings: Full system quad exhaust, Stage-2 mapped Inline-6 Engine delivering 520 BHP & 650 Nm Torque.',
  },
  {
    id: 'ab-002',
    make: 'Mercedes-Benz',
    model: 'GLS 450d',
    year: 2024,
    category: 'SUV',
    price: 12100000,
    quantity: 1,
    image: '/media/mercedes-gls450d.jpg',
    fuel: 'Diesel',
    transmission: 'Automatic',
    mileage: 25000,
    color: 'Obsidian Grey',
    description:
      '2024 Manufactured, 2025 Registered · Single Owner · 25,000 km. 3.0L Inline-6 Diesel Engine producing 390 BHP & 750 Nm Torque. The pinnacle of three-row flagship luxury.',
  },
  {
    id: 'ab-003',
    make: 'BMW',
    model: '5 Series 530d M Sport',
    year: 2021,
    category: 'Sedan',
    price: 4250000,
    quantity: 4,
    image: '/media/bmw-530d.jpg',
    fuel: 'Diesel',
    transmission: 'Automatic',
    mileage: 58000,
    color: 'Midnight Blue',
    description:
      '2021 Manufactured, 2022 Registered · Single Owner · 58,000 km. Legendary 3.0L Inline-6 Diesel Engine producing 350 BHP & 680 Nm Torque in dynamic M Sport specification.',
  },
  {
    id: 'ab-004',
    make: 'Toyota',
    model: 'Land Cruiser 300',
    year: 2026,
    category: 'SUV',
    price: 24100000,
    quantity: 2,
    image: '/media/toyota-lc300.jpg',
    fuel: 'Diesel',
    transmission: 'Automatic',
    mileage: 4000,
    color: 'Precious White Pearl',
    description:
      '2026 Manufactured · Unregistered · 4,000 km driven. 3.3L Twin-Turbo V6 Diesel Engine with 301 BHP & 700 Nm Torque. King of luxury off-road capability.',
  },
  {
    id: 'ab-005',
    make: 'Land Rover',
    model: 'Range Rover Sport HSE Dynamic',
    year: 2025,
    category: 'SUV',
    price: 13900000,
    quantity: 0,
    image: '/media/range-rover-sport.jpg',
    fuel: 'Diesel',
    transmission: 'Automatic',
    mileage: 16000,
    color: 'Sunset Gold Satin Finish',
    description:
      '2025 Manufactured & Registered · 16,000 km driven. 3.0L Inline-6 Diesel Engine generating 345 BHP & 700 Nm Torque in exclusive Sunset Gold Satin Finish.',
  },
  {
    id: 'ab-006',
    make: 'Audi',
    model: 'A6 45 TFSI Technology',
    year: 2024,
    category: 'Sedan',
    price: 4949000,
    quantity: 5,
    image: '/media/audi-a6.jpg',
    fuel: 'Petrol',
    transmission: 'Automatic',
    mileage: 37000,
    color: 'Mythos Black',
    description:
      '2024 Manufactured & Registered · 37,000 km driven. 2.0L Turbocharged Petrol Inline-4 Engine producing 240 BHP & 370 Nm Torque in top-spec Technology trim.',
  },
];

export async function seedDatabase(db, options = {}) {
  initializeSchema(db);

  const isProduction = (options.nodeEnv || process.env.NODE_ENV) === 'production';
  const adminEmail = options.adminEmail !== undefined
    ? options.adminEmail
    : (process.env.ADMIN_EMAIL || (isProduction ? null : DEFAULT_DEV_ADMIN_EMAIL));
  const adminPassword = options.adminPassword !== undefined
    ? options.adminPassword
    : (process.env.ADMIN_PASSWORD || (isProduction ? null : DEFAULT_DEV_ADMIN_PASSWORD));

  // In production, refuse to silently seed published default credentials
  if (isProduction && adminPassword === DEFAULT_DEV_ADMIN_PASSWORD) {
    throw new Error('Refusing to seed database in production with default administrator password.');
  }

  if (adminEmail && adminPassword) {
    const existingAdmin = db.prepare('SELECT id FROM users WHERE email = ?').get(adminEmail);

    if (!existingAdmin) {
      const salt = bcrypt.genSaltSync(10);
      const hashedPassword = bcrypt.hashSync(adminPassword, salt);
      db.prepare(`
        INSERT INTO users (id, email, password, role)
        VALUES (?, ?, ?, 'admin')
      `).run('admin-default-id', adminEmail, hashedPassword);
    }
  }

  // Seed initial vehicles (using REPLACE so re-seeding updates vehicle catalog)
  const insertVehicle = db.prepare(`
    INSERT OR REPLACE INTO vehicles (
      id, make, model, year, category, price, quantity, image,
      fuel, transmission, mileage, color, description, updated_at
    ) VALUES (
      @id, @make, @model, @year, @category, @price, @quantity, @image,
      @fuel, @transmission, @mileage, @color, @description, CURRENT_TIMESTAMP
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
