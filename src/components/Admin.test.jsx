import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi, it, expect } from 'vitest';
import Admin from './Admin';
vi.mock('../lib/auth', () => ({
  useAuth: () => ({ user: { role: 'customer' }, api: {} }),
  isDemo: true,
}));
it('does not expose inventory management to a customer', () => {
  render(
    <MemoryRouter>
      <Admin />
    </MemoryRouter>,
  );
  expect(screen.queryByRole('button', { name: /add vehicle/i })).not.toBeInTheDocument();
  expect(screen.getByText(/administrator access required/i)).toBeInTheDocument();
});
