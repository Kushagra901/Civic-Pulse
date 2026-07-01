<p align="center">
  <img src="https://img.icons8.com/fluency/96/city.png" alt="CivicPulse" width="70"
  style="border-radius: 50%; border: 4px solid white; box-shadow: 0 0 10px rgba(0,0,0,0.18);" />
</p>

<h1 align="center">CivicPulse</h1>
<p align="center"><b>📍 Real-time civic issue reporting, verification & prioritization for safer communities 📍</b></p>

<p align="center">
  <img alt="Platform" src="https://img.shields.io/badge/Platform-Web-blue?style=for-the-badge">
  <img alt="Stack" src="https://img.shields.io/badge/Stack-PERN%20%2B%20Redis%2FBullMQ-purple?style=for-the-badge">
  <img alt="Status" src="https://img.shields.io/badge/Status-Active-success?style=for-the-badge">
  <img alt="License" src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge">
</p>

---

## 🌍 About

**CivicPulse** is a modern full-stack platform that helps communities **report local issues**, **verify signals**, and **prioritize what needs attention** using credibility-driven ranking.

It’s built to feel like a social feed—but optimized for **real civic impact**, not vanity metrics.

---

## 🚀 Quick Start

> **1. Start services** (Postgres + Redis)  
> **2. Start API** (Express + Prisma)  
> **3. Start Worker** (BullMQ background jobs)  
> **4. Start Frontend** (React + Tailwind)  
> **5. Report → Verify → Track**

---

## ✨ Features

- 🧾 **Incident Reporting:** Create civic issue reports with category + details
- ✅ **Confirm / Dispute:** Community verification improves credibility
- 🧠 **Credibility Scoring:** Worker + queue updates incident ranking
- 🕒 **Timeline Tracking:** Status changes are recorded as events
- 🗺️ **Accurate Location Input:**
  - **Use My Location** (GPS)
  - **Search a Place** (OpenStreetMap Nominatim)
  - **Click-to-Pin Map** (Leaflet)
- 🔎 **Filters:** Filter feed by category and status
- 💬 **Clean UX:** Toast feedback, loading skeletons, empty states
- 🔐 **Auth Ready:** JWT-based sessions (access/refresh token flow)

---

## 🏗 Architecture Overview

**Frontend**
- React (Vite) + TailwindCSS  
- Map + Location Picker (Leaflet)

**Backend**
- Node.js + Express  
- Prisma ORM + PostgreSQL  
- Redis + BullMQ for background processing

**Services**
- PostgreSQL → persistent data storage
- Redis → job queue + caching-ready

---

## 🖥 Programming Languages & Frameworks

<p>
  <img src="https://raw.githubusercontent.com/github/explore/80688e429a7d4ef2fca1e82350fe8e3517d3494d/topics/javascript/javascript.png" alt="JavaScript" width="32"/>
  <img src="https://raw.githubusercontent.com/github/explore/80688e429a7d4ef2fca1e82350fe8e3517d3494d/topics/react/react.png" alt="React" width="32"/>
  <img src="https://raw.githubusercontent.com/github/explore/80688e429a7d4ef2fca1e82350fe8e3517d3494d/topics/nodejs/nodejs.png" alt="Node.js" width="32"/>
  <img src="https://raw.githubusercontent.com/github/explore/80688e429a7d4ef2fca1e82350fe8e3517d3494d/topics/express/express.png" alt="Express" width="32"/>
  <img src="https://raw.githubusercontent.com/github/explore/80688e429a7d4ef2fca1e82350fe8e3517d3494d/topics/postgresql/postgresql.png" alt="PostgreSQL" width="32"/>
  <img src="https://raw.githubusercontent.com/github/explore/80688e429a7d4ef2fca1e82350fe8e3517d3494d/topics/docker/docker.png" alt="Docker" width="32"/>
  <img src="https://raw.githubusercontent.com/github/explore/80688e429a7d4ef2fca1e82350fe8e3517d3494d/topics/redis/redis.png" alt="Redis" width="32"/>
  <img src="https://raw.githubusercontent.com/github/explore/80688e429a7d4ef2fca1e82350fe8e3517d3494d/topics/tailwind/tailwind.png" alt="TailwindCSS" width="32"/>
</p>

---

## 🧱 Project Structure

```txt
civicpulse/
  docker-compose.yml
  server/
    prisma/
      schema.prisma
    src/
    .env.example
  client/
    src/
    index.html


## ✅ Requirements (First Time Setup)

Install these before starting:

- **Node.js** (LTS recommended)
- **Git**
- **Docker Desktop** *(recommended)*
- **pgAdmin** *(optional)* for viewing database data

---

## 🚀 Run Locally (Docker Recommended)

### 1️⃣ Start PostgreSQL + Redis

Open Terminal in project root:

```bash
cd civicpulse
docker compose up -d
2️⃣ Backend Setup (API + Prisma)

Open a new Terminal:

cd server
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run dev


Backend:

✅ http://localhost:8080

Health check:

✅ http://localhost:8080/health

3️⃣ Start Worker (BullMQ)

Open another Terminal:

cd server
npm run worker


The worker recalculates credibility and severity scores using background jobs.

4️⃣ Frontend Setup (React)

Open another Terminal:

cd client
npm install
npm run dev


Frontend:

✅ http://localhost:5173

🧪 How to Use the App

Open: http://localhost:5173

Register a user

Login

Go to Feed

Create a report (title, category, description, location)

Open an incident → Confirm / Dispute

Refresh feed → see updated scores

📊 View Database Data (Users, Incidents, Reports)
Option A: Prisma Studio (Fastest)
cd server
npx prisma studio


Open:

✅ http://localhost:5555

Option B: pgAdmin

Docker default credentials:

Host: localhost

Port: 5432

Database: civicpulse

Username: postgres

Password: postgres

To see registered users:

Schemas → public → Tables → "User"

Right-click → View/Edit Data → All Rows

Or run this in Query Tool:

SELECT id, name, email, role, "createdAt"
FROM "User"
ORDER BY "createdAt" DESC;

🔧 Environment Variables
Backend .env

⚠️ Do NOT push .env to GitHub
Use .env.example and create .env.

Example:

DATABASE_URL="postgresql://postgres:postgres@localhost:5432/civicpulse?schema=public"
REDIS_URL="redis://localhost:6379"
JWT_ACCESS_SECRET="your_secret_here"
JWT_REFRESH_SECRET="your_secret_here"

🛑 Stop Everything

Stop frontend / backend / worker:

Press CTRL + C

Stop Docker containers:

docker compose down

🐛 Troubleshooting
❌ Postgres auth failed (P1000)

Ensure .env matches docker-compose.yml:

postgres:postgres

❌ Redis ECONNREFUSED

Start Redis container:

docker compose up -d

❌ Frontend unstyled (Tailwind not applied)

Check:

client/src/index.css contains:

@tailwind base;
@tailwind components;
@tailwind utilities;


client/src/main.jsx imports:

import "./index.css";

---

## 🌐 Deployment Guide

This section explains how to deploy the CivicPulse backend to **Render** or **Railway** with managed PostgreSQL and Redis databases.

### 📊 Choosing a Platform (Render vs Railway)

| Platform | Pros | Cons | Best For |
| :--- | :--- | :--- | :--- |
| **Render** | • Free web tier available (no card needed)<br>• Free PostgreSQL tier (expires in 30 days) | • Web services sleep after 15m inactivity (30-60s cold start)<br>• No free Redis tier (starts at \$10/mo) | Long-running projects where you don't mind cold starts and can use an external free Redis (e.g., Upstash). |
| **Railway** | • \$5 one-time trial credit (expires in 30 days)<br>• Always-on (no cold starts)<br>• Native PostgreSQL + Redis in the same canvas | • Trial credit typically lasts 7-10 days for a Node + PG + Redis stack<br>• Requires card verification to continue after credit expires | Short-lived demos, grading evaluations, and fast hackathon projects. |

---

### 🚩 Path A: Render + Upstash Redis (Recommended for long-term free hosting)

#### Step 1: Push Code Structure
Ensure your repository has the client and server directories correctly structured:
```txt
CivicPulse/
├── client/
├── server/
└── render.yaml
```

#### Step 2: Set Up Managed PostgreSQL on Render
1. Go to [render.com](https://render.com) and sign up/login (using GitHub).
2. Click **New** → **PostgreSQL**.
3. Name it `civicpulse-db` and select a region closest to your users.
4. Select the **Free** tier and click **Create Database**.
5. Once provisioned, copy the **Internal Database URL** (for same-region service connections) or **External Database URL** (for connecting from your local machine).

#### Step 3: Enable PostGIS on Render PostgreSQL
Since PostGIS is not enabled by default on Render's managed database, you need to enable it:
1. Connect to the database using the Render Dashboard Shell tab or a local terminal using `psql` and the **External Database URL**:
   ```bash
   psql "postgresql://user:pass@external-host/dbname"
   ```
2. Run the following SQL commands to enable PostGIS:
   ```sql
   CREATE EXTENSION IF NOT EXISTS postgis;
   SELECT postgis_version();
   ```

#### Step 4: Set Up Upstash Redis (Free Tier)
Render's free tier does not include Redis. Use Upstash for a free managed Redis instance:
1. Go to [upstash.com](https://upstash.com) and sign up.
2. Click **Create Database**, select **Redis**, and choose a region close to your Render services.
3. Once created, copy the **Redis URL** (looks like `rediss://default:TOKEN@xxxx.upstash.io:6380`).
4. Note that Upstash requires TLS (`rediss://`), which is supported automatically by our Redis configuration in [redis.js](file:///d:/pro/Civic-Pulse/server/src/config/redis.js).

#### Step 5: Deploy Backend Web Service
1. Click **New** → **Web Service** on Render.
2. Connect your GitHub repository.
3. Configure the following fields:
   * **Name**: `civicpulse-api`
   * **Root Directory**: `server` (crucial since backend lives in this folder)
   * **Runtime**: `Node`
   * **Build Command**: `npm install && npx prisma generate && npx prisma migrate deploy`
   * **Start Command**: `node src/server.js`
   * **Plan**: `Free`
4. Add the following environment variables under **Environment**:
   ```env
   NODE_ENV=production
   DATABASE_URL=<your-render-internal-database-url>
   REDIS_URL=<your-upstash-redis-url>
   JWT_ACCESS_SECRET=<generate-a-secure-32-char-random-string>
   JWT_REFRESH_SECRET=<generate-another-secure-32-char-random-string>
   ALLOWED_ORIGINS=https://your-frontend-vercel-app.vercel.app
   CLIENT_URL=https://your-frontend-vercel-app.vercel.app
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-gmail-app-password
   SMTP_FROM="CivicPulse <noreply@civicpulse.app>"
   CLOUDINARY_CLOUD_NAME=<your-cloudinary-cloud-name>
   CLOUDINARY_API_KEY=<your-cloudinary-api-key>
   CLOUDINARY_API_SECRET=<your-cloudinary-api-secret>
   LOG_LEVEL=info
   ```
5. Click **Create Web Service**. Render will build and deploy your app. The API will be accessible at a URL like `https://civicpulse-api.onrender.com`.

> [!TIP]
> **Mitigating Cold Starts:**
> Because Render's Free tier sleeps after 15 minutes of inactivity, the first load can take 30–60 seconds. To keep the service warm during demo hours/grading, point a free monitoring service like [UptimeRobot](https://uptimerobot.com) to ping your API health check endpoint: `/api/health`.

---

### 🚩 Path B: Railway (Recommended for seamless setup & grading/demos)

#### Step 1: Create Project & Add Services
1. Go to [railway.app](https://railway.app) and sign up with GitHub.
2. Click **New Project** → **Deploy from GitHub repo** → select `CivicPulse`.
3. Set the service root directory to `server`.
4. In your project canvas, click **+ New** → **Database** → **Add PostgreSQL**.
5. Click **+ New** → **Database** → **Add Redis**.
6. Railway automatically provisions these and creates connection variables.

#### Step 2: Enable PostGIS on Railway PostgreSQL
1. Select the **PostgreSQL** box in your Railway canvas.
2. Go to the **Query** tab or connect using a local database client.
3. Run the SQL commands:
   ```sql
   CREATE EXTENSION IF NOT EXISTS postgis;
   ```

#### Step 3: Configure the Web Service
1. Select your Web Service box on the Railway canvas.
2. Under **Settings**:
   * **Root Directory**: `server`
   * **Build Command**: `npm install && npx prisma generate && npx prisma migrate deploy`
   * **Start Command**: `node src/server.js`
3. Under **Networking**, click **Generate Domain** to get a public URL for your API (e.g., `civicpulse-api.up.railway.app`).
4. Under **Variables**, add your environment variables. Railway can automatically inject database/redis variables using Railway syntax:
   * `DATABASE_URL`: `${{Postgres.DATABASE_URL}}`
   * `REDIS_URL`: `${{Redis.REDIS_URL}}`
   * Add other variables manually (`JWT_ACCESS_SECRET`, `SMTP_HOST`, `CLOUDINARY_CLOUD_NAME`, etc.).

---

### ⚠️ Crucial Production Checklists

1. **Prisma Migrations:** Always use `npx prisma migrate deploy` as part of your deployment build/release command (not `prisma migrate dev`, which is interactive and will hang the build).
2. **PostGIS Extension:** Both Render and Railway require manual execution of `CREATE EXTENSION IF NOT EXISTS postgis;` or migrations to enable geo-queries. If skipped, queries using spatial operations will crash the server.
3. **Health Check Endpoints:** Render and Railway use the `/api/health` endpoint to perform health checks. Ensure it's configured as the health check path in your platform settings.

---

## 💻 Frontend Deployment (Vercel)

This section explains how to deploy the CivicPulse React frontend to **Vercel** with the correct API and client-side router configurations.

### 🔍 Static Hosting & API Proxies: The Core Concept

Since Vercel serves static assets from a CDN, there is no Node.js/Express server behind your frontend to proxy requests at runtime.
* **Option 1 (Recommended): Direct API calls with CORS.** Your React app calls the backend's absolute URL directly (e.g. `https://civicpulse-api.onrender.com/api/...`), and CORS on your Express backend is configured to allow requests from your Vercel domain.
* **Option 2 (Reverse Proxy):** You use a `vercel.json` rewrite rule to transparently forward `/api/*` requests to your backend (e.g., `https://civicpulse-api.onrender.com/api/*`). This hides the backend URL and avoids CORS altogether. *Note: Vercel's reverse proxy does not support WebSocket rewrites, so Socket.io must still connect directly to your backend URL.*

---

### 🛠️ Step 1: Verify Vite Build Configuration
Vercel auto-detects Vite, but ensure `client/package.json` contains:
```json
"scripts": {
  "dev": "vite",
  "build": "vite build",
  "preview": "vite preview"
}
```
And that `client/vite.config.js` is set to output to `dist` (default behavior).

---

### 📦 Step 2: Configure `vercel.json` (Required for React Router)
Without a custom rewrite rule, refreshing any page other than `/` on a Vite single-page app (SPA) deployed to Vercel will return a **404 error** (because Vercel attempts to find a physical file matching that path on the CDN).

Create a [vercel.json](file:///d:/pro/Civic-Pulse/client/vercel.json) file in your `client` directory (which already exists in this project) with the following structure:
```json
{
  "rewrites": [
    {
      "source": "/((?!api/).*)",
      "destination": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options",        "value": "DENY" },
        { "key": "X-XSS-Protection",       "value": "1; mode=block" },
        {
          "key": "Strict-Transport-Security",
          "value": "max-age=31536000; includeSubDomains"
        }
      ]
    },
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

---

### 🚀 Step 3: Deploy via Vercel Dashboard
1. Go to [vercel.com](https://vercel.com) and click **Add New** → **Project**.
2. Import your GitHub repository.
3. Configure the following project settings:
   * **Root Directory**: `client` (crucial since it is a monorepo)
   * **Framework Preset**: `Vite` (automatically detected)
   * **Build Command**: `npm run build`
   * **Output Directory**: `dist`
   * **Install Command**: `npm install`
4. Add the following environment variables in the setup screen:
   * `VITE_API_URL`: `https://civicpulse-api.onrender.com` (your backend API base)
   * `VITE_SOCKET_URL`: `https://civicpulse-api.onrender.com` (backend socket base)
   * `VITE_CLOUDINARY_CLOUD_NAME`: `<your-cloudinary-cloud-name>`
   * `VITE_APP_NAME`: `CivicPulse`
   * `VITE_APP_URL`: `https://civicpulse.vercel.app` (your frontend deployment domain)
5. Click **Deploy**. Vercel will build and launch your site.

> [!WARNING]
> Environment variables starting with `VITE_` are baked into the frontend bundle at **build time**. If you edit your Vercel environment variables, you **must trigger a new deployment** (rebuild) for the changes to take effect.

---

### 🔒 Step 4: Allow Frontend in Backend CORS
On your backend host (Render or Railway), edit the environment variables for your web service to include the Vercel URL:
```env
ALLOWED_ORIGINS=https://civicpulse.vercel.app
```
*Note: Make sure not to include a trailing slash, as that is the most common cause of CORS validation mismatches.*

---

### 🧪 Step 5: Verify Your Deployment
1. Verify the homepage loads and client-side routing works when refreshing paths (e.g. visiting `https://civicpulse.vercel.app/incidents` directly in your browser address bar).
2. Open Browser Developer Tools (F12) → **Network** tab, and perform actions (like logging in or loading incidents) to confirm that requests are successfully reaching your backend API.
3. Verify that real-time notifications (Socket.io) are connected. Since WebSockets require absolute URLs, verify `VITE_SOCKET_URL` is set to the full `https://` protocol (not a relative path).

---

## 🔍 SEO, OG Meta Tags, and Favicons

This section covers the SEO setup, Open Graph social share optimization, Favicon assets, Search Console optimization, and dynamic per-route document tagging.

### 📄 1. Static Base HTML Head Configuration

The [client/index.html](file:///d:/pro/Civic-Pulse/client/index.html) file is optimized with essential base SEO elements, mobile theme setup, and Open Graph card descriptors for major social channels (Facebook, WhatsApp, LinkedIn, X):

* **Canonical Links:** Explicitly points to the production root to prevent duplicate content indexation.
* **Social Previews:** References a dedicated, high-resolution OG image (`1200x630`) hosted absolutely on Vercel.
* **Theme Styling:** Includes `theme-color` tags to customize mobile browsers' address bar color.

---

### 🎨 2. Favicon Set & Web App Manifest

A complete cross-platform favicon bundle is provided under the [client/public/](file:///d:/pro/Civic-Pulse/client/public) folder, matching standard mobile and desktop browser requirements:
* `favicon.svg` — Sharp vector icon of the map/location pin.
* `favicon-16x16.png` & `favicon-32x32.png` — Standard desktop browser tab fallbacks.
* `apple-touch-icon.png` (`180x180`) — Launcher icon for iOS devices.
* `android-chrome-192x192.png` & `android-chrome-512x512.png` — Launcher icons mapped inside `site.webmanifest` for Android "Add to Home Screen" support.

The manifest file [site.webmanifest](file:///d:/pro/Civic-Pulse/client/public/site.webmanifest) provides app name and styling rules for PWA launchers.

---

### 🗺️ 3. Crawler Control: robots.txt & sitemap.xml

Search crawlers are guided using:
* [robots.txt](file:///d:/pro/Civic-Pulse/client/public/robots.txt) — Explicitly allows all search engines to index public routes while blocking internal or sensitive pages (`/admin`, `/reset-password`, `/verify-email`). Points search engines directly to the sitemap URL.
* [sitemap.xml](file:///d:/pro/Civic-Pulse/client/public/sitemap.xml) — Declares key static entry routes (`/`, `/map`, `/register`) with priority mapping.

---

### ⚡ 4. Dynamic Page Titles & Descriptions (SPA Routing)

To prevent the browser tab showing a static name (like `CivicPulse` for every route), a custom hook is implemented to update titles and description tags dynamically when client-side routing transitions.

#### The Hook: `usePageMeta.js`
Located at [client/src/hooks/usePageMeta.js](file:///d:/pro/Civic-Pulse/client/src/hooks/usePageMeta.js), this hook uses React's `useEffect` to safely mutate `document.title` and select the meta description tag to swap contents, automatically resetting them to defaults on unmount.

#### Integration in Incident page:
Integrated unconditionally in [client/src/pages/Incident.jsx](file:///d:/pro/Civic-Pulse/client/src/pages/Incident.jsx) before any early returns:
```javascript
usePageMeta(
  incident?.title,
  incident?.description?.slice(0, 150)
);
```

#### Integration in Profile page:
Integrated unconditionally in [client/src/pages/Profile.jsx](file:///d:/pro/Civic-Pulse/client/src/pages/Profile.jsx):
```javascript
usePageMeta(
  user ? `${user.name}'s Profile` : 'Loading Profile...',
  user ? `Civic reporting activity for ${user.name} on CivicPulse.` : 'View citizen trust rating...'
);
```

---

## 🩺 Health Check & Centralized Error Logging

This section covers the implementation of detailed health check routing, dependency checking, process-level exception interceptors, structured error log routing, and logging within async background queues and real-time gateways.

### 🔌 1. Dependency Probing Health API

We have modularized and enhanced the health check system into a dedicated module:
* [health.controller.js](file:///d:/pro/Civic-Pulse/server/src/modules/health/health.controller.js) — Implements two separate probes:
  * **Deep Probe (`/health` and `/api/health`):** Actively queries the PostgreSQL database (`SELECT 1`) and pings Redis (`redis.ping()`), measuring latency and reporting active service status alongside uptime metrics. Returns a `503 Service Unavailable` status on dependency issues so host platforms can auto-restart/route appropriately.
  * **Liveness Probe (`/health/live` and `/api/health/live`):** A fast liveness ping that returns `200 OK` instantly, indicating that the Node process is running. Used by orchestrators to avoid hammering databases with frequent polling.
* [health.routes.js](file:///d:/pro/Civic-Pulse/server/src/modules/health/health.routes.js) — Defines paths for health checks.
* Mounted at the top level of the router chain in [app.js](file:///d:/pro/Civic-Pulse/server/src/app.js) before auth middleware.

---

### 📝 2. Structured JSON Logger

A lightweight structured JSON logger wrapper is implemented in [logger.js](file:///d:/pro/Civic-Pulse/server/src/config/logger.js):
* Automatically stringifies outputs to single-line JSON strings.
* Supports **Child Context Tagging** (`logger.child({ module: "..." })`) to trace requests, worker flows, or process tasks cleanly.
* Properly serializes and expands javascript `Error` objects (retaining message, stack, code, and class names).

---

### 🛡️ 3. Process-level Failure & Lifecycle Handling

In [server.js](file:///d:/pro/Civic-Pulse/server/src/server.js), listeners intercept critical operational blips to avoid silent crashes:
* **`unhandledRejection`:** Intercepts promises missing `.catch()` blocks, logging them at a `fatal` level.
* **`uncaughtException`:** Catches unexpected synchronous exceptions, logs details, and forces a clean exit (`process.exit(1)`) so the process manager can boot a fresh instance.
* **`SIGTERM`:** Intercepts host termination signals (e.g. during a new deploy), stopping the HTTP server from accepting requests while disconnecting from PostgreSQL and Redis gracefully.

---

### 🧱 4. Centralized Request and Gateway Logging

Structured logging is wired into:
* **Express Error Middleware ([error.js](file:///d:/pro/Civic-Pulse/server/src/middleware/error.js)):**
  * Logs expected user validation and authorization failures (`4xx`) at `warn` level (operational).
  * Logs unexpected programming bugs and database crashes (`5xx`) at `error` level with full stack traces.
  * Masks internal error messages in production to prevent leakage, falling back to a safe generic string.
  * Implements `notFoundHandler` to intercept unmapped paths and log missing route requests.
* **Scoring Jobs Queue ([worker.js](file:///d:/pro/Civic-Pulse/server/src/modules/jobs/worker.js)):**
  * Implements try-catch processing wrappers inside the BullMQ job worker.
  * Emits structured job-level indicators on success, queue connection error (`error` event), or job failure (`failed` event).
* **Real-time Gateway ([socket.js](file:///d:/pro/Civic-Pulse/server/src/modules/realtime/socket.js)):**
  * Swapped console logs for structured logger modules.
  * Added try-catch guards on socket client event handlers (such as `subscribe:incident` or `subscribe:area`) to prevent unhandled arguments or payloads from breaking the socket pool connection.
  * Intercepts and logs connection-level rejection errors (`connect_error`) and socket-level errors (`error`).

---

## ⚡ Performance Optimizations

This section details the pre-launch performance sweep, database query indexing, memory caching layers, connection pool constraints, query profiling, and bundle optimizations implemented in CivicPulse.

### 🗄️ 1. Database Indexing & Query Plans

Prisma indexing is optimized for CivicPulse query patterns in [schema.prisma](file:///d:/pro/Civic-Pulse/server/prisma/schema.prisma):
* **Feed Pagination:** Sorted index `@@index([createdAt(sort: Desc), id(sort: Desc)])` to support cursor-based paging.
* **Incident Filtering:** Combined index `@@index([status, category])` for the home feed filters.
* **Reputation Tables:** Index `@@index([trustScore(sort: Desc)])` for leaderboards and moderation queues.
* **Timeline Events:** Combined index `@@index([incidentId, createdAt(sort: Desc)])` for fast incident history pagination.
* **Notifications:** Combined index `@@index([userId, readAt])` for notifications and unread badge counters.

#### PostGIS Geography Index (GIST)
PostgreSQL spatial queries (`ST_DWithin` and `ST_Within`) require a **GIST index** to prevent full-table scans on coordinate sets.
To generate and apply the migrations:
1. Generate the empty schema skeleton structure:
   ```bash
   npx prisma migrate dev --create-only --name add_gist_spatial_index
   ```
2. Edit the generated SQL migration file to add the spatial index:
   ```sql
   CREATE INDEX IF NOT EXISTS incidents_location_gist_idx ON "Incident" USING GIST (location);
   ```
3. Apply the migration:
   ```bash
   npx prisma migrate dev
   ```

---

### 🧠 2. Reusable Caching Module (Redis Cache Helper)

A reusable caching utility is implemented in [cache.js](file:///d:/pro/Civic-Pulse/server/src/utils/cache.js):
* **`cached(key, ttlSeconds, fetchFn)`:** Checks Redis cache. On a cache miss, executes the fetch query function, caches the JSON results, and returns them.
* **Fail-open Behaviour:** If Redis is down, the library intercepts the connection errors, outputs warnings, and fetches data directly from PostgreSQL to keep the application responsive.
* **`invalidatePrefix(prefix)`:** Scans and invalidates keys matching a prefix without blocking the Redis single-threaded process (uses `SCAN` instead of `KEYS`).

#### Cache Keys and TTL Strategy
* **Heatmap Points (`heatmap:*`):** Cached for `120s`. Cleared immediately on incident score recalculation using `invalidatePrefix("heatmap:")` in [scoring.js](file:///d:/pro/Civic-Pulse/server/src/modules/jobs/scoring.js).
* **Search Results (`search:*`):** Filter-only search results are cached for `30s` and invalidated on scoring updates (`invalidatePrefix("search:")`).
* **Admin Dashboard Metrics (`admin:metrics`):** Aggregates across the app, cached for `300s` with natural TTL expiry.

---

### 🔌 3. Database & Redis Connection Constraints

To prevent free cloud database providers (like Render or Supabase) from hitting connection pool limits:
* **Prisma Connection Pooling:**DATABASE_URL query params set the pool connection limits (e.g. `connection_limit=5&pool_timeout=10` limits active database connections and fails fast on pool exhaustion).
* **Redis Connection Sharing:** BullMQ queues and workers reuse the single `ioredis` instance exported by [redis.js](file:///d:/pro/Civic-Pulse/server/src/config/redis.js) instead of spinning up separate TCP connections per file.

---

### ⏱️ 4. Development Query Profiling

Prisma query performance logging is implemented in [prisma.js](file:///d:/pro/Civic-Pulse/server/src/config/prisma.js):
* Emits query events when `NODE_ENV === "development"`.
* Warns when any database query takes more than **`100ms`** to resolve.

---

### 📦 5. Client Chunk Splitting & Route Lazy-Loading

To speed up initial page load times:
* **Route Lazy Loading:** Pages inside [App.jsx](file:///d:/pro/Civic-Pulse/client/src/App.jsx) (such as `MapView` and `AdminDashboard`) are loaded on-demand using React's `lazy` and `Suspense`. Heavy dependencies (like Leaflet Maps) are only fetched when users navigate to those routes.
* **Manual Chunk Splitting:** [vite.config.js](file:///d:/pro/Civic-Pulse/client/vite.config.js) splits third-party dependencies into independent bundles:
  * `vendor-react` — react, react-dom, react-router-dom
  * `vendor-leaflet` — leaflet
  * `vendor-socket` — socket.io-client
  * `index` — main application scripts

---

## 🌟 Future Enhancements






📍 Near Me Feed (radius-based incidents)

📷 Photo uploads + moderation

🧑‍💼 Admin dashboard for authorities

🔔 Real-time updates (Socket.IO)

🤖 Spam / fake report detection

👨‍💻 Author

Built by Kushagra Srivastava
Backend-focused fullstack project (BTech level) showcasing scalable backend patterns.
