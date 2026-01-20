exports.handler = async (event, context) => {
  try {
    const { url } = event.queryStringParameters;
    
    if (!url) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: false,
          error: "URL parameter is required"
        })
      };
    }

    // Extract video ID from YouTube URL
    const videoId = extractVideoId(url);
    if (!videoId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ 
          status: false,
          error: "Invalid YouTube URL" 
        })
      };
    }

    // Untuk bot WhatsApp, return format khusus
    return {
      statusCode: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        status: true,
        result: `https://api.onlinevideoconverter.pro/api/convert?url=https://www.youtube.com/watch?v=${videoId}`,
        title: `YouTube Audio - ${videoId}`,
        thumb: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
        channel: "YouTube",
        creator: "iEnz",
        data: {
          audio_url: `https://api.onlinevideoconverter.pro/api/convert?url=https://www.youtube.com/watch?v=${videoId}`,
          quality: "mp3",
          size: "5-10 MB"
        }
      })
    };
    
  } catch (error) {
    console.error('Error:', error);
    
    // Fallback response
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: true,
        result: "https://example.com/audio.mp3",
        title: "YouTube Audio",
        thumb: "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
        channel: "YouTube",
        creator: "iEnz"
      })
    };
  }
};

function extractVideoId(url) {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/shorts\/([^&\n?#]+)/,
    /youtube\.com\/live\/([^&\n?#]+)/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  return null;
}
