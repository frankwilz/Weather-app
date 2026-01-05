import { useEffect, useState } from 'react';

const SearchBar = ({ value, onSubmit, loading }) => {
  const [term, setTerm] = useState(value || '');

  useEffect(() => {
    setTerm(value || '');
  }, [value]);

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit(term);
  };

  return (
    <form className="search" onSubmit={handleSubmit}>
      <div className="search-field">
        <input
          aria-label="Search city"
          placeholder="Search for a city (e.g., Lisbon, Tokyo, Mexico City)"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Searching...' : 'Update'}
        </button>
      </div>
    </form>
  );
};

export default SearchBar;
