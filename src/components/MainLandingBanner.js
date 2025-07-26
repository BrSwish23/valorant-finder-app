import React from 'react';

const MainLandingBanner = ({ onlinePlayersCount = 0, totalMatches = 0 }) => {
  const scrollToPlayersSection = () => {
    const playersSection = document.getElementById('players-section');
    if (playersSection) {
      playersSection.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  return (
    <div className="relative w-full h-64 sm:h-80 lg:h-96 overflow-hidden">
      {/* Background Image with Overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('/BannerValo.png')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-black/40" />
      </div>

      {/* Content */}
      <div className="relative z-10 h-full flex items-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="max-w-3xl">
            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4 leading-tight">
              Find Your Perfect
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600">
                Valorant Squad
              </span>
            </h1>

            {/* Description */}
            <p className="text-lg sm:text-xl text-gray-300 mb-8 max-w-2xl leading-relaxed">
              Connect with skilled players, form unbeatable teams, and dominate the competition. 
              Your next ranked victory starts here.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <button 
                onClick={scrollToPlayersSection}
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-lg shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center justify-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Browse Players
              </button>
            </div>

            {/* Key Metrics */}
            <div className="flex flex-wrap gap-6 text-sm">
              <div className="flex items-center space-x-2 bg-black/30 backdrop-blur-sm rounded-lg px-4 py-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-green-400 font-semibold">{onlinePlayersCount}</span>
                <span className="text-gray-300">Players Online</span>
              </div>

              <div className="flex items-center space-x-2 bg-black/30 backdrop-blur-sm rounded-lg px-4 py-2">
                <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span className="text-yellow-400 font-semibold">Instant</span>
                <span className="text-gray-300">Connections</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute bottom-0 right-0 w-64 h-64 opacity-10">
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <defs>
            <pattern id="hexPattern" x="0" y="0" width="20" height="17.32" patternUnits="userSpaceOnUse">
              <polygon points="10,1.73 3.66,6.25 3.66,15.59 10,20.11 16.34,15.59 16.34,6.25" fill="none" stroke="currentColor" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect x="0" y="0" width="100" height="100" fill="url(#hexPattern)" className="text-white"/>
        </svg>
      </div>
    </div>
  );
};

export default MainLandingBanner; 