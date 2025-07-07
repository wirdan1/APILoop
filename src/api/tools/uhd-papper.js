const axios = require('axios');
const cheerio = require('cheerio');

module.exports = function (app) {
  app.get('/tools/walpaperhd', async (req, res) => {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({
        status: false,
        message: 'Berikan parameter query. Contoh: /uhdpaper?query=naruto'
      });
    }

    try {
      const response = await axios.get(`https://www.uhdpaper.com/search?q=${encodeURIComponent(query)}&by-date=true&i=0`);
      const html = response.data;
      const $ = cheerio.load(html);
      const results = [];

      $('article.post-outer-container').each((_, element) => {
        const title = $(element).find('.snippet-title h2').text().trim();
        const imageUrl = $(element).find('.snippet-title img').attr('src');
        const resolution = $(element).find('.wp_box b').text().trim();
        const link = $(element).find('a').attr('href');

        if (title && imageUrl && resolution && link) {
          results.push({ title, imageUrl, resolution, link });
        }
      });

      if (results.length === 0) {
        throw new Error('Tidak ditemukan hasil untuk query tersebut.');
      }

      res.json({
        status: true,
        query,
        results
      });

    } catch (error) {
      res.status(500).json({
        status: false,
        message: 'Terjadi kesalahan saat mengambil data dari UHDPaper.',
        error: error.message
      });
    }
  });
};
