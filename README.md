# DevTrack

The frontend and backend are kept in separate directories:

```text
frontend/  React, Vite, Tailwind CSS application
backend/   Django REST Framework API
```

## Frontend

```powershell
cd frontend
npm ci
npm run dev
```

The Vite development server proxies `/api` requests to `http://127.0.0.1:8000`. Registration, login, profile updates, and password recovery use Django sessions and the backend database. Course progress and the cart remain in browser storage; checkout orders are saved by the Django API.

See [frontend/README.md](./frontend/README.md) for UI and application details.

### Deploying the frontend to Render

The root `render.yaml` Blueprint defines a static site named `dev-track-web`. Apply the Blueprint changes in Render to create or update it; Render builds the Vite app from `frontend/` and publishes `dist/`. After the deploy completes, use the `dev-track-web` URL for the updated site.

## Backend

In a second terminal, from the repository root:

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

Run backend checks and tests from `backend/`:

```powershell
py manage.py check
py manage.py test users courses
```

See [backend/README.md](./backend/README.md) for API routes, security settings, and production configuration.
