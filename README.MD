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
