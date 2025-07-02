const axios = require('axios');

module.exports = function (app) {
  app.get('/ai/tts', async (req, res) => {
    const { text } = req.query;

    if (!text) {
      return res.status(400).json({
        status: false,
        message: 'Berikan parameter text. Contoh: /texttosound?text=Halo dunia'
      });
    }

    try {
      const apiUrl = `https://api.botcahx.eu.org/api/sound/texttosound?text1=${encodeURIComponent(text)}&lang=ja-JP&apikey=danz-dev`;
      const { data } = await axios.get(apiUrl);

      if (!data.status || !data.result) {
        throw new Error('Gagal mengubah teks menjadi suara.');
      }

      res.json({
        status: true,
        text,
        audio: data.result
      });
    } catch (error) {
      res.status(500).json({
        status: false,
        message: 'Terjadi kesalahan saat memproses suara.',
        error: error.message
      });
    }
  });
};
