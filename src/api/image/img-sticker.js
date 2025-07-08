const axios = require('axios');
const cheerio = require('cheerio');

const BASE_URL = 'https://getstickerpack.com';

async function searchSticker(query) {
  const res = await axios.get(`${BASE_URL}/stickers?query=${encodeURIComponent(query)}`);
  const $ = cheerio.load(res.data);
  const packs = [];

  $('.sticker-pack-cols a').each((_, el) => {
    const title = $(el).find('.title').text().trim();
    const href = $(el).attr('href')?.trim();
    if (title && href) {
      const fullUrl = href.startsWith('http') ? href : BASE_URL + href;
      packs.push({ title, url: fullUrl });
    }
  });

  return packs;
}

module.exports = function (app) {
  app.get('/image/search/sticker', async (req, res) => {
    try {
      const { q } = req.query;
      if (!q) {
        return res.status(400).json({
          status: false,
          message: 'Masukkan parameter q. Contoh: /search/sticker?q=anime'
        });
      }

      const results = await searchSticker(q);
      res.json({
        status: true,
        total: results.length,
        result: results
      });
    } catch (error) {
      res.status(500).json({
        status: false,
        message: 'Terjadi kesalahan saat pencarian sticker.',
        error: error.message
      });
    }
  });
};
