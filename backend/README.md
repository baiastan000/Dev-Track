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

Create the initial migrations before creating users. `AUTH_USER_MODEL` uses a custom email-based user, and switching user models after initial migrations requires a complex data migration. In debug mode, password-reset verification codes are printed to the backend console.

## Apps

- `users/` — custom user, profile, registration, session login/logout, and password reset.
- `courses/` — category, course, module, lesson, enrollment, and lesson-progress models and APIs.
- `payments/` — payment records and course orders. Orders are saved in the backend database and listed in Django admin. No payment provider or external notification service is connected.
- `dashboard/` — authenticated dashboard response varies by user role.

## API

- `GET /api/v1/courses/` — paginated published catalog; supports `?search=` and `?category=<slug>`.
- `GET /api/v1/courses/<slug>/` — course and module/lesson outline. Non-preview content is limited to enrolled students and the owning instructor.
- `POST /api/v1/orders/` — validate and save a course order. Requires a JSON body with `idempotency_key`, `customer_name`, `customer_email`, and `items` (`course_id`, `title`, `quantity`, `unit_price`). Limited to 10 attempts per IP per hour.
- `GET /api/v1/dashboard/` — student enrollments/progress, instructor course counts, or admin counts; requires login.
- `GET /api/v1/auth/csrf/` — initialize the CSRF cookie/token.
- `GET /api/v1/auth/session/` — current session user, or `null` when signed out.
- `POST /api/v1/auth/register/`, `/login/`, `/logout/`, `/profile/`, `/change-password/` — JSON session-auth endpoints. POST requests require the `csrftoken` cookie in `X-CSRFToken` and browser credentials.
- `POST /api/v1/auth/password-reset/` sends a six-digit email code; `/password-reset/verify/` validates it and returns a short-lived reset token; `/password-reset/confirm/` accepts that token and the new password. Codes expire after 10 minutes, are limited to five verification attempts, and requests are limited to three per hour with a one-minute resend cooldown.

During local development, start the frontend from `frontend/` with `npm run dev`; Vite proxies `/api` to Django on port 8000.

## Production

Set `DJANGO_SECRET_KEY`, `DJANGO_DEBUG=0`, and `DJANGO_ALLOWED_HOSTS`. Set `DATABASE_URL` to PostgreSQL, configure working SMTP credentials using the `DJANGO_EMAIL_*` variables, set the frontend origin in `CORS_ALLOWED_ORIGINS`, terminate TLS, and proxy `/api/` to Django on the same site. `DJANGO_SESSION_COOKIE_SAMESITE` and `DJANGO_CSRF_COOKIE_SAMESITE` default to `None` in production to support a separate frontend domain; secure cookies are enabled when debug is off. Then run `py manage.py collectstatic`. Add rate limiting for login, registration, and password reset at the reverse proxy.

### Deploying to Render

The repository includes a Render Blueprint in `render.yaml`. In Render, create a **Blueprint** from this repository and apply it. The Blueprint creates the `dev-track-web` static frontend, the `dev-track-api` web service, and a PostgreSQL database, then connects the database to the API through `DATABASE_URL`.

The frontend is built from `frontend/` and published as a static site. Orders are stored in the backend database; checkout does not initiate a payment or send an external notification.

New checkout orders appear under **Course orders** in Django admin. In the frontend demo panel, orders are also shown only in the same browser that submitted them. Checkout records an order request; it does not confirm payment or grant course access.

If Render assigns a different service hostname or you use a custom domain, update `VITE_API_BASE_URL` on `dev-track-web` and `CORS_ALLOWED_ORIGINS` on `dev-track-api` to the corresponding API and frontend origins, then redeploy.

The checkout frontend defaults to the `dev-track-yptw.onrender.com` API in production when `VITE_API_BASE_URL` is unset. Netlify-hosted sites on `*.netlify.app` are allowed by the backend CORS configuration. For a custom frontend domain, add its exact origin to `CORS_ALLOWED_ORIGINS` on the backend service.

If entering the settings manually, use these values with `backend/` as the service root directory:

- **Build Command:** `pip install -r requirements.txt && python manage.py collectstatic --no-input`
- **Start Command:** `python manage.py migrate --run-syncdb --noinput && gunicorn config.wsgi:application --bind 0.0.0.0:$PORT`
- **Environment:** `DJANGO_DEBUG=0`, `DJANGO_SECRET_KEY` (generate a secret), and `DATABASE_URL` (the PostgreSQL internal connection string).

The start command applies Django migrations and creates tables for apps that do not yet have migration files. Generate and commit initial migrations before making future model changes. WhiteNoise serves the collected Django admin static files. Render's free PostgreSQL database is temporary and expires after its free period; upgrade it before storing data you need to keep. The service uses Render's generated hostname and HTTPS proxy headers automatically.

Paid enrollment creation is deliberately not exposed. Do not grant paid access on a client request; add a payment provider and create enrollments only after verifying signed server-side payment webhooks.
