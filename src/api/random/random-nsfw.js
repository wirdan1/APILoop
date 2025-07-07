const axios = require('axios');

async function getBuffer(url) {
  const response = await axios.get(url, { responseType: 'arraybuffer' });
  return response.data;
}

module.exports = function (app) {
  app.get('/random/nsfw', async (req, res) => {
    try {
      const types = ['blowjob', 'neko', 'trap', 'waifu'];
      const randomType = types[Math.floor(Math.random() * types.length)];
      const apiUrl = `https://api.waifu.pics/nsfw/${randomType}`;

      const { data } = await axios.get(apiUrl);
      if (!data.url) {
        return res.status(500).json({
          status: false,
          message: 'Gagal mengambil gambar.'
        });
      }

      const imageBuffer = await getBuffer(data.url);
      res.writeHead(200, {
        'Content-Type': 'image/png',
        'Content-Length': imageBuffer.length
      });
      res.end(imageBuffer);

    } catch (error) {
      res.status(500).json({
        status: false,
        message: 'Terjadi kesalahan saat mengambil gambar.',
        error: error.message
      });
    }
  });
};
