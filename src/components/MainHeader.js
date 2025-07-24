import React from 'react';

const MainHeader = ({ username, onLogout, loading }) => (
  <div className="w-full max-w-3xl mx-auto flex items-center justify-between p-4 rounded-2xl bg-white/10 backdrop-blur-lg border border-white/20 shadow-lg mb-8 mt-6">
    <div className="flex items-center gap-3">
      <img src="/favicon.png" alt="Valorant Logo" className="h-10 w-10 rounded-lg shadow" />
      <span className="text-xl font-extrabold tracking-widest text-white drop-shadow">VALORANT TEAM FINDER</span>
    </div>
    <div className="flex items-center gap-4">
      <span className="text-base font-semibold text-green-300">{username}</span>
      <button
        className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold shadow transition disabled:opacity-60"
        onClick={onLogout}
        disabled={loading}
      >
        {loading ? 'Logging out...' : 'Logout'}
      </button>
    </div>
  </div>
);

export default MainHeader; 