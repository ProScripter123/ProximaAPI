const axios = require('axios');

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
  };

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
          message: "Instagram URL is required"
        })
      };
    }

    console.log(`Processing Instagram URL: ${url}`);

    // Use Instagram public API
    const response = await axios.get(`https://www.instagram.com/api/v1/oembed/?url=${encodeURIComponent(url)}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 10000
    });

    const data = response.data;

    const result = {
      status: true,
      creator: "iEnz",
      result: "Instagram data retrieved",
      data: {
        title: data.title || "Instagram Post",
        author: data.author_name || "Instagram User",
        author_url: data.author_url || "",
        thumbnail: data.thumbnail_url || "",
        media_url: data.thumbnail_url.replace(/\/[^\/]+\.jpg$/, '/media?size=l') || "",
        width: data.width || 0,
        height: data.height || 0,
        html: data.html || "",
        type: data.type || "rich",
        provider: data.provider_name || "Instagram",
        post_id: extractPostId(url)
      }
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(result, null, 2)
    };

  } catch (error) {
    console.error('Instagram API Error:', error.message);
    
    // Mock data
    const mockData = {
      status: true,
      creator: "iEnz",
      result: "Demo Instagram Data (Mock)",
      data: {
        title: "Beautiful Sunset ☀️",
        author: "instagram_user",
        thumbnail: "https://instagram.com/static/images/instagram.jpg",
        media_url: "https://example.com/instagram-video.mp4",
        width: 1080,
        height: 1350,
        type: "video",
        post_id: "Cxample123",
        likes: "15K",
        comments: "500",
        timestamp: Date.now()
      }
    };

    return {
      statusCode: error.response?.status || 500,
      headers,
      body: JSON.stringify(error.response ? {
        status: false,
        creator: "iEnz",
        error: error.message,
        mock_data: mockData
      } : mockData)
    };
  }
};

function extractPostId(url) {
  const matches = url.match(/\/(p|reel|tv)\/([^\/?#]+)/);
  return matches ? matches[2] : "unknown";
}
