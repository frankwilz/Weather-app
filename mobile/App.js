import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Keyboard,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';

const API_BASE = 'https://api.openweathermap.org/data/2.5';
const CLIMATE_BASE = 'https://pro.openweathermap.org/data/2.5';
const GEO_BASE = 'https://api.openweathermap.org/geo/1.0';
const API_KEY = process.env.EXPO_PUBLIC_OPENWEATHER_KEY || '';
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
  const response = await fetch(`${GEO_BASE}/direct?q=${encodeURIComponent(city)}&limit=1&appid=${API_KEY}`);
  if (!response.ok) {
    throw new Error('Unable to resolve that location right now.');
  }
  const data = await response.json();
  if (!data.length) {
    throw new Error('City not found. Try another search.');
  }
  return data[0];
};

const formatTime = (timestamp, timezone) => {
  if (!timestamp) return '—';
  const local = new Date((timestamp + (timezone || 0)) * 1000);
  return local.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const formatDay = (date) =>
  new Date(date).toLocaleDateString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

const evaluateTravelAdvice = (data, units) => {
  if (!data) return null;
  const code = data.conditionId || 0;
  const windyThreshold = units === 'metric' ? 14 : 31;
  const cold = units === 'metric' ? data.temp < 0 : data.temp < 32;
  const hot = units === 'metric' ? data.temp > 35 : data.temp > 95;
  const windy = (data.wind || 0) >= windyThreshold;
  const stormy = code >= 200 && code < 600;

  if (stormy || windy || cold || hot) {
    const reasons = [];
    if (stormy) reasons.push('Active storm systems');
    if (windy) reasons.push('High winds');
    if (cold) reasons.push('Below freezing');
    if (hot) reasons.push('Heat elevated');
    return {
      tone: 'caution',
      title: 'Travel with caution',
      detail: reasons.join(' • '),
    };
  }
  return {
    tone: 'good',
    title: 'Good to go',
    detail: 'Weather looks calm for travel right now.',
  };
};

const SectionTitle = ({ children }) => <Text style={styles.sectionTitle}>{children}</Text>;

const WeatherApp = () => {
  const [query, setQuery] = useState(DEFAULT_CITY);
  const [draft, setDraft] = useState(DEFAULT_CITY);
  const [units, setUnits] = useState('metric');
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');

  const unitLabel = units === 'metric' ? '°C' : '°F';
  const windLabel = units === 'metric' ? 'm/s' : 'mph';
  const advice = useMemo(() => evaluateTravelAdvice(weather, units), [weather, units]);
  const titleCase = (text = '') =>
    text
      .split(' ')
      .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
      .join(' ');

  const fetchWeather = async (city, nextUnits = units) => {
    const trimmed = city.trim();
    if (!API_KEY) {
      setError('Add your OpenWeatherMap key in EXPO_PUBLIC_OPENWEATHER_KEY.');
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
      } catch (forecastError) {
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
      setQuery(formattedCurrent.city || trimmed);
      setDraft(formattedCurrent.city || trimmed);
    } catch (err) {
      setError(err.message || 'Something went wrong. Try again.');
      setStatus('idle');
    }
  };

  useEffect(() => {
    fetchWeather(query, units);
  }, [units]);

  const onSubmit = () => {
    Keyboard.dismiss();
    fetchWeather(draft, units);
  };

  const onUnitPress = (nextUnits) => {
    setUnits(nextUnits);
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <StatusBar style="light" />
      <Text style={styles.eyebrow}>OpenWeatherMap • Live</Text>
      <Text style={styles.title}>Weather by Frank</Text>
      <Text style={styles.subtitle}>Search any city to see live conditions and outlook.</Text>

      <View style={styles.toggleRow}>
        {[
          { value: 'metric', label: '°C' },
          { value: 'imperial', label: '°F' },
        ].map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[styles.toggleButton, units === option.value && styles.toggleButtonActive]}
            onPress={() => onUnitPress(option.value)}
          >
            <Text style={[styles.toggleText, units === option.value && styles.toggleTextActive]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.searchRow}>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          onSubmitEditing={onSubmit}
          placeholder="Search city e.g. Lisbon"
          placeholderTextColor="#c8cedf"
          style={styles.searchInput}
          returnKeyType="search"
        />
        <TouchableOpacity
          style={[styles.searchButton, status === 'loading' && styles.searchButtonDisabled]}
          onPress={onSubmit}
          disabled={status === 'loading'}
        >
          <Text style={styles.searchButtonText}>{status === 'loading' ? 'Searching…' : 'Update'}</Text>
        </TouchableOpacity>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.card}>
        <SectionTitle>Current conditions</SectionTitle>
        {!weather ? (
          <Text style={styles.muted}>{status === 'loading' ? 'Fetching live readings…' : 'Search for a city to see the weather.'}</Text>
        ) : (
          <View style={styles.currentRow}>
            <View style={styles.currentText}>
              <Text style={styles.locationText}>
                {weather.city}
                {weather.country ? `, ${weather.country}` : ''}
              </Text>
              <Text style={styles.muted}>{titleCase(weather.description || '')}</Text>
              <Text style={styles.temp}>
                {weather.temp}
                {unitLabel}
              </Text>
              <Text style={styles.muted}>Feels like {weather.feelsLike}{unitLabel}</Text>
              <Text style={styles.muted}>
                High {weather.max}
                {unitLabel} · Low {weather.min}
                {unitLabel}
              </Text>
              <Text style={styles.subtle}>Updated {formatTime(weather.dt, weather.timezone)}</Text>
            </View>
            {weather.icon ? (
              <Image
                source={{ uri: `https://openweathermap.org/img/wn/${weather.icon}@4x.png` }}
                style={styles.icon}
              />
            ) : null}
          </View>
        )}
      </View>

      <View style={styles.card}>
        <SectionTitle>Atmospheric highlights</SectionTitle>
        {status === 'loading' && !weather ? (
          <ActivityIndicator color="#7de1fa" />
        ) : !weather ? (
          <Text style={styles.muted}>Highlights will appear once a city is loaded.</Text>
        ) : (
          <View style={styles.statsGrid}>
            {[
              `Humidity: ${weather.humidity ?? '—'}%`,
              `Wind: ${weather.wind ?? '—'} ${windLabel}`,
              `Sunrise: ${formatTime(weather.sunrise, weather.timezone)}`,
              `Sunset: ${formatTime(weather.sunset, weather.timezone)}`,
              `Feels like: ${weather.feelsLike}${unitLabel}`,
              `Day range: ${weather.min}${unitLabel} – ${weather.max}${unitLabel}`,
            ].map((item) => (
              <Text key={item} style={styles.stat}>
                {item}
              </Text>
            ))}
          </View>
        )}
      </View>

      <View style={[styles.card, advice?.tone === 'good' ? styles.adviceGood : styles.adviceCaution]}>
        <SectionTitle>Travel check</SectionTitle>
        {!advice ? (
          <Text style={styles.muted}>Advice will appear once a city is loaded.</Text>
        ) : status === 'loading' ? (
          <ActivityIndicator color="#7de1fa" />
        ) : (
          <>
            <Text style={styles.adviceTitle}>{advice.title}</Text>
            <Text style={styles.muted}>{advice.detail}</Text>
          </>
        )}
      </View>

      <View style={styles.card}>
        <SectionTitle>5 day outlook</SectionTitle>
        {status === 'loading' && !forecast.length ? (
          <ActivityIndicator color="#7de1fa" />
        ) : !forecast.length ? (
          <Text style={styles.muted}>Forecast arrives after your first search.</Text>
        ) : (
          <View style={styles.forecastGrid}>
            {forecast.map((entry) => (
              <View key={entry.date} style={styles.forecastItem}>
                <Text style={styles.forecastDay}>{formatDay(entry.date)}</Text>
                {entry.icon ? (
                  <Image
                    source={{ uri: `https://openweathermap.org/img/wn/${entry.icon}@2x.png` }}
                    style={styles.forecastIcon}
                  />
                ) : null}
                <Text style={styles.forecastTemp}>
                  {entry.temp}
                  {unitLabel}
                </Text>
                <Text style={styles.forecastDescription}>{entry.description}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {status === 'loading' && weather ? <ActivityIndicator style={{ marginTop: 12 }} color="#7de1fa" /> : null}
    </ScrollView>
  );
};

export default function App() {
  return <WeatherApp />;
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#0c1023',
    paddingBottom: 34,
  },
  eyebrow: {
    color: '#c4c9d4',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 6,
  },
  title: {
    color: '#f5f7ff',
    fontSize: 34,
    fontWeight: '700',
    marginBottom: 6,
  },
  subtitle: {
    color: '#b9bfd2',
    marginBottom: 16,
  },
  toggleRow: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    borderRadius: 12,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    marginBottom: 16,
    padding: 4,
    backgroundColor: 'rgba(12, 22, 46, 0.8)',
  },
  toggleButton: {
    width: 52,
    borderRadius: 9,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 2,
  },
  toggleButtonActive: {
    backgroundColor: '#7b8bff',
  },
  toggleText: {
    color: '#e8ecf6',
    fontWeight: '700',
  },
  toggleTextActive: {
    color: '#0c1023',
  },
  searchRow: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    backgroundColor: 'rgba(12, 22, 46, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    borderRadius: 12,
    color: '#f5f7ff',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  searchButton: {
    minWidth: 95,
    borderRadius: 10,
    backgroundColor: '#7de1fa',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  searchButtonDisabled: {
    opacity: 0.75,
  },
  searchButtonText: {
    color: '#0c1023',
    fontWeight: '700',
  },
  error: {
    color: '#ffc2c2',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 90, 90, 0.25)',
    padding: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 90, 90, 0.12)',
  },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    backgroundColor: 'rgba(12, 22, 46, 0.7)',
    padding: 14,
    marginBottom: 14,
  },
  sectionTitle: {
    color: '#d4d9e5',
    fontWeight: '700',
    marginBottom: 10,
    letterSpacing: 0.4,
  },
  muted: {
    color: '#c4c9d4',
    marginTop: 4,
  },
  subtle: {
    color: '#9da2b5',
    marginTop: 4,
  },
  currentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  currentText: {
    flex: 1,
  },
  locationText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#f5f7ff',
  },
  temp: {
    fontSize: 54,
    fontWeight: '800',
    color: '#f5f7ff',
    marginTop: 8,
  },
  icon: {
    width: 90,
    height: 90,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  stat: {
    width: '48%',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 10,
    padding: 10,
    color: '#f5f7ff',
  },
  adviceGood: {
    borderColor: 'rgba(109, 230, 182, 0.4)',
    backgroundColor: 'rgba(109, 230, 182, 0.1)',
  },
  adviceCaution: {
    borderColor: 'rgba(255, 173, 96, 0.45)',
    backgroundColor: 'rgba(255, 173, 96, 0.1)',
  },
  adviceTitle: {
    color: '#f5f7ff',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 6,
  },
  forecastGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  forecastItem: {
    width: '31%',
    minWidth: 100,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 12,
    alignItems: 'center',
    padding: 10,
    marginBottom: 8,
  },
  forecastDay: {
    color: '#c4c9d4',
    fontSize: 12,
    marginBottom: 4,
  },
  forecastIcon: {
    width: 50,
    height: 50,
  },
  forecastTemp: {
    color: '#f5f7ff',
    fontWeight: '700',
    marginBottom: 4,
  },
  forecastDescription: {
    color: '#bac0d5',
    textAlign: 'center',
    fontSize: 12,
  },
});
