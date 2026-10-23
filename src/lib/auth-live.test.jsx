import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, it, expect, afterEach } from 'vitest';
vi.stubEnv('VITE_API_MODE', 'live');
const { AuthProvider, useAuth } = await import('./auth');
function Probe() {
  const { user, login, logout, api } = useAuth();
  return (
    <>
      <span>{user ? user.email : 'signed out'}</span>
      <button
        onClick={() =>
          login({ email: 'user@example.com', password: 'password' }).catch((e) => {
            document.querySelector('output').textContent = e.message;
          })
        }
      >
        Login
      </button>
      <button onClick={logout}>Logout</button>
      <button onClick={() => api.list().catch(() => {})}>Fetch</button>
      <output />
    </>
  );
}
afterEach(() => {
  vi.unstubAllGlobals();
});
const token = (exp) =>
  `header.${btoa(JSON.stringify({ sub: 'u1', role: 'customer', exp }))}.signature`;
it('accepts future JWT expiration and clears sessions on protected 401', async () => {
  vi.stubGlobal(
    'fetch',
    vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          access_token: token(Math.floor(Date.now() / 1000) + 3600),
          user: { email: 'user@example.com', role: 'customer' },
        }),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: { message: 'Expired' } }),
      }),
  );
  render(
    <AuthProvider>
      <Probe />
    </AuthProvider>,
  );
  fireEvent.click(screen.getByText('Login'));
  expect(await screen.findByText('user@example.com')).toBeInTheDocument();
  expect(sessionStorage.getItem('autobest.live.session')).toContain('access_token');
  fireEvent.click(screen.getByText('Fetch'));
  expect(await screen.findByText('signed out')).toBeInTheDocument();
  expect(sessionStorage.getItem('autobest.live.session')).toBeNull();
});
it('rejects expired tokens without storing a session', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        access_token: token(1),
        user: { email: 'user@example.com', role: 'customer' },
      }),
    }),
  );
  render(
    <AuthProvider>
      <Probe />
    </AuthProvider>,
  );
  fireEvent.click(screen.getByText('Login'));
  await waitFor(() =>
    expect(document.querySelector('output')).toHaveTextContent('invalid or expired token'),
  );
  expect(sessionStorage.getItem('autobest.live.session')).toBeNull();
});
