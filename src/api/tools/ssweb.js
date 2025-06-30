const axios = require('axios');

module.exports = function(app) {
  app.get('/ssweb', async (req, res) => {
    const { url, type = 'desktop' } = req.query;

    if (!/^https?:\/\//.test(url)) {
      return res.status(400).json({ status: false, message: 'Masukkan URL yang valid, senpai~' });
    }

    const types = {
      desktop: { device: 'desktop', fullPage: false },
      mobile:  { device: 'mobile', fullPage: false },
      full:    { device: 'desktop', fullPage: true },
    };

    if (!(type in types)) {
      return res.status(400).json({ status: false, message: 'Tipe harus: desktop, mobile, atau full' });
    }

    try {
      const payload = { url: url.trim(), ...types[type] };
      const response = await axios.post('https://api.magickimg.com/generate/website-screenshot', payload, {
        responseType: 'arraybuffer',
        headers: {
          'Content-Type': 'application/json',
          'Origin': 'https://magickimg.com',
          'Referer': 'https://magickimg.com',
          'User-Agent': 'Mozilla/5.0'
        }
      });

      res.setHeader('Content-Type', 'image/png');
      res.send(Buffer.from(response.data));
    } catch (err) {
      res.status(500).json({
        status: false,
        message: 'Yabai! Screenshot gagal.',
        error: err?.message || 'Unknown error'
      });
    }
  });
};
