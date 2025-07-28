const axios = require('axios');

module.exports = function (app) {
  app.get('/download/tiktok', async (req, res) => {
    const { url } = req.query;

    if (!url || !/^https?:\/\/(www\.)?(tiktok\.com|vt\.tiktok\.com|vm\.tiktok\.com|m\.tiktok\.com)\/.+/i.test(url)) {
      return res.status(400).json({
        status: false,
        message: 'Masukkan parameter ?url= TikTok yang valid.'
      });
    }

    try {
      const { data } = await axios.get('https://tiktok-scraper7.p.rapidapi.com', {
        headers: {
          'Accept-Encoding': 'gzip',
          'Connection': 'Keep-Alive',
          'Host': 'tiktok-scraper7.p.rapidapi.com',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.130 Safari/537.36',
          'X-RapidAPI-Host': 'tiktok-scraper7.p.rapidapi.com',
          'X-RapidAPI-Key': 'ca5c6d6fa3mshfcd2b0a0feac6b7p140e57jsn72684628152a' // Ganti dengan kunci kamu sendiri
        },
        params: {
          url: url,
          hd: '1'
        }
      });

      res.json({
        status: true,
        result: data.data
      });

    } catch (error) {
      res.status(500).json({
        status: false,
        message: 'Gagal mengambil data TikTok',
        error: error.message
      });
    }
  });
};
