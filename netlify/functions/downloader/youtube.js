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
          message: "YouTube URL is required"
        })
      };
    }

    console.log(`Processing YouTube URL: ${url}`);
    
    // Extract video ID from various YouTube URL formats
    let videoId = '';
    if (url.includes('youtu.be/')) {
      videoId = url.split('youtu.be/')[1].split('?')[0];
    } else if (url.includes('v=')) {
      videoId = url.split('v=')[1].split('&')[0];
    } else if (url.includes('/embed/')) {
      videoId = url.split('/embed/')[1].split('?')[0];
    } else if (url.includes('youtube.com/shorts/')) {
      videoId = url.split('shorts/')[1].split('?')[0];
    }

    if (!videoId) {
      throw new Error('Could not extract video ID from URL');
    }

    // Use public YouTube API (youtubei/v1/player)
    const response = await axios.post(
      'https://www.youtube.com/youtubei/v1/player?key=AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8',
      {
        context: {
          client: {
            clientName: 'WEB',
            clientVersion: '2.20231219.06.00',
            hl: 'en',
            gl: 'US'
          }
        },
        videoId: videoId
      },
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Content-Type': 'application/json'
        },
        timeout: 15000
      }
    );

    const data = response.data;
    
    if (!data.videoDetails) {
      throw new Error('Invalid YouTube video data');
    }

    const result = {
      status: true,
      creator: "iEnz",
      result: "YouTube video data retrieved",
      data: {
        title: data.videoDetails.title,
        author: data.videoDetails.author,
        video_id: videoId,
        duration: formatDuration(data.videoDetails.lengthSeconds),
        views: data.videoDetails.viewCount || "N/A",
        likes: data.videoDetails.likes || "N/A",
        thumbnail: data.videoDetails.thumbnail.thumbnails.pop().url,
        description: data.videoDetails.shortDescription || "",
        keywords: data.videoDetails.keywords || [],
        category: data.videoDetails.category || "Entertainment",
        publish_date: data.videoDetails.publishDate || "N/A",
        is_live: data.videoDetails.isLive || false,
        is_private: data.videoDetails.isPrivate || false,
        is_unlisted: data.videoDetails.isUnlisted || false,
        formats: []
      }
    };

    // Add available formats
    if (data.streamingData) {
      const formats = [];
      if (data.streamingData.formats) {
        formats.push(...data.streamingData.formats.map(f => ({
          quality: f.qualityLabel || f.quality,
          fps: f.fps,
          url: f.url,
          mimeType: f.mimeType,
          bitrate: f.bitrate,
          width: f.width,
          height: f.height
        })));
      }
      if (data.streamingData.adaptiveFormats) {
        formats.push(...data.streamingData.adaptiveFormats.map(f => ({
          quality: f.qualityLabel || f.quality,
          fps: f.fps,
          url: f.url,
          mimeType: f.mimeType,
          bitrate: f.bitrate,
          width: f.width,
          height: f.height
        })));
      }
      result.data.formats = formats;
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(result, null, 2)
    };

  } catch (error) {
    console.error('YouTube API Error:', error.message);
    
    // Mock data for testing
    const mockData = {
      status: true,
      creator: "iEnz",
      result: "Demo YouTube Data (Mock)",
      data: {
        title: "YouTube Demo Video",
        author: "YouTube Demo Channel",
        video_id: "dQw4w9WgXcQ",
        duration: "3:45",
        views: "10M",
        likes: "500K",
        thumbnail: "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
        description: "This is a demo YouTube video description",
        formats: [
          {
            quality: "1080p",
            fps: 30,
            url: "https://example.com/youtube-video-1080p.mp4",
            mimeType: "video/mp4"
          },
          {
            quality: "720p",
            fps: 30,
            url: "https://example.com/youtube-video-720p.mp4",
            mimeType: "video/mp4"
          }
        ]
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

function formatDuration(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}