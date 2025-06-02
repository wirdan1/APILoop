const axios = require('axios');

module.exports = function(app) {
  app.get('/freepik/search', async (req, res) => {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({
        status: false,
        message: 'Parameter ?q= wajib diisi'
      });
    }

    try {
      const page = Math.floor(Math.random() * 100) + 1;
      const { data } = await axios.get(`https://www.freepik.com/api/regular/search?filters[ai-generated][excluded]=1&filters[content_type]=photo&locale=en&page=${page}&term=${q}`, {
        headers: {
          'user-agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Mobile Safari/537.36'
        }
      });

      const results = data.items.map(item => ({
        title: item.name,
        type: item.type,
        is_premium: item.premium,
        is_aigenerated: item.isAIGenerated,
        author: {
          name: item.author.name,
          avatar: item.author.avatar,
          url: `https://www.freepik.com/author/${item.author.slug}`
        },
        previewUrl: item.preview.url,
        url: item.url
      }));

      res.json({ status: true, result: results });
    } catch (err) {
      res.status(500).json({
        status: false,
        message: 'Gagal mencari data',
        error: err.message
      });
    }
  });
};
