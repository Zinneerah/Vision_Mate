// ============================================================
//  VisionMate – Weather Monitoring Module (v3)
//  weather.js  |  Live weather + forecast using Open-Meteo API
//  v3: Dynamic lat/lon support for GPS-driven weather updates
// ============================================================

const WEATHER_CONFIG = {
  // Default location: FB Area, Karachi (hardware-linked zone)
  lat: 24.9352,
  lon: 67.0822,
  units: 'metric'
};

// ── WMO Weather code descriptions ──────────────────────────────
const WMO_CODES = {
  0:'Clear sky', 1:'Mainly clear', 2:'Partly cloudy', 3:'Overcast',
  45:'Foggy', 48:'Icy fog',
  51:'Light drizzle', 53:'Moderate drizzle', 55:'Dense drizzle',
  61:'Slight rain', 63:'Moderate rain', 65:'Heavy rain',
  71:'Slight snow', 73:'Moderate snow', 75:'Heavy snow',
  77:'Snow grains',
  80:'Slight showers', 81:'Moderate showers', 82:'Violent showers',
  85:'Slight snow showers', 86:'Heavy snow showers',
  95:'Thunderstorm', 96:'Thunderstorm w/ hail', 99:'Thunderstorm w/ heavy hail'
};

// ── Update location (called when GPS data arrives from Firebase) ──
function setWeatherLocation(lat, lon) {
  if (lat && lon && !isNaN(lat) && !isNaN(lon)) {
    WEATHER_CONFIG.lat = lat;
    WEATHER_CONFIG.lon = lon;
  }
}

// ── Fetch current weather ──────────────────────────────────────
async function getWeather(lat, lon) {
  const useLat = lat || WEATHER_CONFIG.lat;
  const useLon = lon || WEATHER_CONFIG.lon;
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${useLat}&longitude=${useLon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&wind_speed_unit=kmh&timezone=auto`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Open-Meteo HTTP ' + res.status);
    const raw = await res.json();
    const c = raw.current;
    return {
      tempC: Math.round(c.temperature_2m),
      condition: WMO_CODES[c.weather_code] || 'Unknown',
      humidity: c.relative_humidity_2m,
      windKph: Math.round(c.wind_speed_10m),
      updatedAt: new Date().toISOString(),
      isPlaceholder: false,
      lat: useLat,
      lon: useLon
    };
  } catch (e) {
    console.warn('[VisionMate Weather] Fetch failed, using placeholder:', e.message);
    return { tempC: 31, condition: 'Sunny', humidity: 58, windKph: 14, updatedAt: new Date().toISOString(), isPlaceholder: true };
  }
}

// ── Fetch 7-day forecast ───────────────────────────────────────
async function getForecast(lat, lon) {
  const useLat = lat || WEATHER_CONFIG.lat;
  const useLon = lon || WEATHER_CONFIG.lon;
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${useLat}&longitude=${useLon}&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max&wind_speed_unit=kmh&timezone=auto&forecast_days=7`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Open-Meteo forecast HTTP ' + res.status);
    const raw = await res.json();
    const d = raw.daily;
    return d.time.map((date, i) => ({
      date,
      condition: WMO_CODES[d.weather_code[i]] || 'Unknown',
      weatherCode: d.weather_code[i],
      maxTemp: Math.round(d.temperature_2m_max[i]),
      minTemp: Math.round(d.temperature_2m_min[i]),
      rainChance: d.precipitation_probability_max[i],
      maxWind: Math.round(d.wind_speed_10m_max[i])
    }));
  } catch (e) {
    console.warn('[VisionMate Weather] Forecast fetch failed:', e.message);
    return null;
  }
}

// ── Risk assessment helper ─────────────────────────────────────
function getWeatherRisk(forecast) {
  if (!forecast || !forecast.length) return { level: 'Low', color: 'success', alerts: [] };
  const alerts = [];
  const today = forecast[0];
  const tomorrow = forecast[1];

  if (today.rainChance >= 70) alerts.push(`Rain likely today (${today.rainChance}% chance)`);
  if (tomorrow && tomorrow.rainChance >= 70) alerts.push(`Heavy rain expected tomorrow (${tomorrow.rainChance}% chance)`);
  if (today.maxTemp >= 40) alerts.push(`High temperature alert: ${today.maxTemp}°C today`);
  if (today.maxWind >= 50) alerts.push(`Strong winds expected: ${today.maxWind} km/h`);
  if (today.weatherCode >= 95) alerts.push('Thunderstorm warning active');
  if (today.rainChance >= 50 && !alerts.some(a => a.includes('Rain')))
    alerts.push(`Rain possible today (${today.rainChance}% chance)`);

  const level = alerts.length === 0 ? 'Low' : alerts.length === 1 ? 'Moderate' : 'High';
  const color = level === 'Low' ? 'success' : level === 'Moderate' ? 'warning' : 'danger';
  return { level, color, alerts };
}

// ── Icon + color helper ────────────────────────────────────────
function getWeatherIcon(condition) {
  const c = (condition || '').toLowerCase();
  if (c.includes('rain') || c.includes('drizzle') || c.includes('shower')) return { icon: 'bi-cloud-rain-fill', color: '#3B82F6' };
  if (c.includes('thunder')) return { icon: 'bi-cloud-lightning-rain-fill', color: '#7C3AED' };
  if (c.includes('snow')) return { icon: 'bi-snow', color: '#06B6D4' };
  if (c.includes('fog') || c.includes('mist') || c.includes('haze')) return { icon: 'bi-cloud-haze2-fill', color: '#94A3B8' };
  if (c.includes('cloud') || c.includes('overcast')) return { icon: 'bi-cloud-fill', color: '#64748B' };
  if (c.includes('clear') || c.includes('sun') || c.includes('mainly clear') || c.includes('partly')) return { icon: 'bi-sun-fill', color: '#F59E0B' };
  return { icon: 'bi-sun-fill', color: '#F59E0B' };
}

// ── Day label helper ──────────────────────────────────────────
function getDayLabel(dateStr, index) {
  if (index === 0) return 'Today';
  if (index === 1) return 'Tomorrow';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-PK', { weekday: 'short', month: 'short', day: 'numeric' });
}

window.VMWeather = { getWeather, getForecast, getWeatherIcon, getWeatherRisk, getDayLabel, setWeatherLocation, WEATHER_CONFIG };
console.log('[VisionMate] Weather module v3 loaded (Open-Meteo — dynamic GPS location support).');
