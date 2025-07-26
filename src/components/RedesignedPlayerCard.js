import React, { useState } from 'react';
import { formatRankForDisplay } from '../utils/valorantApi';

const RedesignedPlayerCard = ({ 
  player, 
  currentUserId, 
  onChatClick,
  existingChatId = null,
  hasRequestSent = false
}) => {
  const [imageError, setImageError] = useState(false);
  
  const hasValorantProfile = player.valorantName && player.valorantTag;
  const displayName = hasValorantProfile ? `${player.valorantName}#${player.valorantTag}` : player.username;
  const formattedRank = formatRankForDisplay(player.valorantRank);
  const defaultProfileImage = '/favicon.png';
  const profileImage = (!imageError && player.profilePhotoUrl) ? player.profilePhotoUrl : defaultProfileImage;
  
  // Calculate win percentage
  const lifetimeWins = player.lifetimeWins || 0;
  const lifetimeGamesPlayed = player.lifetimeGamesPlayed || 0;
  const winPercentage = lifetimeGamesPlayed > 0 
    ? Math.round((lifetimeWins / lifetimeGamesPlayed) * 100) 
    : 0;

  // Determine status color and icon
  const getStatusConfig = (status) => {
    switch (status) {
      case 'Looking to Queue':
        return { color: 'blue', bgColor: 'bg-blue-600/20', textColor: 'text-blue-300', borderColor: 'border-blue-500/30' };
      case 'Available for 5v5':
        return { color: 'green', bgColor: 'bg-green-600/20', textColor: 'text-green-300', borderColor: 'border-green-500/30' };
      case 'Offline':
        return { color: 'gray', bgColor: 'bg-gray-600/20', textColor: 'text-gray-400', borderColor: 'border-gray-500/30' };
      default:
        return { color: 'blue', bgColor: 'bg-blue-600/20', textColor: 'text-blue-300', borderColor: 'border-blue-500/30' };
    }
  };

  const statusConfig = getStatusConfig(player.status);
  const hasExistingChat = existingChatId !== null;
  
  // Determine button state and styling
  const getButtonConfig = () => {
    if (hasExistingChat) {
      return {
        text: 'Continue Chat',
        className: 'flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-lg shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center justify-center gap-2 text-sm',
        disabled: false,
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        )
      };
    } else if (hasRequestSent) {
      return {
        text: 'Request Sent',
        className: 'flex-1 px-4 py-2 bg-gray-600 cursor-not-allowed text-gray-300 font-semibold rounded-lg border border-gray-500 flex items-center justify-center gap-2 text-sm',
        disabled: true,
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      };
    } else {
      return {
        text: 'Send Request',
        className: 'flex-1 px-4 py-2 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-semibold rounded-lg shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center justify-center gap-2 text-sm',
        disabled: false,
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        )
      };
    }
  };

  const buttonConfig = getButtonConfig();

  return (
    <div className="bg-gray-900/80 backdrop-blur-lg rounded-2xl shadow-2xl border border-gray-700/50 p-6 hover:shadow-3xl hover:border-gray-600/50 transition-all duration-300 transform hover:scale-[1.02]">
      {/* Header with Profile Photo and Status */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-4">
          {/* Profile Photo */}
          <div className="relative flex-shrink-0">
            <img
              src={profileImage}
              alt="Profile"
              className="w-16 h-16 rounded-full border-3 border-gray-600 shadow-lg object-cover"
              onError={() => setImageError(true)}
            />
            {hasValorantProfile && (
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-gray-900 flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </div>

          {/* Name and Status */}
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-white truncate mb-1">
              {displayName}
            </h3>
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusConfig.bgColor} ${statusConfig.textColor} ${statusConfig.borderColor} border`}>
              <div className={`w-1.5 h-1.5 rounded-full mr-1 ${player.status === 'Offline' ? 'bg-gray-400' : 'bg-green-400 animate-pulse'}`}></div>
              {player.status}
            </span>
          </div>
        </div>

        {/* Chat Button */}
        <button
          onClick={() => onChatClick(player)}
          className="flex-shrink-0 p-2 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 rounded-lg text-blue-300 hover:text-blue-200 transition-all duration-200 group"
          title={hasExistingChat ? "Continue conversation" : "Start chat"}
        >
          <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          {hasExistingChat && (
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
          )}
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Rank */}
        {hasValorantProfile && formattedRank && (
          <div className="bg-gray-800/60 backdrop-blur-sm rounded-lg p-3 border border-gray-700/50">
            <div className="flex items-center space-x-2 mb-1">
              <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="text-yellow-300 font-semibold text-sm">
                {formattedRank}
              </span>
            </div>
            <span className="text-gray-400 text-xs">Rank</span>
          </div>
        )}

        {/* Win Rate */}
        <div className="bg-gray-800/60 backdrop-blur-sm rounded-lg p-3 border border-gray-700/50">
          <div className="flex items-center space-x-2 mb-1">
            <span className="text-green-400 font-bold text-lg">
              {winPercentage}%
            </span>
          </div>
          <span className="text-gray-400 text-xs">Win Rate</span>
          <div className="text-xs text-gray-500 mt-0.5">
            {lifetimeWins}W / {lifetimeGamesPlayed - lifetimeWins}L
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={() => !buttonConfig.disabled && onChatClick(player)}
          className={buttonConfig.className}
          disabled={buttonConfig.disabled}
        >
          {buttonConfig.icon}
          {buttonConfig.text}
        </button>

        <button className="px-4 py-2 bg-gray-800/60 hover:bg-gray-700/60 border border-gray-600 text-gray-300 hover:text-white font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-2 text-sm">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          Profile
        </button>
      </div>

      {/* Last Active Indicator */}
      {player.lastActive && (
        <div className="mt-3 pt-3 border-t border-gray-700/50">
          <div className="flex items-center justify-center text-xs text-gray-500">
            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Last seen: {new Date(player.lastActive.toDate()).toLocaleString()}
          </div>
        </div>
      )}
    </div>
  );
};

export default RedesignedPlayerCard; 