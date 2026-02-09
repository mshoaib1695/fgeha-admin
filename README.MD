# FGEHA Admin

Admin panel for FGEHA-RSP, built with [Refine](https://refine.dev), React, Ant Design, and Vite.

## Prerequisites

- Node.js 18+
- npm (or yarn/pnpm)

## Setup

1. **Clone and install**

   ```bash
   npm install
   ```

2. **Environment**

   Copy the example env file and set your API URL:

   ```bash
   cp .env.example .env
   ```

   Edit `.env` and set `VITE_API_URL` to your backend API base URL (e.g. `http://localhost:8080`). Do not commit `.env`; it is gitignored.

3. **Run development server**

   ```bash
   npm run dev
   ```

   The app will be available at the URL shown in the terminal (typically `http://localhost:5173`).

## Scripts

| Command        | Description                    |
|----------------|--------------------------------|
| `npm run dev`  | Start Vite dev server          |
| `npm run build`| Type-check and production build|
| `npm run preview` | Preview production build    |

## Running in production

**Important:** `VITE_API_URL` is embedded at **build time**. Set it in `.env` (or as an env var) before running `npm run build`, and use your production API URL.

### 1. Build

```bash
# Set production API URL (in .env or export)
# VITE_API_URL=https://api.yourdomain.com

npm run build
```

Output is in the **`dist/`** folder (static files).

### 2. Serve the build

**Option A – Local preview (test production build)**

```bash
npm run preview
```

Serves `dist/` at the URL shown (e.g. `http://localhost:4173`). Good for checking the build before deploy.

**Option B – Static server (Node)**

```bash
npx serve dist
```

Uses [serve](https://www.npmjs.com/package/serve). For SPA routing, use: `npx serve dist -s` (single-page fallback).

**Option C – Docker**

From the project root:

```bash
docker build -t fgeha-admin .
docker run -p 3000:3000 fgeha-admin
```

The image builds the app and serves it with `serve` on port 3000.

**Option D – Deploy `dist/` anywhere**

Upload the contents of **`dist/`** to any static host (e.g. Netlify, Vercel, S3 + CloudFront, or your own nginx/Apache). Configure the server for SPA routing (serve `index.html` for all routes).

## Project structure

- **`src/pages/`** – Dashboard, users, requests, request types, daily bulletin, login, etc.
- **`src/providers/`** – Auth, data (REST), and constants (e.g. `API_URL` from `VITE_API_URL`).
- **`src/components/`** – Shared UI (e.g. header).

## Tech stack

- [Refine](https://refine.dev) – Admin framework
- [React](https://react.dev) + [React Router](https://reactrouter.com)
- [Ant Design](https://ant.design) – UI components
- [Vite](https://vitejs.dev) – Build tool

## License

MIT
