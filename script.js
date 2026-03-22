/* ============================================================
   BROWSER — MAIN SCRIPT
   ============================================================ */

// ── PAGE ROUTING ─────────────────────────────────────────────

let currentPage = 'weather';

function goToPage(page) {
  // hide all pages
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  // show target
  const target = document.getElementById('page-' + page);
  if (target) target.classList.add('active');

  // update nav buttons
  document.querySelectorAll('.nav-btn[data-page]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.page === page);
  });

  currentPage = page;

  // auto-load content
  if (page === 'news' && document.getElementById('newsContainer').children.length === 0) {
    getNews();
  }

  // close mobile drawer
  closeMobileNav();
}

// ── WELCOME ──────────────────────────────────────────────────

function enterApp() {
  const ws = document.getElementById('welcomeScreen');
  ws.style.opacity = '0';
  ws.style.transition = 'opacity 0.6s ease';
  setTimeout(() => {
    ws.classList.add('hidden');
    document.getElementById('appShell').classList.remove('hidden');
    goToPage('weather');
  }, 600);
}

// ── MOBILE NAV ───────────────────────────────────────────────

function toggleMobileNav() {
  document.getElementById('mobileDrawer').classList.toggle('open');
}

function closeMobileNav() {
  document.getElementById('mobileDrawer').classList.remove('open');
}

// ── THEME ────────────────────────────────────────────────────

function toggleTheme() {
  const html = document.documentElement;
  const isDark = html.dataset.theme === 'dark';
  html.dataset.theme = isDark ? 'light' : 'dark';
  document.getElementById('themeIcon').className = isDark ? 'fas fa-moon' : 'fas fa-sun';
  localStorage.setItem('theme', html.dataset.theme);
}

// Load saved theme
(function initTheme() {
  const saved = localStorage.getItem('theme');
  if (saved === 'dark') {
    document.documentElement.dataset.theme = 'dark';
    const icon = document.getElementById('themeIcon');
    if (icon) icon.className = 'fas fa-sun';
  }
})();

// ── SETTINGS ─────────────────────────────────────────────────

function openSettings() {
  document.getElementById('settingsOverlay').classList.add('visible');
  document.getElementById('settingsPanel').classList.add('visible');
}

function closeSettings() {
  document.getElementById('settingsOverlay').classList.remove('visible');
  document.getElementById('settingsPanel').classList.remove('visible');
}

function applyBrightness(val) {
  document.body.style.filter = `brightness(${val}%)`;
}

function applyFontSize(val) {
  document.body.style.fontSize = val + 'px';
}

// ── WEATHER ──────────────────────────────────────────────────

const OWM_KEY = 'bd5e378503939ddaee76f12ad7a97608'; // public demo key

function weatherEmoji(code) {
  if (code >= 200 && code < 300) return '⛈️';
  if (code >= 300 && code < 400) return '🌧️';
  if (code >= 500 && code < 600) return '🌧️';
  if (code >= 600 && code < 700) return '❄️';
  if (code >= 700 && code < 800) return '🌫️';
  if (code === 800) return '☀️';
  if (code === 801) return '🌤️';
  if (code === 802) return '⛅';
  return '🌥️';
}

function dayName(timestamp) {
  const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  return days[new Date(timestamp * 1000).getDay()];
}

async function getWeather() {
  const city = document.getElementById('weatherCity').value.trim();
  if (!city) return showWeatherEmpty();
  showWeatherLoading();
  try {
    const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${OWM_KEY}&units=metric`);
    const data = await res.json();
    if (data.cod !== 200) { showWeatherError(data.message); return; }
    renderWeather(data);
    fetchForecast(city);
  } catch(e) { showWeatherError('Network error'); }
}

async function getWeatherByLocation() {
  if (!navigator.geolocation) return;
  showWeatherLoading();
  navigator.geolocation.getCurrentPosition(async pos => {
    const { latitude: lat, longitude: lon } = pos.coords;
    try {
      const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${OWM_KEY}&units=metric`);
      const data = await res.json();
      renderWeather(data);
      document.getElementById('weatherCity').value = data.name;
      fetchForecast(null, lat, lon);
    } catch(e) { showWeatherError('Network error'); }
  }, () => showWeatherError('Location denied'));
}

function renderWeather(data) {
  const emoji = weatherEmoji(data.weather[0].id);
  document.getElementById('weatherResult').innerHTML = `
    <div class="glass-card weather-big">
      <div class="weather-icon-big">${emoji}</div>
      <div class="weather-info">
        <div class="weather-city">${data.name}, ${data.sys.country}</div>
        <div class="weather-temp">${Math.round(data.main.temp)}°C</div>
        <div class="weather-desc">${data.weather[0].description}</div>
      </div>
      <div class="weather-stats">
        <div class="stat-box"><div class="stat-label">Feels Like</div><div class="stat-val">${Math.round(data.main.feels_like)}°</div></div>
        <div class="stat-box"><div class="stat-label">Humidity</div><div class="stat-val">${data.main.humidity}%</div></div>
        <div class="stat-box"><div class="stat-label">Wind</div><div class="stat-val">${Math.round(data.wind.speed)} m/s</div></div>
        <div class="stat-box"><div class="stat-label">Pressure</div><div class="stat-val">${data.main.pressure}</div></div>
      </div>
    </div>
  `;
}

async function fetchForecast(city, lat, lon) {
  let url;
  if (city) url = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&appid=${OWM_KEY}&units=metric`;
  else url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${OWM_KEY}&units=metric`;

  try {
    const res = await fetch(url);
    const data = await res.json();
    const daily = {};
    data.list.forEach(item => {
      const d = new Date(item.dt * 1000).toDateString();
      if (!daily[d]) daily[d] = { dt: item.dt, temps: [], codes: [] };
      daily[d].temps.push(item.main.temp);
      daily[d].codes.push(item.weather[0].id);
    });
    const days = Object.values(daily).slice(0, 5);
    document.getElementById('forecastContainer').innerHTML = days.map(d => `
      <div class="forecast-card">
        <div class="forecast-day">${dayName(d.dt)}</div>
        <div class="forecast-ico">${weatherEmoji(d.codes[0])}</div>
        <div class="forecast-hi">${Math.round(Math.max(...d.temps))}°</div>
        <div class="forecast-lo">${Math.round(Math.min(...d.temps))}° lo</div>
      </div>
    `).join('');

    // chart
    const labels = days.map(d => dayName(d.dt));
    const highs  = days.map(d => Math.round(Math.max(...d.temps)));
    const lows   = days.map(d => Math.round(Math.min(...d.temps)));
    renderWeatherChart(labels, highs, lows);
    document.getElementById('weatherChartWrap').style.display = 'block';
  } catch(e) {}
}

let weatherChartInst = null;
function renderWeatherChart(labels, highs, lows) {
  const ctx = document.getElementById('weatherChart').getContext('2d');
  if (weatherChartInst) weatherChartInst.destroy();
  const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#1a1aff';
  weatherChartInst = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        { label: 'High °C', data: highs, borderColor: accent, backgroundColor: accent + '22', fill: true, tension: 0.4, pointRadius: 5 },
        { label: 'Low °C',  data: lows,  borderColor: '#888',  backgroundColor: '#88888822', fill: true, tension: 0.4, pointRadius: 5 }
      ]
    },
    options: {
      responsive: true,
      plugins: { legend: { labels: { color: '#888' } } },
      scales: {
        x: { ticks: { color: '#888' }, grid: { color: 'rgba(128,128,128,0.15)' } },
        y: { ticks: { color: '#888' }, grid: { color: 'rgba(128,128,128,0.15)' } }
      }
    }
  });
}

function showWeatherLoading() {
  document.getElementById('weatherResult').innerHTML = '<div class="loading-spinner"><div class="spinner"></div></div>';
}

function showWeatherError(msg) {
  document.getElementById('weatherResult').innerHTML = `<div class="glass-card empty-state"><div class="empty-icon">⚠️</div><p>${msg}</p></div>`;
}

function showWeatherEmpty() {
  document.getElementById('weatherResult').innerHTML = `<div class="glass-card empty-state"><div class="empty-icon">🌤️</div><p>Enter a city to see the weather</p></div>`;
}

// ── NEWS ─────────────────────────────────────────────────────

let newsCategory = '';

function setNewsCategory(cat) {
  newsCategory = cat;
  document.querySelectorAll('#newsPills .pill').forEach(p => {
    p.classList.toggle('active', p.textContent.toLowerCase() === (cat || 'all').toLowerCase());
  });
  getNews();
}

async function getNews() {
  const container = document.getElementById('newsContainer');
  container.innerHTML = '<div class="loading-spinner"><div class="spinner"></div></div>';

  // Using GNews API (free) — or fallback to NYT RSS via allorigins
  // We'll use a CORS proxy with RSS feeds
  try {
    const cat = newsCategory || 'general';
    // NewsAPI.org — use demo key that works for demo
    const url = `https://saurav.tech/NewsAPI/top-headlines/category/${cat}/in.json`;
    const res = await fetch(url);
    const data = await res.json();
    if (!data.articles || data.articles.length === 0) {
      container.innerHTML = `<div class="glass-card empty-state"><div class="empty-icon">📭</div><p>No articles found</p></div>`;
      return;
    }
    container.innerHTML = data.articles.slice(0, 12).map(a => `
      <a class="news-card" href="${a.url}" target="_blank" rel="noopener">
        ${a.urlToImage ? `<img class="news-img" src="${a.urlToImage}" alt="" loading="lazy" onerror="this.style.display='none'">` : ''}
        <div class="news-body">
          <div class="news-source">${a.source?.name || 'News'}</div>
          <div class="news-headline">${a.title}</div>
          <div class="news-date">${a.publishedAt ? new Date(a.publishedAt).toLocaleDateString() : ''}</div>
        </div>
      </a>
    `).join('');
  } catch(e) {
    container.innerHTML = `<div class="glass-card empty-state"><div class="empty-icon">📭</div><p>Could not load news. Check your connection.</p></div>`;
  }
}

// ── STOCKS ───────────────────────────────────────────────────

async function getStock() {
  const sym = document.getElementById('stockSymbol').value.trim().toUpperCase();
  if (!sym) return;

  const result = document.getElementById('stockResult');
  result.innerHTML = '<div class="loading-spinner"><div class="spinner"></div></div>';

  try {
    // Using Alpha Vantage demo key (limited)
    const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${sym}&apikey=demo`;
    const res = await fetch(url);
    const data = await res.json();
    const q = data['Global Quote'];

    if (!q || !q['05. price']) {
      // fallback mock for demo
      renderStockMock(sym);
      return;
    }

    const price  = parseFloat(q['05. price']).toFixed(2);
    const change = parseFloat(q['09. change']).toFixed(2);
    const pct    = q['10. change percent'] || '';
    const isUp   = change >= 0;

    result.innerHTML = `
      <div class="glass-card" style="padding:28px">
        <div style="font-family:var(--font-display);font-size:28px;font-weight:800;margin-bottom:4px">${sym}</div>
        <div style="font-size:13px;color:var(--text-2);margin-bottom:20px">Global Quote</div>
        <div class="stock-result">
          <div class="stock-card"><div class="stock-label">Price</div><div class="stock-value">$${price}</div></div>
          <div class="stock-card"><div class="stock-label">Change</div><div class="stock-value ${isUp?'up':'down'}">${isUp?'+':''}${change}</div></div>
          <div class="stock-card"><div class="stock-label">% Change</div><div class="stock-value ${isUp?'up':'down'}">${pct}</div></div>
          <div class="stock-card"><div class="stock-label">Open</div><div class="stock-value">$${parseFloat(q['02. open']).toFixed(2)}</div></div>
          <div class="stock-card"><div class="stock-label">High</div><div class="stock-value">$${parseFloat(q['03. high']).toFixed(2)}</div></div>
          <div class="stock-card"><div class="stock-label">Low</div><div class="stock-value">$${parseFloat(q['04. low']).toFixed(2)}</div></div>
        </div>
      </div>
    `;
    renderStockChart(sym, price);
    document.getElementById('stockChartWrap').style.display = 'block';
  } catch(e) {
    renderStockMock(sym);
  }
}

function renderStockMock(sym) {
  const price  = (Math.random() * 300 + 50).toFixed(2);
  const change = (Math.random() * 10 - 5).toFixed(2);
  const isUp   = change >= 0;
  const result = document.getElementById('stockResult');
  result.innerHTML = `
    <div class="glass-card" style="padding:28px">
      <div style="font-family:var(--font-display);font-size:28px;font-weight:800;margin-bottom:4px">${sym}</div>
      <div style="font-size:13px;color:var(--text-2);margin-bottom:20px">Demo Data</div>
      <div class="stock-result">
        <div class="stock-card"><div class="stock-label">Price</div><div class="stock-value">$${price}</div></div>
        <div class="stock-card"><div class="stock-label">Change</div><div class="stock-value ${isUp?'up':'down'}">${isUp?'+':''}${change}</div></div>
      </div>
      <p style="font-size:12px;color:var(--text-2);margin-top:12px">⚠️ Demo data shown. Add a real API key for live quotes.</p>
    </div>
  `;
  renderStockChart(sym, price);
  document.getElementById('stockChartWrap').style.display = 'block';
}

let stockChartInst = null;
function renderStockChart(sym, currentPrice) {
  const ctx = document.getElementById('stockChart').getContext('2d');
  if (stockChartInst) stockChartInst.destroy();
  const base = parseFloat(currentPrice);
  const labels = ['Mon','Tue','Wed','Thu','Fri','Today'];
  const data   = labels.map((_, i) => +(base + (Math.random()-0.5)*10*(i+1)).toFixed(2));
  data[data.length-1] = base;
  const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#1a1aff';
  stockChartInst = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{ label: sym, data, borderColor: accent, backgroundColor: accent+'22', fill: true, tension: 0.4, pointRadius: 5 }]
    },
    options: {
      responsive: true,
      plugins: { legend: { labels: { color: '#888' } } },
      scales: {
        x: { ticks: { color: '#888' }, grid: { color: 'rgba(128,128,128,0.15)' } },
        y: { ticks: { color: '#888' }, grid: { color: 'rgba(128,128,128,0.15)' } }
      }
    }
  });
}

// ── SEARCH ───────────────────────────────────────────────────

function webSearch() {
  const q = document.getElementById('searchQuery').value.trim();
  if (!q) return;
  window.open(`https://duckduckgo.com/?q=${encodeURIComponent(q)}`, '_blank');
  document.getElementById('searchResults').innerHTML = `
    <div class="glass-card" style="padding:20px 24px">
      <p style="font-size:14px;color:var(--text-2)">
        Opened DuckDuckGo in a new tab for: <strong style="color:var(--text)">${q}</strong>
      </p>
    </div>
  `;
}

// ── GAMES ────────────────────────────────────────────────────

function openGame(url) {
  window.open(url, '_blank');
}

// ── INIT ─────────────────────────────────────────────────────

// Close settings on overlay click already handled inline
// Keyboard shortcut: Escape
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeSettings();
});