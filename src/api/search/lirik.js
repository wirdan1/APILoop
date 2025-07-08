const axios = require('axios');
const cheerio = require('cheerio');

module.exports = function (app) {
  app.get('/api/lyrics', async (req, res) => {
    try {
      const { q } = req.query;
      if (!q) {
        return res.status(400).json({
          status: false,
          message: 'Masukkan parameter q. Contoh: /lirik?q=jauh disana'
        });
      }

      const BASE_URL = 'https://lirik-lagu.net';
      const SEARCH_PATH = '/search';
      const encodedQuery = encodeURIComponent(q.trim().replace(/\s+/g, '+'));
      const searchUrl = `${BASE_URL}${SEARCH_PATH}/${encodedQuery}.html`;

      const searchResponse = await axios.get(searchUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });

      const $ = cheerio.load(searchResponse.data);
      const firstResult = $('.card-body.list_main .title-list a').first();

      if (!firstResult.length) {
        return res.json({
          status: false,
          message: 'Lagu tidak ditemukan.'
        });
      }

      const title = firstResult.text().trim();
      const link = BASE_URL + firstResult.attr('href');

      const detailResponse = await axios.get(link, {
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });

      const $$ = cheerio.load(detailResponse.data);
      const lirikContainer = $$('.post-read.lirik_lagu, #lirik_lagu').first();

      if (!lirikContainer.length) {
        return res.json({
          status: false,
          message: 'Lirik tidak ditemukan.'
        });
      }

      lirikContainer.find('script, style, div[align="center"], ins, .mt-3.pt-3, .artis, .tags, .adsbygoogle').remove();
      let htmlLirik = lirikContainer.html() || '';
      htmlLirik = htmlLirik.replace(/<br\s*\/?>/gi, '\n');
      let lirikText = cheerio.load(htmlLirik).text();

      const lines = lirikText.split('\n').map(line => line.trim()).filter(line => line.length > 0);

      let resultLines = [];
      for (let i = 0; i < lines.length; i++) {
        if (/^(\[.*\]|\(.*\))$/.test(lines[i]) && i > 0) {
          resultLines.push('');
        }
        resultLines.push(lines[i]);
      }

      const finalLirik = resultLines.join('\n');

      res.json({
        status: true,
        result: {
          title,
          link,
          lirik: finalLirik
        }
      });

    } catch (error) {
      res.status(500).json({
        status: false,
        message: 'Terjadi kesalahan saat mengambil lirik.',
        error: error.message
      });
    }
  });
};
