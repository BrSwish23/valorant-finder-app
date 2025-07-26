// Mock Valorant API data for development
// This simulates the HenrikDev API response structure

export const mockValorantResponse = {
  "status": 200,
  "data": {
    "name": "Kakashi1425",
    "tag": "8516",
    "puuid": "e5794daf-37e7-5698-85e3-16d13ffec4bc",
    "current_data": {
      "currenttier": 10,
      "currenttierpatched": "Silver 2",
      "images": {
        "small": "https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/10/smallicon.png",
        "large": "https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/10/largeicon.png",
        "triangle_down": "https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/10/ranktriangledownicon.png",
        "triangle_up": "https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/10/ranktriangleupicon.png"
      },
      "ranking_in_tier": 38,
      "mmr_change_to_last_game": 19,
      "elo": 1038,
      "old": false
    },
    // Mock profile card data (this might come from a different API endpoint in real scenarios)
    "card": {
      "small": "https://media.valorant-api.com/playercards/9fb348bc-41a0-91ad-8a3e-818035c4e561/smallart.png",
      "large": "https://media.valorant-api.com/playercards/9fb348bc-41a0-91ad-8a3e-818035c4e561/largeart.png",
      "wide": "https://media.valorant-api.com/playercards/9fb348bc-41a0-91ad-8a3e-818035c4e561/wideart.png"
    }
  }
};

// Different rank examples for testing
export const mockRankExamples = {
  "Iron 1": { currenttier: 3, currenttierpatched: "Iron 1", elo: 103 },
  "Bronze 3": { currenttier: 6, currenttierpatched: "Bronze 3", elo: 603 },
  "Silver 2": { currenttier: 10, currenttierpatched: "Silver 2", elo: 1038 },
  "Gold 1": { currenttier: 13, currenttierpatched: "Gold 1", elo: 1303 },
  "Platinum 2": { currenttier: 17, currenttierpatched: "Platinum 2", elo: 1738 },
  "Diamond 1": { currenttier: 21, currenttierpatched: "Diamond 1", elo: 2103 },
  "Immortal 1": { currenttier: 24, currenttierpatched: "Immortal 1", elo: 2403 },
  "Radiant": { currenttier: 27, currenttierpatched: "Radiant", elo: 2703 },
  "Unranked": { currenttier: 0, currenttierpatched: "Unranked", elo: 0 }
};

/**
 * Mock validation function that simulates API response
 * @param {string} valorantName 
 * @param {string} valorantTag 
 * @returns {Promise<Object>} Mock API response
 */
export const mockValidateValorantProfile = async (valorantName, valorantTag) => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Basic validation
  if (!valorantName || !valorantTag) {
    throw new Error('Valorant Name and Tag are required.');
  }
  
  // Simulate some common error cases for testing
  if (valorantName.toLowerCase() === 'invalid') {
    throw new Error('Valorant account not found. Please check your Name and Tag ID.');
  }
  
  // For demo purposes, assign different ranks based on name length
  const rankKeys = Object.keys(mockRankExamples);
  const rankIndex = valorantName.length % rankKeys.length;
  const selectedRank = rankKeys[rankIndex];
  const rankData = mockRankExamples[selectedRank];
  
  // Create mock response with the provided name/tag
  const mockResponse = {
    ...mockValorantResponse,
    data: {
      ...mockValorantResponse.data,
      name: valorantName,
      tag: valorantTag,
      current_data: {
        ...mockValorantResponse.data.current_data,
        ...rankData
      }
    }
  };
  
  return mockResponse;
}; 