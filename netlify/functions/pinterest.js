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
          message: "Pinterest URL is required"
        })
      };
    }

    console.log(`Processing Pinterest URL: ${url}`);

    // Extract pin ID from URL
    const pinId = extractPinId(url);
    
    // Use Pinterest API
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Cache-Control': 'max-age=0'
      },
      timeout: 15000
    });

    const $ = cheerio.load(response.data);
    
    // Try to extract from JSON-LD
    let pinData = {};
    try {
      const jsonLd = $('script[type="application/ld+json"]').html();
      if (jsonLd) {
        const data = JSON.parse(jsonLd);
        if (Array.isArray(data)) {
          pinData = data.find(item => item['@type'] === 'ImageObject') || {};
        } else {
          pinData = data;
        }
      }
    } catch (e) {
      console.log('JSON-LD parsing failed, using fallback');
    }

    // Extract from meta tags
    const metaTags = {
      title: $('meta[property="og:title"]').attr('content') ||
             $('meta[name="twitter:title"]').attr('content') ||
             $('title').text() ||
             "Pinterest Pin",
      
      description: $('meta[property="og:description"]').attr('content') ||
                   $('meta[name="twitter:description"]').attr('content') ||
                   $('meta[name="description"]').attr('content') ||
                   "",
      
      image: $('meta[property="og:image"]').attr('content') ||
             $('meta[name="twitter:image"]').attr('content') ||
             $('meta[property="og:image:secure_url"]').attr('content') ||
             $('img[src*="pinimg"]').first().attr('src') ||
             "",
      
      author: $('meta[property="og:site_name"]').attr('content') ||
              $('meta[name="twitter:site"]').attr('content') ||
              "Pinterest User",
      
      url: $('meta[property="og:url"]').attr('content') || url
    };

    // Clean image URL
    let imageUrl = metaTags.image || pinData.url || pinData.contentUrl || "";
    if (imageUrl && !imageUrl.startsWith('http')) {
      imageUrl = `https:${imageUrl}`;
    }
    
    // Remove size parameters for original image
    if (imageUrl.includes('originals')) {
      imageUrl = imageUrl.replace(/\/\d+x\//, '/originals/');
    }

    const result = {
      status: true,
      creator: "iEnz",
      result: "Pinterest data retrieved",
      data: {
        pin_id: pinId,
        pin_url: url,
        title: metaTags.title,
        description: metaTags.description.substring(0, 200) + (metaTags.description.length > 200 ? '...' : ''),
        author: metaTags.author,
        source_url: metaTags.url,
        media_type: imageUrl.match(/\.(mp4|webm|mov)$/i) ? 'video' : 'image',
        image_url: imageUrl,
        thumbnail: imageUrl.replace('/originals/', '/236x/') || imageUrl,
        dimensions: {
          width: $('meta[property="og:image:width"]').attr('content') || "0",
          height: $('meta[property="og:image:height"]').attr('content') || "0"
        },
        created_at: new Date().toISOString(),
        download_links: [
          {
            type: 'image',
            quality: 'Original',
            url: imageUrl,
            download_url: imageUrl
          },
          {
            type: 'image',
            quality: 'HD',
            url: imageUrl.replace('/originals/', '/736x/') || imageUrl,
            download_url: imageUrl.replace('/originals/', '/736x/') || imageUrl
          },
          {
            type: 'image',
            quality: 'Medium',
            url: imageUrl.replace('/originals/', '/236x/') || imageUrl,
            download_url: imageUrl.replace('/originals/', '/236x/') || imageUrl
          }
        ]
      }
    };

    // If it's a video pin
    const videoUrl = $('meta[property="og:video"]').attr('content') ||
                     $('meta[property="og:video:url"]').attr('content') ||
                     $('video source').attr('src');
    
    if (videoUrl) {
      result.data.media_type = 'video';
      result.data.video_url = videoUrl;
      result.data.download_links.unshift({
        type: 'video',
        quality: 'HD',
        url: videoUrl,
        download_url: videoUrl
      });
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(result, null, 2)
    };

  } catch (error) {
    console.error('Pinterest API Error:', error.message);
    
    // Mock data for Pinterest
    const mockData = {
      status: true,
      creator: "iEnz",
      result: "Pinterest Demo Data (Mock)",
      data: {
        pin_id: "595699155001658720",
        pin_url: "https://www.pinterest.com/pin/595699155001658720/",
        title: "Beautiful Sunset Landscape",
        description: "Stunning sunset over mountains with clouds - nature photography",
        author: "Nature Lover",
        media_type: "image",
        image_url: "https://i.pinimg.com/originals/5a/4b/87/5a4b87c132b7f4d8f8f8f8f8f8f8f8f8.jpg",
        thumbnail: "https://i.pinimg.com/236x/5a/4b/87/5a4b87c132b7f4d8f8f8f8f8f8f8f8f8.jpg",
        dimensions: {
          width: "1200",
          height: "800"
        },
        created_at: new Date().toISOString(),
        download_links: [
          {
            type: 'image',
            quality: 'Original',
            url: 'https://i.pinimg.com/originals/5a/4b/87/5a4b87c132b7f4d8f8f8f8f8f8f8f8f8.jpg',
            download_url: 'https://i.pinimg.com/originals/5a/4b/87/5a4b87c132b7f4d8f8f8f8f8f8f8f8f8.jpg'
          },
          {
            type: 'image',
            quality: 'HD',
            url: 'https://i.pinimg.com/736x/5a/4b/87/5a4b87c132b7f4d8f8f8f8f8f8f8f8f8.jpg',
            download_url: 'https://i.pinimg.com/736x/5a/4b/87/5a4b87c132b7f4d8f8f8f8f8f8f8f8.jpg'
          },
          {
            type: 'image',
            quality: 'Medium',
            url: 'https://i.pinimg.com/236x/5a/4b/87/5a4b87c132b7f4d8f8f8f8f8f8f8f8f8.jpg',
            download_url: 'https://i.pinimg.com/236x/5a/4b/87/5a4b87c132b7f4d8f8f8f8f8f8f8f8.jpg'
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

function extractPinId(url) {
  const patterns = [
    /pin\/(\d+)/,
    /pin\/([\w-]+)/,
    /\/pin\/(\d+)/,
    /\/pin\/([\w-]+)/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  return "unknown";
}