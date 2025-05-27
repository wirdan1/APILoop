const axios = require('axios');
const { URLSearchParams } = require('url');

function generateCookie() {
  const now = Date.now();
  const timestamp = Math.floor(now / 1000);
  const visitorId = Math.floor(Math.random() * 1000000000);
  const sessionId = Math.random().toString(36).substring(2, 15);
  return `PHPSESSID=${sessionId}; _ga=GA1.1.${visitorId}.${timestamp}; _ga_PDQN6PX6YK=GS1.1.${timestamp}.1.1.${timestamp}.0.0.0`;
}

function toCamelCase(str) {
  return str
    .split(/[\s-_]+/)
    .map((word, i) => (i === 0 ? word.toLowerCase() : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()))
    .join('');
}

function parseData(data) {
  try {
    const accountInfo = {};
    const accountSection = data.match(/<h3>Your Account Info:<\/h3>\s*(.*?)(?=<br \/>\s*<br \/>)/s);
    if (accountSection) {
      const lines = accountSection[1].split('<br />');
      lines.forEach(line => {
        const match = line.match(/[╭├╰]\s*([^:]+):\s*([^<]+)/);
        if (match) {
          accountInfo[toCamelCase(match[1].trim())] = match[2].trim();
        }
      });
    }

    const booyahPass = {};
    const booyahSection = data.match(/╭\s*Booyah Pass[^]*?(?=<br \/>\s*<br \/>)/);
    if (booyahSection) {
      const lines = booyahSection[0].split('<br />');
      lines.forEach(line => {
        const match = line.match(/[╭╰]\s*([^:]+):\s*([^<]+)/);
        if (match) {
          const key = match[1].toLowerCase().includes('premium') ? 'premium' : 'level';
          booyahPass[key] = match[2].trim();
        }
      });
    }

    const pet = {};
    const petSection = data.match(/🐾\s*Pet Information[^]*?(?=<br \/>\s*<br \/>)/);
    if (petSection) {
      const lines = petSection[0].split('<br />');
      lines.forEach(line => {
        const match = line.match(/[╭├╰]\s*([^:]+):\s*([^<]+)/);
        if (match) {
          pet[toCamelCase(match[1].trim())] = match[2].trim();
        }
      });
    }

    const guild = {};
    const guildSection = data.match(/Guild Information[^]*?(?=<br \/>\s*<br \/>)/);
    if (guildSection) {
      const lines = guildSection[0].split('<br />');
      lines.forEach(line => {
        const match = line.match(/[╭├╰]\s*([^:]+):\s*([^<]+)/);
        if (match) {
          guild[toCamelCase(match[1].trim())] = match[2].trim();
        }
      });
    }

    const versionMatch = data.match(/Current Version:\s*([^\s<]+)/);
    const version = versionMatch ? versionMatch[1] : null;

    const equippedItems = {
      outfit: [],
      pet: [],
      avatar: [],
      banner: [],
      weapons: [],
      title: []
    };

    const categoryMapping = {
      Outfit: 'outfit',
      Pet: 'pet',
      Avatar: 'avatar',
      Banner: 'banner',
      Weapons: 'weapons',
      Title: 'title'
    };

    Object.entries(categoryMapping).forEach(([dataCategory, jsonCategory]) => {
      const regex = new RegExp(`<h4>${dataCategory}</h4>(.*?)(?=<h4>|<script|$)`, 's');
      const match = data.match(regex);
      if (match) {
        const itemRegex = /<div class='equipped-item'><img src='([^']+)' alt='([^']+)'[^>]*><p>([^<]+)<\/p><\/div>/g;
        let itemMatch;
        while ((itemMatch = itemRegex.exec(match[1])) !== null) {
          equippedItems[jsonCategory].push({
            imageUrl: itemMatch[1],
            itemName: itemMatch[2],
            itemDescription: itemMatch[3]
          });
        }
      }
    });

    return {
      status: true,
      code: 200,
      message: "Success",
      result: { accountInfo, booyahPass, pet, guild, version, equippedItems }
    };
  } catch (error) {
    return {
      status: false,
      code: 500,
      error: error.message
    };
  }
}

async function stalk(uid) {
  if (!uid) {
    return {
      status: false,
      code: 400,
      message: "Seriously? You want to stalk without providing a UID? 🗿"
    };
  }
  if (!/^\d+$/.test(uid)) {
    return {
      status: false,
      code: 400,
      message: "UID must be numeric, please."
    };
  }

  const cookie = generateCookie();
  const formData = new URLSearchParams();
  formData.append('uid', uid);

  try {
    const response = await axios({
      method: 'POST',
      url: 'https://tools.freefireinfo.in/profileinfo.php',
      headers: {
        'authority': 'tools.freefireinfo.in',
        'accept': 'text/data,application/xdata+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'accept-language': 'en-US,en;q=0.9',
        'cache-control': 'max-age=0',
        'content-type': 'application/x-www-form-urlencoded',
        'origin': 'https://tools.freefireinfo.in',
        'referer': 'https://tools.freefireinfo.in/',
        'user-agent': 'Postify/1.0.0',
        cookie
      },
      data: formData,
      maxRedirects: 5,
      validateStatus: status => status >= 200 && status < 400
    });

    if (!response.data || typeof response.data !== 'string' || response.data.length < 100) {
      return {
        status: false,
        code: 404,
        message: "No valid response received."
      };
    }

    return parseData(response.data);

  } catch (error) {
    return {
      status: false,
      code: error.response?.status || 500,
      error: {
        type: error.name,
        details: error.message
      }
    };
  }
}

module.exports = function(app) {
  app.get('/ffstalk', async (req, res) => {
    const { uid } = req.query;

    try {
      const result = await stalk(uid);
      res.status(result.code).json(result);
    } catch (err) {
      console.error('ffStalk error:', err.message);
      res.status(500).json({
        status: false,
        message: 'Internal server error'
      });
    }
  });
};
