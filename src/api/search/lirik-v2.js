const axios = require('axios');
const cheerio = require('cheerio');

module.exports = function (app) {
  app.get('/search/lirik', async (req, res) => {
    try {
      const query = req.query.q;

      if (!query) {
        return res.status(400).json({
          status: false,
          message: 'Parameter ?q= tidak boleh kosong.'
        });
      }

      const baseUrl = 'https://www.chosic.com/find-song-by-lyrics/';
      const url = `${baseUrl}?q=${encodeURIComponent(query)}`;

      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
        }
      });

      const $ = cheerio.load(response.data);
      const results = [];

      $('.blog-list-item').each((_, el) => {
        const title = $(el).find('h2').text().trim();
        const link = $(el).find('a').attr('href');
        const snippet = $(el).find('.excerpt').text().trim();
        const img = $(el).find('img').attr('src');

        if (title && link) {
          results.push({
            title,
            snippet: snippet || null,
            image: img || null,
            url: link
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
