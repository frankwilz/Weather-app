const UnitToggle = ({ units, onChange }) => {
  const options = [
    { value: 'metric', label: 'Celsius' },
    { value: 'imperial', label: 'Fahrenheit' },
  ];

  return (
    <div className="toggle" role="group" aria-label="Temperature units">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className={units === option.value ? 'active' : ''}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
};

export default UnitToggle;
