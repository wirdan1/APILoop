const axios = require('axios');

module.exports = function (app) {
  app.get('/ai/tts', async (req, res) => {
    const { text, apikey, lang } = req.query;

    // Validasi apikey user
    if (!global.apikeyf || !global.apikeyf.includes(apikey)) {
      return res.status(401).json({
        status: false,
        message: 'Apikey tidak valid.'
      });
    }

    // Validasi text
    if (!text) {
      return res.status(400).json({
        status: false,
        message: 'Parameter text wajib diisi. Contoh: /texttosound?text=Halo&apikey=xxxx'
      });
    }

    try {
      // Lang default: Jepang
      const apiUrl = `https://api.botcahx.eu.org/api/sound/texttosound?text1=${encodeURIComponent(text)}&lang=${lang || 'ja-JP'}&apikey=danz-dev`;

      const { data } = await axios.get(apiUrl);

      if (!data.status || !data.result) {
        throw new Error('Gagal mengubah teks menjadi suara.');
      }

      res.json({
        status: true,
        text,
        lang: lang || 'ja-JP',
        audio_url: data.result
      });
    } catch (error) {
      res.status(500).json({
        status: false,
        message: 'Terjadi kesalahan saat memproses permintaan.',
        error: error.message
      });
    }
  });
};
