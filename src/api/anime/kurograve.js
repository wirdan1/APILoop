const axios = require('axios');
const cheerio = require('cheerio');

module.exports = function (app) {
  const BASE_URL = 'https://k.kurogaze.moe';
  const HEADERS = {
    'user-agent': 'Postify/1.0.0',
    accept: 'text/html',
    referer: BASE_URL + '/'
  };

  const fetchHTML = async (url) => {
    const { data } = await axios.get(url, { headers: HEADERS, timeout: 15000 });
    return cheerio.load(data);
  };

  app.get('/anime/search', async (req, res) => {
    const { q, page = 1 } = req.query;
    if (!q) {
      return res.status(400).json({ status: false, error: 'Query is required' });
    }

    try {
      const $ = await fetchHTML(`${BASE_URL}/page/${page}/?s=${encodeURIComponent(q)}&post_type=post`);
      const articles = $('.artikel-post article').toArray();

      if (!articles.length) {
        return res.status(404).json({ status: false, error: `Anime "${q}" tidak ditemukan.` });
      }

      const results = articles.map(el => {
        const wrap = $(el);
        return {
          title: wrap.find('h2.title a').text().trim(),
          link: wrap.find('h2.title a').attr('href'),
          image: wrap.find('.thumb img').attr('src')
        };
      });

      res.status(200).json({
        status: true,
        result: {
          keyword: q,
          page: parseInt(page),
          totalResults: results.length,
          data: results
        }
      });
    } catch (err) {
      res.status(500).json({ status: false, error: 'Gagal mengambil hasil pencarian.', details: err.message });
    }
  });

  app.get('/anime/details', async (req, res) => {
    const { url } = req.query;
    if (!url) return res.status(400).json({ status: false, error: 'Parameter "url" diperlukan.' });

    try {
      const $ = await fetchHTML(url);
      const title = $('h1').text().trim();
      const sinopsis = $('.sinopsis .content').text().trim();
      const info = {};

      $('.single-data table tr').each((_, tr) => {
        const key = $(tr).find('td').first().text().trim().toLowerCase();
        const val = $(tr).find('td').last().text().trim();
        info[key] = val;
      });

      const trailer = $('.trailer iframe').attr('src') || null;
      const episodeList = $('.episode-data ul li').map((_, li) => $(li).text().trim()).get();
      const downloadLinks = [];

      $('.dlcontent .title-dl-anime').each((_, el) => {
        const episodeTitle = $(el).text().trim();
        const episodeNumber = episodeTitle.match(/Episode\s+(\d+)/i)?.[1] || null;

        $(el).next('.dl-content-for').find('.reso').each((_, r) => {
          const resolution = $(r).find('strong').text().trim();
          const mirrors = $(r).find('a').map((_, a) => ({
            label: $(a).text().trim(),
            link: $(a).attr('href')
          })).get();

          if (resolution && mirrors.length) {
            downloadLinks.push({ episode: episodeNumber, episodeTitle, resolution, mirrors });
          }
        });
      });

      if (!downloadLinks.length) {
        $('.content-batch ul li, .dl-content-for .reso').each((_, r) => {
          const resolution = $(r).find('strong').text().trim();
          const mirrors = $(r).find('a').map((_, a) => ({
            label: $(a).text().trim(),
            link: $(a).attr('href')
          })).get();

          if (resolution && mirrors.length) downloadLinks.push({ resolution, mirrors });
        });
      }

      res.status(200).json({
        status: true,
        result: {
          title,
          sinopsis,
          type: info.type || 'Unknown',
          status: info.status || '',
          score: info.score || '',
          premiered: info.premiered || '',
          genre: info.genre || '',
          studio: info.studios || '',
          trailer,
          episodeList,
          downloadLinks
        }
      });
    } catch (err) {
      res.status(500).json({ status: false, error: 'Gagal mengambil detail anime.', details: err.message });
    }
  });

  app.get('/anime/schedule', async (_req, res) => {
    try {
      const $ = await fetchHTML(`${BASE_URL}/jadwal-rilis/`);
      const jadwal = {};

      $('.contnet-artikel h3').each((_, h) => {
        const hari = $(h).text().trim().toUpperCase();
        if (!['SENIN','SELASA','RABU','KAMIS','JUMAT','SABTU','MINGGU'].includes(hari)) return;

        const list = [];
        $(h).next('p').find('a').each((_, a) => {
          const link = $(a).attr('href');
          const title = $(a).text().trim();
          const timeMatch = $(a).parent().text().match(/\((.*?)\)/);
          const time = timeMatch ? timeMatch[1].replace(/–/g, '-') : null;
          list.push({ title, time, link });
        });

        jadwal[hari] = list;
      });

      res.status(200).json({
        status: true,
        result: {
          updated: new Date().toISOString(),
          schedule: jadwal
        }
      });
    } catch (err) {
      res.status(500).json({ status: false, error: 'Gagal mengambil jadwal.', details: err.message });
    }
  });

  app.get('/anime/ongoing', async (_req, res) => {
    try {
      const $ = await fetchHTML(BASE_URL);
      const data = [];

      $('.carousel-wrapp .owl-carousel .article.item').each((_, el) => {
        const wrap = $(el);
        data.push({
          title: wrap.find('h3').text().trim(),
          link: wrap.find('a').attr('href'),
          image: wrap.find('img').attr('src'),
          time: wrap.find('.waktu-carousel').text().trim(),
          episode: wrap.find('.eps-terbaru').text().trim()
        });
      });

      res.status(200).json({
        status: true,
        result: {
          updated: new Date().toISOString(),
          data
        }
      });
    } catch (err) {
      res.status(500).json({ status: false, error: 'Gagal mengambil anime ongoing.', details: err.message });
    }
  });
};
