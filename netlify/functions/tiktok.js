const axios = require('axios');

exports.handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
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
    const { url } = event.queryStringParameters;
    
    if (!url) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          status: false,
          creator: "iEnz",
          message: "URL parameter is required"
        })
      };
    }

    console.log(`Processing TikTok URL: ${url}`);

    // Real TikTok API integration using public API
    const apiResponse = await axios.get(`https://tikwm.com/api?url=${encodeURIComponent(url)}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 10000
    });

    const data = apiResponse.data.data || apiResponse.data;

    if (!data) {
      throw new Error('No data received from TikTok API');
    }

    const result = {
      status: true,
      creator: "iEnz",
      result: "TikTok video data retrieved successfully",
      data: {
        title: data.title || "TikTok Video",
        author: data.author?.nickname || data.author?.unique_id || "Unknown",
        author_id: data.author?.id || "N/A",
        video_id: data.video_id || data.id || "N/A",
        duration: data.duration || "0",
        views: data.play_count || data.view_count || "0",
        likes: data.digg_count || data.like_count || "0",
        comments: data.comment_count || "0",
        shares: data.share_count || "0",
        created_at: data.create_time || Date.now(),
        watermark: false,
        thumbnail: data.cover || data.thumbnail || "",
        video_url: data.play || data.hdplay || data.play_addr?.url || "",
        music_title: data.music_info?.title || data.music || "Original Sound",
        music_author: data.music_info?.author || data.music_author || "Unknown",
        music_url: data.music_info?.play_url || data.music_url || ""
      }
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(result, null, 2)
    };

  } catch (error) {
    console.error('TikTok API Error:', error.message);
    
    // Fallback mock data for testing
    const mockData = {
      status: true,
      creator: "iEnz",
      result: "Demo TikTok Data (Mock)",
      data: {
        title: "TikTok Demo Video",
        author: "tiktok_demo_user",
        video_id: "1234567890",
        duration: "15s",
        views: "1.5M",
        likes: "250K",
        comments: "10K",
        shares: "50K",
        watermark: false,
        thumbnail: "https://p16-sign-sg.tiktokcdn.com/obj/tos-alisg-p-0037/123456789",
        video_url: "https://example.com/tiktok-video.mp4",
        music_title: "Trending Sound",
        music_author: "Popular Artist"
      }
    };

    return {
      statusCode: error.response?.status || 500,
      headers,
      body: JSON.stringify(error.response ? {
        status: false,
        creator: "iEnz",
        error: error.response.data?.message || error.message,
        mock_data: mockData
      } : mockData)
    };
  }
};