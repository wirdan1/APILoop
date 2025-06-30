const axios = require('axios');

module.exports = function(app) {
  app.get('/tools/ssweb', async (req, res) => {
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({
        status: false,
        message: 'Berikan URL-nya dulu dong, senpai!\nContoh: /ssweb?url=https://www.nasa.gov'
      });
    }

    try {
      const response = await axios.get(`https://image.thum.io/get/png/fullpage/viewportWidth/2400/${url}`, {
        responseType: 'arraybuffer'
      });

      const buffer = Buffer.from(response.data);

      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Content-Disposition', 'inline; filename="screenshot.png"');
      res.send(buffer);
    } catch (err) {
      res.status(500).json({
        status: false,
        message: 'Yabai! Gagal mengambil screenshot dari URL tersebut.',
        error: err.message
      });
    }
  });
};
