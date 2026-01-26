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
