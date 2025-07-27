const {onRequest} = require("firebase-functions/v2/https");
const {logger} = require("firebase-functions");
const cors = require('cors')({origin: true});

// Valorant profile validation function
exports.validateValorantProfile = onRequest((request, response) => {
  return cors(request, response, async () => {
    try {
      // Only allow POST requests
      if (request.method !== 'POST') {
        response.status(405).json({error: 'Method not allowed'});
        return;
      }

      const {valorantName, valorantTag} = request.body;

      if (!valorantName || !valorantTag) {
        response.status(400).json({error: 'Missing valorantName or valorantTag'});
        return;
      }

      logger.info(`Validating profile: ${valorantName}#${valorantTag}`);

      // Make direct API call without CORS proxy
      const apiUrl = `https://api.henrikdev.xyz/valorant/v2/mmr/AP/${valorantName}/${valorantTag}`;
      
      const fetch = (await import('node-fetch')).default;
      const apiResponse = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Authorization': 'HDEV-f1588d35-627e-4c94-8bc9-8d967b3d2f88',
          'Content-Type': 'application/json',
        }
      });

      if (!apiResponse.ok) {
        logger.error(`API request failed: ${apiResponse.status} ${apiResponse.statusText}`);
        response.status(apiResponse.status).json({
          error: `API request failed: ${apiResponse.statusText}`
        });
        return;
      }

      const apiData = await apiResponse.json();
      
      if (!apiData || !apiData.data) {
        logger.error('Invalid API response structure');
        response.status(400).json({error: 'Invalid API response'});
        return;
      }

      // Extract profile data
      const profileData = extractProfileData(apiData.data);
      
      logger.info(`Profile validation successful for ${valorantName}#${valorantTag}`);
      response.status(200).json({
        success: true,
        data: profileData
      });

    } catch (error) {
      logger.error('Profile validation error:', error);
      response.status(500).json({
        error: 'Failed to validate profile',
        message: error.message
      });
    }
  });
});

// Helper function to extract profile data
function extractProfileData(apiData) {
  try {
    // Extract rank
    let rank = null;
    if (apiData.current_data?.currenttierpatched) {
      rank = apiData.current_data.currenttierpatched;
    } else if (apiData.currenttierpatched) {
      rank = apiData.currenttierpatched;
    }

    // Extract profile image
    let profilePhotoUrl = null;
    const imagePaths = [
      apiData.card?.small,
      apiData.card?.large,
      apiData.current_data?.images?.small,
      apiData.current_data?.images?.large,
      apiData.images?.small,
      apiData.images?.large
    ];
    
    for (const path of imagePaths) {
      if (path && typeof path === 'string' && path.startsWith('http')) {
        profilePhotoUrl = path;
        break;
      }
    }

    // Extract lifetime statistics
    let totalWins = 0;
    let totalGames = 0;

    if (apiData.by_season && typeof apiData.by_season === 'object') {
      Object.keys(apiData.by_season).forEach(seasonKey => {
        const seasonData = apiData.by_season[seasonKey];
        if (seasonData && typeof seasonData === 'object') {
          const wins = parseInt(seasonData.wins) || 0;
          const games = parseInt(seasonData.number_of_games) || 0;
          totalWins += wins;
          totalGames += games;
        }
      });
    }

    return {
      isValid: true,
      valorantRank: rank,
      profilePhotoUrl: profilePhotoUrl,
      lifetimeWins: totalWins,
      lifetimeGamesPlayed: totalGames
    };

  } catch (error) {
    logger.error('Error extracting profile data:', error);
    return {
      isValid: false,
      valorantRank: null,
      profilePhotoUrl: null,
      lifetimeWins: 0,
      lifetimeGamesPlayed: 0
    };
  }
} 