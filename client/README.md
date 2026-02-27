# MyResCal — React Client

This Vite + React 19 application is the front-end for **MyResCal**, a reservation cockpit for property owners. It consumes the Express + Supabase API that lives in `../server`, provides bilingual UI (English/Polish), and ships a calendar-first workflow for creating, editing, and deleting bookings.

## Getting Started

```bash
cd client
npm install
npm run dev        # starts Vite on http://localhost:5173
```

During development the client proxies `"/api"` to the Node server (default `http://localhost:3000`). Start the backend first so API calls succeed.

## Environment Variables

| Variable | Default | Description |
| --- | --- | --- |
| `VITE_API_URL` | `/api` | Preferred API origin variable for dev/prod deployments. |
| `VITE_API_BASE_URL` | `/api` | Legacy fallback (kept for backwards compatibility). |

Create a `.env` file inside `client/` if you need to override the default proxy path:

```
VITE_API_URL=https://your-production-api.example.com
```

### Dev vs Prod

- Dev (with Vite proxy): usually no frontend env is required, default `/api` works with `vite.config.js` proxy.
- Prod: set `VITE_API_URL` to the public backend URL (for example `https://api.example.com`).

## Available Scripts

- `npm run dev` – Vite dev server with hot reload.
- `npm run build` – Production build (outputs to `dist/`).
- `npm run preview` – Serves the build locally for smoke-testing.
- `npm run lint` – Runs ESLint with the shared React config.

## Folder Overview

```
src/
  api/             # REST helpers (auth, reservations, properties, rooms)
  assets/          # Static assets (noise texture, icons)
  components/      # UI building blocks, dialogs, dashboard, settings, auth
  context/         # Auth + locale providers with localStorage persistence
  hooks/           # Shared React hooks (e.g., reservation form data loader)
  i18n/            # Translation dictionaries (en/pl)
  router/          # React Router configuration + protected route guard
  theme/           # Material UI theme with brand styling
  utils/           # Pure helpers (reservation status metadata)
```

## Architecture Notes

- **State** – Authentication and locale state live in dedicated React contexts. Calendar, reservation forms, and dashboards rely on lightweight component state plus reusable hooks (see `hooks/useReservationFormData.js`) to keep API calls consistent.
- **Design System** – Material UI handles layout and components. The custom theme applies the “parchment” look & feel across typography, colors, and elevations.
- **Localization** – `LocaleProvider` exposes `t(key, options)` and `dateLocale`; UI strings sit in `src/i18n/translations.js`. Switching languages updates `localStorage` so the preference sticks between sessions.
- **Networking** – `api/client.js` wraps `fetch`, injects the Supabase access token, and broadcasts an `auth:unauthorized` event to force logout when the backend responds with 401.

For server-specific configuration (Supabase tables, env variables, etc.) see the root `README.md` and `server/supabase/README.md`.
