export class ApiError extends Error {
  constructor(message, status = 0, details = {}) {
    super(message);
    this.status = status;
    this.details = details;
  }
}
export function createApiClient(
  base,
  getToken,
  onUnauthorized,
  fetcher = (...args) => fetch(...args),
) {
  async function request(path, { method = 'GET', body, signal } = {}) {
    let response;
    try {
      response = await fetcher(`${base.replace(/\/$/, '')}${path}`, {
        method,
        signal,
        headers: {
          'Content-Type': 'application/json',
          ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
      });
    } catch (error) {
      if (error.name === 'AbortError') throw error;
      throw new ApiError('Unable to connect. Check your connection and try again.');
    }
    if (response.status === 204) return null;
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      if (response.status === 401 && !path.startsWith('/auth/')) onUnauthorized();
      throw new ApiError(
        data.error?.message ||
          (typeof data.detail === 'string' ? data.detail : 'The request could not be completed.'),
        response.status,
        data.error?.details || {},
      );
    }
    return data;
  }
  return {
    login: (values) => request('/auth/login', { method: 'POST', body: values }),
    register: (values) => request('/auth/register', { method: 'POST', body: values }),
    list: (filters = {}, signal) => {
      const query = new URLSearchParams(
        Object.entries(filters).filter(([, v]) => v !== '' && v != null),
      );
      return request(query.size ? `/vehicles/search?${query}` : '/vehicles', { signal });
    },
    add: (body) => request('/vehicles', { method: 'POST', body }),
    update: (id, body) => request(`/vehicles/${encodeURIComponent(id)}`, { method: 'PUT', body }),
    remove: (id) => request(`/vehicles/${encodeURIComponent(id)}`, { method: 'DELETE' }),
    purchase: (id, customer) =>
      request(`/vehicles/${encodeURIComponent(id)}/purchase`, {
        method: 'POST',
        body: { quantity: 1, customer },
      }),
    restock: (id, quantity) =>
      request(`/vehicles/${encodeURIComponent(id)}/restock`, {
        method: 'POST',
        body: { quantity },
      }),
  };
}
