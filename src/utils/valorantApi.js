// Valorant API utility functions using environment-appropriate endpoints
import API_CONFIG from '../config/apiConfig';

// Extract profile image URL from various API response structures
const extractProfileImageUrl = (apiData) => {
  try {
    // Try different possible paths for profile images
    const imagePaths = [
      apiData?.card?.small,
      apiData?.card?.large,
      apiData?.current_data?.images?.small,
      apiData?.current_data?.images?.large,
      apiData?.images?.small,
      apiData?.images?.large
    ];
    
    for (const path of imagePaths) {
      if (path && typeof path === 'string' && path.startsWith('http')) {
        return path;
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error extracting profile image URL:', error);
    return null;
  }
};

// Extract rank information from API response
const extractRankFromApiData = (apiData) => {
  try {
    if (apiData?.current_data?.currenttierpatched) {
      return apiData.current_data.currenttierpatched;
    }
    if (apiData?.currenttierpatched) {
      return apiData.currenttierpatched;
    }
    return null;
  } catch (error) {
    console.error('Error extracting rank from API data:', error);
    return null;
  }
};

// Extract lifetime statistics from by_season data in MMR API response
const extractLifetimeStatsFromMmr = (apiData) => {
  try {
    let totalWins = 0;
    let totalGames = 0;

    // Check if by_season data exists
    if (apiData?.by_season && typeof apiData.by_season === 'object') {
      console.log('Found by_season data, calculating lifetime stats...');
      
      // Iterate through each season
      Object.keys(apiData.by_season).forEach(seasonKey => {
        const seasonData = apiData.by_season[seasonKey];
        
        if (seasonData && typeof seasonData === 'object') {
          const wins = parseInt(seasonData.wins) || 0;
          const games = parseInt(seasonData.number_of_games) || 0;
          
          totalWins += wins;
          totalGames += games;
          
          console.log(`Season ${seasonKey}: ${wins} wins out of ${games} games`);
        }
      });
    }

    console.log(`Total lifetime stats: ${totalWins} wins out of ${totalGames} games`);
    return { lifetimeWins: totalWins, lifetimeGamesPlayed: totalGames };
  } catch (error) {
    console.error('Error extracting lifetime stats from MMR data:', error);
    return { lifetimeWins: 0, lifetimeGamesPlayed: 0 };
  }
};

// Format rank for display
const formatRankForDisplay = (rank) => {
  if (!rank) return null;
  
  // Handle various rank formats
  if (typeof rank === 'string') {
    return rank;
  }
  
  return String(rank);
};

// Validate Valorant profile using dedicated Node.js backend
const validateValorantProfile = async (valorantName, valorantTag) => {
  console.log(`🚀 Starting profile validation for ${valorantName}#${valorantTag}`);
  console.log(`🌍 Environment: ${API_CONFIG.IS_DEVELOPMENT ? 'Development' : 'Production'}`);
  console.log(`🔗 Backend URL: ${API_CONFIG.BACKEND_BASE_URL}`);
  
  try {
    const backendUrl = `${API_CONFIG.BACKEND_BASE_URL}${API_CONFIG.VALIDATE_PROFILE_ENDPOINT}`;
    console.log(`📡 Calling backend: ${backendUrl}`);
    
    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        valorantName: valorantName.trim(),
        valorantTag: valorantTag.trim()
      })
    });

    console.log(`📥 Response status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      // If backend is not available, try fallback
      if (response.status === 500 || response.status === 0) {
        console.warn('⚠️ Backend not available, trying direct API fallback...');
        return await validateViaDirectAPI(valorantName, valorantTag);
      }
      
      let errorData;
      try {
        errorData = await response.json();
      } catch (e) {
        errorData = { error: `HTTP ${response.status}: ${response.statusText}` };
      }
      
      console.error('❌ Backend API error:', errorData);
      throw new Error(errorData.error || `Backend request failed: ${response.status}`);
    }

    const result = await response.json();
    
    if (!result.success || !result.data) {
      console.error('❌ Invalid response from backend:', result);
      throw new Error('Invalid response from validation service');
    }

    console.log('✅ Profile validation successful:', {
      rank: result.data.valorantRank,
      hasProfilePhoto: !!result.data.profilePhotoUrl,
      lifetimeWins: result.data.lifetimeWins,
      lifetimeGamesPlayed: result.data.lifetimeGamesPlayed
    });

    return result.data;

  } catch (error) {
    console.error('❌ Profile validation failed:', error);
    
    // Try fallback if backend fails
    if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      console.warn('⚠️ Network error, trying direct API fallback...');
      try {
        return await validateViaDirectAPI(valorantName, valorantTag);
      } catch (fallbackError) {
        console.error('❌ Fallback also failed:', fallbackError);
      }
    }
    
    // Provide user-friendly error messages
    if (error.message.includes('404')) {
      throw new Error('Player not found. Please check your Valorant Name and Tag ID.');
    } else if (error.message.includes('500')) {
      throw new Error('Validation service is temporarily unavailable. Please try again later.');
    } else if (error.message.includes('Failed to fetch')) {
      throw new Error('Network error. Please check your internet connection and try again.');
    } else {
      throw new Error(error.message || 'Failed to validate Valorant profile. Please try again.');
    }
  }
};

// Fallback function for direct API calls when serverless function isn't available
const validateViaDirectAPI = async (valorantName, valorantTag) => {
  console.log('🔧 Fallback: Using direct API call');
  
  const apiUrl = `https://api.henrikdev.xyz/valorant/v2/mmr/AP/${encodeURIComponent(valorantName)}/${encodeURIComponent(valorantTag)}`;
  
  const response = await fetch(apiUrl, {
    method: 'GET',
    headers: {
      'Authorization': API_CONFIG.VALORANT_API_KEY,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  const data = await response.json();
  
  // Process the data using helper functions
  const lifetimeStats = extractLifetimeStatsFromMmr(data);
  const processedData = {
    valorantRank: extractRankFromApiData(data),
    profilePhotoUrl: extractProfileImageUrl(data),
    lifetimeWins: lifetimeStats.lifetimeWins,
    lifetimeGamesPlayed: lifetimeStats.lifetimeGamesPlayed
  };

  return processedData;
};

// Update player profile with latest data
const updatePlayerProfile = async (valorantName, valorantTag) => {
  try {
    console.log(`🔄 Updating profile for ${valorantName}#${valorantTag}`);
    
    const profileData = await validateValorantProfile(valorantName, valorantTag);
    
    // Calculate lifetime win rate
    let lifetimeWinRate = 0;
    if (profileData.lifetimeGamesPlayed > 0) {
      lifetimeWinRate = Math.round((profileData.lifetimeWins / profileData.lifetimeGamesPlayed) * 100);
    }
    
    console.log(`📊 Profile update completed - Wins: ${profileData.lifetimeWins}, Games: ${profileData.lifetimeGamesPlayed}, Win Rate: ${lifetimeWinRate}%`);
    
    return {
      valorantRank: profileData.valorantRank,
      profilePhotoUrl: profileData.profilePhotoUrl,
      lifetimeWins: profileData.lifetimeWins,
      lifetimeGamesPlayed: profileData.lifetimeGamesPlayed,
      lifetimeWinRate: lifetimeWinRate
      // Note: lastProfileUpdate will be set to serverTimestamp() in the calling function
    };
  } catch (error) {
    console.error('❌ Error updating player profile:', error);
    throw error;
  }
};

// Filter players by rank range
const filterPlayersByRank = (players, rankFilter) => {
  if (!rankFilter || rankFilter === 'all') {
    return players;
  }

  return players.filter(player => {
    if (!player.valorantRank) return false;
    
    const rank = player.valorantRank.toLowerCase();
    
    switch (rankFilter) {
      case 'iron-bronze':
        return rank.includes('iron') || rank.includes('bronze');
      case 'silver-gold':
        return rank.includes('silver') || rank.includes('gold');
      case 'gold-platinum':
        return rank.includes('gold') || rank.includes('platinum');
      case 'platinum-diamond':
        return rank.includes('platinum') || rank.includes('diamond');
      case 'diamond-ascendant':
        return rank.includes('diamond') || rank.includes('ascendant');
      case 'ascendant-immortal':
        return rank.includes('ascendant') || rank.includes('immortal');
      case 'immortal-radiant':
        return rank.includes('immortal') || rank.includes('radiant');
      case 'radiant':
        return rank.includes('radiant');
      default:
        return true;
    }
  });
};

// Get rank tier number for sorting
const getRankTier = (rank) => {
  if (!rank) return 0;
  
  const rankLower = rank.toLowerCase();
  
  // Iron: 1-3
  if (rankLower.includes('iron')) {
    if (rankLower.includes('1')) return 1;
    if (rankLower.includes('2')) return 2;
    if (rankLower.includes('3')) return 3;
    return 2; // Default iron
  }
  
  // Bronze: 4-6
  if (rankLower.includes('bronze')) {
    if (rankLower.includes('1')) return 4;
    if (rankLower.includes('2')) return 5;
    if (rankLower.includes('3')) return 6;
    return 5; // Default bronze
  }
  
  // Silver: 7-9
  if (rankLower.includes('silver')) {
    if (rankLower.includes('1')) return 7;
    if (rankLower.includes('2')) return 8;
    if (rankLower.includes('3')) return 9;
    return 8; // Default silver
  }
  
  // Gold: 10-12
  if (rankLower.includes('gold')) {
    if (rankLower.includes('1')) return 10;
    if (rankLower.includes('2')) return 11;
    if (rankLower.includes('3')) return 12;
    return 11; // Default gold
  }
  
  // Platinum: 13-15
  if (rankLower.includes('platinum')) {
    if (rankLower.includes('1')) return 13;
    if (rankLower.includes('2')) return 14;
    if (rankLower.includes('3')) return 15;
    return 14; // Default platinum
  }
  
  // Diamond: 16-18
  if (rankLower.includes('diamond')) {
    if (rankLower.includes('1')) return 16;
    if (rankLower.includes('2')) return 17;
    if (rankLower.includes('3')) return 18;
    return 17; // Default diamond
  }
  
  // Ascendant: 19-21
  if (rankLower.includes('ascendant')) {
    if (rankLower.includes('1')) return 19;
    if (rankLower.includes('2')) return 20;
    if (rankLower.includes('3')) return 21;
    return 20; // Default ascendant
  }
  
  // Immortal: 22-24
  if (rankLower.includes('immortal')) {
    if (rankLower.includes('1')) return 22;
    if (rankLower.includes('2')) return 23;
    if (rankLower.includes('3')) return 24;
    return 23; // Default immortal
  }
  
  // Radiant: 25
  if (rankLower.includes('radiant')) return 25;
  
  return 0; // Unranked
};

// Placeholder function for fetchLifetimeMatches (if needed by App.js)
const fetchLifetimeMatches = async (valorantName, valorantTag) => {
  console.log('fetchLifetimeMatches called - this is a placeholder function');
  return { matches: [], totalMatches: 0 };
};

export {
  validateValorantProfile,
  updatePlayerProfile,
  extractRankFromApiData,
  formatRankForDisplay,
  extractLifetimeStatsFromMmr,
  extractProfileImageUrl,
  filterPlayersByRank,
  getRankTier,
  fetchLifetimeMatches
};