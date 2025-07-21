const axios = require('axios');
const cheerio = require('cheerio');

module.exports = function (app) {
  app.get('/api/anime', async (req, res) => {
    const { search } = req.query;

    if (!search) {
      return res.status(400).json({
        status: false,
        message: 'Parameter ?search= wajib diisi!'
      });
    }

    try {
      const response = await axios.get(`https://otakotaku.com/quote/search?q=${encodeURIComponent(search)}&q_filter=quote`);
      const $ = cheerio.load(response.data);
      const quotes = [];

      $('.kotodama-list').each((_, element) => {
        quotes.push({
          link: $(element).find('a.kuroi').attr('href'),
          gambar: $(element).find('.char-img img').attr('data-src'),
          karakter: $(element).find('.char-name').text().trim(),
          anime: $(element).find('.anime-title').text().trim(),
          episode: $(element).find('.meta').text().trim(),
          quote: $(element).find('.quote').text().trim()
        });
      });

      if (!quotes.length) {
        return res.json({
          status: false,
          message: 'Tidak ditemukan quote dengan kata kunci tersebut.'
        });
      }

      res.json({
        status: true,
        total: quotes.length,
        result: quotes
      });

    } catch (error) {
      res.status(500).json({
        status: false,
        message: 'Terjadi kesalahan saat mengambil data',
        error: error.message
      });
    }
  });
};
