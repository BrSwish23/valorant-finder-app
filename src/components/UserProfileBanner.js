import React from 'react';
import { formatRankForDisplay } from '../utils/valorantApi';

const UserProfileBanner = ({ 
  valorantName, 
  valorantTag, 
  valorantRank, 
  profilePhotoUrl,
  username 
}) => {
  const hasValorantProfile = valorantName && valorantTag;
  const displayName = hasValorantProfile ? `${valorantName}#${valorantTag}` : username;
  const formattedRank = formatRankForDisplay(valorantRank);

  // Default placeholder image for profile photo
  const defaultProfileImage = '/favicon.png'; // Using the app's favicon as placeholder
  const profileImage = profilePhotoUrl || defaultProfileImage;

  return (
    <div className="w-full max-w-4xl mx-auto mb-8 px-2">
      <div className="bg-white/10 backdrop-blur-lg p-4 md:p-6 rounded-2xl shadow-2xl border border-white/20">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
          {/* Profile Photo */}
          <div className="relative flex-shrink-0">
            <img
              src={profileImage}
              alt="Profile"
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-3 border-white/30 shadow-lg object-cover"
              onError={(e) => {
                // Fallback to default image if the provided URL fails
                e.target.src = defaultProfileImage;
              }}
            />
            {hasValorantProfile && (
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </div>

          {/* Profile Information */}
          <div className="text-center sm:text-left">
            {/* Display Name */}
            <div className="mb-2">
              {hasValorantProfile ? (
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-blue-300 mb-1">
                    {displayName}
                  </h2>
                  <p className="text-sm text-gray-300">Valorant Profile</p>
                </div>
              ) : (
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-green-300 mb-1">
                    {displayName}
                  </h2>
                  <p className="text-sm text-gray-400">Username</p>
                </div>
              )}
            </div>

            {/* Rank Display */}
            {hasValorantProfile && formattedRank && (
              <div className="flex items-center justify-center sm:justify-start gap-2 mb-3">
                <div className="px-3 sm:px-4 py-2 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-lg border border-yellow-500/30">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span className="text-yellow-300 font-semibold text-base sm:text-lg">
                      {formattedRank}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Status Indicator */}
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-xs text-green-300 font-medium">Online</span>
            </div>
          </div>
        </div>

        {/* Additional Info Bar */}
        {hasValorantProfile && (
          <div className="mt-4 pt-4 border-t border-white/10">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 text-xs sm:text-sm text-gray-300">
              <div className="flex items-center gap-1">
                <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Verified Profile</span>
              </div>
              <div className="flex items-center gap-1">
                <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Ready to Queue</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfileBanner; 