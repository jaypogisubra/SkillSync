export default function JobSearchSection() {
  function handleSearch(event) {
    event.preventDefault();
  }

  return (
    <section className="job-search-section">
      <form className="job-search-card" onSubmit={handleSearch}>
        <div className="search-heading">
          <span>⌕</span>
          <div>
            <h2>Start exploring opportunities</h2>
            <p>Search by role, skill, company, or preferred location.</p>
          </div>
        </div>

        <div className="search-fields">
          <label className="search-input">
            <span>⌕</span>
            <input type="text" placeholder="Job title, keyword, or company" />
          </label>

          <label className="search-input">
            <span>⌖</span>
            <input type="text" placeholder="Location" />
          </label>

          <select defaultValue="">
            <option value="" disabled>
              Job Type
            </option>
            <option value="full-time">Full Time</option>
            <option value="part-time">Part Time</option>
            <option value="remote">Remote</option>
            <option value="internship">Internship</option>
          </select>

          <button type="submit">Search Job</button>
        </div>
      </form>
    </section>
  );
}