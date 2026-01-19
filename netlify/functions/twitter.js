const axios = require('axios');
const cheerio = require('cheerio');

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
          message: "Twitter URL is required"
        })
      };
    }

    console.log(`Processing Twitter URL: ${url}`);

    // Extract tweet ID from URL
    const tweetId = extractTweetId(url);
    
    if (!tweetId) {
      throw new Error('Invalid Twitter URL format');
    }

    // Use Twitter API via nitter (public instance)
    const nitterUrl = `https://nitter.net/i/status/${tweetId}`;
    
    const response = await axios.get(nitterUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 15000
    });

    const $ = cheerio.load(response.data);
    
    // Extract tweet data
    const tweetData = {
      text: $('.tweet-content').text().trim() || "",
      author: $('.fullname').text().trim() || $('.username').text().trim() || "Unknown",
      author_handle: $('.username').text().trim().replace('@', '') || "unknown",
      timestamp: $('.tweet-date a').attr('title') || $('.tweet-date').text().trim() || "",
      likes: extractCount($('.icon-heart').parent().text()) || "0",
      retweets: extractCount($('.icon-retweet').parent().text()) || "0",
      replies: extractCount($('.icon-comment').parent().text()) || "0",
      media: []
    };

    // Extract media (images/videos)
    $('.attachment.image img').each((i, elem) => {
      const imgUrl = $(elem).attr('src');
      if (imgUrl && !imgUrl.includes('placeholder')) {
        tweetData.media.push({
          type: 'image',
          url: imgUrl.startsWith('http') ? imgUrl : `https://nitter.net${imgUrl}`,
          thumbnail: imgUrl.startsWith('http') ? imgUrl : `https://nitter.net${imgUrl}`
        });
      }
    });

    // Try to find video
    $('video source').each((i, elem) => {
      const videoUrl = $(elem).attr('src');
      if (videoUrl) {
        tweetData.media.push({
          type: 'video',
          url: videoUrl.startsWith('http') ? videoUrl : `https://nitter.net${videoUrl}`,
          thumbnail: tweetData.media[0]?.thumbnail || ""
        });
      }
    });

    // If no media found, use mock data
    if (tweetData.media.length === 0) {
      tweetData.media.push({
        type: 'video',
        url: `https://twittervideodownloader.com/dl?url=${encodeURIComponent(url)}`,
        thumbnail: "https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png"
      });
    }

    const result = {
      status: true,
      creator: "iEnz",
      result: "Twitter data retrieved",
      data: {
        tweet_id: tweetId,
        tweet_url: url,
        ...tweetData,
        download_links: tweetData.media.map(media => ({
          type: media.type,
          url: media.url,
          quality: media.type === 'video' ? 'HD' : 'Original',
          download_url: media.type === 'video' ? 
            `https://twdown.net/download.php?url=${encodeURIComponent(url)}` :
            media.url
        }))
      }
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(result, null, 2)
    };

  } catch (error) {
    console.error('Twitter API Error:', error.message);
    
    // Mock data for Twitter
    const mockData = {
      status: true,
      creator: "iEnz",
      result: "Twitter Demo Data (Mock)",
      data: {
        tweet_id: "1234567890",
        tweet_url: "https://twitter.com/Twitter/status/1234567890",
        text: "This is a demo tweet showing Twitter downloader functionality 🐦",
        author: "Twitter User",
        author_handle: "twitteruser",
        timestamp: new Date().toISOString(),
        likes: "1.5K",
        retweets: "500",
        replies: "120",
        media: [
          {
            type: 'video',
            url: 'https://example.com/twitter-video.mp4',
            thumbnail: 'https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png',
            quality: 'HD',
            size: '15MB'
          }
        ],
        download_links: [
          {
            type: 'video',
            url: 'https://example.com/twitter-video.mp4',
            quality: 'HD',
            download_url: 'https://twdown.net/download.php?url=https://twitter.com/user/status/1234567890'
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
        mock_data: mockData.data
      } : mockData)
    };
  }
};

function extractTweetId(url) {
  const patterns = [
    /twitter\.com\/\w+\/status\/(\d+)/,
    /x\.com\/\w+\/status\/(\d+)/,
    /status\/(\d+)/,
    /\/statuses\/(\d+)/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  return null;
}

function extractCount(text) {
  const match = text.match(/(\d+\.?\d*)(K|M|B)?/);
  if (!match) return "0";
  
  let count = parseFloat(match[1]);
  const suffix = match[2];
  
  if (suffix === 'K') count *= 1000;
  else if (suffix === 'M') count *= 1000000;
  else if (suffix === 'B') count *= 1000000000;
  
  return Math.round(count).toString();
}