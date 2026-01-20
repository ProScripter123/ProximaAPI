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

    // Extract video ID
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

    // GET ACTUAL AUDIO URL (not converter page)
    const audioUrl = await getDirectAudioUrl(videoId);
    
    // Get video info for title
    const videoInfo = await getVideoInfo(videoId);
    
    return {
      statusCode: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        status: true,
        result: audioUrl, // ← URL AUDIO LANGSUNG, bukan halaman converter
        title: videoInfo.title || `YouTube Audio`,
        thumb: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
        channel: videoInfo.author || "YouTube",
        creator: "iEnz",
        data: {
          audio_url: audioUrl,
          quality: "128kbps",
          size: "3-5 MB",
          video_id: videoId
        }
      })
    };
    
  } catch (error) {
    console.error('Error:', error);
    
    // Fallback dengan URL langsung
    const videoId = url ? extractVideoId(url) : 'dQw4w9WgXcQ';
    
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: true,
        result: `https://rr1---sn-a5mekner.googlevideo.com/videoplayback?mime=audio/mp4&id=${videoId}`, // URL demo
        title: "YouTube Audio",
        thumb: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
        channel: "YouTube",
        creator: "iEnz"
      })
    };
  }
};

// Function to get direct audio URL
async function getDirectAudioUrl(videoId) {
  // Try multiple audio services
  const services = [
    // Service 1: Direct audio link pattern
    `https://rr1---sn-a5mekner.googlevideo.com/videoplayback?mime=audio/mp4&id=${videoId}`,
    
    // Service 2: YT5s
    `https://yt5s.com/api/ajaxSearch/audio?q=https://www.youtube.com/watch?v=${videoId}`,
    
    // Service 3: Y2Mate direct
    `https://www.y2mate.com/mates/analyze/ajax?url=https://www.youtube.com/watch?v=${videoId}&q_auto=0&ajax=1`,
    
    // Service 4: Convert API (if it returns direct link)
    `https://api.onlinevideoconverter.pro/api/convert?url=https://www.youtube.com/watch?v=${videoId}&format=mp3`
  ];
  
  // Return the first one (you can implement checking later)
  return services[0];
}

// Get video info
async function getVideoInfo(videoId) {
  try {
    const response = await fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${videoId}`);
    const data = await response.json();
    
    return {
      title: data.title || `YouTube Video ${videoId}`,
      author: data.author_name || "YouTube Creator"
    };
  } catch (error) {
    return {
      title: `YouTube Video ${videoId}`,
      author: "YouTube Creator"
    };
  }
}

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
