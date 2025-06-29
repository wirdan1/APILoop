const axios = require('axios');

module.exports = function(app) {
  function msToMinutes(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  app.get('/spotify/download', async (req, res) => {
    const { url } = req.query;
    if (!url) {
      return res.status(400).json({
        status: false,
        message: 'Link-nya mana, senpai?'
      });
    }

    try {
      const headers = {
        'Content-Type': 'application/json',
        'Origin': 'https://spotiydownloader.com',
        'Referer': 'https://spotiydownloader.com/id',
        'User-Agent': 'Mozilla/5.0'
      };

      const metaResponse = await axios.post(
        'https://spotiydownloader.com/api/metainfo',
        { url },
        { headers }
      );

      const meta = metaResponse.data;
      if (!meta || !meta.success || !meta.id) {
        throw new Error('Gomen senpai! Aku gagal mengambil info lagunya');
      }

      const dlResponse = await axios.post(
        'https://spotiydownloader.com/api/download',
        { id: meta.id },
        { headers }
      );

      const result = dlResponse.data;
      if (!result || !result.success || !result.link) {
        throw new Error('Yabai! Gagal dapetin link-nya senpai!');
      }

      res.json({
        status: true,
        artist: meta.artists || meta.artist || 'Unknown',
        title: meta.title || 'Unknown',
        duration: meta.duration_ms ? msToMinutes(meta.duration_ms) : 'Unknown',
        image: meta.cover || null,
        download: result.link
      });

    } catch (err) {
      res.status(500).json({
        status: false,
        message: err.message
      });
    }
  });
};
