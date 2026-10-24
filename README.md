# AutoBest Motors

A cinematic, scroll-driven car dealership frontend built with **HTML5, CSS3, Tailwind CSS, React, Vite, React Router, an auth context, and an isolated API client**. The supplied AutoBest film opens the experience with only the dealership name in the video visible. Pointer-reactive vehicle cards reveal an accessible same-page detail dialog.

**Current scope: frontend only.** The default preview uses sample inventory. No backend, real account system, payment processor, or database has been implemented. The planned backend remains **Python + FastAPI + PostgreSQL + SQLAlchemy + pytest**.

## Run locally

Use Node.js 22.12 or later and npm.

```sh
npm ci
npm run dev
```

Open the local URL printed by Vite. Choose **Sign in → Explore as customer** or **Explore as admin** to exercise the complete frontend. Sample inventory mutations persist in localStorage; the active session lasts for the browser tab. Demo registration tracks fictional email addresses for duplicate-email feedback. Demo sign-in accepts fictional credentials and is an interaction simulator, not authentication. Passwords are never persisted by the demo.

Copy `.env.example` to `.env.local` to change configuration. Restart Vite after changing environment variables.

```sh
npm test
npm run test:coverage
npm run test:e2e
npm run build
npm run preview
```

Browser tests use installed Microsoft Edge. On another operating system, change `channel` in `playwright.config.js` to an installed browser or remove it and run `npx playwright install chromium`. Production hosting must rewrite SPA routes to `index.html` and serve `/media` assets normally.

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

## Backend connection (next phase)

There is no backend to start yet. Build the planned FastAPI service with PostgreSQL persistence, JWT/password hashing, server-side authorization, an atomic purchase transaction, and server validation. The proposed layers are routers → services → repositories → models, with auth isolated. Seed admins server-side; registration must never accept a role.

Then configure:

```dotenv
VITE_API_MODE=live
VITE_API_BASE_URL=http://localhost:8000/api
```

The frontend switches from `src/lib/demo.js` to `src/lib/api.js`. Configure backend CORS for the exact frontend origin. Follow [the API contract](docs/API-CONTRACT.md) for request/response shapes. Live backend compatibility still requires integration testing after that service exists. Client route guards and decoded JWT claims are presentation aids; only the server can authorize operations.

## Structure

```text
src/components/  Hero, inventory, vehicle cards, account forms, admin, dialogs
src/lib/         HTTP adapter, demo adapter, auth context, validation, seed data
src/test/        Test environment setup
e2e/             Repeatable browser acceptance journeys
public/media/    Supplied video and locally served sample photographs
docs/            API contract, test report, and screenshots
```

## Screenshots

![Desktop showroom](docs/home-desktop.png)
![The dealership video and its name on a phone](docs/hero-mobile.png)
![Inventory details](docs/vehicle-details.png)
![Administrator inventory](docs/admin-desktop.png)
![Mobile showroom](docs/showroom-mobile.png)

## Test report

See [TEST-REPORT.md](docs/TEST-REPORT.md) for verified results, coverage scope and limitations. Unit/component tests target validation, API contracts, stock handling and role visibility. Browser tests exercise full customer/admin journeys and the mobile layout. Test-first commits record failures before the corresponding initial implementations.

## My AI Usage

**Tools used:** OpenAI Codex (ChatGPT), with terminal, browser automation and official documentation lookup tools.

**How AI was used:** Codex read the supplied brief and planning text, scaffolded the React/Vite/Tailwind application, wrote the initial failing tests, implemented frontend components and the API/demo adapters, reviewed screenshots, exercised customer/admin flows in Edge, and drafted setup and integration documentation. The dealership opening video was supplied by the project owner. Photography is sourced separately below. No implementation was copied from another application repository.

**Workflow reflection:** AI accelerated translating the brief into testable UI flows and caught photo/model mismatches during visual review. Automated checks provide useful evidence but do not establish that the future backend is secure or compatible. The owner should review the code, confirm the final backend contract, replace illustrative inventory with verified listings, and be able to explain the authorization and atomic-stock decisions. This reflection describes the assisted process; it does not claim unperformed human review.

The owner is the author and committer of this repository's commits. AI assistance is documented here; no individual outside the project is credited as a co-author. GitHub can associate a co-author email with an unrelated account, so contributor credit should be checked before adding a trailer. [PROMPTS.md](PROMPTS.md) preserves the raw user request and supplied plan rather than an AI-written summary.

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
