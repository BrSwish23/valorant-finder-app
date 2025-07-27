// api/validate-valorant-profile.js
module.exports = async function handler(req, res) {
    // Handle CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }
  
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  
    try {
      const { valorantName, valorantTag } = req.body;
  
      if (!valorantName || !valorantTag) {
        return res.status(400).json({ 
          success: false,
          error: 'Missing valorantName or valorantTag' 
        });
      }

      // Check if API key is available
      const apiKey = process.env.VALORANT_API_KEY;
      if (!apiKey) {
        console.error('❌ VALORANT_API_KEY environment variable not set');
        return res.status(500).json({
          success: false,
          error: 'API configuration error'
        });
      }
  
      console.log(`🚀 Validating profile: ${valorantName}#${valorantTag}`);
  
      // Make the API call server-side (no CORS issues)
      const apiUrl = `https://api.henrikdev.xyz/valorant/v2/mmr/AP/${encodeURIComponent(valorantName)}/${encodeURIComponent(valorantTag)}`;
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Authorization': apiKey,
          'Content-Type': 'application/json',
        },
      });
  
      if (!response.ok) {
        console.error(`API request failed: ${response.status}`);
        if (response.status === 404) {
          return res.status(404).json({
            success: false,
            error: 'Player not found. Please check your Valorant Name and Tag ID.'
          });
        }
        return res.status(response.status).json({ 
          success: false,
          error: `API request failed: ${response.status}` 
        });
      }
  
      const data = await response.json();
      console.log('✅ API call successful');
  
      // Process the data using helper functions
      const lifetimeStats = extractLifetimeStatsFromMmr(data);
      const processedData = {
        valorantRank: extractRankFromApiData(data),
        profilePhotoUrl: extractProfileImageUrl(data),
        lifetimeWins: lifetimeStats.lifetimeWins,
        lifetimeGamesPlayed: lifetimeStats.lifetimeGamesPlayed
      };
  
      console.log('📊 Processed data:', processedData);
  
      res.status(200).json({
        success: true,
        data: processedData,
      });
  
    } catch (error) {
      console.error('❌ Function error:', error);
      res.status(500).json({ 
        success: false,
        error: 'Internal server error' 
      });
    }
  }
  
  // Helper functions (copy from your valorantApi.js)
  function extractRankFromApiData(apiData) {
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
  }
  
  function extractProfileImageUrl(apiData) {
    try {
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
  }
  
  function extractLifetimeStatsFromMmr(apiData) {
    try {
      let totalWins = 0;
      let totalGames = 0;
  
      if (apiData?.by_season && typeof apiData.by_season === 'object') {
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
  
      return { lifetimeWins: totalWins, lifetimeGamesPlayed: totalGames };
    } catch (error) {
      console.error('Error extracting lifetime stats from MMR data:', error);
      return { lifetimeWins: 0, lifetimeGamesPlayed: 0 };
    }
  }