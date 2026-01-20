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

    // Get video info first
    const videoInfo = await getVideoInfo(videoId);
    
    // Generate audio URL (gunakan service pihak ketiga)
    const audioUrl = await getAudioUrl(videoId);
    
    // FORMAT RESPONSE UNTUK BOT WHATSAPP
    return {
      statusCode: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        status: true,
        result: audioUrl,  // <- URL langsung untuk WhatsApp audio
        title: videoInfo.title,
        thumb: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
        channel: videoInfo.author,
        creator: "iEnz",
        // Data tambahan untuk debugging
        data: {
          video_id: videoId,
          audio_url: audioUrl,
          thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
          duration: videoInfo.duration,
          quality: "128kbps MP3"
        }
      })
    };
    
  } catch (error) {
    console.error('Error:', error);
    
    // FALLBACK: Return demo audio URL untuk testing
    const demoVideoId = url ? extractVideoId(url) : 'dQw4w9WgXcQ';
    
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: true,
        result: `https://www.convert2mp3.net/api/button/mp3?url=https://www.youtube.com/watch?v=${demoVideoId}`,
        title: "YouTube Audio",
        thumb: `https://i.ytimg.com/vi/${demoVideoId}/hqdefault.jpg`,
        channel: "YouTube",
        creator: "iEnz",
        data: {
          note: "Demo audio URL (real service might be offline)",
          video_id: demoVideoId
        }
      })
    };
  }
};

// Helper function to extract video ID
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

// Get video info
async function getVideoInfo(videoId) {
  try {
    // Try to get info via oEmbed
    const response = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
    const data = await response.json();
    
    return {
      title: data.title || `YouTube Video ${videoId}`,
      author: data.author_name || "YouTube Creator",
      duration: "N/A"
    };
  } catch (error) {
    return {
      title: `YouTube Video ${videoId}`,
      author: "YouTube Creator",
      duration: "N/A"
    };
  }
}

// Get audio URL from various services
async function getAudioUrl(videoId) {
  const services = [
    // Service 1: Convert2MP3
    `https://www.convert2mp3.net/api/button/mp3?url=https://www.youtube.com/watch?v=${videoId}`,
    
    // Service 2: YTMP3.cc API
    `https://ytmp3.cc/api/button/mp3?url=https://www.youtube.com/watch?v=${videoId}`,
    
    // Service 3: OnlineVideoConverter
    `https://api.onlinevideoconverter.pro/api/convert?url=https://www.youtube.com/watch?v=${videoId}`,
    
    // Service 4: Y2Mate
    `https://api.y2mate.guru/audio?id=${videoId}`,
    
    // Service 5: Savetube
    `https://savetube.co/api/v1/download?url=https://www.youtube.com/watch?v=${videoId}&format=mp3`
  ];
  
  // Coba service pertama yang tersedia
  for (const serviceUrl of services) {
    try {
      // Test if service is accessible
      const test = await fetch(serviceUrl, { method: 'HEAD', timeout: 3000 });
      if (test.ok) {
        return serviceUrl;
      }
    } catch (e) {
      continue;
    }
  }
  
  // Jika semua gagal, return service pertama sebagai fallback
  return services[0];
}
