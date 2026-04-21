const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

// --- In-memory data ---
let alerts = [
  { id: 1, location: 'Mumbai, Maharashtra', severity: 'high', details: 'Heavy flooding reported.', lat: 19.076, lng: 72.877, time: new Date(Date.now() - 3600000).toISOString() },
  { id: 2, location: 'Delhi NCR', severity: 'critical', details: 'Severe air pollution.', lat: 28.704, lng: 77.102, time: new Date(Date.now() - 7200000).toISOString() },
  { id: 3, location: 'Chennai, Tamil Nadu', severity: 'moderate', details: 'Cyclone approaching.', lat: 13.082, lng: 80.27, time: new Date(Date.now() - 10800000).toISOString() },
  { id: 4, location: 'Himachal Pradesh', severity: 'low', details: 'Minor landslides.', lat: 31.1, lng: 77.17, time: new Date(Date.now() - 14400000).toISOString() },
];

let news = [
  { id: 1, title: 'Flood Warning Issued', summary: 'Flood warnings for western coastal regions.', time: new Date(Date.now() - 1800000).toISOString() },
  { id: 2, title: 'Emergency Services in Chennai', summary: 'NDRF teams deployed.', time: new Date(Date.now() - 5400000).toISOString() },
  { id: 3, title: 'Delhi Schools Closed', summary: 'Closure due to air quality.', time: new Date(Date.now() - 21600000).toISOString() },
  { id: 4, title: 'Relief Camps in Maharashtra', summary: 'Camps established for flood victims.', time: new Date(Date.now() - 86400000).toISOString() },
];

// --- REST endpoints ---
app.get('/api/alerts', (req, res) => res.json(alerts));
app.get('/api/news', (req, res) => res.json(news));

app.post('/api/alerts', (req, res) => {
  const { location, severity, details, lat, lng } = req.body;
  const newAlert = {
    id: Date.now(),
    location,
    severity,
    details,
    lat: lat || null,
    lng: lng || null,
    time: new Date().toISOString(),
  };
  alerts.unshift(newAlert);
  // Broadcast to all connected clients
  io.emit('new_alert', newAlert);
  res.json({ success: true, alert: newAlert });
});

app.post('/api/nearby', (req, res) => {
  const { lat, lng, radius = 50 } = req.body;
  const R = 6371;
  const nearby = alerts.filter(a => {
    if (!a.lat || !a.lng) return false;
    const dLat = ((a.lat - lat) * Math.PI) / 180;
    const dLng = ((a.lng - lng) * Math.PI) / 180;
    const sinDLat = Math.sin(dLat / 2);
    const sinDLng = Math.sin(dLng / 2);
    const c = 2 * Math.atan2(
      Math.sqrt(sinDLat * sinDLat + Math.cos((lat * Math.PI) / 180) * Math.cos((a.lat * Math.PI) / 180) * sinDLng * sinDLng),
      Math.sqrt(1 - sinDLat * sinDLat - Math.cos((lat * Math.PI) / 180) * Math.cos((a.lat * Math.PI) / 180) * sinDLng * sinDLng)
    );
    const dist = R * c;
    return dist <= radius;
  });
  res.json({ nearby });
});

// --- Socket.io ---
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  socket.emit('init_alerts', alerts);
  socket.on('disconnect', () => console.log('Client disconnected:', socket.id));
});

// Simulate live news updates every 45s
setInterval(() => {
  const liveItems = [
    { title: 'Cyclone Update', summary: 'Cyclone intensifies near Bay of Bengal.' },
    { title: 'Rescue Operations', summary: 'NDRF teams airlifted to flood zones.' },
    { title: 'Heat Wave Advisory', summary: 'Severe heat wave warning for Rajasthan.' },
    { title: 'Earthquake Alert', summary: 'Minor tremors felt near Uttarakhand.' },
  ];
  const item = liveItems[Math.floor(Math.random() * liveItems.length)];
  const newsItem = { id: Date.now(), ...item, time: new Date().toISOString() };
  news.unshift(newsItem);
  if (news.length > 20) news.pop();
  io.emit('news_update', newsItem);
}, 45000);

const PORT = 5000;
server.listen(PORT, () => console.log(`RESCUE.AI Server running on port ${PORT}`));

