const axios = require('axios');

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  };

  // Handle OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: 'CORS enabled' })
    };
  }

  try {
    let params = {};
    
    // Handle both GET and POST requests
    if (event.httpMethod === 'GET') {
      const queryParams = event.queryStringParameters || {};
      params = {
        svr_id: queryParams.svr_id,
        player_id: queryParams.player_id,
        lang: queryParams.lang || 'en',
        gacha_id: queryParams.gacha_id,
        gacha_type: queryParams.gacha_type,
        svr_area: queryParams.svr_area || 'global',
        record_id: queryParams.record_id,
        resources_id: queryParams.resources_id,
        platform: queryParams.platform || 'Android'
      };
    } else if (event.httpMethod === 'POST') {
      try {
        params = JSON.parse(event.body);
      } catch (e) {
        params = {};
      }
    }

    // Validate required parameters
    if (!params.player_id || !params.record_id) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          status: false,
          creator: "iEnz",
          error: "Missing required parameters: player_id and record_id are required"
        })
      };
    }

    console.log('Processing WuWa Stalk request:', params);

    // Prepare request to Kuro Games API
    const kuroApiUrl = 'https://gmserver-api.aki-game2.net/gacha/record/query';
    
    // Headers for Kuro Games API
    const kuroHeaders = {
      'Content-Type': 'application/json',
      'Origin': 'https://aki-gm-resources-oversea.aki-game.net',
      'Referer': 'https://aki-gm-resources-oversea.aki-game.net/',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    };

    // Prepare request body
    const requestBody = {
      svr_id: params.svr_id || '10cd7254d57e58ae560b15d51e34b4c8',
      player_id: params.player_id,
      lang: params.lang || 'en',
      gacha_id: params.gacha_id || '200047',
      gacha_type: params.gacha_type || '2',
      svr_area: params.svr_area || 'global',
      record_id: params.record_id,
      resources_id: params.resources_id || 'e355aed96f36a270e0ee3489578a7842',
      platform: params.platform || 'Android'
    };

    // Call Kuro Games API
    const response = await axios.post(kuroApiUrl, requestBody, {
      headers: kuroHeaders,
      timeout: 15000
    });

    const kuroData = response.data;
    
    // Process and format the data
    const processedData = processWuWaData(kuroData, params);

    const result = {
      status: true,
      creator: "iEnz",
      result: "WuWa gacha data retrieved successfully",
      data: processedData
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(result, null, 2)
    };

  } catch (error) {
    console.error('WuWa Stalk API Error:', error.message);
    
    // Generate mock data for demo purposes
    const mockData = generateMockWuWaData(params || {});
    
    return {
      statusCode: error.response?.status || 500,
      headers,
      body: JSON.stringify({
        status: error.response ? false : true, // true for demo mode
        creator: "iEnz",
        result: error.response ? "API Error" : "Demo data (API offline)",
        error: error.response ? error.message : "Using demo data",
        data: mockData
      })
    };
  }
};

// Process WuWa data from Kuro Games API
function processWuWaData(kuroData, params) {
  if (!kuroData || kuroData.code !== 0) {
    return generateMockWuWaData(params);
  }

  const data = kuroData.data || {};
  
  // Format records
  const records = (data.records || []).map(record => {
    return {
      id: record.id || record.item_id,
      name: record.name || record.item_name,
      type: record.type || (record.item_type === 1 ? 'character' : 'weapon'),
      rarity: getRarityFromRank(record.rank || record.rarity || 3),
      time: record.time || record.created_at,
      banner: record.gacha_name || 'Standard',
      pity: record.pity || null
    };
  });

  // Calculate statistics
  const fiveStarRecords = records.filter(r => r.rarity === '5-star');
  const fourStarRecords = records.filter(r => r.rarity === '4-star');
  const characterRecords = records.filter(r => r.type === 'character');
  const weaponRecords = records.filter(r => r.type === 'weapon');

  return {
    player_info: {
      player_id: params.player_id,
      server: params.svr_area || 'global',
      language: params.lang || 'en',
      platform: params.platform || 'Android'
    },
    records: records,
    statistics: {
      total_records: records.length,
      five_star_count: fiveStarRecords.length,
      four_star_count: fourStarRecords.length,
      character_count: characterRecords.length,
      weapon_count: weaponRecords.length,
      last_5_star: fiveStarRecords[0] || null,
      last_update: new Date().toISOString()
    },
    analysis: {
      five_star_rate: records.length > 0 ? ((fiveStarRecords.length / records.length) * 100).toFixed(2) + '%' : '0%',
      average_pity: calculateAveragePity(fiveStarRecords),
      most_common_rarity: getMostCommonRarity(records),
      banner_distribution: getBannerDistribution(records)
    },
    raw_data: kuroData.data // Include raw data for reference
  };
}

// Generate mock data for demo
function generateMockWuWaData(params) {
  const characters = [
    { name: 'Jiyan', type: 'character', element: 'Aero' },
    { name: 'Yinlin', type: 'character', element: 'Electro' },
    { name: 'Calcharo', type: 'character', element: 'Electro' },
    { name: 'Verina', type: 'character', element: 'Spectro' },
    { name: 'Baizhi', type: 'character', element: 'Glacio' },
    { name: 'Rover', type: 'character', element: 'Spectro' },
    { name: 'Mortefi', type: 'character', element: 'Fusion' }
  ];

  const weapons = [
    { name: 'Sword of Night', type: 'weapon', rarity: '5-star' },
    { name: 'Dawn Breaker', type: 'weapon', rarity: '5-star' },
    { name: 'Verdant Summit', type: 'weapon', rarity: '4-star' },
    { name: 'Broadblade of Night', type: 'weapon', rarity: '4-star' },
    { name: 'Lunar Cutter', type: 'weapon', rarity: '4-star' }
  ];

  const banners = ['Standard', 'Character Event', 'Weapon Event', 'Beginner'];
  
  // Generate records
  const records = [];
  const totalRecords = Math.floor(Math.random() * 50) + 20; // 20-70 records
  
  let pityCounter = 0;
  let lastFiveStarPity = 0;
  
  for (let i = 0; i < totalRecords; i++) {
    pityCounter++;
    
    // Determine if this is a 5-star (approx 0.6% chance per pull, but guarantee at 80)
    let isFiveStar = false;
    if (pityCounter >= 80 || Math.random() < 0.006) {
      isFiveStar = true;
      lastFiveStarPity = pityCounter;
      pityCounter = 0;
    }
    
    // Determine if this is a 4-star (approx 5.1% chance, but guarantee at 10)
    const isFourStar = (pityCounter >= 10 && !isFiveStar) || Math.random() < 0.051;
    
    // Determine item type
    const isCharacter = Math.random() > 0.5;
    
    // Select item
    let item;
    let rarity;
    
    if (isFiveStar) {
      rarity = '5-star';
      item = isCharacter ? 
        characters[Math.floor(Math.random() * characters.length)] :
        weapons[0]; // First weapon is 5-star
    } else if (isFourStar) {
      rarity = '4-star';
      item = isCharacter ? 
        characters[Math.floor(Math.random() * characters.length)] :
        weapons[Math.floor(Math.random() * (weapons.length - 1)) + 1]; // Skip first (5-star)
    } else {
      rarity = '3-star';
      item = {
        name: 'Standard Weapon',
        type: 'weapon'
      };
    }
    
    // Generate timestamp (recent to old)
    const timeOffset = (totalRecords - i) * 24 * 60 * 60 * 1000; // Spread over days
    const timestamp = new Date(Date.now() - timeOffset + Math.random() * 86400000).toISOString();
    
    records.push({
      id: `record_${Date.now()}_${i}`,
      name: item.name,
      type: item.type,
      rarity: rarity,
      time: timestamp,
      banner: banners[Math.floor(Math.random() * banners.length)],
      pity: isFiveStar ? lastFiveStarPity : null,
      element: item.element
    });
  }

  // Sort by time (newest first)
  records.sort((a, b) => new Date(b.time) - new Date(a.time));

  // Calculate statistics
  const fiveStarRecords = records.filter(r => r.rarity === '5-star');
  const fourStarRecords = records.filter(r => r.rarity === '4-star');
  const characterRecords = records.filter(r => r.type === 'character');
  const weaponRecords = records.filter(r => r.type === 'weapon');

  return {
    player_info: {
      player_id: params.player_id || '905800276',
      server: params.svr_area || 'global',
      language: params.lang || 'en',
      platform: params.platform || 'Android',
      note: 'Demo data - Real API requires valid gacha record'
    },
    records: records.slice(0, 50), // Limit to 50 records
    statistics: {
      total_records: records.length,
      five_star_count: fiveStarRecords.length,
      four_star_count: fourStarRecords.length,
      character_count: characterRecords.length,
      weapon_count: weaponRecords.length,
      last_5_star: fiveStarRecords[0] || null,
      last_5_star_pity: fiveStarRecords[0]?.pity || 'N/A',
      last_update: new Date().toISOString(),
      total_pulls: records.length,
      demo_mode: true
    },
    analysis: {
      five_star_rate: ((fiveStarRecords.length / records.length) * 100).toFixed(2) + '%',
      four_star_rate: ((fourStarRecords.length / records.length) * 100).toFixed(2) + '%',
      character_rate: ((characterRecords.length / records.length) * 100).toFixed(2) + '%',
      average_pity: calculateAveragePity(fiveStarRecords),
      most_common_rarity: getMostCommonRarity(records),
      banner_distribution: getBannerDistribution(records),
      luck_score: calculateLuckScore(records)
    },
    pity_counters: {
      current_pity: pityCounter,
      last_5_star_pity: lastFiveStarPity,
      next_guarantee: 80 - pityCounter
    }
  };
}

// Helper functions
function getRarityFromRank(rank) {
  switch(rank) {
    case 5: return '5-star';
    case 4: return '4-star';
    case 3: return '3-star';
    default: return '3-star';
  }
}

function calculateAveragePity(fiveStarRecords) {
  if (!fiveStarRecords.length) return 'N/A';
  const totalPity = fiveStarRecords.reduce((sum, record) => sum + (record.pity || 80), 0);
  return (totalPity / fiveStarRecords.length).toFixed(1);
}

function getMostCommonRarity(records) {
  const counts = {
    '5-star': 0,
    '4-star': 0,
    '3-star': 0
  };
  
  records.forEach(record => {
    counts[record.rarity] = (counts[record.rarity] || 0) + 1;
  });
  
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
}

function getBannerDistribution(records) {
  const distribution = {};
  
  records.forEach(record => {
    const banner = record.banner || 'Unknown';
    distribution[banner] = (distribution[banner] || 0) + 1;
  });
  
  return distribution;
}

function calculateLuckScore(records) {
  const fiveStarCount = records.filter(r => r.rarity === '5-star').length;
  const expectedFiveStars = records.length * 0.006; // 0.6% rate
  
  if (expectedFiveStars === 0) return 'N/A';
  
  const luckRatio = fiveStarCount / expectedFiveStars;
  
  if (luckRatio >= 1.5) return 'Extremely Lucky ⭐⭐⭐⭐⭐';
  if (luckRatio >= 1.2) return 'Very Lucky ⭐⭐⭐⭐';
  if (luckRatio >= 1.0) return 'Lucky ⭐⭐⭐';
  if (luckRatio >= 0.8) return 'Average ⭐⭐';
  if (luckRatio >= 0.6) return 'Unlucky ⭐';
  return 'Very Unlucky';
}
