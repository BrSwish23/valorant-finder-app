import React, { useState, useRef, useEffect } from 'react';

const RankFilterSection = ({ onFilterChange, selectedFilter = 'all' }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const rankRanges = [
    { value: 'all', label: 'All Ranks', description: 'Show players from all ranks' },
    { value: 'iron-bronze', label: 'Iron - Bronze', description: 'Tiers 1-6' },
    { value: 'silver-gold', label: 'Silver - Gold', description: 'Tiers 7-12' },
    { value: 'gold-platinum', label: 'Gold - Platinum', description: 'Tiers 10-15' },
    { value: 'platinum-diamond', label: 'Platinum - Diamond', description: 'Tiers 13-18' },
    { value: 'diamond-ascendant', label: 'Diamond - Ascendant', description: 'Tiers 16-21' },
    { value: 'ascendant-immortal', label: 'Ascendant - Immortal', description: 'Tiers 19-24' },
    { value: 'immortal-radiant', label: 'Immortal - Radiant', description: 'Tiers 22-25' },
    { value: 'radiant', label: 'Radiant', description: 'Tier 25' }
  ];

  const selectedRank = rankRanges.find(rank => rank.value === selectedFilter) || rankRanges[0];

  // Handle clicks outside dropdown to close it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  const handleFilterSelect = (rankValue) => {
    onFilterChange(rankValue);
    setIsDropdownOpen(false);
  };

  const handleDropdownToggle = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  return (
    <div id="players-section" className="w-full max-w-6xl mx-auto px-4 mb-8 relative z-50">
      <div className="bg-gray-900/80 backdrop-blur-lg rounded-2xl shadow-2xl border border-gray-700/50 p-6">
        {/* Section Title */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-white mb-2">
            Discover Other Players
          </h2>
          <p className="text-gray-400">
            Find teammates that match your skill level and playstyle
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          {/* Rank Filter Dropdown */}
          <div className="relative z-50" ref={dropdownRef}>
            <button
              onClick={handleDropdownToggle}
              className="flex items-center justify-between w-64 px-4 py-3 bg-gray-800/60 hover:bg-gray-700/60 border border-gray-600 rounded-lg text-white font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <div className="flex items-center space-x-3">
                <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span>{selectedRank.label}</span>
              </div>
              <svg 
                className={`w-4 h-4 text-gray-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-gray-800 rounded-lg shadow-2xl border border-gray-700 z-[99999] backdrop-blur-sm">
                <div className="py-2">
                  {rankRanges.map((rank) => (
                    <button
                      key={rank.value}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleFilterSelect(rank.value);
                      }}
                      className={`w-full text-left px-4 py-3 hover:bg-gray-700 transition-colors ${
                        selectedFilter === rank.value ? 'bg-gray-700 text-blue-400' : 'text-gray-300'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <div>
                          <div className="font-medium">{rank.label}</div>
                          <div className="text-xs text-gray-400">{rank.description}</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Search Button */}
          <button
            onClick={() => {
              // Debug logging removed for production
              onFilterChange(selectedFilter);
            }}
            className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-lg shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Apply Filter
          </button>

          {/* Clear Filter */}
          {selectedFilter !== 'all' && (
            <button
              onClick={() => handleFilterSelect('all')}
              className="px-6 py-3 bg-gray-800/60 hover:bg-gray-700/60 border border-gray-600 text-gray-300 hover:text-white font-medium rounded-lg transition-all duration-200 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Clear
            </button>
          )}
        </div>

        {/* Active Filter Indicator */}
        {selectedFilter !== 'all' && (
          <div className="mt-4 text-center">
            <span className="inline-flex items-center px-3 py-1 bg-blue-600/20 border border-blue-500/30 rounded-full text-blue-300 text-sm">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.414A1 1 0 013 6.707V4z" />
              </svg>
              Filtering by: {selectedRank.label}
            </span>
          </div>
        )}
      </div>

    </div>
  );
};

export default RankFilterSection; 