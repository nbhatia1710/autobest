import { it, expect, vi } from 'vitest';
import { createApiClient } from './api';
import { createDemoClient } from './demo';
const car = {
  make: 'Lexus',
  model: 'LC',
  year: 2024,
  category: 'Coupe',
  price: 80000,
  quantity: 2,
};
it('uses every write endpoint and encodes IDs with JSON bodies', async () => {
  const fetcher = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => car });
  const api = createApiClient('/api/', () => null, vi.fn(), fetcher);
  await api.register({ email: 'demo@example.com', password: 'password' });
  await api.login({ email: 'demo@example.com', password: 'password' });
  await api.add(car);
  await api.update('a/b', car);
  await api.purchase('a/b');
  await api.restock('a/b', 4);
  await api.remove('a/b');
  expect(fetcher.mock.calls.map(([url, options]) => [url, options.method])).toEqual([
    ['/api/auth/register', 'POST'],
    ['/api/auth/login', 'POST'],
    ['/api/vehicles', 'POST'],
    ['/api/vehicles/a%2Fb', 'PUT'],
    ['/api/vehicles/a%2Fb/purchase', 'POST'],
    ['/api/vehicles/a%2Fb/restock', 'POST'],
    ['/api/vehicles/a%2Fb', 'DELETE'],
  ]);
  expect(JSON.parse(fetcher.mock.calls[5][1].body)).toEqual({ quantity: 4 });
  expect(fetcher.mock.calls[0][1].headers.Authorization).toBeUndefined();
});
it('handles no-content deletion, connection failure and cancellation distinctly', async () => {
  const fetcher = vi
    .fn()
    .mockResolvedValueOnce({ status: 204 })
    .mockRejectedValueOnce(new Error('offline'))
    .mockRejectedValueOnce(new DOMException('Cancelled', 'AbortError'));
  const api = createApiClient('/api', () => null, vi.fn(), fetcher);
  expect(await api.remove('1')).toBeNull();
  await expect(api.list()).rejects.toThrow('Unable to connect');
  await expect(api.list()).rejects.toHaveProperty('name', 'AbortError');
});
it('does not expire sessions on a wrong password and preserves conflict details', async () => {
  const expired = vi.fn(),
    fetcher = vi
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ detail: 'Wrong password' }),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 409,
        json: async () => ({ error: { message: 'Sold out', details: { quantity: 'No stock' } } }),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => {
          throw new Error('HTML');
        },
      });
  const api = createApiClient('/api', () => null, expired, fetcher);
  await expect(api.login({})).rejects.toThrow('Wrong password');
  expect(expired).not.toHaveBeenCalled();
  await expect(api.purchase('1')).rejects.toMatchObject({
    status: 409,
    details: { quantity: 'No stock' },
  });
  await expect(api.list()).rejects.toThrow('could not be completed');
});
it('demo supports CRUD, search bounds and rejects bad or missing inventory', async () => {
  const api = createDemoClient(() => ({ role: 'admin' }));
  const added = await api.add(car);
  expect(added.id).toBeTruthy();
  expect(
    await api.list({
      make: 'lexus',
      model: 'lc',
      category: 'coupe',
      min_price: '70000',
      max_price: '90000',
    }),
  ).toHaveLength(1);
  expect(await api.list({ min_price: '200000' })).toHaveLength(0);
  expect(await api.list({ max_price: '1' })).toHaveLength(0);
  expect((await api.update(added.id, { ...car, price: 90000 })).price).toBe(90000);
  await api.remove(added.id);
  await expect(api.purchase(added.id)).rejects.toMatchObject({ status: 404 });
  await expect(api.add({ ...car, price: -1 })).rejects.toMatchObject({ status: 400 });
  await expect(api.update('ab-001', { ...car, quantity: 1.1 })).rejects.toMatchObject({
    status: 400,
  });
});
it('demo registration detects duplicate email and never persists passwords', async () => {
  const api = createDemoClient(() => null);
  await api.register({ email: 'demo@example.com', password: 'secret-password' });
  await expect(api.register({ email: 'demo@example.com' })).rejects.toMatchObject({ status: 409 });
  await expect(api.login({ email: 'demo@example.com', password: '' })).rejects.toMatchObject({
    status: 400,
  });
  expect((await api.login({ email: 'demo@example.com', password: 'fictional' })).user.role).toBe(
    'customer',
  );
  expect(JSON.stringify({ ...sessionStorage, ...localStorage })).not.toContain('secret-password');
});
