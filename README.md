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
