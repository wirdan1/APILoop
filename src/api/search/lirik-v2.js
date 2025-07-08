const axios = require('axios');
const cheerio = require('cheerio');

module.exports = function (app) {
  app.get('/search/lirik', async (req, res) => {
    try {
      const query = req.query.q;

      if (!query) {
        return res.status(400).json({
          status: false,
          message: 'Parameter ?q= diperlukan.'
        });
      }

      const baseURL = 'https://www.chosic.com/find-song-by-lyrics/';
      const response = await axios.get(`${baseURL}?q=${encodeURIComponent(query)}`);
      const $ = cheerio.load(response.data);
      const results = [];

      $('.blog-list-item').each((_, el) => {
        const title = $(el).find('h2').text().trim();
        const snippet = $(el).find('.excerpt').text().trim();
        const link = $(el).find('a').attr('href')?.trim();
        const img = $(el).find('img').attr('src')?.trim();

        if (title && snippet) {
          results.push({
            title,
            snippet,
            link: link || null,
            image: img || null
          });
        }
      });

      if (!results.length) {
        return res.json({
          status: true,
          message: 'Tidak ada lagu ditemukan.',
          result: []
        });
      }

      res.json({
        status: true,
        query,
        total: results.length,
        result: results
      });

    } catch (error) {
      res.status(500).json({
        status: false,
        message: 'Terjadi kesalahan: ' + error.message
      });
    }
  });
};
