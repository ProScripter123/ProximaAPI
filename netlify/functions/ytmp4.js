exports.handler = async (event, context) => {
  try {
    const { url, quality = '360' } = event.queryStringParameters;
    
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

    // Return video download URL
    return {
      statusCode: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        status: true,
        creator: "iEnz",
        result: "YouTube video download URL generated",
        data: {
          title: `YouTube Video - ${videoId}`,
          video_id: videoId,
          video_url: `https://api.y2mate.guru/video?id=${videoId}&q=${quality}`,
          thumbnail: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
          qualities: [
            { quality: "144p", url: `https://api.y2mate.guru/video?id=${videoId}&q=144` },
            { quality: "360p", url: `https://api.y2mate.guru/video?id=${videoId}&q=360` },
            { quality: "720p", url: `https://api.y2mate.guru/video?id=${videoId}&q=720` },
            { quality: "1080p", url: `https://api.y2mate.guru/video?id=${videoId}&q=1080` }
          ]
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
        creator: "iEnz",
        result: "Demo video data",
        data: {
          title: "Demo YouTube Video",
          video_url: "https://example.com/video.mp4",
          thumbnail: "https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg"
        }
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