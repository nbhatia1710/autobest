import { render, screen, fireEvent, within, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { it, expect } from 'vitest';
import { AuthProvider } from '../lib/auth';
import App from '../App';
function start(path = '/login') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </MemoryRouter>,
  );
}
const fill = (label, value) =>
  fireEvent.change(screen.getByLabelText(label, { exact: true }), { target: { value } });
it('registers a fictional account, signs in and signs out', async () => {
  start('/register');
  fireEvent.click(screen.getByRole('button', { name: 'Create account' }));
  expect(screen.getByText('Enter a valid email address.')).toBeInTheDocument();
  fill('Email address', 'test@example.com');
  fill('Password', 'demo-password');
  fill('Confirm password', 'demo-password');
  fireEvent.click(screen.getByRole('button', { name: 'Create account' }));
  expect(await screen.findByText('You’re all set.')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('link', { name: 'Continue to sign in' }));
  fill('Email address', 'test@example.com');
  fill('Password', 'demo-password');
  fireEvent.click(screen.getByRole('button', { name: 'Sign in', exact: true }));
  await screen.findByRole('button', { name: /Explore Porsche/ });
  fireEvent.click(screen.getByRole('button', { name: 'Sign out' }));
  expect(await screen.findByRole('heading', { name: 'Welcome back.' })).toBeInTheDocument();
});
it('drives administrator add, update, restock and delete through forms', async () => {
  start();
  fireEvent.click(screen.getByRole('button', { name: 'Explore as admin' }));
  await screen.findByRole('button', { name: 'Edit Panamera' });
  fireEvent.click(screen.getByRole('button', { name: 'Add vehicle' }));
  fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Add vehicle' }));
  expect(screen.getAllByText('This field is required.')).toHaveLength(2);
  fill('Make *', 'Lexus');
  fill('Model *', 'LC 500');
  fill('Price (USD) *', '90000');
  fill('Quantity in stock *', '2');
  fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Add vehicle' }));
  fireEvent.click(await screen.findByRole('button', { name: 'Edit LC 500' }));
  fill('Price (USD) *', '88000');
  fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
  await screen.findByText('$88,000');
  fireEvent.click(screen.getByRole('button', { name: 'Restock LC 500' }));
  fill('Units to add', '-1');
  fireEvent.click(screen.getByRole('button', { name: 'Confirm restock' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('positive whole number');
  fill('Units to add', '3');
  fireEvent.click(screen.getByRole('button', { name: 'Confirm restock' }));
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  fireEvent.click(screen.getByRole('button', { name: 'Delete LC 500' }));
  fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
  expect(screen.getByRole('button', { name: 'Delete LC 500' })).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Delete LC 500' }));
  fireEvent.click(screen.getByRole('button', { name: 'Delete vehicle' }));
  await waitFor(() =>
    expect(screen.queryByRole('button', { name: 'Delete LC 500' })).not.toBeInTheDocument(),
  );
});
it('opens same-page details and completes a customer purchase', async () => {
  start();
  fireEvent.click(screen.getByRole('button', { name: 'Explore as customer' }));
  fireEvent.click(await screen.findByRole('button', { name: /Explore Mercedes/ }));
  expect(screen.getByRole('dialog')).toHaveTextContent('AMG GT');
  fireEvent.click(screen.getByRole('button', { name: 'Purchase vehicle' }));
  fireEvent.change(screen.getByLabelText('Full name'), { target: { value: 'Test Buyer' } });
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'buyer@example.com' } });
  fireEvent.change(screen.getByLabelText('Address'), { target: { value: '12 Test Street' } });
  fireEvent.click(screen.getByRole('button', { name: 'Confirm purchase' }));
  await waitFor(() => expect(screen.getByRole('dialog').textContent).toContain('0 in stock'));
  expect(
    within(screen.getByRole('dialog')).getByRole('button', { name: 'Out of stock' }),
  ).toBeDisabled();
  fireEvent.click(screen.getByRole('button', { name: 'Close dialog' }));
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});
