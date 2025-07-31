const axios = require('axios');
const cheerio = require('cheerio');

async function xnxxDownload(url) {
  const res = await axios.get(url);
  const $ = cheerio.load(res.data);
  const title = $('meta[property="og:title"]').attr("content");
  const duration = $('meta[property="og:duration"]').attr("content");
  const image = $('meta[property="og:image"]').attr("content");
  const videoType = $('meta[property="og:video:type"]').attr("content");
  const videoWidth = $('meta[property="og:video:width"]').attr("content");
  const videoHeight = $('meta[property="og:video:height"]').attr("content");
  const info = $("span.metadata").text();
  const script = $("#video-player-bg > script:nth-child(6)").html() || '';

  const getMatch = (regex) => {
    const match = script.match(regex);
    return match ? match[1] : null;
  };

  const files = {
    low: getMatch(/html5player\.setVideoUrlLow\('(.*?)'\);/),
    high: getMatch(/html5player\.setVideoUrlHigh\('(.*?)'\);/),
    hls: getMatch(/html5player\.setVideoHLS\('(.*?)'\);/),
    thumb: getMatch(/html5player\.setThumbUrl\('(.*?)'\);/),
    thumb169: getMatch(/html5player\.setThumbUrl169\('(.*?)'\);/),
    thumbSlide: getMatch(/html5player\.setThumbSlide\('(.*?)'\);/),
    thumbSlideBig: getMatch(/html5player\.setThumbSlideBig\('(.*?)'\);/),
  };

  return {
    title,
    url,
    duration,
    image,
    videoType,
    videoWidth,
    videoHeight,
    info,
    files
  };
}

module.exports = function (app) {
  app.get('/xnxx/downloadv2', async (req, res) => {
    const { url } = req.query;

    if (!url || !/^https?:\/\//.test(url)) {
      return res.status(400).json({
        status: false,
        message: 'Masukkan parameter url yang valid. Contoh: /xnxx/download?url=https://www.xnxx.com/video-abc123'
      });
    }

    try {
      const result = await xnxxDownload(url);
      res.json({
        status: true,
        url,
        result
      });
    } catch (error) {
      res.status(500).json({
        status: false,
        message: 'Terjadi kesalahan saat mengambil data video.',
        error: error.message
      });
    }
  });
};
