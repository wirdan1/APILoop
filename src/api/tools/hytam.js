const axios = require('axios');

module.exports = function (app) {
  app.get('/hytam', async (req, res) => {
    const { url, filter } = req.query;
    const FILTERS = ['Coklat', 'Hitam', 'Nerd', 'Piggy', 'Carbon', 'Botak'];
    const selected = FILTERS.find(f => f.toLowerCase() === (filter || 'Hitam').toLowerCase());

    if (!url || !/^https?:\/\//.test(url)) {
      return res.status(400).json({
        status: false,
        message: 'Berikan URL gambar yang valid. Contoh: /filterimage?url=https://example.com/image.jpg&filter=Hitam'
      });
    }

    if (!selected) {
      return res.status(400).json({
        status: false,
        message: `Filter '${filter}' tidak tersedia. Filter yang tersedia: ${FILTERS.join(', ')}`
      });
    }

    try {
      const imgRes = await axios.get(url, { responseType: 'arraybuffer' });
      const base64Input = Buffer.from(imgRes.data).toString('base64');

      const { data } = await axios.post('https://wpw.my.id/api/process-image', {
        imageData: base64Input,
        filter: selected.toLowerCase()
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Origin': 'https://wpw.my.id',
          'Referer': 'https://wpw.my.id/'
        }
      });

      const dataUrl = data?.processedImageUrl;
      if (!dataUrl?.startsWith('data:image/')) {
        throw new Error('Gagal memproses gambar.');
      }

      res.json({
        status: true,
        url,
        filter: selected,
        result: dataUrl
      });
    } catch (error) {
      res.status(500).json({
        status: false,
        message: 'Terjadi kesalahan saat memproses gambar.',
        error: error.message
      });
    }
  });
};
