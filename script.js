// ===== DATA =====
const severityColors = { critical:'#ef4444', high:'#f97316', moderate:'#eab308', low:'#22c55e' };
let currentUser = null;
let userAlerts = [];

let appData = {
  alerts: [
    { id:1, location:'Mumbai, Maharashtra', severity:'high', details:'Heavy flooding reported across low-lying areas.', lat:19.076, lng:72.877, time:new Date(Date.now()-3600000).toISOString() },
    { id:2, location:'Delhi NCR', severity:'critical', details:'Severe air pollution — AQI exceeds 500.', lat:28.704, lng:77.102, time:new Date(Date.now()-7200000).toISOString() },
    { id:3, location:'Chennai, Tamil Nadu', severity:'moderate', details:'Cyclone approaching the Bay of Bengal coast.', lat:13.082, lng:80.27, time:new Date(Date.now()-10800000).toISOString() },
    { id:4, location:'Himachal Pradesh', severity:'low', details:'Minor landslides on mountain roads.', lat:31.1, lng:77.17, time:new Date(Date.now()-14400000).toISOString() },
  ],
  news: [
    { id:1, title:'Flood Warning Issued', summary:'Flood warnings for western coastal regions as heavy rains continue.', time:new Date(Date.now()-1800000).toISOString(), isNew:false },
    { id:2, title:'Emergency Services in Chennai', summary:'NDRF teams deployed to coastal areas ahead of cyclone.', time:new Date(Date.now()-5400000).toISOString(), isNew:false },
    { id:3, title:'Delhi Schools Closed', summary:'Schools remain closed due to hazardous air quality levels.', time:new Date(Date.now()-21600000).toISOString(), isNew:false },
    { id:4, title:'Relief Camps in Maharashtra', summary:'Camps established to house over 10,000 flood victims.', time:new Date(Date.now()-86400000).toISOString(), isNew:false },
  ]
};

// ===== MAPS =====
let maps = {}, markerLayers = {};
function initMap(id, lat, lng, zoom) {
  if (maps[id]) { maps[id].remove(); delete maps[id]; }
  const m = L.map(id, {zoomControl:true}).setView([lat,lng],zoom);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'© OpenStreetMap'}).addTo(m);
  maps[id] = m;
  markerLayers[id] = L.layerGroup().addTo(m);
}
function refreshMarkers(id) {
  if (!maps[id]) return;
  markerLayers[id].clearLayers();
  appData.alerts.forEach(a => {
    if (!a.lat || !a.lng) return;
    const c = severityColors[a.severity]||'#888';
    const icon = L.divIcon({ className:'', html:`<div style="width:14px;height:14px;background:${c};border-radius:50%;border:2px solid rgba(255,255,255,0.6);box-shadow:0 0 8px ${c}88;"></div>`, iconSize:[14,14], iconAnchor:[7,7] });
    L.marker([a.lat,a.lng],{icon}).bindPopup(`<b>${a.location}</b><br><span style="color:${c};text-transform:capitalize;">${a.severity}</span><br>${a.details}`).addTo(markerLayers[id]);
  });
}

// ===== TIME =====
function timeAgo(iso) {
  const s = (Date.now()-new Date(iso))/1000;
  if(s<60) return 'just now';
  if(s<3600) return Math.floor(s/60)+'m ago';
  if(s<86400) return Math.floor(s/3600)+'h ago';
  return new Date(iso).toLocaleDateString();
}

// ===== RENDER =====
function renderAlerts() {
  ['home-alerts-list','alerts-list'].forEach(id=>{
    const el=document.getElementById(id); if(!el) return;
    el.innerHTML = appData.alerts.map(a=>`
      <div class="alert-item ${a.severity}">
        <div class="alert-header"><span class="alert-location">📍 ${a.location}</span><span class="severity-badge badge-${a.severity}">${a.severity}</span></div>
        <div class="alert-details">${a.details}</div>
        <div class="alert-time">${timeAgo(a.time)}</div>
      </div>`).join('');
  });
  document.getElementById('stat-active').textContent = appData.alerts.length;
  document.getElementById('stat-critical').textContent = appData.alerts.filter(a=>a.severity==='critical').length;
  const dashStat = document.getElementById('dash-stat-active');
  if(dashStat) dashStat.textContent = appData.alerts.length;
}

function renderNews() {
  const el=document.getElementById('news-list'); if(!el) return;
  el.innerHTML = appData.news.map(n=>`
    <div class="news-item">
      <div class="news-title">${n.title}${n.isNew?'<span class="new-badge">NEW</span>':''}</div>
      <div class="news-summary">${n.summary}</div>
      <div class="news-time">${timeAgo(n.time)}</div>
    </div>`).join('');
  document.getElementById('stat-news').textContent = appData.news.length;
}

function renderDashboard() {
  const el = document.getElementById('dashboard-alerts'); if(!el) return;
  const list = [...userAlerts, ...appData.alerts.slice(0,3)];
  if(list.length===0){ el.innerHTML='<div style="color:var(--text-muted);padding:2rem;text-align:center;">No alerts reported yet.</div>'; return; }
  el.innerHTML = list.map(a=>`
    <div class="dash-alert-item ${a.severity}">
      <div class="dash-alert-loc">📍 ${a.location}</div>
      <div class="dash-alert-sev"><strong>Severity:</strong> ${a.severity.charAt(0).toUpperCase()+a.severity.slice(1)}</div>
      <div class="dash-alert-sev" style="margin-top:0.2rem;">${a.details}</div>
    </div>`).join('');
  const st = document.getElementById('dash-stat-total');
  if(st) st.textContent = userAlerts.length;
}

// ===== FIRST AID TOGGLE =====
function toggleFASection(btn) {
  const body = btn.nextElementSibling;
  const isOpen = btn.classList.contains('open');
  // Close all in same disaster card
  btn.closest('.fa-disaster-card').querySelectorAll('.fa-section-btn').forEach(b=>{ b.classList.remove('open'); b.querySelector('.fa-arrow').textContent='▶'; b.nextElementSibling.classList.remove('open'); });
  if(!isOpen) { btn.classList.add('open'); btn.querySelector('.fa-arrow').textContent='▼'; body.classList.add('open'); }
}

// ===== SUBMIT ALERT =====
function submitAlert() {
  const loc = document.getElementById('alert-location').value.trim();
  const sev = document.getElementById('alert-severity').value;
  const det = document.getElementById('alert-details').value.trim();
  if(!loc||!det){ showToast('error','⚠️','Please fill in all fields.'); return; }
  const a = { id:Date.now(), location:loc, severity:sev, details:det, lat:null, lng:null, time:new Date().toISOString() };
  appData.alerts.unshift(a);
  if(currentUser) userAlerts.unshift(a);
  renderAlerts();
  renderDashboard();
  ['home-map','main-map','alert-map'].forEach(id=>refreshMarkers(id));
  showToast('success','✅',`Alert sent successfully!`);
  showToast('info','🚨',`New emergency alert: ${loc}`);
  document.getElementById('alert-location').value='';
  document.getElementById('alert-details').value='';
}

// ===== CONTACT =====
function submitContact() {
  const n=document.getElementById('contact-name').value.trim();
  const e=document.getElementById('contact-email').value.trim();
  const m=document.getElementById('contact-message').value.trim();
  if(!n||!e||!m){ showToast('error','⚠️','Please fill all fields.'); return; }
  showToast('success','✅','Message sent! We will get back to you soon.');
  document.getElementById('contact-name').value='';
  document.getElementById('contact-email').value='';
  document.getElementById('contact-message').value='';
}

// ===== AUTH =====
function switchAuthTab(tab) {
  document.getElementById('tab-signin').classList.toggle('active', tab==='signin');
  document.getElementById('tab-register').classList.toggle('active', tab==='register');
  document.getElementById('auth-signin').style.display = tab==='signin'?'block':'none';
  document.getElementById('auth-register').style.display = tab==='register'?'block':'none';
}

function doSignIn() {
  const u=document.getElementById('signin-username').value.trim();
  const p=document.getElementById('signin-password').value;
  if(!u||!p){ showToast('error','⚠️','Please enter username and password.'); return; }
  currentUser = { name:u };
  setLoggedIn(u);
  showToast('success','✅',`Welcome back, ${u}!`);
  showPage('dashboard');
}

function doRegister() {
  const n=document.getElementById('reg-name').value.trim();
  const u=document.getElementById('reg-username').value.trim();
  const p=document.getElementById('reg-password').value;
  if(!n||!u||!p){ showToast('error','⚠️','Please fill in all fields.'); return; }
  currentUser = { name:n, username:u };
  setLoggedIn(n);
  showToast('success','✅',`Account created! Welcome, ${n}!`);
  showPage('dashboard');
}

function setLoggedIn(name) {
  const actions = document.getElementById('nav-actions');
  actions.innerHTML = `
    <div class="user-badge"><div class="user-avatar">${name[0].toUpperCase()}</div>${name}</div>
    <button class="btn btn-ghost" onclick="doSignOut()">Sign Out</button>`;
  // Add dashboard link
  const links = document.getElementById('nav-links');
  if(!document.getElementById('nav-dashboard')) {
    const db = document.createElement('button');
    db.className='nav-link'; db.id='nav-dashboard';
    db.textContent='Dashboard';
    db.onclick=()=>showPage('dashboard');
    links.appendChild(db);
  }
}

function doSignOut() {
  currentUser = null;
  userAlerts = [];
  document.getElementById('nav-actions').innerHTML=`
    <button class="btn btn-ghost" onclick="showPage('auth')">Sign In</button>
    <button class="btn btn-primary" onclick="showPage('auth')">Register</button>`;
  const db=document.getElementById('nav-dashboard');
  if(db) db.remove();
  showToast('info','👋','You have been signed out.');
  showPage('home');
}

// ===== TRACK LOCATION =====
function trackLocation() {
  if(!navigator.geolocation){ showToast('error','❌','Geolocation not supported.'); return; }
  showToast('info','📍','Locating your position...');
  navigator.geolocation.getCurrentPosition(pos=>{
    const {latitude:lat,longitude:lng} = pos.coords;
    showToast('success','✅','Location tracked successfully!');
    const R=6371;
    const nearby = appData.alerts.filter(a=>{
      if(!a.lat||!a.lng) return false;
      const dL=(a.lat-lat)*Math.PI/180, dG=(a.lng-lng)*Math.PI/180;
      const aa=Math.sin(dL/2)**2+Math.cos(lat*Math.PI/180)*Math.cos(a.lat*Math.PI/180)*Math.sin(dG/2)**2;
      return R*2*Math.atan2(Math.sqrt(aa),Math.sqrt(1-aa))<=50;
    });
    setTimeout(()=>{
      if(nearby.length===0) showToast('success','🟢','No disasters reported in your vicinity.');
      else showToast('error','🚨',`${nearby.length} disaster(s) detected within 50km!`);
    },800);
    // Add pin to all active maps
    Object.keys(maps).forEach(id=>{
      const icon=L.divIcon({className:'',html:'<div style="width:16px;height:16px;background:#3b82f6;border-radius:50%;border:3px solid #fff;box-shadow:0 0 12px #3b82f699;"></div>',iconSize:[16,16],iconAnchor:[8,8]});
      L.marker([lat,lng],{icon}).bindPopup('<b>Your Current Location</b>').openPopup().addTo(markerLayers[id]);
      maps[id].setView([lat,lng],10);
    });
  },()=>showToast('error','❌','Could not get your location.'));
}

// ===== TOAST =====
function showToast(type, icon, msg) {
  const c=document.getElementById('toast-container');
  const t=document.createElement('div');
  t.className=`toast ${type}`;
  t.innerHTML=`<span>${icon}</span><span>${msg}</span><span class="toast-close" onclick="this.parentElement.remove()">✕</span>`;
  c.appendChild(t);
  setTimeout(()=>t.remove(),5000);
}

// ===== NAV =====
let mapsInited={};
function showPage(name) {
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.nav-link').forEach(l=>l.classList.remove('active'));
  const page = document.getElementById(`page-${name}`);
  if(page) page.classList.add('active');
  document.querySelectorAll('.nav-link').forEach(l=>{ if(l.getAttribute("data-translate") === name||(name==='home'&&l.textContent==='Home')) l.classList.add('active'); });

  setTimeout(()=>{
    if(name==='home'&&!mapsInited.home){ mapsInited.home=true; initMap('home-map',22,80,4.5); refreshMarkers('home-map'); }
    if(name==='map'&&!mapsInited.map){ mapsInited.map=true; initMap('main-map',22,80,4.5); refreshMarkers('main-map'); }
    if(name==='alerts'&&!mapsInited.alerts){ mapsInited.alerts=true; initMap('alert-map',22,80,4); refreshMarkers('alert-map'); }
    if(name==='dashboard') renderDashboard();
    Object.keys(maps).forEach(id=>{ if(maps[id]) maps[id].invalidateSize(); });
  },120);
}

// ===== LIVE SIMULATION =====
const newsPool=[
  {title:'Cyclone Intensifies',summary:'Cyclone strengthens near Bay of Bengal — Category 2 warning issued.'},
  {title:'NDRF Airlifted to Flood Zone',summary:'Teams airlifted to flood-hit districts in Maharashtra.'},
  {title:'Heat Wave Advisory',summary:'IMD issues severe heat wave warning for Rajasthan and UP.'},
  {title:'Earthquake Tremors',summary:'Mild tremors of magnitude 3.2 near Uttarakhand.'},
];
const alertPool=[
  {location:'Kolkata, WB',severity:'moderate',details:'Waterlogging in low-lying areas.',lat:22.57,lng:88.36},
  {location:'Jaipur, Rajasthan',severity:'high',details:'Extreme heat advisory.',lat:26.91,lng:75.78},
];
setInterval(()=>{
  const item=newsPool[Math.floor(Math.random()*newsPool.length)];
  const n={id:Date.now(),...item,time:new Date().toISOString(),isNew:true};
  appData.news.unshift(n); if(appData.news.length>15) appData.news.pop();
  renderNews(); showToast('info','📰',`Update: ${n.title}`);
},45000);
setInterval(()=>{
  const item=alertPool[Math.floor(Math.random()*alertPool.length)];
  const a={id:Date.now(),...item,time:new Date().toISOString()};
  appData.alerts.unshift(a); if(appData.alerts.length>20) appData.alerts.pop();
  renderAlerts(); ['home-map','main-map','alert-map'].forEach(id=>refreshMarkers(id));
  showToast('error','🚨',`New alert: ${a.location} — ${a.severity.toUpperCase()}`);
},65000);

// ===== INIT =====
renderAlerts();
renderNews();
showPage('home');


const translations = {
  en: {
    home: "Home",
    news: "News",
    alerts: "Alerts",
    contact: "Contact",
    firstaid: "First Aid",
    emergency: "Emergency Alerts"
  },
  hi: {
    home: "होम",
    news: "समाचार",
    alerts: "अलर्ट",
    contact: "संपर्क",
    firstaid: "प्राथमिक उपचार",
    emergency: "आपातकालीन अलर्ट"
  },
  ta: {
    home: "முகப்பு",
    news: "செய்திகள்",
    alerts: "எச்சரிக்கை",
    contact: "தொடர்பு",
    firstaid: "முதல் உதவி",
    emergency: "அவசர எச்சரிக்கை"
  },
  bn: {
    home: "হোম",
    news: "সংবাদ",
    alerts: "সতর্কতা",
    contact: "যোগাযোগ",
    firstaid: "প্রাথমিক চিকিৎসা",
    emergency: "জরুরি সতর্কতা"
  }
};

function changeLanguage() {
  const lang = document.getElementById("language-select").value;
  const t = translations[lang];

  document.querySelectorAll("[data-translate]").forEach(el => {
    const key = el.getAttribute("data-translate");
    if (t[key]) el.textContent = t[key];
  });

  localStorage.setItem("lang", lang);
}

window.onload = () => {
  const saved = localStorage.getItem("lang") || "en";
  const select = document.getElementById("language-select");

  if (select) {
    select.value = saved;
    changeLanguage();
  }
};