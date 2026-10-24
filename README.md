# AutoBest Motors

A cinematic, scroll-driven car dealership frontend built with **HTML5, CSS3, Tailwind CSS, React, Vite, React Router, an auth context, and an isolated API client**. The supplied AutoBest film opens the experience with only the dealership name in the video visible. Pointer-reactive vehicle cards reveal an accessible same-page detail dialog.

**Architecture**: Full-stack application featuring a React/Vite/Tailwind frontend and a high-performance **Node.js + Express + SQLite** RESTful backend API with persistent storage, JWT bearer authentication, atomic inventory concurrency controls, and full RBAC.

## Run locally

Use Node.js 22.12 or later and npm.

### 1. Backend Setup & Startup

The backend runs on port 8000 by default and connects to a persistent SQLite database (`data/autobest.sqlite`).

```sh
cd backend
npm install
npm run seed      # Seeds admin (admin@autobest.com / AdminSecurePass123!) and 6 vehicles
npm start         # Runs Express server at http://localhost:8000
```

To run backend tests and inspect coverage:

```sh
cd backend
npm test          # Runs 51 passing unit/integration tests
npm run test:coverage # Computes test coverage report (~90% line coverage)
```

### 2. Frontend Setup & Startup

In a separate terminal at the project root:

```sh
npm ci
npm run dev       # Starts Vite dev server on http://localhost:5173
```

To connect the frontend directly to the live Node.js backend API:

Create a `.env.local` file (or update `.env`) with:

```dotenv
VITE_API_MODE=live
VITE_API_BASE_URL=http://localhost:8000/api
```

Restart the Vite dev server. The frontend will now communicate directly with the live Express backend API, authenticating against the persistent SQLite database.

Default administrator credentials:
- **Email**: `admin@autobest.com`
- **Password**: `AdminSecurePass123!`

## Features

- Local 1080p opening video with no text layered over the dealership name, a lightweight poster, play/pause/replay controls, and reduced-motion support.
- Responsive vehicle cards, manufacture year, stock, category, price, photo, multidirectional pointer tilt and “Click to know more” hover prompt.
- Native modal dialogs with Escape dismissal, focus containment, focus restoration and preserved page position.
- Registration, login, logout, field validation, duplicate-email feedback, protected routes, bearer token support and expired-session handling.
- Debounced make/model/category/price search, range validation, clear filters, sorting, loading skeletons, empty states, network errors and retry.
- Purchase controls on every card, zero-stock disabling, confirmation, pending state, stock refresh and specific 409 conflict feedback.
- Admin add, edit, confirmed delete and positive-integer restock; customer access restrictions; inventory totals and management search.
- All essential controls work without hover, with labels and visible keyboard focus.

The public homepage shows three **static editorial sample vehicles**. Protected inventory is fetched only after sign-in. `GET /vehicles` must include zero-stock listings so disabled purchase states remain visible. All inventory write controls except purchase are admin-only; this deliberately resolves the brief's differing wording around add/update permissions.

## Backend Architecture & API (Node.js + Express + SQLite)

The backend is built with **Node.js, Express 5, and SQLite (`better-sqlite3`)**, adopting a clean layered architecture adhering to SOLID principles:

```text
Routes → Middleware (Auth/RBAC) → Controllers → Services → Repositories → SQLite Database
```

- **Database Layer**: Persistent file-based SQLite database with Write-Ahead Logging (`WAL`) mode and foreign key constraints enabled.
- **Authentication & RBAC**: Stateless token-based authentication using **JSON Web Tokens (JWT)** and salted **bcrypt** password hashing. User registration strictly enforces the `customer` role to prevent privilege escalation. Server seeds a default administrator (`admin@autobest.com`).
- **Atomic Concurrency Controls**: Inventory purchase executes an atomic conditional database statement:
  ```sql
  UPDATE vehicles SET quantity = quantity - ? WHERE id = ? AND quantity >= ?;
  ```
  If zero rows are affected due to concurrent exhaustion, an HTTP `409 Conflict` (`OUT_OF_STOCK`) is returned.
- **RESTful Endpoints**:
  - `POST /api/auth/register`: Register new customer account.
  - `POST /api/auth/login`: Authenticate and receive signed JWT.
  - `GET /api/vehicles`: View complete catalog (including zero-stock items for disabled frontend UI states).
  - `GET /api/vehicles/search`: Filter vehicles by make, model, category, and price range.
  - `POST /api/vehicles`: Add new vehicle (Admin only).
  - `PUT /api/vehicles/:id`: Update vehicle details (Admin only).
  - `DELETE /api/vehicles/:id`: Delete vehicle (Admin only).
  - `POST /api/vehicles/:id/purchase`: Purchase vehicle, atomically decrementing stock.
  - `POST /api/vehicles/:id/restock`: Restock vehicle by positive integer quantity (Admin only).

## Structure

```text
backend/
├── src/
│   ├── controllers/   # Request/response mapping and HTTP status codes
│   ├── db/            # SQLite connection, schema definition, and seeder
│   ├── middleware/    # JWT verification, RBAC guard, and error handler
│   ├── repositories/  # Database access queries (UserRepository, VehicleRepository)
│   ├── routes/        # Express router declarations (authRoutes, vehicleRoutes)
│   ├── services/      # Business logic, atomic transactions, domain rules
│   ├── utils/         # Input validators and sanitizers
│   ├── app.js         # Express app factory with dependency injection
│   └── server.js      # Server entrypoint with auto-seeding
└── src/tests/         # TDD test suites (auth, catalog, crud, inventory, E2E)

src/components/        # React components (Hero, inventory, vehicle cards, admin)
src/lib/               # HTTP client adapter, demo adapter, auth context
docs/                  # API contract, test reports, and visual screenshots
```

## Screenshots

![Desktop showroom](docs/home-desktop.png)
![The dealership video and its name on a phone](docs/hero-mobile.png)
![Inventory details](docs/vehicle-details.png)
![Administrator inventory](docs/admin-desktop.png)
![Mobile showroom](docs/showroom-mobile.png)

## Test report

- Frontend tests: See [TEST-REPORT.md](docs/TEST-REPORT.md) for verified frontend results.
- Backend tests: See [BACKEND-TEST-REPORT.md](docs/BACKEND-TEST-REPORT.md) for verified backend results. 51 tests across 6 suites passing with ~90% code coverage. Strict TDD was followed with explicit **Red-Green-Refactor** commits for database migrations, authentication, catalog search, vehicle management CRUD, and inventory concurrency operations.

## My AI Usage

**Tools used:**
1. **OpenAI Codex (ChatGPT)**: Used during the frontend phase for UI scaffolding, component layouts, and browser journeys.
2. **Google Gemini**: Used during the backend phase for requirement analysis, test-driven development (TDD), generating test suites, implementing service and repository layers, and structuring clean git commits following the Red-Green-Refactor pattern.

**How AI was used:**
- **Architecture & API Design**: Gemini mapped the technical requirements into a layered architecture (Controllers → Services → Repositories → SQLite).
- **Test-Driven Development (TDD)**: Before implementing any backend logic, failing specification tests (Red) were written and committed for each module: database schema, authentication, catalog search, vehicle CRUD, and atomic purchase/restock.
- **Implementation (Green)**: Minimal robust code was implemented to satisfy the test assertions, verify HTTP status codes (200, 201, 204, 400, 401, 403, 404, 409), and enforce business rules.
- **Refactoring (Refactor)**: Code was cleaned, parameter sanitization was extracted into validator utilities, and database abstraction was modularized while ensuring test suites remained 100% green.
- **End-to-End Integration**: AI generated an end-to-end integration test verifying full customer and administrator journeys.

**Workflow reflection:**
AI significantly accelerated development by automating repetitive boilerplate and formulating rigorous test suites before implementation. Adhering to the Red-Green-Refactor discipline ensured each layer was verified independently, preventing regressions and edge cases such as stock-decrement race conditions and privilege escalation during registration.

Every AI-assisted commit includes the required `Co-authored-by` trailer (`Co-authored-by: Gemini <AI@users.noreply.github.com>`). All raw user prompts and chat requests are recorded verbatim in [PROMPTS.md](PROMPTS.md).

## Media credits and sample data

`public/media/hero.mp4`: user-supplied AutoBest Motors opening animation, included unchanged. It plays muted without preloading the full file. Account and administrator pages are loaded only when opened to keep the first page load light.

Local sample images from Unsplash image CDN (illustrative, not verified sale listings):

- Porsche: https://images.unsplash.com/photo-1503376780353-7e6692767b70
- Mercedes-Benz: https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8
- BMW: https://images.unsplash.com/photo-1555215695-3004980ad54e
- Honda: https://images.unsplash.com/photo-1519641471654-76ce0107ad1b
- Audi: https://images.unsplash.com/photo-1606152421802-db97b9c7a11b
- Tesla: https://images.unsplash.com/photo-1560958089-b8a1929cea89

All years, prices, stock counts and specifications are fictional demonstration values, not vehicle provenance claims. Replace them with verified inventory before launch. Currency is USD for the sample; the backend contract must agree on currency before launch.
