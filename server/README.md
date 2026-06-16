# Civic Pulse Server - Run Instructions

## Prerequisites
- Node.js (v18+)
- Docker & Docker Compose (Recommended for DB & Redis)

## 1. Setup Environment
Ensure your `.env` file is configured.
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/civicpulse"
# Redis URL defaults to localhost:6379 if not set
```
*Note: If you use the provided docker-compose.yml, the password is 'password'. update your .env accordingly.*

## 2. Start Dependencies (DB & Redis)
The easiest way is to use Docker:
```bash
docker-compose up -d
```
This starts PostgreSQL on port 5432 and Redis on port 6379.

## 3. Install & Migrate
```bash
npm install
npx prisma migrate dev
```

## 4. Run the Server
```bash
npm run dev
```
The server will start on port 8080 (or as configured).

## 5. Run the Worker (for background jobs)
Open a new terminal:
```bash
npm run worker
```

## 6. Verify Geo-Spatial Features
I have created a script to verify the new PostGIS features.
Ensure the server is running (or at least DB/Redis are up), then run:
```bash
node scripts/test-geospatial.js
```
This script will:
1. Create incidents in New York and Los Angeles.
2. Verify "Near Me" search works.
3. Validate "Auto-Clustering" by attaching a nearby report to an existing incident.
