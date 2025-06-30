const axios = require('axios');

module.exports = function (app) {
  app.get('/tools/ssweb', async (req, res) => {
    const { url } = req.query;

    if (!url || !/^https?:\/\//.test(url)) {
      return res.status(400).json({
        status: false,
        message: 'Berikan URL yang valid. Contoh: /ssweb?url=https://www.nasa.gov'
      });
    }

    try {
      const apiURL = `https://api.botcahx.eu.org/api/tools/ssweb?url=${encodeURIComponent(url)}&apikey=danz-dev`;

      const response = await axios.get(apiURL, {
        responseType: 'arraybuffer',
        headers: {
          'User-Agent': 'Mozilla/5.0'
        }
      });

      const buffer = Buffer.from(response.data);
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Content-Disposition', 'inline; filename="screenshot.png"');
      res.send(buffer);

    } catch (err) {
      console.error('Screenshot error:', err?.response?.data || err.message);
      res.status(500).json({
        status: false,
        message: 'Yahh, server hookrest lagi down bang.',
        error: err?.response?.data || err.message
      });
    }
  });
};
