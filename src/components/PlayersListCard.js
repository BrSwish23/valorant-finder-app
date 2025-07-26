import React from 'react';
import { formatRankForDisplay } from '../utils/valorantApi';

const PlayersListCard = ({ players, playersLoading, userId, chatRequestsSent, onRequestChat, userIdToUsername, OFFLINE_THRESHOLD }) => {
  const now = Date.now();
  const playersWithDerivedStatus = players.map(player => {
    const lastActive = player.lastActive && player.lastActive.seconds ? player.lastActive.seconds * 1000 : 0;
    const isOnline = lastActive && (now - lastActive < OFFLINE_THRESHOLD);
    const derivedStatus = isOnline ? player.status : 'Offline';
    
    // Determine display name - prioritize Valorant profile if available
    const hasValorantProfile = player.valorantName && player.valorantTag;
    const displayName = hasValorantProfile 
      ? `${player.valorantName}#${player.valorantTag}`
      : (player.username && player.username.length >= 3 
          ? player.username 
          : `Player_${player.userId ? player.userId.slice(-6) : 'Unknown'}`);
    
    const displayRank = formatRankForDisplay(player.valorantRank);
    
    return { 
      ...player, 
      derivedStatus, 
      displayName,
      hasValorantProfile,
      displayRank
    };
  });
  const filteredPlayers = playersWithDerivedStatus.filter(p => p.derivedStatus !== 'Offline');

  return (
    <div className="bg-white/10 backdrop-blur-lg p-8 rounded-2xl shadow-2xl w-full max-w-2xl border border-white/20 mb-8">
      <h2 className="text-2xl font-bold mb-5 text-green-400">Players Online</h2>
      {playersLoading ? (
        <div className="flex items-center">
          <svg className="animate-spin h-5 w-5 text-blue-500 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
          </svg>
          Loading players...
        </div>
      ) : (
        <ul className="divide-y divide-gray-700">
          {filteredPlayers.length === 0 ? (
            <li className="py-2 text-gray-400">No active players found. Be the first to set your status to 'Looking to Queue' or 'Available for 5v5'!</li>
          ) : filteredPlayers.map((player) => (
            <li
              key={player.userId}
              className={`flex items-center justify-between py-3 px-3 rounded-xl transition-all duration-100 mb-1 ${
                player.userId === userId
                  ? 'bg-gray-700 border-l-4 border-blue-500 shadow-lg scale-105'
                  : 'hover:bg-gray-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className={`font-mono text-base font-bold ${player.hasValorantProfile ? 'text-blue-400' : 'text-green-400'}`}>
                      {player.displayName}
                    </span>
                    {player.userId === userId && <span className="text-xs text-blue-400">(You)</span>}
                  </div>
                  {player.hasValorantProfile && player.displayRank && (
                    <span className="text-xs text-yellow-300 font-medium">
                      {player.displayRank}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`px-3 py-1 rounded-lg text-xs font-bold shadow-md border-2 ${
                    player.derivedStatus === 'Looking to Queue'
                      ? 'bg-blue-600 text-white border-blue-400'
                      : player.derivedStatus === 'Available for 5v5'
                      ? 'bg-green-600 text-white border-green-400'
                      : 'bg-gray-600 text-gray-300 border-gray-400'
                  }`}
                >
                  {player.derivedStatus}
                </span>
                {player.userId !== userId &&
                  (player.derivedStatus !== 'Offline') &&
                  (player.status === 'Looking to Queue' || player.status === 'Available for 5v5') && (
                    <button
                      className="ml-2 px-3 py-1 rounded-lg bg-red-500 hover:bg-red-600 text-white text-xs font-bold shadow border-2 border-red-400 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-60 disabled:cursor-not-allowed"
                      onClick={() => onRequestChat(player)}
                      disabled={!!chatRequestsSent[player.userId]}
                    >
                      {chatRequestsSent[player.userId] ? 'Request Sent' : 'Request Chat'}
                    </button>
                  )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default PlayersListCard; 