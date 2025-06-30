const axios = require('axios');

module.exports = function(app) {
  app.get('/tools/ssweb', async (req, res) => {
    const { url, type = 'desktop' } = req.query;

    if (!/^https?:\/\//.test(url || '')) {
      return res.status(400).json({
        status: false,
        message: 'URL ga ada, yg bener dong dasar senpai bodoh!'
      });
    }

    const types = {
      desktop: { device: 'desktop', fullPage: false },
      mobile: { device: 'mobile', fullPage: false },
      full: { device: 'desktop', fullPage: true },
    };

    if (!(type in types)) {
      return res.status(400).json({
        status: false,
        message: 'Tipe tidak dikenal. Gunakan "desktop", "mobile", atau "full", senpai.'
      });
    }

    const { device, fullPage } = types[type];

    try {
      const payload = { url: url.trim(), device, fullPage };

      const response = await axios.post(
        'https://api.magickimg.com/generate/website-screenshot',
        payload,
        {
          responseType: 'arraybuffer',
          headers: {
            'Content-Type': 'application/json',
            Origin: 'https://magickimg.com',
            Referer: 'https://magickimg.com',
            Accept: 'application/json, text/plain, */*',
            'User-Agent': 'Mozilla/5.0'
          }
        }
      );

      const buffer = Buffer.from(response.data);
      const base64 = buffer.toString('base64');
      const contentType = response.headers['content-type'] || 'image/png';
      const sizeKB = (response.headers['content-length'] / 1024).toFixed(2) + ' KB';

      res.json({
        status: true,
        type,
        url: payload.url,
        device,
        fullPage,
        contentType,
        size: sizeKB,
        base64: `data:${contentType};base64,${base64}`
      });
    } catch (err) {
      res.status(500).json({
        status: false,
        message: err.message || 'Terjadi kesalahan saat mengambil screenshot... maafkan aku, senpai.'
      });
    }
  });
};
