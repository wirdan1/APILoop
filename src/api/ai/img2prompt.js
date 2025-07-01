const axios = require('axios');

module.exports = function (app) {
  app.get('/ai/img2prompt', async (req, res) => {
    const { url } = req.query;

    if (!url || !/^https?:\/\//.test(url)) {
      return res.status(400).json({
        status: false,
        message: 'Parameter ?url= wajib diisi dan harus berupa URL gambar yang valid.\nContoh: /img2prompt?url=https://telegra.ph/file/xxx.jpg'
      });
    }

    try {
      const apiUrl = `https://api.botcahx.eu.org/api/tools/img2prompt?url=${encodeURIComponent(url)}&apikey=danz-dev`;
      const { data } = await axios.get(apiUrl);

      if (!data.status || !data.result) {
        throw new Error('Gagal mengambil prompt dari gambar.');
      }

      res.json({
        status: true,
        url,
        prompt: data.result
      });
    } catch (error) {
      res.status(500).json({
        status: false,
        message: 'Terjadi kesalahan saat mengambil data dari API.',
        error: error.message
      });
    }
  });
};
