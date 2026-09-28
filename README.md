# Event Management App

A full-stack Event Management application built with React (Vite) frontend and Django REST Framework backend using PostgreSQL.

## Structure
- `backend/` — Django API with users, events, venues, attendees, registrations, dashboard stats.
- `frontend/` — React app with dashboard, events, calendar, analytics, CRUD flows.

## Development
### Backend
```bash
cd backend
cp .env.example .env
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Notes
- PostgreSQL credentials are provided via environment variables.
- Frontend reads the API URL from `VITE_API_BASE_URL`.
- CORS is enabled for local development origins.
