// Valorant API utility functions using HenrikDev API with improved CORS handling
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

// Validate Valorant profile with enhanced data extraction from MMR API
const validateValorantProfile = async (valorantName, valorantTag) => {
  console.log(`🚀 Starting profile validation for ${valorantName}#${valorantTag}`);
  
  // Updated CORS proxies list with more reliable options
  const corsProxies = [
    'https://api.allorigins.win/raw?url=',
    'https://corsproxy.io/?',
    'https://cors-anywhere.herokuapp.com/',
    'https://thingproxy.freeboard.io/fetch/',
  ];

  let lastError = null;
  let proxyAttempts = [];

  for (let i = 0; i < corsProxies.length; i++) {
    const proxy = corsProxies[i];
    const attemptStartTime = Date.now();
    
    try {
      const baseUrl = `${API_CONFIG.API_BASE_URL}/mmr/AP/${valorantName}/${valorantTag}`;
      const url = proxy + encodeURIComponent(baseUrl);
      
      console.log(`🔄 Attempt ${i + 1}/${corsProxies.length}: Trying proxy ${proxy}`);
      console.log(`📡 Full URL: ${url}`);

      const requestOptions = {
        method: 'GET',
        headers: {
          'Authorization': API_CONFIG.VALORANT_API_KEY,
          'Content-Type': 'application/json',
        }
      };

      // Special handling for different proxies
      if (proxy.includes('allorigins.win')) {
        // allorigins doesn't forward headers well, so we'll skip authorization for this one
        delete requestOptions.headers['Authorization'];
      } else {
        requestOptions.headers['X-Requested-With'] = 'XMLHttpRequest';
      }

      console.log('📤 Request options:', requestOptions);

      const response = await fetch(url, requestOptions);
      const responseTime = Date.now() - attemptStartTime;
      
      console.log(`📥 Response status: ${response.status} ${response.statusText} (${responseTime}ms)`);

      if (response.ok) {
        const responseText = await response.text();
        console.log('📄 Raw response preview:', responseText.substring(0, 200) + '...');
        
        let apiResponseData;
        try {
          apiResponseData = JSON.parse(responseText);
        } catch (parseError) {
          console.warn('❌ JSON parse error:', parseError);
          proxyAttempts.push({ proxy, status: 'JSON_PARSE_ERROR', error: parseError.message, responseTime });
          continue;
        }

        console.log('✅ Profile validation successful via:', proxy);
        console.log('📊 API Response structure:', Object.keys(apiResponseData));
        
        if (!apiResponseData || !apiResponseData.data) {
          console.warn('⚠️ Invalid API response structure - missing data property');
          console.log('📋 Full response:', apiResponseData);
          proxyAttempts.push({ proxy, status: 'INVALID_STRUCTURE', responseTime });
          continue;
        }

        const rank = extractRankFromApiData(apiResponseData.data);
        const profilePhotoUrl = extractProfileImageUrl(apiResponseData.data);
        
        // Extract lifetime statistics from by_season data
        const lifetimeStats = extractLifetimeStatsFromMmr(apiResponseData.data);

        console.log('✅ Extracted profile data:', {
          rank,
          profilePhotoUrl: profilePhotoUrl ? 'Found' : 'Not found',
          lifetimeWins: lifetimeStats.lifetimeWins,
          lifetimeGamesPlayed: lifetimeStats.lifetimeGamesPlayed
        });

        proxyAttempts.push({ proxy, status: 'SUCCESS', responseTime });
        console.log('📊 Proxy attempt summary:', proxyAttempts);

        return {
          isValid: true,
          valorantRank: rank,
          profilePhotoUrl: profilePhotoUrl,
          lifetimeWins: lifetimeStats.lifetimeWins,
          lifetimeGamesPlayed: lifetimeStats.lifetimeGamesPlayed
        };
      } else {
        const errorText = await response.text();
        console.warn(`❌ HTTP ${response.status} via ${proxy}:`, errorText.substring(0, 100));
        lastError = `HTTP ${response.status}: ${response.statusText}`;
        proxyAttempts.push({ proxy, status: `HTTP_${response.status}`, error: errorText.substring(0, 100), responseTime });
      }
    } catch (error) {
      const responseTime = Date.now() - attemptStartTime;
      console.warn(`❌ Network error via ${proxy}:`, error.message);
      lastError = error.message;
      proxyAttempts.push({ proxy, status: 'NETWORK_ERROR', error: error.message, responseTime });
    }
  }

  // Log detailed failure summary
  console.error('❌ All proxy attempts failed:', proxyAttempts);
  console.error('🔧 Debugging info:', {
    userName: valorantName,
    userTag: valorantTag,
    apiKey: API_CONFIG.VALORANT_API_KEY ? 'Present' : 'Missing',
    baseUrl: API_CONFIG.API_BASE_URL,
    totalAttempts: proxyAttempts.length,
    lastError
  });

  // If all proxies failed, throw error with the last error message
  throw new Error(`Failed to validate Valorant profile after trying ${corsProxies.length} proxies. Last error: ${lastError}. Please check your Name and Tag ID.`);
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

export {
  validateValorantProfile,
  updatePlayerProfile,
  extractRankFromApiData,
  formatRankForDisplay,
  extractLifetimeStatsFromMmr,
  filterPlayersByRank,
  getRankTier
};