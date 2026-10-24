# Frontend / future FastAPI contract

Base URL: `VITE_API_BASE_URL`, default `http://localhost:8000/api`. JSON requests and responses. Protected calls send `Authorization: Bearer <access_token>`. IDs are encoded as URL path segments. Search is registered before the dynamic vehicle ID route.

| Method | Path | Request | Expected success |
| --- | --- | --- | --- |
| POST | `/auth/register` | `{email,password}` | 201, any JSON; UI then requests login |
| POST | `/auth/login` | `{email,password}` | `{access_token, user:{id,email,role}}` |
| GET | `/vehicles` | none | Vehicle array, including zero stock; `{items:[...]}` also accepted |
| GET | `/vehicles/search` | query: `make,model,category,min_price,max_price` | Same listing response |
| POST | `/vehicles` | Vehicle fields, no ID required | Created Vehicle |
| PUT | `/vehicles/:id` | Vehicle fields | Updated Vehicle |
| DELETE | `/vehicles/:id` | none | 204 or JSON |
| POST | `/vehicles/:id/purchase` | `{quantity:1,customer:{name,email,address}}` | Updated Vehicle, including quantity |
| POST | `/vehicles/:id/restock` | `{quantity:positiveInteger}` | Updated Vehicle |

```json
{
  "id": "ab-001",
  "make": "Porsche",
  "model": "Panamera",
  "category": "Sedan",
  "price": 119900,
  "quantity": 3,
  "year": 2024,
  "image": "/media/porsche.jpg",
  "fuel": "Petrol",
  "transmission": "Automatic",
  "mileage": 4200,
  "color": "Black",
  "description": "Example description"
}
```

Required core data: unique `id`, `make`, `model`, `category`, finite positive `price`, nonnegative integer `quantity`. The requested UI also requires manufacture `year` and an `image` URL; other descriptive fields are optional with display fallbacks. Image input accepts HTTPS or `/media/` paths. Prices use USD and must be represented safely in PostgreSQL (decimal, not floating point). Categories in the editor: Sedan, SUV, Coupe, Hatchback, Convertible, Truck. Any additional server categories should be added to this shared contract and editor.

Auth JWT claims: `sub`, `role`, `exp`. Role names: `customer` or `admin`. Login returns the user explicitly; the frontend does not infer a trustworthy role from unverified token claims. Token data is kept in sessionStorage, never in repository configuration. Expiration schedules logout; 401 on any protected API request clears the session and protected routes redirect to login. Login 401 stays in the form. Auth responses must contain a valid future `exp`; refresh tokens are outside current scope.

Errors:

```json
{"error":{"code":"OUT_OF_STOCK","message":"The last unit was purchased.","details":{}}}
```

Use 400/422 for validation, 401 for invalid/expired authentication, 403 for wrong role, 404 for missing vehicles and 409 for stock conflicts or duplicate emails. `details` may map form field names to messages for auth. The adapter also displays a string FastAPI `detail` fallback. Inventory forms surface server failures above the form and client field validation inline.

Server requirements: admin-only add/update/delete/restock, no client-selected role at registration, hashed passwords, server-seeded admins, atomic conditional stock updates, positive integer purchase/restock validation, persisted PostgreSQL data, and consistent errors. Validate metadata server-side too. The browser demo deliberately does not implement security, concurrency, password checking or persistent user accounts.

No payment gateway, sales tax, shipping, financing, order history, pagination protocol, or deployment is implied by the original API brief. Purchase records customer details and a stock decrement; any payment/order workflow will require a separately agreed contract.

Purchase requires trimmed customer name (1–120 characters), valid email (up to 254), and address (1–1000). Migration 3 creates private purchase records linked to the authenticated user, with vehicle/price snapshots. Saving these details and decrementing stock occur in one SQLite transaction. Responses remain updated Vehicle objects and do not expose customer details. No payment is collected.
