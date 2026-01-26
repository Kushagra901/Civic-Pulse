# CivicPulse 🌍✨  
A full-stack **community signal platform** to report civic issues, verify them with public confirmations, and help prioritize what matters most.

> Built with **React + Vite**, **Node.js + Express**, **PostgreSQL + Prisma**, **Redis + BullMQ**, and **Docker Compose**.

---

## 📌 What CivicPulse Does
CivicPulse helps communities track real problems like:
- 🚧 Roads & potholes
- 💡 Electricity & streetlights
- 🚰 Water issues
- 🧹 Sanitation
- 🛡️ Safety concerns

### Key Features
✅ User Authentication (Register/Login)  
✅ Create Incident Reports  
✅ Auto credibility scoring (worker + queue)  
✅ Confirm / Dispute incidents  
✅ Timeline tracking  
✅ Location support (map + GPS + search) *(frontend)*  
✅ Modern responsive UI (TailwindCSS)  
✅ Production-ready backend patterns (validation, error handling, scalable structure)

---

## 🧱 Tech Stack
### Frontend
- React (Vite)
- TailwindCSS
- Leaflet + React Leaflet (Map)
- react-hot-toast (toasts)

### Backend
- Node.js + Express
- Prisma ORM
- PostgreSQL
- Redis + BullMQ (background jobs)

### DevOps (optional)
- Docker + Docker Compose

---

## 📁 Project Structure
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
✅ Requirements (First Time Setup)

Install these before starting:

Node.js (LTS recommended)

Git

Docker Desktop (recommended)

pgAdmin (optional) for viewing DB data

🚀 Quick Start (Recommended: Docker)
1️⃣ Start PostgreSQL + Redis (Docker)

Open Terminal in project root:

cd civicpulse
docker compose up -d


Check if running:

docker ps

2️⃣ Backend Setup (Prisma + API)

Open a new Terminal:

cd server
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run dev


Backend runs at:
✅ http://localhost:8080
Health check:
✅ http://localhost:8080/health

3️⃣ Start Worker (Background jobs)

Open another Terminal:

cd server
npm run worker


This worker updates scoring and credibility logic.

4️⃣ Frontend Setup (React)

Open another Terminal:

cd client
npm install
npm run dev


Frontend runs at:
✅ http://localhost:5173

🧪 How to Use the App

Open frontend: http://localhost:5173

Register a new user

Login

Go to Feed

Create a civic report (add title, category, description, pick location)

Open incident → Confirm / Dispute

Refresh feed → scores update

📊 View Database Data (Users, Incidents, Reports)
Option A: Prisma Studio (Fastest)
cd server
npx prisma studio


Open:
✅ http://localhost:5555

Option B: pgAdmin

Use these credentials (Docker default):

Host: localhost

Port: 5432

Database: civicpulse

Username: postgres

Password: postgres

To see registered users:

Schemas → public → Tables → "User" → Right click → View/Edit Data → All Rows
Or run this query in Query Tool:

SELECT id, name, email, role, "createdAt"
FROM "User"
ORDER BY "createdAt" DESC;

🔧 Environment Variables
Backend .env

Do NOT push .env to GitHub.
Use .env.example and create .env.

Example:

DATABASE_URL="postgresql://postgres:postgres@localhost:5432/civicpulse?schema=public"
REDIS_URL="redis://localhost:6379"
JWT_ACCESS_SECRET="your_secret_here"
JWT_REFRESH_SECRET="your_secret_here"

🛑 Stop Everything
Stop frontend/backend/worker:

Press:
CTRL + C

Stop docker containers:
docker compose down

🐛 Troubleshooting
❌ Postgres auth failed (P1000)

Check your .env matches docker-compose password:

postgres:postgres

❌ Redis ECONNREFUSED

Make sure Redis container is running:

docker compose up -d

❌ Frontend looks unstyled

Tailwind not applied → verify:

client/src/index.css contains:
@tailwind base; @tailwind components; @tailwind utilities;

client/src/main.jsx imports:
import "./index.css";

🌟 Future Enhancements (Ideas)

“Near Me” feed (radius search)

Photo upload + moderation

Admin dashboard for authorities

Real-time updates with Socket.IO

ML-based spam detection

👨‍💻 Author

Built by Kushagra Srivastava (Backend-focused fullstack project)
