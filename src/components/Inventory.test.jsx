import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, it, expect, vi } from 'vitest';
import Inventory from './Inventory';
const state = vi.hoisted(() => ({
  user: { role: 'customer' },
  api: { list: vi.fn(), purchase: vi.fn() },
}));
vi.mock('../lib/auth', () => ({ useAuth: () => state, isDemo: true }));
const car = {
  id: 'a',
  make: 'Porsche',
  model: 'Panamera',
  year: 2024,
  category: 'Sedan',
  price: 90000,
  quantity: 1,
};
beforeEach(() => {
  state.user = { role: 'customer' };
  state.api.list.mockReset().mockResolvedValue([car]);
  state.api.purchase.mockReset();
});
const start = () =>
  render(
    <MemoryRouter>
      <Inventory />
    </MemoryRouter>,
  );
it('recovers from network errors using retry', async () => {
  state.api.list.mockRejectedValueOnce(new Error('Connection unavailable'));
  start();
  expect(await screen.findByRole('alert')).toHaveTextContent('Connection unavailable');
  fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
  expect(await screen.findByRole('button', { name: /Explore Porsche/ })).toBeInTheDocument();
});
it('shows a conflict and refreshes inventory instead of overselling', async () => {
  state.api.purchase.mockRejectedValue(Object.assign(new Error('Sold out'), { status: 409 }));
  start();
  fireEvent.click(await screen.findByRole('button', { name: 'Purchase' }));
  fireEvent.change(screen.getByLabelText('Full name'), { target: { value: 'Test Buyer' } });
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'buyer@example.com' } });
  fireEvent.change(screen.getByLabelText('Address'), { target: { value: '12 Test Street' } });
  fireEvent.click(screen.getByRole('button', { name: 'Confirm purchase' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('stock changed');
  await waitFor(() => expect(state.api.list).toHaveBeenCalledTimes(2));
});
it('shows empty search state and resets filters', async () => {
  state.api.list.mockResolvedValue([]);
  start();
  expect(await screen.findByText('No cars match just yet.')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Clear all filters' }));
  expect(screen.getByRole('textbox', { name: 'Search by model' })).toHaveValue('');
});
it('validates price bounds without making a bad request', async () => {
  start();
  await screen.findByRole('button', { name: /Explore Porsche/ });
  fireEvent.click(screen.getByRole('button', { name: 'Filters' }));
  fireEvent.change(screen.getByLabelText('Minimum price (₹)'), { target: { value: '200' } });
  fireEvent.change(screen.getByLabelText('Maximum price (₹)'), { target: { value: '100' } });
  expect(screen.getByRole('alert')).toHaveTextContent('Minimum price');
  expect(state.api.list).toHaveBeenCalledTimes(1);
});
it('does not fetch protected inventory for public visitors', () => {
  state.user = null;
  start();
  expect(state.api.list).not.toHaveBeenCalled();
  expect(screen.getByRole('link', { name: 'Enter the showroom' })).toHaveAttribute(
    'href',
    '/login',
  );
});
