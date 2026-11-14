# DevTrack Django API

This directory contains the independent Django REST Framework backend. Install its dependencies from the repository root with `py -m pip install -r backend\requirements.txt`, then run management commands from this directory.

## Setup on Windows

From the repository root:

```powershell
py -m venv .venv
.\.venv\Scripts\Activate.ps1
py -m pip install -r backend\requirements.txt
cd backend
py manage.py makemigrations users courses payments
py manage.py migrate
py manage.py createsuperuser
py manage.py runserver
```

Create the initial migrations before creating users. `AUTH_USER_MODEL` uses a custom email-based user, and switching user models after initial migrations requires a complex data migration. In debug mode, password-reset email and reset links are printed to the backend console.

## Apps

- `users/` — custom user, profile, registration, session login/logout, and password reset.
- `courses/` — category, course, module, lesson, enrollment, and lesson-progress models and APIs.
- `payments/` — payment records and course-order notifications; no payment provider is connected.
- `dashboard/` — authenticated dashboard response varies by user role.

## API

- `GET /api/v1/courses/` — paginated published catalog; supports `?search=` and `?category=<slug>`.
- `GET /api/v1/courses/<slug>/` — course and module/lesson outline. Non-preview content is limited to enrolled students and the owning instructor.
- `POST /api/v1/orders/` — validate and save a course order. Requires a JSON body with `idempotency_key`, `customer_name`, `customer_email`, and `items` (`course_id`, `title`, `quantity`, `unit_price`). Limited to 10 attempts per IP per hour.
- `GET /api/v1/dashboard/` — student enrollments/progress, instructor course counts, or admin counts; requires login.
- `GET /api/v1/auth/csrf/` — initialize the CSRF cookie/token.
- `POST /api/v1/auth/register/`, `/login/`, `/logout/`, `/password-reset/` — JSON session-auth endpoints. POST requests require the `csrftoken` cookie in `X-CSRFToken` and browser credentials.
- Password reset confirmation uses the emailed `/api/v1/auth/password-reset/confirm/<uid>/<token>/` link.

During local development, start the frontend from `frontend/` with `npm run dev`; Vite proxies `/api` to Django on port 8000.

## Production

Set `DJANGO_SECRET_KEY`, `DJANGO_DEBUG=0`, and `DJANGO_ALLOWED_HOSTS`. Set `DATABASE_URL` to PostgreSQL, configure SMTP using the `DJANGO_EMAIL_*` variables, terminate TLS, and proxy `/api/` to Django on the same site. Then run `py manage.py collectstatic`. Production HTTPS and secure-cookie flags are enabled when debug is off. Add rate limiting for login, registration, and password reset at the reverse proxy.

### Deploying to Render

The repository includes a Render Blueprint in `render.yaml`. In Render, create a **Blueprint** from this repository and apply it. The Blueprint creates the `dev-track-web` static frontend, the `dev-track-api` web service, and a PostgreSQL database, then connects the database to the API through `DATABASE_URL`.

The frontend is built from `frontend/` and published as a static site. Orders are stored in the backend database and sent to the configured WhatsApp number by the server.

WhatsApp notifications use the official Meta WhatsApp Cloud API. Set `WHATSAPP_ACCESS_TOKEN` and `WHATSAPP_PHONE_NUMBER_ID` in the backend environment. The recipient is configured as `WHATSAPP_RECIPIENT_PHONE` in international format (`+996501306654`). Create and get approval for a WhatsApp message template, then set its exact name and language using `WHATSAPP_TEMPLATE_NAME` and `WHATSAPP_TEMPLATE_LANGUAGE`. The configured template must have five body placeholders, in order: order number, customer name, customer email, course list, and total. For example: `New course order #{{1}}. Customer: {{2}} ({{3}}). Courses: {{4}}. Total: {{5}}.` Set `WHATSAPP_GRAPH_API_VERSION` to a supported Meta Graph API version. Apply the same settings locally in `backend/.env` or in the Render `dev-track-api` service Environment. Keep the access token private and never put it in source control or frontend variables. Meta requires customer opt-in and an approved template for business-initiated notifications.

If Render assigns a different service hostname or you use a custom domain, update `VITE_API_BASE_URL` on `dev-track-web` and `CORS_ALLOWED_ORIGINS` on `dev-track-api` to the corresponding API and frontend origins, then redeploy.

The checkout frontend defaults to the `dev-track-yptw.onrender.com` API in production when `VITE_API_BASE_URL` is unset. Netlify-hosted sites on `*.netlify.app` are allowed by the backend CORS configuration. For a custom frontend domain, add its exact origin to `CORS_ALLOWED_ORIGINS` on the backend service.

If entering the settings manually, use these values with `backend/` as the service root directory:

- **Build Command:** `pip install -r requirements.txt && python manage.py collectstatic --no-input`
- **Start Command:** `python manage.py migrate --run-syncdb --noinput && gunicorn config.wsgi:application --bind 0.0.0.0:$PORT`
- **Environment:** `DJANGO_DEBUG=0`, `DJANGO_SECRET_KEY` (generate a secret), `DATABASE_URL` (the PostgreSQL internal connection string), `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, and an approved `WHATSAPP_TEMPLATE_NAME`.

The start command applies Django migrations and creates tables for apps that do not yet have migration files. Generate and commit initial migrations before making future model changes. WhiteNoise serves the collected Django admin static files. Render's free PostgreSQL database is temporary and expires after its free period; upgrade it before storing data you need to keep. The service uses Render's generated hostname and HTTPS proxy headers automatically.

Paid enrollment creation is deliberately not exposed. Do not grant paid access on a client request; add a payment provider and create enrollments only after verifying signed server-side payment webhooks.
