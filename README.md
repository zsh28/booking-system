# Slotbook Appointment Booking

Full-stack appointment booking platform with a slot-based backend and a TanStack Start frontend.

## Stack

- Backend: Express + TypeScript + Prisma + PostgreSQL + JWT + Zod
- Frontend: TanStack Start + Tailwind + React Toastify
- Monorepo: Turborepo + npm workspaces

## Project Structure

- `apps/api` — backend API (Express + Prisma)
- `apps/web` — frontend (TanStack Start)

## Quick Start (Local)

1) Install dependencies

```
npm install
```

2) Configure backend env

Create `apps/api/.env`:

```
DATABASE_URL="postgresql://user:pass@localhost:5432/appointment_db?schema=public"
JWT_SECRET="your-secret"
```

3) Prisma generate + migrate

```
npm run prisma:generate --workspace @appointment-booking/api
npm run prisma:migrate --workspace @appointment-booking/api
```

4) Start apps

```
npm run dev:api
npm run dev:web
```

- API: `http://localhost:3000`
- Web: `http://localhost:3001`
- Swagger: `http://localhost:3000/docs`
- OpenAPI JSON: `http://localhost:3000/openapi.json`

## Root Scripts

```
npm run dev        # runs both via turbo
npm run dev:api    # backend only
npm run dev:web    # frontend only
npm run build      # builds all
npm run typecheck  # typecheck all
```

## API Highlights

- Auth: `/auth/register`, `/auth/login`
- Services: `/services` + `/services/:id/slots`
- Availability (provider):
  - `GET /services/:id/availability`
  - `POST /services/:id/availability`
  - `PUT /services/:id/availability`
- Appointments:
  - `POST /appointments`
  - `GET /appointments/me`
  - `PATCH /appointments/:appointmentId/cancel`
- Provider schedule: `GET /providers/me/schedule?date=YYYY-MM-DD`
- Provider services: `GET /providers/me/services`

## Frontend Flow

- `/services` → select a service
- `/services/:id/date` → choose a date (Calendly-style)
- `/services/:id/slots` → select a slot and book
- `/appointments` → manage appointments
- `/provider` → provider dashboard (services, availability, schedule)

## Docker (Production)

The root `Dockerfile` builds both apps and runs them with PM2. The API runs on `API_PORT` (default 3000). The web server uses `PORT` (Render sets this).

```
docker build -t slotbook .
docker run -e DATABASE_URL=... -e JWT_SECRET=... -e PORT=3001 -p 3000:3000 -p 3001:3001 slotbook
```