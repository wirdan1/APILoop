const axios = require('axios');

module.exports = function (app) {
  app.get('/tools/cuaca', async (req, res) => {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({
        status: false,
        message: 'Berikan parameter lokasi. Contoh: /cuaca?query=jakarta'
      });
    }

    try {
      const apiUrl = `https://api.botcahx.eu.org/api/tools/cuaca?query=${encodeURIComponent(query)}&apikey=danz-dev`;
      const { data } = await axios.get(apiUrl);

      if (!data.status || !data.result) {
        throw new Error('Gagal mengambil data cuaca.');
      }

      res.json({
        status: true,
        location: data.result.location,
        country: data.result.country,
        weather: data.result.weather,
        currentTemp: data.result.currentTemp,
        maxTemp: data.result.maxTemp,
        minTemp: data.result.minTemp,
        humidity: data.result.humidity,
        windSpeed: data.result.windSpeed
      });
    } catch (error) {
      res.status(500).json({
        status: false,
        message: 'Terjadi kesalahan saat mengambil data cuaca.',
        error: error.message
      });
    }
  });
};
