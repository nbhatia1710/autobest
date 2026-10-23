import { describe, it, expect } from 'vitest';
import { validateVehicle, validateFilters, validateAuth } from './validation';
describe('vehicle and account rules', () => {
  const car = {
    make: 'BMW',
    model: 'M4',
    category: 'Coupe',
    year: 2024,
    price: 89000,
    quantity: 2,
  };
  it('accepts valid inventory', () => expect(validateVehicle(car)).toEqual({}));
  it('rejects missing identity and negative or fractional stock', () => {
    expect(validateVehicle({ ...car, make: '', quantity: -1 })).toHaveProperty('make');
    expect(validateVehicle({ ...car, quantity: 1.5 })).toHaveProperty('quantity');
  });
  it('rejects an inverted price range', () =>
    expect(validateFilters({ min_price: '200', max_price: '100' })).toBeTruthy());
  it('accepts a zero price floor', () =>
    expect(validateFilters({ min_price: '0', max_price: '100' })).toBe(''));
  it('validates email and password confirmation', () => {
    const errors = validateAuth({ email: 'bad', password: '123', confirm: '456' }, true);
    expect(errors).toHaveProperty('email');
    expect(errors).toHaveProperty('password');
    expect(errors).toHaveProperty('confirm');
  });
});
