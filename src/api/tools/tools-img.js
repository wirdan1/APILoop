const axios = require('axios');
const cheerio = require('cheerio');
const FormData = require('form-data');

module.exports = function (app) {
  const BASE_URL = 'https://imagetools.rapikzyeah.biz.id';
  const AVAILABLE_TYPES = ['removebg', 'enhance', 'upscale', 'restore', 'colorize'];

  async function uploadFromUrl(imageUrl, type) {
    if (!imageUrl) throw new Error('Image URL is required');
    if (!AVAILABLE_TYPES.includes(type)) {
      throw new Error(`Invalid type. Allowed: ${AVAILABLE_TYPES.join(', ')}`);
    }

    const imageResponse = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
      timeout: 10000
    });

    const buffer = Buffer.from(imageResponse.data);

    const form = new FormData();
    form.append('file', buffer, `${Date.now()}.jpg`);
    form.append('type', type);

    const { data } = await axios.post(`${BASE_URL}/upload`, form, {
      headers: form.getHeaders(),
      timeout: 15000
    });

    const $ = cheerio.load(data);
    const resultUrl = $('img#memeImage').attr('src');

    if (!resultUrl) throw new Error('No result found from server');
    return resultUrl;
  }

  // Daftar fitur yang tersedia
  app.get('/image/tools/list', (_req, res) => {
    res.status(200).json({
      status: true,
      result: AVAILABLE_TYPES
    });
  });

  // Endpoint utama: upload dari image URL
  app.get('/image/tools', async (req, res) => {
    const { url, type } = req.query;

    if (!url || !type) {
      return res.status(400).json({
        status: false,
        error: 'Parameters "url" and "type" are required'
      });
    }

    try {
      const result = await uploadFromUrl(url, type);
      res.status(200).json({ status: true, result });
    } catch (err) {
      res.status(500).json({ status: false, error: err.message });
    }
  });
};
