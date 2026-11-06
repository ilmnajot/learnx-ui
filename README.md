# LearnX UI

Mobile-first web app for LearnX, daily 5-minute English practice for IT professionals.

React 19, TypeScript, Vite, React Router, TanStack Query.

## Run locally

Start [learnx-api](../learnx-api) first, then:

```bash
npm install
npm run dev
```

Open <http://localhost:5173>. The dev server proxies `/api` to the backend on port 8080.

## Check

```bash
npm run typecheck
npm test
npm run lint
npm run build
```

## Structure

| Folder | Contents |
|---|---|
| `src/api` | HTTP client with transparent token refresh, and API types |
| `src/auth` | Session state |
| `src/components` | Shared layout and UI |
| `src/features` | One folder per screen or feature |
| `src/i18n` | All interface text; add a language by adding a dictionary with the same keys |

Decisions worth keeping:

- **Tokens stay out of reach of scripts.** The access token lives in memory and the refresh token is an HttpOnly cookie.
- **Refreshes never overlap.** Refresh tokens rotate and reuse revokes sessions, so refreshing is serialised across tabs with the Web Locks API.
- **Speech uses the browser's recognition**, with typing as the fallback. It works in Chrome, Edge and Safari but not Firefox, and browsers may send audio to their vendor's servers.

## Production

`npm run build` outputs static files to `dist/`. Serve them with `/api` routed to the backend on the same origin, so the `SameSite=Strict` refresh cookie is sent. Routes need to fall back to `index.html`.
