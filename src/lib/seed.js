export const vehicles = [
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
    engine: '3.0L Inline-6 Turbo (Stage 2)',
    power: '520 BHP',
    torque: '650 Nm',
    owners: 'Single Owner',
    registrationYear: 2023,
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
    engine: '3.0L Inline-6 Diesel',
    power: '390 BHP',
    torque: '750 Nm',
    owners: 'Single Owner',
    registrationYear: 2025,
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
    engine: '3.0L Inline-6 Diesel',
    power: '350 BHP',
    torque: '680 Nm',
    owners: 'Single Owner',
    registrationYear: 2022,
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
    engine: '3.3L Twin-Turbo V6 Diesel',
    power: '301 BHP',
    torque: '700 Nm',
    owners: 'Unregistered',
    registrationYear: 2026,
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
    engine: '3.0L Inline-6 Diesel',
    power: '345 BHP',
    torque: '700 Nm',
    owners: 'Single Owner',
    registrationYear: 2025,
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
    engine: '2.0L Turbocharged Inline-4 Petrol',
    power: '240 BHP',
    torque: '370 Nm',
    owners: 'Single Owner',
    registrationYear: 2024,
  },
];

export const formatIndianLakhsCrores = (value) => {
  if (value == null || Number.isNaN(Number(value))) return '';
  const num = Number(value);
  if (num >= 10000000) {
    const cr = num / 10000000;
    return `₹${cr % 1 === 0 ? cr : Number(cr.toFixed(2))} Cr`;
  }
  if (num >= 100000) {
    const lk = num / 100000;
    return `₹${lk % 1 === 0 ? lk : Number(lk.toFixed(2))} Lakh`;
  }
  return money(num);
};

export const money = (value) => {
  if (value == null || Number.isNaN(Number(value))) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(value));
};
