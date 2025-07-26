import React from 'react';

const MainHeader = ({ onLogout, loading }) => {
  return (
    <div className="w-full relative mb-6 mt-6">
      {/* Header Card - Centered */}
      <div className="w-full max-w-6xl mx-auto p-4 rounded-2xl bg-white/10 backdrop-blur-lg border border-white/20 shadow-lg">
        <div className="flex items-center justify-center gap-3">
          <img src="/favicon.png" alt="Valorant Logo" className="h-12 w-12 rounded-lg shadow" />
          <span className="text-2xl font-extrabold tracking-widest text-white drop-shadow">VALORANT TEAM FINDER</span>
        </div>
      </div>
      
      {/* Logout Button - Positioned outside header card, all the way to the right */}
      <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
        <button
          className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold shadow transition disabled:opacity-60 flex items-center gap-2"
          onClick={onLogout}
          disabled={loading}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          {loading ? 'Logging out...' : 'Logout'}
        </button>
      </div>
    </div>
  );
};

export default MainHeader; 