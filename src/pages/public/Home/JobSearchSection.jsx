import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

// Comprehensive list of major areas across the Philippines
const PHILIPPINES_LOCATIONS = [
  'Manila, Metro Manila', 'Quezon City, Metro Manila', 'Makati, Metro Manila', 'Taguig, Metro Manila', 
  'Pasig, Metro Manila', 'Mandaluyong, Metro Manila', 'Pasay, Metro Manila', 'Parañaque, Metro Manila',
  'Angeles City, Pampanga', 'San Fernando, Pampanga', 'Olongapo City, Zambales', 'Baguio City, Benguet',
  'Laoag City, Ilocos Norte', 'Dagupan City, Pangasinan', 'San Fernando, La Union', 'Malolos City, Bulacan',
  'Bacoor City, Cavite', 'Dasmariñas City, Cavite', 'Imus City, Cavite', 'Tagaytay City, Cavite',
  'Biñan City, Laguna', 'Calamba City, Laguna', 'Santa Rosa City, Laguna', 'Lipa City, Batangas',
  'Batangas City, Batangas', 'Puerto Princesa, Palawan', 'Naga City, Camarines Sur', 'Legazpi City, Albay',
  'Cebu City, Central Visayas', 'Mandaue City, Central Visayas', 'Lapu-Lapu City, Central Visayas',
  'Tagbilaran City, Bohol', 'Dumaguete City, Negros Oriental', 'Iloilo City, Western Visayas',
  'Bacolod City, Negros Occidental', 'Roxas City, Capiz', 'Tacloban City, Eastern Visayas', 'Ormoc City, Leyte',
  'Davao City, Davao Region', 'Tagum City, Davao del Norte', 'Digos City, Davao del Sur', 'Mati City, Davao Oriental',
  'Panabo City, Davao del Norte', 'Cagayan de Oro, Northern Mindanao', 'Iligan City, Northern Mindanao',
  'General Santos, Soccsksargen', 'Koronadal City, South Cotabato', 'Zamboanga City, Zamboanga Peninsula',
  'Butuan City, Caraga', 'Surigao City, Caraga', 'Cotabato City, BARMM'
];

// Sample list of common Job Titles / Keywords for SkillSync
const POPULAR_JOB_TITLES = [
  'Web Developer',
  'Frontend Developer',
  'Backend Developer',
  'Full Stack Developer',
  'Mobile Application Developer',
  'UI/UX Designer',
  'Data Analyst',
  'Software Engineer',
  'IT Support Specialist',
  'Network Administrator',
  'Customer Service Representative',
  'Technical Support Associate',
  'Quality Assurance Engineer',
  'Project Manager',
  'Virtual Assistant'
];

export default function JobSearchSection() {
  const navigate = useNavigate();

  // 1. Setup States for Inputs
  const [keywordInput, setKeywordInput] = useState('');
  const [locationInput, setLocationInput] = useState('');
  const [jobType, setJobType] = useState('');
  
  // 2. Setup States/Refs for Job Title Dropdown
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [showJobDropdown, setShowJobDropdown] = useState(false);
  const jobDropdownRef = useRef(null);

  // 3. Setup States/Refs for Location Dropdown
  const [filteredLocations, setFilteredLocations] = useState([]);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const locationDropdownRef = useRef(null);

  // 4. Form Submit Handler
  function handleSearch(event) {
    event.preventDefault();
    const params = new URLSearchParams();
    if (keywordInput) params.append('keyword', keywordInput);
    if (locationInput) params.append('location', locationInput);
    if (jobType) params.append('type', jobType);
    
    navigate(`/browse-jobs?${params.toString()}`);
  }

  // 5. EFFECT: Filter JOB TITLES dynamically
  useEffect(() => {
    if (keywordInput.trim() === '') {
      setFilteredJobs([]);
      return;
    }
    const filtered = POPULAR_JOB_TITLES.filter(job =>
      job.toLowerCase().includes(keywordInput.toLowerCase())
    );
    setFilteredJobs(filtered);
  }, [keywordInput]);

  // 6. EFFECT: Filter LOCATIONS dynamically
  useEffect(() => {
    if (locationInput.trim() === '') {
      setFilteredLocations([]);
      return;
    }
    const filtered = PHILIPPINES_LOCATIONS.filter(loc =>
      loc.toLowerCase().includes(locationInput.toLowerCase())
    );
    setFilteredLocations(filtered);
  }, [locationInput]);

  // 7. EFFECT: Close dropdowns if clicking completely outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (jobDropdownRef.current && !jobDropdownRef.current.contains(event.target)) {
        setShowJobDropdown(false);
      }
      if (locationDropdownRef.current && !locationDropdownRef.current.contains(event.target)) {
        setShowLocationDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
          
          {/* --- JOB TITLE / KEYWORD DROPDOWN CONTAINER --- */}
          <div 
            className="search-input" 
            ref={jobDropdownRef} 
            style={{ position: 'relative', display: 'flex', alignItems: 'center' }}
          >
            <span>⌕</span>
            <input 
              type="text" 
              placeholder="Job title, keyword, or company" 
              value={keywordInput}
              onChange={(e) => {
                setKeywordInput(e.target.value);
                setShowJobDropdown(true);
              }}
              onFocus={() => setShowJobDropdown(true)}
              style={{ width: '100%', border: 'none', outline: 'none', background: 'transparent' }}
            />

            {/* Job Suggestions List */}
            {showJobDropdown && filteredJobs.length > 0 && (
              <ul style={{
                position: 'absolute',
                top: '110%',
                left: 0,
                right: 0,
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                maxHeight: '220px',
                overflowY: 'auto',
                zIndex: 1000, // Slightly higher zIndex to ensure it covers elements
                listStyle: 'none',
                padding: '6px 0',
                margin: 0,
                textAlign: 'left'
              }}>
                {filteredJobs.map((job, index) => (
                  <li
                    key={index}
                    onClick={() => {
                      setKeywordInput(job);
                      setShowJobDropdown(false);
                    }}
                    style={{
                      padding: '10px 16px',
                      cursor: 'pointer',
                      color: '#2d3748',
                      fontSize: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#f7fafc'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                  >
                    🔍 {job}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* --- LOCATION DROPDOWN CONTAINER --- */}
          <div 
            className="search-input" 
            ref={locationDropdownRef} 
            style={{ position: 'relative', display: 'flex', alignItems: 'center' }}
          >
            <span>⌖</span>
            <input 
              type="text" 
              placeholder="Location" 
              value={locationInput}
              onChange={(e) => {
                setLocationInput(e.target.value);
                setShowLocationDropdown(true);
              }}
              onFocus={() => setShowLocationDropdown(true)}
              style={{ width: '100%', border: 'none', outline: 'none', background: 'transparent' }}
            />

            {/* Location Suggestions List */}
            {showLocationDropdown && filteredLocations.length > 0 && (
              <ul style={{
                position: 'absolute',
                top: '110%',
                left: 0,
                right: 0,
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                maxHeight: '220px',
                overflowY: 'auto',
                zIndex: 999,
                listStyle: 'none',
                padding: '6px 0',
                margin: 0,
                textAlign: 'left'
              }}>
                {filteredLocations.map((location, index) => (
                  <li
                    key={index}
                    onClick={() => {
                      setLocationInput(location);
                      setShowLocationDropdown(false);
                    }}
                    style={{
                      padding: '10px 16px',
                      cursor: 'pointer',
                      color: '#2d3748',
                      fontSize: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#f7fafc'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                  >
                    📍 {location}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* --- JOB TYPE SELECT --- */}
          <select 
            value={jobType} 
            onChange={(e) => setJobType(e.target.value)}
          >
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