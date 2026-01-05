const formatTime = (timestamp, timezone) => {
  if (!timestamp) {
    return '—';
  }

  const local = new Date((timestamp + (timezone || 0)) * 1000);
  return local.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const titleCase = (text = '') =>
  text
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

const CurrentWeather = ({ data, status, unitLabel }) => {
  if (status === 'loading' && !data) {
    return (
      <div className="card current">
        <p className="label">Current conditions</p>
        <p className="muted">Fetching live readings...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="card current">
        <p className="label">Current conditions</p>
        <p className="muted">Search for a city to see the weather.</p>
      </div>
    );
  }

  return (
    <div className="card current">
      <div className="card-top">
        <p className="label">Current conditions</p>
        <p className="muted">Updated {formatTime(data.dt, data.timezone)}</p>
      </div>
      <div className="current-body">
        <div className="current-meta">
          <p className="city">
            {data.city}
            {data.country ? `, ${data.country}` : ''}
          </p>
          <p className="description">{titleCase(data.description || '')}</p>
          <div className="temp-line">
            <span className="temp">
              {data.temp}
              {unitLabel}
            </span>
            <span className="feels">
              Feels like {data.feelsLike}
              {unitLabel}
            </span>
          </div>
          <p className="range">
            High {data.max}
            {unitLabel} · Low {data.min}
            {unitLabel}
          </p>
        </div>
        {data.icon ? (
          <div className="current-icon">
            <img
              src={`https://openweathermap.org/img/wn/${data.icon}@2x.png`}
              alt={data.description}
              loading="lazy"
            />
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default CurrentWeather;
