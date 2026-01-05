import { useEffect, useState } from 'react';
import './App.css';
import CurrentWeather from './components/CurrentWeather';
import ForecastRail from './components/ForecastRail';
import SearchBar from './components/SearchBar';
import StatCards from './components/StatCards';
import UnitToggle from './components/UnitToggle';
import TravelAdvice from './components/TravelAdvice';

const API_BASE = 'https://api.openweathermap.org/data/2.5';
const CLIMATE_BASE = 'https://pro.openweathermap.org/data/2.5';
const GEO_BASE = 'https://api.openweathermap.org/geo/1.0';
const API_KEY = process.env.REACT_APP_OPENWEATHER_KEY;
const DEFAULT_CITY = 'Seattle';

const formatCurrent = (payload) => ({
  city: payload?.name,
  country: payload?.sys?.country,
  description: payload?.weather?.[0]?.description,
  conditionId: payload?.weather?.[0]?.id,
  icon: payload?.weather?.[0]?.icon,
  temp: Math.round(payload?.main?.temp),
  feelsLike: Math.round(payload?.main?.feels_like),
  humidity: payload?.main?.humidity,
  wind: Math.round(payload?.wind?.speed ?? 0),
  min: Math.round(payload?.main?.temp_min),
  max: Math.round(payload?.main?.temp_max),
  sunrise: payload?.sys?.sunrise,
  sunset: payload?.sys?.sunset,
  dt: payload?.dt,
  timezone: payload?.timezone,
});

const getPrimaryTemp = (entry) => {
  const { temp, main } = entry || {};
  if (typeof temp === 'number') return temp;
  if (temp?.day) return temp.day;
  if (temp?.average) return temp.average;
  if (temp?.avg) return temp.avg;
  if (temp?.mean) return temp.mean;
  if (temp?.max && temp?.min) return (temp.max + temp.min) / 2;
  if (temp?.max) return temp.max;
  if (temp?.min) return temp.min;
  if (main?.temp) return main.temp;
  return null;
};

const buildForecast = (list = []) =>
  list.slice(0, 5).map((entry, idx) => ({
    date: entry?.dt ? entry.dt * 1000 : Date.now() + idx * 24 * 60 * 60 * 1000,
    icon: entry?.weather?.[0]?.icon,
    description: entry?.weather?.[0]?.description,
    temp: Math.round(getPrimaryTemp(entry) ?? 0),
  }));

const geocodeCity = async (city) => {
  const res = await fetch(`${GEO_BASE}/direct?q=${encodeURIComponent(city)}&limit=1&appid=${API_KEY}`);
  if (!res.ok) {
    throw new Error('Unable to resolve that location right now.');
  }
  const data = await res.json();
  if (!data.length) {
    throw new Error('City not found. Try another search.');
  }
  return data[0];
};

const evaluateTravelAdvice = (data, units) => {
  if (!data) return null;

  const code = data.conditionId || 0;
  const windyThreshold = units === 'metric' ? 14 : 31; // ~31 mph
  const cold = units === 'metric' ? data.temp < 0 : data.temp < 32;
  const hot = units === 'metric' ? data.temp > 35 : data.temp > 95;
  const windy = (data.wind || 0) >= windyThreshold;
  const stormy = code >= 200 && code < 600; // thunderstorm or rain/snow

  if (stormy || windy || cold || hot) {
    const reasons = [];
    if (stormy) reasons.push('Active storm systems in the area');
    if (windy) reasons.push('High winds could affect travel comfort');
    if (cold) reasons.push('Temperatures are below freezing');
    if (hot) reasons.push('Heat levels are elevated');

    return {
      tone: 'caution',
      headline: 'Travel with caution',
      detail: reasons.join(' • '),
    };
  }

  return {
    tone: 'good',
    headline: 'Good to go',
    detail: 'Weather looks calm for travel right now.',
  };
};

function App() {
  const [query, setQuery] = useState(DEFAULT_CITY);
  const [units, setUnits] = useState('metric');
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');

  const unitLabel = units === 'metric' ? '°C' : '°F';
  const windLabel = units === 'metric' ? 'm/s' : 'mph';

  const fetchWeather = async (city, nextUnits = units) => {
    const trimmed = city.trim();

    if (!API_KEY) {
      setError('Add your OpenWeatherMap key to a .env file as REACT_APP_OPENWEATHER_KEY.');
      setStatus('idle');
      return;
    }

    if (!trimmed) {
      setError('Please enter a city to search.');
      setStatus('idle');
      return;
    }

    setStatus('loading');
    setError('');

    try {
      const coords = await geocodeCity(trimmed);

      const currentRes = await fetch(
        `${API_BASE}/weather?lat=${coords.lat}&lon=${coords.lon}&units=${nextUnits}&appid=${API_KEY}`
      );

      if (!currentRes.ok) {
        const message = currentRes.status === 404 ? 'City not found. Try another search.' : 'Unable to fetch weather right now.';
        throw new Error(message);
      }

      let forecastData;
      try {
        const climateRes = await fetch(
          `${CLIMATE_BASE}/forecast/climate?lat=${coords.lat}&lon=${coords.lon}&units=${nextUnits}&appid=${API_KEY}`
        );
        if (!climateRes.ok) {
          throw new Error('Climate endpoint unavailable');
        }
        forecastData = await climateRes.json();
      } catch (climateError) {
        const fallbackRes = await fetch(
          `${API_BASE}/forecast?lat=${coords.lat}&lon=${coords.lon}&units=${nextUnits}&appid=${API_KEY}`
        );
        if (!fallbackRes.ok) {
          throw new Error('Unable to load the forecast right now.');
        }
        forecastData = await fallbackRes.json();
      }

      const currentData = await currentRes.json();

      const formattedCurrent = formatCurrent(currentData);
      setWeather({
        ...formattedCurrent,
        city: formattedCurrent.city || coords.name,
        country: formattedCurrent.country || coords.country,
      });
      setForecast(buildForecast(forecastData.list || []));
      setStatus('ready');
    } catch (err) {
      setError(err.message || 'Something went wrong. Try again.');
      setStatus('idle');
    }
  };

  useEffect(() => {
    fetchWeather(query, units);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [units]);

  const handleSearch = (value) => {
    setQuery(value);
    fetchWeather(value, units);
  };

  return (
    <div className="page">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <main className="shell">
        <header className="hero">
          <div>
            <p className="eyebrow">OpenWeatherMap • Live</p>
            <h1>Weather by Frank</h1>
            <p className="lede">Search any city to see live conditions and a rolling five day outlook.</p>
          </div>
          <UnitToggle units={units} onChange={setUnits} />
        </header>

        <SearchBar value={query} onSubmit={handleSearch} loading={status === 'loading'} />

        {error && <div className="alert">{error}</div>}

        <section className="content">
          <div className="stack">
            <CurrentWeather data={weather} status={status} unitLabel={unitLabel} />
            <StatCards data={weather} unitLabel={unitLabel} windLabel={windLabel} status={status} />
            <TravelAdvice advice={evaluateTravelAdvice(weather, units)} status={status} />
          </div>
          <ForecastRail items={forecast} status={status} unitLabel={unitLabel} />
        </section>
      </main>
    </div>
  );
}

export default App;
