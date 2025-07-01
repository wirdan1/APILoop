const axios = require('axios');
const FormData = require('form-data');

module.exports = function(app) {
  app.get('/anifinder', async (req, res) => {
    const { image } = req.query;

    if (!image) {
      return res.status(400).json({
        status: false,
        message: 'Parameter ?image= wajib diisi dengan URL gambar!'
      });
    }

    try {
      // Ambil gambar dari URL
      const imageBuffer = (await axios.get(image, {
        responseType: 'arraybuffer'
      })).data;

      const form = new FormData();
      form.append('image', imageBuffer, {
        filename: 'anime.jpg',
        contentType: 'image/jpeg'
      });

      // Kirim ke Anime Finder API
      const response = await axios.post('https://www.animefinder.xyz/api/identify', form, {
        headers: {
          ...form.getHeaders(),
          'Origin': 'https://www.animefinder.xyz',
          'Referer': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3 Mobile/15E148 Safari/604.1'
        },
        maxBodyLength: Infinity
      });

      const result = response.data;

      res.json({
        status: true,
        image,
        anime: result.animeTitle,
        character: result.character,
        genres: result.genres,
        premiere: result.premiereDate,
        production: result.productionHouse,
        description: result.description,
        synopsis: result.synopsis,
        references: result.references || []
      });

    } catch (err) {
      res.status(500).json({
        status: false,
        message: 'Gagal mengidentifikasi anime dari gambar',
        error: err.response?.data || err.message
      });
    }
  });
};
