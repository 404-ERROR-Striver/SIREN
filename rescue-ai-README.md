# 🚨 RESCUE.AI — Intelligent Disaster Response System

A real-time AI-powered disaster management and emergency response platform built for hackathons.

## 🏃 Quick Start (Single File — Hackathon Demo)
Just open `rescue-ai-complete.html` in any browser. No installation needed!

## 🛠 Full Stack Setup (React + Node.js + Socket.io)

### Backend
```bash
cd server
npm install
node index.js
# Server runs on http://localhost:5000
```

### Frontend (React)
```bash
cd client
npm install
npm start
# App runs on http://localhost:3000
```

## ✨ Features
- 🗺️ **Interactive Map** — Color-coded emergency markers across India (Leaflet.js)
- 🚨 **Emergency Alert System** — Submit alerts with severity levels (Low/Moderate/High/Critical)
- 📡 **Real-Time Updates** — Socket.io for live alert broadcasting
- 📍 **Location Tracking** — Detects your location, scans 50km for nearby hazards
- 📰 **News Feed** — Live disaster news updates
- 🩺 **First Aid Guide** — Disaster-specific first aid for Earthquake, Flood, Cyclone, Fire
- 📞 **Contact Page** — Emergency contacts (112, 100, 108, 101)

## 🎨 Tech Stack
- **Frontend**: HTML5, CSS3, Vanilla JS / React
- **Backend**: Node.js, Express, Socket.io
- **Maps**: Leaflet.js + OpenStreetMap
- **Real-time**: Socket.io WebSockets
- **Styling**: Custom CSS with CSS variables, dark theme

## 📁 Structure
```
rescue-ai/
├── rescue-ai-complete.html   ← HACKATHON DEMO (open directly)
├── README.md
└── server/
    ├── package.json
    └── index.js              ← Express + Socket.io backend
```
