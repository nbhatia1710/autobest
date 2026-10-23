# Raw user request

follow the instructions and techstack stricly&#x20;
i have design for website in mind
overview the design is like as the website will load a video animation will run and will it has dealership name
it will be scroll website
as user scrolls how they will see stck cars in form of cards&#x20;
cards will have car photo name and manufacture year
if user hovers over card it will have a 3d tilting affect from all sides and will display click to know more
as user clicks the card the card will expand on same page and window showing details&#x20;

make sure frontend has all features which are req by backend all means all&#x20;

after making frontend we will make and connect backend&#x20;
currently focus on frpntend

i ahve created repo
make sure to follow all rules while commiting to repo
i  am provoding you with video and repo link start woorking&#x20;

[https://github.com/nbhatia1710/autobest](https://github.com/nbhatia1710/autobest)

# Raw supplied planning text

Here’s the plan, with the backend first since it’s most of the work.
I’d go with Python + FastAPI + PostgreSQL + SQLAlchemy + pytest. You already know Python and Postgres, you get validation (Pydantic) and auto-generated OpenAPI docs for free, and pytest makes red-green-refactor quick. Node/TypeScript with Express, Prisma, Jest and Supertest is an equally valid alternative. Run Postgres through docker-compose, with a separate test database.
```
routers (HTTP only) → services (business rules) → repositories (DB access) → models
```
- Routers hold no logic, only parsing and status codes.
- Services depend on a repository interface, so you can unit test them with a fake repo (Dependency Inversion).
- Auth (hashing, JWT) lives in its own module.
- Use one global error handler with a consistent shape: { "error": { "code", "message", "details" } }.
Add indexes on make, model, category and price.
1. Route order: register /search before /:id, or “search” gets parsed as an ID.
2. Overselling race condition: make purchase atomic with a single statement, e.g. UPDATE vehicles SET quantity = quantity - :n WHERE id = :id AND quantity >= :n. If zero rows are affected, return 409. This is a great interview talking point, and you can write a concurrency test for it.
3. “Available vehicles”: the frontend needs a disabled Purchase button for quantity 0, so GET /vehicles should return all vehicles including out-of-stock ones. Document that decision in the README.
4. How a user becomes admin: don’t let register accept a role field. Use a seed script or env vars (ADMIN_EMAIL, ADMIN_PASSWORD) and document it.
5. Decide on add/update permissions: the spec marks only delete and restock as admin-only, but the frontend section says add/update/delete are admin UI. I’d make POST and PUT admin-only too, since it’s more coherent, and note the choice in the README. Or follow the spec literally. Just pick one deliberately.
6. JWT: include sub, role and exp in the payload. Read the secret from env, and return 401 for missing, invalid or expired tokens and 403 for wrong role.
- Unit tests (fake repo): password hashing, token create/verify/expiry, purchase and restock rules, search filter building, validation.
- Integration tests (real test Postgres, truncate between tests): every endpoint with happy path, validation errors, 401, 403, 404 and 409. Include “regular user cannot delete”, “purchase at quantity 0 fails”, and two simultaneous purchases of the last unit.
- Coverage: pytest-cov, aim for 90%+, and export an HTML or terminal report for the README’s test report section.
Each feature gets 3 commits:
1. test: add failing tests for X (red)
2. feat: implement X (green)
3. refactor: ... (when there’s something to clean up)
On any commit where AI helped, add the Co-authored-by: trailer exactly as the spec shows.
1. Setup: repo, docker-compose, skeleton, .env.example, health check, and start PROMPTS.md on day one (save raw chat logs or share links as you go, unedited).
2. Auth: hashing and JWT utils → register → login → auth dependency → admin guard.
3. Vehicles CRUD (including delete).
4. Search.
5. Inventory: purchase, then restock.
6. Hardening: CORS, pagination, rate limit on login (optional), seed script with sample vehicles, check the OpenAPI docs.
7. Docs: README, test report, screenshots.
8. Optional: deploy (e.g. Render or Railway for the API, Neon for Postgres, Vercel for the frontend).
Stack: Vite + React + Tailwind, React Router, an auth context, and a small API client module. Animations are yours.
Auth (/auth/register, /auth/login)
- Register form: email, password, confirm password. Show field errors for 400 and a “email already exists” message for 409.
- Login form that stores the JWT and the user’s role.
- Logout, plus an automatic redirect to login whenever any API call returns 401.
- Attach Authorization: Bearer <token> to every request.
Route protection
- Every vehicle endpoint is protected, so the dashboard, search and admin pages all require login.
Dashboard (GET /vehicles)
- Display each vehicle’s make, model, category, price and quantity.
- Stock indicator: in stock, low stock, or out of stock.
- Loading, empty and error states.
Search and filter (GET /vehicles/search)
- Inputs for make, model, category, and min/max price, with debounced calls.
- A clear-filters button, a “no results” state, and client-side validation that min ≤ max.
Purchase (POST /vehicles/:id/purchase)
- A Purchase button per vehicle, disabled when quantity is 0.
- Per-button loading state, and update the quantity in the UI from the response.
- Success and error feedback. Handle 409 specifically, e.g. someone bought the last unit while you were looking.
Admin-only UI (add, update, delete, restock)
- Add vehicle form (POST) with validation matching the backend.
- Edit form prefilled from the vehicle (PUT).
- Delete with a confirmation step (DELETE).
- Restock control with a quantity input (POST /restock). The spec’s frontend list doesn’t mention it, but the backend has the endpoint, so the admin UI should too.
- Hide these controls for non-admins, but remember the backend is the real enforcement.
Cross-cutting
- Responsive layout, labelled inputs, keyboard-accessible controls and visible focus states.
- A few Vitest and React Testing Library tests are worth adding (e.g. the disabled purchase button, the admin controls being hidden for regular users).
- README: project explanation, backend and frontend setup, screenshots, test report, and the My AI Usage section (tools, how you used them, your reflection).
- PROMPTS.md with raw logs or links only, no summaries. A share link to this chat can go in there.
- Public repo link, plus the optional deployed link for bonus points.