const TravelAdvice = ({ advice, status }) => {
  if (status === 'loading' && !advice) {
    return (
      <div className="card advice">
        <p className="label">Travel check</p>
        <p className="muted">Assessing conditions...</p>
      </div>
    );
  }

  if (!advice) {
    return (
      <div className="card advice">
        <p className="label">Travel check</p>
        <p className="muted">Advice will appear once a city is loaded.</p>
      </div>
    );
  }

  return (
    <div className={`card advice ${advice.tone}`}>
      <div className="advice-header">
        <p className="label">Travel check</p>
        <span className="pill">{advice.tone === 'good' ? 'Clear' : 'Caution'}</span>
      </div>
      <h3 className="advice-title">{advice.headline}</h3>
      <p className="muted">{advice.detail}</p>
    </div>
  );
};

export default TravelAdvice;
