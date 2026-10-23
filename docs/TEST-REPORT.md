# Frontend verification report

Verified on **24 October 2026 (Asia/Calcutta)** using Windows, Node.js 22.23.2, Vite 7.3.7, Vitest 5.0.5, and Playwright with installed Microsoft Edge.

| Check | Result |
| --- | --- |
| `npm run test:coverage` | **29 passed**, 8 test files |
| `npm run test:e2e` | **3 passed**, customer/admin/mobile journeys |
| `npm run build` | **Passed**, production bundle generated |
| `npm run format:check` | **Passed** |
| `npm audit --audit-level=moderate` | **0 vulnerabilities reported** |
| `git diff --check` | **Passed** |

## Unit and component coverage

V8 coverage includes `src/lib/**` and `src/components/**`; test files are excluded by the runner. Browser tests are separate and are **not** included in these percentages. App routing and the entry point are outside this configured coverage scope.

| Metric | Covered |
| --- | --- |
| Statements | **85.02%** (369 / 434) |
| Branches | **83.01%** (352 / 424) |
| Functions | **78.48%** (124 / 158) |
| Lines | **84.87%** (331 / 390) |

Library statement coverage: **93.33%**. Component statement coverage: **79.92%**. The remaining gaps are principally media/pointer events and some error/cancel branches. The frontend has not reached 90% overall. Regenerate the detailed HTML report at `coverage/index.html` with `npm run test:coverage`; generated coverage files are ignored by Git.

## Covered behaviors

- Required vehicle fields, integer/nonnegative stock, price range ordering, email/password/confirmation validation.
- Bearer headers, encoded IDs, every API write route, request bodies, 204 responses, network failures, cancellation, 401 expiration, 409 details, and malformed error JSON.
- Demo authorization, no-stock conflicts, purchases, restock, CRUD, search bounds, duplicate registration and no persisted demo passwords.
- Live-mode future/expired JWT handling and clearing session storage after a protected 401.
- Registration → sign-in → sign-out, protected routes, hidden customer admin controls, and admin management via forms.
- Loading/retry, no results, invalid price range, purchase conflict refresh, detail dialog and stock update.

## Browser acceptance tests

1. **Customer:** video readiness, six-car inventory, disabled sold-out purchase, model search, same-page details, confirmed last-unit purchase, updated disabled state, Escape dismissal, inverted price range, clear filters and denied admin access. No page JavaScript errors were recorded in this journey.
2. **Admin:** add a listing, edit its price, restock, verify the resulting quantity, cancel deletion, confirm deletion and verify the listing count.
3. **Mobile:** protected-route redirect, invalid registration feedback, successful registration, demo sign-in, reduced-motion video pause, no horizontal page overflow at 390 × 844, detail dialog and Escape dismissal.

Desktop screenshots were captured at 1440 × 1000 and mobile screenshots at 390 × 844. Full-page screenshots load the lazy photographs before capture. Visual inspection confirmed the video title, readable desktop/mobile layouts, card imagery, the detail dialog and inventory management table. On narrow phones the film uses its full 16:9 frame so the supplied dealership title is not cropped. The supplied MP4 was verified as 1920 × 1080, approximately 4.01 seconds; it is stored unchanged.

## TDD and environment notes

Initial validation/card tests were committed and run before those modules existed. API/auth/stock contract tests were likewise committed failing before the adapters were implemented. An admin access test preceded the admin component. Later interaction and error tests extend that baseline. Every commit credits AI assistance.

An initial parallel-worker startup timeout was resolved by running one Vitest worker. The multi-step component journey timeout is 15 seconds, accommodating DOM instrumentation overhead on this machine. Assertions remain explicit; no failed tests are skipped. Final coverage run: 29/29 passed. Final browser run: 3/3 passed.

## Limits

These checks verify the frontend and simulated inventory, not a real backend, database, payment or concurrent purchase transaction. Live FastAPI integration, PostgreSQL tests, server-side authorization/security tests, and real inventory metadata remain for the backend phase. Safari and Firefox were not tested. Demonstration accounts, vehicle specifications and prices must not be treated as production data.
