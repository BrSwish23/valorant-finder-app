import React, { useState, useRef, useEffect } from 'react';

const RedesignedHeader = ({ 
  username, 
  valorantName, 
  valorantTag, 
  valorantRank, 
  profilePhotoUrl, 
  onLogout, 
  loading,
  messageRequestsCount = 0,
  onShowRequests,
  unreadConversationsCount = 0,
  onShowUnreadMessages
}) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef(null);
  const hasValorantProfile = valorantName && valorantTag;
  const displayName = hasValorantProfile ? `${valorantName}#${valorantTag}` : username;
  const defaultProfileImage = '/favicon.png';
  const profileImage = profilePhotoUrl || defaultProfileImage;

  // Handle clicks outside profile menu to close it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    };

    if (showProfileMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showProfileMenu]);

  const handleProfileMenuToggle = () => {
    setShowProfileMenu(!showProfileMenu);
  };

  const handleLogoutClick = () => {
    setShowProfileMenu(false);
    if (onLogout) {
      onLogout();
    }
  };

  return (
    <header className="w-full bg-gray-900/95 backdrop-blur-lg border-b border-gray-700/50 shadow-xl relative z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left Side - Logo & App Name */}
          <div className="flex items-center space-x-3">
            <img 
              src="/favicon.png" 
              alt="Valorant Logo" 
              className="h-10 w-10 rounded-lg shadow-lg" 
            />
            <div className="flex flex-col">
              <h1 className="text-xl font-bold text-white tracking-wide">
                VALORANT
              </h1>
              <span className="text-sm text-gray-300 -mt-1">
                Team Finder
              </span>
            </div>
          </div>

          {/* Right Side - Message Requests & User Profile */}
          <div className="flex items-center space-x-4">
            {/* Received Messages Button */}
            {onShowUnreadMessages && (
              <button
                onClick={onShowUnreadMessages}
                className="relative p-2 bg-gray-800/60 hover:bg-gray-700/60 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                {unreadConversationsCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                    {unreadConversationsCount > 9 ? '9+' : unreadConversationsCount}
                  </span>
                )}
              </button>
            )}

            {/* Message Requests Button */}
            {onShowRequests && (
              <button
                onClick={onShowRequests}
                className="relative p-2 bg-gray-800/60 hover:bg-gray-700/60 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m13-8V9a2 2 0 01-2 2H9a2 2 0 01-2-2V5a2 2 0 012-2h6a2 2 0 012 2z" />
                </svg>
                {messageRequestsCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                    {messageRequestsCount > 9 ? '9+' : messageRequestsCount}
                  </span>
                )}
              </button>
            )}

            {/* User Profile */}
            <div className="relative z-50" ref={profileMenuRef}>
            <button
              onClick={handleProfileMenuToggle}
              className="flex items-center space-x-3 bg-gray-800/60 hover:bg-gray-700/60 rounded-lg p-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {/* Profile Photo */}
              <img
                src={profileImage}
                alt="Profile"
                className="h-8 w-8 rounded-full border-2 border-gray-600 object-cover"
                onError={(e) => {
                  e.target.src = defaultProfileImage;
                }}
              />
              
              {/* User Info */}
              <div className="text-left hidden sm:block">
                <div className="text-sm font-medium text-white">
                  {displayName}
                </div>
                {hasValorantProfile && valorantRank && (
                  <div className="text-xs text-gray-400">
                    {valorantRank}
                  </div>
                )}
              </div>

              {/* Dropdown Arrow */}
              <svg 
                className={`w-4 h-4 text-gray-400 transition-transform ${showProfileMenu ? 'rotate-180' : ''}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Profile Dropdown Menu */}
            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-gray-800 rounded-lg shadow-xl border border-gray-700 z-[99999] backdrop-blur-sm">
                <div className="py-2">
                  {/* Profile Info */}
                  <div className="px-4 py-3 border-b border-gray-700">
                    <div className="flex items-center space-x-3">
                      <img
                        src={profileImage}
                        alt="Profile"
                        className="h-10 w-10 rounded-full border-2 border-gray-600 object-cover"
                      />
                      <div>
                        <div className="text-sm font-medium text-white">
                          {displayName}
                        </div>
                        {hasValorantProfile && valorantRank && (
                          <div className="text-xs text-gray-400">
                            {valorantRank}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Menu Items */}
                  <div className="py-1">
                    <button 
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        // Add view profile functionality here if needed
                      }}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                    >
                      <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      View Profile
                    </button>
                    
                    <button 
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        // Add settings functionality here if needed
                      }}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                    >
                      <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Settings
                    </button>

                    <div className="border-t border-gray-700 my-1"></div>

                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleLogoutClick();
                      }}
                      disabled={loading}
                      className="flex items-center w-full px-4 py-2 text-sm text-red-400 hover:bg-red-600/10 hover:text-red-300 transition-colors disabled:opacity-50"
                    >
                      <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      {loading ? 'Logging out...' : 'Logout'}
                    </button>
                  </div>
                </div>
              </div>
            )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default RedesignedHeader; 