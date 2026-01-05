const formatSunTime = (timestamp, timezone) => {
  if (!timestamp) {
    return '—';
  }

  const local = new Date((timestamp + (timezone || 0)) * 1000);
  return local.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const StatCards = ({ data, unitLabel, windLabel, status }) => {
  if (status === 'loading' && !data) {
    return (
      <div className="card stats">
        <p className="label">Atmospheric highlights</p>
        <p className="muted">Pulling readings...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="card stats">
        <p className="label">Atmospheric highlights</p>
        <p className="muted">Highlights will appear once a city is loaded.</p>
      </div>
    );
  }

  const stats = [
    { label: 'Humidity', value: `${data.humidity ?? '—'}%` },
    { label: 'Wind', value: `${data.wind ?? '—'} ${windLabel}` },
    { label: 'Sunrise', value: formatSunTime(data.sunrise, data.timezone) },
    { label: 'Sunset', value: formatSunTime(data.sunset, data.timezone) },
    { label: 'Feels like', value: `${data.feelsLike}${unitLabel}` },
    { label: 'Day range', value: `${data.min}${unitLabel} – ${data.max}${unitLabel}` },
  ];

  return (
    <div className="card stats">
      <p className="label">Atmospheric highlights</p>
      <div className="stats-grid">
        {stats.map((stat) => (
          <div className="stat" key={stat.label}>
            <p className="muted">{stat.label}</p>
            <p className="stat-value">{stat.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StatCards;
