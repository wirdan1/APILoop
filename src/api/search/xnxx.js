const axios = require('axios');
const cheerio = require('cheerio');

async function xnxxSearch(query) {
  const baseurl = "https://www.xnxx.com";
  const res = await axios.get(`${baseurl}/search/${encodeURIComponent(query)}/${Math.floor(Math.random() * 3) + 1}`);
  const $ = cheerio.load(res.data);
  const title = [];
  const url = [];
  const desc = [];
  const results = [];

  $("div.mozaique").each((_, b) => {
    $(b).find("div.thumb").each((_, d) => {
      const link = $(d).find("a").attr("href");
      if (link) url.push(baseurl + link.replace("/THUMBNUM/", "/"));
    });
  });

  $("div.mozaique").each((_, b) => {
    $(b).find("div.thumb-under").each((_, d) => {
      desc.push($(d).find("p.metadata").text());
      $(d).find("a").each((_, f) => {
        title.push($(f).attr("title"));
      });
    });
  });

  for (let i = 0; i < title.length; i++) {
    results.push({
      title: title[i],
      info: desc[i],
      link: url[i],
    });
  }

  return results;
}

module.exports = function (app) {
  app.get('/xnxx/search', async (req, res) => {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({
        status: false,
        message: 'Masukkan parameter query. Contoh: /xnxx/search?query=naruto'
      });
    }

    try {
      const results = await xnxxSearch(query);
      if (!results.length) throw new Error('Tidak ada hasil ditemukan.');
      res.json({
        status: true,
        query,
        result: results
      });
    } catch (error) {
      res.status(500).json({
        status: false,
        message: 'Terjadi kesalahan saat mencari video.',
        error: error.message
      });
    }
  });
};
