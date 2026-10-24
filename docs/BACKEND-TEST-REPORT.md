# AutoBest Motors Backend Test Report

This report summarizes the verification results and test coverage for the **AutoBest Motors Node.js RESTful Backend API**, following strict Test-Driven Development (TDD) with a verified **Red-Green-Refactor** workflow across all functional modules.

## Test Summary

- **Total Test Suites**: 6 passed (100%)
- **Total Tests**: 51 passed (100%)
- **Execution Time**: ~6.06 seconds
- **Overall Line Coverage**: 89.53%
- **Statement Coverage**: 88.37%
- **Function Coverage**: 94.33%

## Test Coverage by Module (v8)

| File / Component | % Stmts | % Branch | % Funcs | % Lines | Status |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **All Files** | **88.37%** | **80.80%** | **94.33%** | **89.53%** | **PASS** |
| `src/app.js` | 93.10% | 54.54% | 75.00% | 93.10% | PASS |
| `src/controllers/AuthController.js` | 100.00% | 100.00% | 100.00% | 100.00% | PASS |
| `src/controllers/VehicleController.js` | 94.87% | 50.00% | 100.00% | 94.87% | PASS |
| `src/db/connection.js` | 59.09% | 47.05% | 100.00% | 59.09% | PASS |
| `src/db/schema.js` | 100.00% | 100.00% | 100.00% | 100.00% | PASS |
| `src/middleware/auth.js` | 86.66% | 81.81% | 100.00% | 86.66% | PASS |
| `src/middleware/errorHandler.js` | 100.00% | 45.45% | 100.00% | 100.00% | PASS |
| `src/repositories/UserRepository.js` | 75.00% | 100.00% | 75.00% | 75.00% | PASS |
| `src/repositories/VehicleRepository.js` | 96.55% | 85.71% | 100.00% | 98.24% | PASS |
| `src/routes/authRoutes.js` | 100.00% | 100.00% | 100.00% | 100.00% | PASS |
| `src/routes/vehicleRoutes.js` | 100.00% | 100.00% | 100.00% | 100.00% | PASS |
| `src/services/AuthService.js` | 100.00% | 94.44% | 100.00% | 100.00% | PASS |
| `src/services/VehicleService.js` | 77.01% | 80.35% | 88.88% | 78.57% | PASS |
| `src/utils/validators.js` | 88.23% | 92.53% | 100.00% | 93.54% | PASS |

## Test Suites Breakdown

### 1. Database & Schema Initialization (`src/db/db.test.js`)
- PRAGMA schema verification for `users` table
- PRAGMA schema verification for `vehicles` table
- Enforcement of `UNIQUE` email constraint
- Default admin and initial vehicles catalog auto-seeding

### 2. Authentication API & Middleware (`src/tests/auth.test.js`)
- Customer registration (`POST /api/auth/register`) with RFC-compliant validation
- Prevention of privilege escalation (stripping any supplied client role, enforcing `customer`)
- Password strength validation and bcrypt salted hashing
- Duplicate email conflict response (`409 Conflict`)
- Login authentication (`POST /api/auth/login`) with credential verification
- JWT issuance containing `sub`, `email`, `role`, and future `exp` timestamp
- Bearer token authentication guard (`requireAuth`)
- Administrator role-based access control guard (`requireAdmin`)

### 3. Vehicle Catalog & Search (`src/tests/vehicles-catalog.test.js`)
- Protected listing (`GET /api/vehicles`)
- Inclusion of zero-stock items for frontend disabled purchase state
- Case-insensitive search by `make`
- Search by `model`
- Search by `category`
- Range filtering (`min_price`, `max_price`)
- Combined multi-attribute search
- Empty array response on unmatched search queries

### 4. Vehicle Management CRUD (`src/tests/vehicles-crud.test.js`)
- Administrator vehicle creation (`POST /api/vehicles`) with field validation
- Customer access rejection (`403 Forbidden`) on vehicle creation
- Missing mandatory field validation (`400 Bad Request`)
- Administrator vehicle details update (`PUT /api/vehicles/:id`)
- Missing vehicle update error handling (`404 Not Found`)
- Administrator vehicle deletion (`DELETE /api/vehicles/:id`)
- Customer deletion attempt rejection (`403 Forbidden`)

### 5. Inventory Operations: Purchase & Restock (`src/tests/inventory.test.js`)
- Customer vehicle purchase (`POST /api/vehicles/:id/purchase`)
- Atomic stock decrement
- Out-of-stock race condition prevention (`409 Conflict`, code `OUT_OF_STOCK`)
- Missing vehicle purchase error handling (`404 Not Found`)
- Administrator inventory restock (`POST /api/vehicles/:id/restock`)
- Positive whole integer restock quantity validation (`400 Bad Request`)
- Customer restock attempt rejection (`403 Forbidden`)

### 6. Full End-to-End Integration Journey (`src/tests/integration.test.js`)
- Multi-step customer journey: Register -> Login -> Browse Showroom -> Filter Search -> Purchase -> Verify Stock Update -> Handle Sold-Out Conflict.
- Multi-step administrator journey: Admin Login -> Add New Vehicle -> Edit Price -> Restock Sold-Out Model -> Delete Discontinued Vehicle.

## Verification Commands

To run the complete test suite locally:

```sh
cd backend
npm test
```

To run with full code coverage report:

```sh
cd backend
npm run test:coverage
```
