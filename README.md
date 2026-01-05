# Weather by Frank

A modern React app that surfaces live conditions and a five-day forecast from the OpenWeatherMap API. Search any city, flip between Celsius and Fahrenheit, and view key highlights like humidity, wind, sunrise, and sunset with a glassy, responsive UI.

## Quick start

1) Install dependencies

```bash
npm install
```

2) Add your OpenWeatherMap API key

Create a `.env` file in the project root:

```
REACT_APP_OPENWEATHER_KEY=your_api_key_here
```

3) Run the app

```bash
npm start
```

Then open `http://localhost:3000`.

## Scripts

- `npm start` – launch the dev server with hot reload.
- `npm run build` – create a production build in `build/`.
- `npm test` – run the test watcher (CRA default setup).

## Features

- City search with instant form submission.
- Live current conditions: temp, feels-like, humidity, wind, day range, sunrise, sunset.
- Five-day outlook using the midday forecast slice.
- Unit toggle (Celsius/metric or Fahrenheit/imperial).
- Travel readiness advisor that flags storms, extreme temps, or high winds.
- Friendly error states for missing keys, invalid cities, and network hiccups.
- Responsive, animated glassmorphism-inspired UI.

## Demo

<video controls width="100%" src="https://raw.githubusercontent.com/frankwilz/Weather-app/main/public/weatherdemo.mp4" title="Weather by Frank demo"></video>

If the embed does not render on your device, [watch/download the demo here](https://raw.githubusercontent.com/frankwilz/Weather-app/main/public/weatherdemo.mp4).

## Running snapshot

Terminal after a successful run:

![Terminal view](public/Screenshot%202026-01-04%20at%2010.38.59%E2%80%AFPM.png)

## Project structure

- `src/App.js` – main container, data fetching, and state management.
- `src/components/` – UI pieces:
  - `SearchBar` – city input and submit control.
  - `UnitToggle` – Celsius/Fahrenheit switcher.
  - `CurrentWeather` – hero card for live conditions.
  - `StatCards` – humidity, wind, sunrise, sunset, and range highlights.
  - `TravelAdvice` – quick travel feasibility based on current conditions.
  - `ForecastRail` – five-day forecast tiles.
- `src/App.css` & `src/index.css` – layout, theme, and typography.

## API notes

Data comes from:

- Geocoding: `https://api.openweathermap.org/geo/1.0/direct`
- Current: `https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}`
- Climate forecast (Pro): `https://pro.openweathermap.org/data/2.5/forecast/climate?lat={lat}&lon={lon}`

All endpoints expect the `appid` query param set to your key and the `units` param set to `metric` or `imperial`. The climate endpoint requires an OpenWeatherMap Pro key. No key is bundled in this repo; you must supply your own.

## Deployment

Run `npm run build` and deploy the contents of `build/` to any static host (Netlify, Vercel, S3 + CloudFront, etc.). Set the `REACT_APP_OPENWEATHER_KEY` environment variable in your hosting provider before deploying.
