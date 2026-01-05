const formatDay = (date) =>
  new Date(date).toLocaleDateString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

const ForecastRail = ({ items, status, unitLabel }) => {
  if (status === 'loading' && items.length === 0) {
    return (
      <div className="card forecast">
        <p className="label">5 day outlook</p>
        <p className="muted">Loading forecast...</p>
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="card forecast">
        <p className="label">5 day outlook</p>
        <p className="muted">Forecast arrives after your first search.</p>
      </div>
    );
  }

  return (
    <div className="card forecast">
      <p className="label">5 day outlook</p>
      <div className="forecast-grid">
        {items.map((entry) => (
          <article className="forecast-day" key={entry.date}>
            <p className="muted">{formatDay(entry.date)}</p>
            {entry.icon ? (
              <img
                src={`https://openweathermap.org/img/wn/${entry.icon}@2x.png`}
                alt={entry.description}
                loading="lazy"
              />
            ) : null}
            <p className="forecast-temp">
              {entry.temp}
              {unitLabel}
            </p>
            <p className="muted">{entry.description}</p>
          </article>
        ))}
      </div>
    </div>
  );
};

export default ForecastRail;
