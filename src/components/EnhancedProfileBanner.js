import React from 'react';
import { formatRankForDisplay } from '../utils/valorantApi';

const EnhancedProfileBanner = ({ 
  username,
  valorantName, 
  valorantTag, 
  valorantRank, 
  profilePhotoUrl,
  lifetimeWins = 0,
  lifetimeGamesPlayed = 0,
  onlinePlayersCount = 0,
  currentStatus = 'Online',
  onEditProfile
}) => {
  const hasValorantProfile = valorantName && valorantTag;
  const displayName = hasValorantProfile ? `${valorantName}#${valorantTag}` : username;
  const formattedRank = formatRankForDisplay(valorantRank);
  const defaultProfileImage = '/favicon.png';
  const profileImage = profilePhotoUrl || defaultProfileImage;
  
  // Calculate win percentage
  const winPercentage = lifetimeGamesPlayed > 0 
    ? Math.round((lifetimeWins / lifetimeGamesPlayed) * 100) 
    : 0;

  // Get status styling and config
  const getStatusConfig = (status) => {
    switch (status) {
      case 'Looking to Queue':
        return {
          bgColor: 'bg-blue-600/20',
          borderColor: 'border-blue-500/30',
          textColor: 'text-blue-300',
          dotColor: 'bg-blue-400',
          label: 'Looking to Queue'
        };
      case 'Available for 5v5':
        return {
          bgColor: 'bg-purple-600/20',
          borderColor: 'border-purple-500/30',
          textColor: 'text-purple-300',
          dotColor: 'bg-purple-400',
          label: 'Available for 5v5'
        };
      case 'Offline':
        return {
          bgColor: 'bg-gray-600/20',
          borderColor: 'border-gray-500/30',
          textColor: 'text-gray-300',
          dotColor: 'bg-gray-400',
          label: 'Offline'
        };
      default: // Online
        return {
          bgColor: 'bg-green-600/20',
          borderColor: 'border-green-500/30',
          textColor: 'text-green-300',
          dotColor: 'bg-green-400',
          label: 'Online'
        };
    }
  };

  const statusConfig = getStatusConfig(currentStatus);

  return (
    <div className="w-full max-w-5xl mx-auto px-4 mb-8">
      <div className="bg-gray-900/80 backdrop-blur-lg rounded-2xl shadow-2xl border border-gray-700/50 p-6">
        <div className="flex flex-col lg:flex-row items-center lg:items-start gap-6">
          {/* Profile Photo */}
          <div className="relative flex-shrink-0">
            <div className="relative">
              <img
                src={profileImage}
                alt="Profile"
                className="w-24 h-24 lg:w-32 lg:h-32 rounded-full border-4 border-gray-600 shadow-xl object-cover"
                onError={(e) => {
                  e.target.src = defaultProfileImage;
                }}
              />
              {hasValorantProfile && (
                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full border-3 border-gray-900 flex items-center justify-center shadow-lg">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
          </div>

          {/* Profile Information */}
          <div className="flex-1 text-center lg:text-left">
            {/* Display Name & Status */}
            <div className="mb-4">
              {hasValorantProfile ? (
                <div>
                  <h2 className="text-2xl lg:text-3xl font-bold text-white mb-2">
                    {displayName}
                  </h2>
                  <div className="flex items-center justify-center lg:justify-start gap-2 mb-2">
                    <span className="px-3 py-1 bg-blue-600/20 border border-blue-500/30 rounded-full text-blue-300 text-sm font-medium">
                      Verified Profile
                    </span>
                    <span className={`px-3 py-1 ${statusConfig.bgColor} border ${statusConfig.borderColor} rounded-full ${statusConfig.textColor} text-sm font-medium flex items-center gap-1`}>
                      <div className={`w-2 h-2 ${statusConfig.dotColor} rounded-full ${currentStatus === 'Offline' ? '' : 'animate-pulse'}`}></div>
                      {statusConfig.label}
                    </span>
                  </div>
                </div>
              ) : (
                <div>
                  <h2 className="text-2xl lg:text-3xl font-bold text-white mb-2">
                    {displayName}
                  </h2>
                  <div className="flex items-center justify-center lg:justify-start gap-2 mb-2">
                    <span className={`px-3 py-1 ${statusConfig.bgColor} border ${statusConfig.borderColor} rounded-full ${statusConfig.textColor} text-sm font-medium flex items-center gap-1`}>
                      <div className={`w-2 h-2 ${statusConfig.dotColor} rounded-full ${currentStatus === 'Offline' ? '' : 'animate-pulse'}`}></div>
                      {statusConfig.label}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Rank */}
              {hasValorantProfile && formattedRank && (
                <div className="bg-gray-800/60 backdrop-blur-sm rounded-lg p-4 border border-gray-700/50">
                  <div className="flex items-center justify-center lg:justify-start gap-2 mb-1">
                    <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span className="text-yellow-300 font-semibold text-lg">
                      {formattedRank}
                    </span>
                  </div>
                  <span className="text-gray-400 text-sm">Current Rank</span>
                </div>
              )}

              {/* Win Rate */}
              <div className="bg-gray-800/60 backdrop-blur-sm rounded-lg p-4 border border-gray-700/50">
                <div className="flex items-center justify-center lg:justify-start gap-2 mb-1">
                  <span className="text-2xl font-bold text-green-400">
                    {winPercentage}%
                  </span>
                </div>
                <span className="text-gray-400 text-sm">Lifetime Win Rate</span>
                <div className="text-xs text-gray-500 mt-1">
                  {lifetimeWins}W / {lifetimeGamesPlayed - lifetimeWins}L
                </div>
              </div>

              {/* Online Players */}
              <div className="bg-gray-800/60 backdrop-blur-sm rounded-lg p-4 border border-gray-700/50">
                <div className="flex items-center justify-center lg:justify-start gap-2 mb-1">
                  <span className="text-2xl font-bold text-blue-400">
                    {onlinePlayersCount}
                  </span>
                </div>
                <span className="text-gray-400 text-sm">Players Online</span>
                <div className="text-xs text-gray-500 mt-1">
                  Ready to play
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3 flex-shrink-0">
            <button 
              className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-lg shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center gap-2"
              onClick={onEditProfile}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit Profile
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedProfileBanner; 