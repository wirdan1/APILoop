const axios = require('axios');
const FormData = require('form-data');

module.exports = function (app) {
  app.get('/tools/remini', async (req, res) => {
    try {
      const imageUrl = req.query.url;
      const resolution = req.query.res || '1080p';
      const enhance = req.query.enhance === 'false' ? false : true;

      if (!imageUrl || !/^https?:\/\/.+\.(jpe?g|png|webp|gif)$/i.test(imageUrl)) {
        return res.status(400).json({
          status: false,
          message: 'URL gambar tidak valid. Contoh: ?url=https://contoh.com/gambar.jpg'
        });
      }

      const validResolutions = ['480p', '720p', '1080p', '2k', '4k', '8k', '12k'];
      if (!validResolutions.includes(resolution.toLowerCase())) {
        return res.status(400).json({
          status: false,
          message: 'Resolusi tidak valid. Pilih salah satu: ' + validResolutions.join(', ')
        });
      }

      const { data: imageBuffer } = await axios.get(imageUrl, { responseType: 'arraybuffer' });

      const form = new FormData();
      form.append('image', imageBuffer, { filename: 'image.jpg' });
      form.append('resolution', resolution.toLowerCase());
      form.append('enhance', enhance.toString());

      const { data } = await axios.post('https://upscale.cloudkuimages.guru/hd.php', form, {
        headers: {
          ...form.getHeaders(),
          origin: 'https://upscale.cloudkuimages.guru',
          referer: 'https://upscale.cloudkuimages.guru/'
        },
        maxBodyLength: Infinity
      });

      if (data?.status !== 'success') {
        return res.status(500).json({
          status: false,
          message: 'Upscale gagal: ' + JSON.stringify(data)
        });
      }

      const result = data.data;

      res.json({
        status: true,
        result: {
          url: result.url,
          filename: result.filename,
          original: result.original,
          resolution_from: result.original_resolution,
          resolution_to: result.resolution_now,
          enhanced: result.enhanced,
          size_before: result.original_size,
          size_after: result.new_size
        }
      });

    } catch (error) {
      res.status(500).json({
        status: false,
        message: 'Terjadi kesalahan: ' + error.message
      });
    }
  });
};
