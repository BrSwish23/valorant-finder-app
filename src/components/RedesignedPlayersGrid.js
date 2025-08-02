import React from 'react';
import RedesignedPlayerCard from './RedesignedPlayerCard';
import { filterPlayersByRank, getRankTier } from '../utils/valorantApi';

const RedesignedPlayersGrid = ({ 
  players, 
  currentUserId, 
  onChatClick, 
  existingChats = {},
  chatRequestsSent = {},
  rankFilter = 'all',
  loading = false,
  unreadChats = {}
}) => {
  // First filter out offline players, then filter by rank
  const onlinePlayers = players.filter(player => player.isOnline && player.displayStatus !== 'Offline');
  
  const filteredPlayers = filterPlayersByRank(onlinePlayers, rankFilter);
  
  // Sort players by rank tier (highest first), then by win rate
  const sortedPlayers = [...filteredPlayers].sort((a, b) => {
    // First sort by rank tier
    const aRankTier = getRankTier(a.valorantRank) || 0;
    const bRankTier = getRankTier(b.valorantRank) || 0;
    
    if (aRankTier !== bRankTier) {
      return bRankTier - aRankTier; // Higher rank first
    }
    
    // Then sort by win rate
    const aWinRate = a.lifetimeGamesPlayed > 0 ? (a.lifetimeWins / a.lifetimeGamesPlayed) : 0;
    const bWinRate = b.lifetimeGamesPlayed > 0 ? (b.lifetimeWins / b.lifetimeGamesPlayed) : 0;
    
    return bWinRate - aWinRate; // Higher win rate first
  });

  if (loading) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, index) => (
            <div key={index} className="bg-gray-900/80 backdrop-blur-lg rounded-2xl shadow-2xl border border-gray-700/50 p-6 animate-pulse">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-16 h-16 bg-gray-700 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-700 rounded mb-2"></div>
                  <div className="h-3 bg-gray-700 rounded w-2/3"></div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-gray-800/60 rounded-lg p-3">
                  <div className="h-3 bg-gray-700 rounded mb-1"></div>
                  <div className="h-2 bg-gray-700 rounded w-1/2"></div>
                </div>
                <div className="bg-gray-800/60 rounded-lg p-3">
                  <div className="h-3 bg-gray-700 rounded mb-1"></div>
                  <div className="h-2 bg-gray-700 rounded w-1/2"></div>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex-1 h-8 bg-gray-700 rounded-lg"></div>
                <div className="w-16 h-8 bg-gray-700 rounded-lg"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (sortedPlayers.length === 0) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 mb-8">
        <div className="bg-gray-900/80 backdrop-blur-lg rounded-2xl shadow-2xl border border-gray-700/50 p-12 text-center">
          <div className="max-w-md mx-auto">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
            <h3 className="text-xl font-semibold text-white mb-2">
              No Players Found
            </h3>
            <p className="text-gray-400 mb-4">
              {rankFilter !== 'all' 
                ? 'No players match your current rank filter. Try adjusting your filter or check back later.'
                : 'No players are currently online. Be the first to set your status and start building your squad!'}
            </p>
            {rankFilter !== 'all' && (
              <button
                onClick={() => onChatClick && onChatClick({ clearFilter: true })}
                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-lg shadow-lg transform hover:scale-105 transition-all duration-200"
              >
                Clear Filter
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 mb-8">
      {/* Results Header */}
      <div className="mb-6 text-center">
        <h3 className="text-xl font-semibold text-white mb-2">
          {rankFilter === 'all' ? 'All Players' : 'Filtered Results'}
        </h3>
        <p className="text-gray-400">
          Showing {sortedPlayers.length} player{sortedPlayers.length !== 1 ? 's' : ''} 
          {rankFilter !== 'all' && ' matching your criteria'}
        </p>
      </div>

      {/* Players Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {sortedPlayers.map((player) => (
          <RedesignedPlayerCard
            key={player.userId}
            player={player}
            currentUserId={currentUserId}
            onChatClick={onChatClick}
            existingChatId={existingChats[player.userId] || null}
            hasRequestSent={!!chatRequestsSent[player.userId]}
            hasUnreadMessages={!!unreadChats[player.userId]}
          />
        ))}
      </div>

      {/* Load More Button (for future pagination) */}
      {sortedPlayers.length >= 20 && (
        <div className="text-center mt-8">
          <button className="px-8 py-3 bg-gray-800/60 hover:bg-gray-700/60 border border-gray-600 text-white font-medium rounded-lg transition-all duration-200">
            Load More Players
          </button>
        </div>
      )}
    </div>
  );
};

export default RedesignedPlayersGrid; 