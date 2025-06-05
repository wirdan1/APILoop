const axios = require('axios');

module.exports = function(app) {
  app.get('/deepimg', async (req, res) => {
    const { prompt, style = 'default', size = '1:1' } = req.query;

    const sizeList = {
      '1:1': '1024x1024',
      '3:2': '1080x720',
      '2:3': '720x1080'
    };
    const styleList = {
      'default': '-style Realism',
      'ghibli': '-style Ghibli Art',
      'cyberpunk': '-style Cyberpunk',
      'anime': '-style Anime',
      'portrait': '-style Portrait',
      'chibi': '-style Chibi',
      'pixel art': '-style Pixel Art',
      'oil painting': '-style Oil Painting',
      '3d': '-style 3D'
    };

    if (!prompt) {
      return res.status(400).json({
        status: false,
        message: 'Parameter ?prompt= wajib diisi.'
      });
    }

    if (!styleList[style]) {
      return res.status(400).json({
        status: false,
        message: `Style tidak valid. Pilihan: ${Object.keys(styleList).join(', ')}`
      });
    }

    if (!sizeList[size]) {
      return res.status(400).json({
        status: false,
        message: `Size tidak valid. Pilihan: ${Object.keys(sizeList).join(', ')}`
      });
    }

    try {
      const device_id = Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('');

      const { data } = await axios.post('https://api-preview.apirouter.ai/api/v1/deepimg/flux-1-dev', {
        device_id,
        prompt: prompt + ' ' + styleList[style],
        size: sizeList[size],
        n: '1',
        output_format: 'png'
      }, {
        headers: {
          'content-type': 'application/json',
          origin: 'https://deepimg.ai',
          referer: 'https://deepimg.ai/',
          'user-agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Mobile Safari/537.36'
        }
      });

      res.json({
        status: true,
        prompt,
        style,
        size,
        image: data.data.images[0].url
      });

    } catch (error) {
      res.status(500).json({
        status: false,
        message: 'Gagal generate gambar',
        error: error.message
      });
    }
  });
};
