const axios = require('axios');
const FormData = require('form-data');

module.exports = function(app) {
  const headersBase = {
    accept: "application/json, text/plain, */*",
    "accept-language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
    origin: "https://vheer.com",
    referer: "https://vheer.com/",
    "next-action": "1eeefc61e5469e1a173b48743a3cb8dd77eed91b"
  };

  const toBase64 = (str) => Buffer.from(str, 'utf-8').toString('base64');

  async function generateTextToImage(prompt) {
    if (!prompt) throw new Error('Isi promptnya dulu, bray!');

    const type = 1;
    const width = 768;
    const height = 1344;
    const flux_model = 1;

    const form = new FormData();
    form.append("prompt", toBase64(prompt));
    form.append("type", String(type));
    form.append("width", String(width));
    form.append("height", String(height));
    form.append("flux_model", String(flux_model));

    const uploadHeaders = { ...headersBase, ...form.getHeaders() };

    const uploadRes = await axios.post(
      "https://access.vheer.com/api/Vheer/UploadByFile",
      form,
      { headers: uploadHeaders }
    );

    const code = uploadRes.data?.data?.code;
    if (!code) throw new Error('Gagal dapet kode txt2img, bray!');

    let imageUrl = null;
    const maxTime = 180000;
    const start = Date.now();

    while (Date.now() - start < maxTime) {
      const pollRes = await axios.post(
        "https://vheer.com/app/text-to-image",
        `[{"type":${type},"code":"${code}"}]`,
        { headers: headersBase }
      );

      const lines = pollRes.data.split('\n');
      for (let line of lines) {
        const match = line.match(/^\d+:(\{.*\})$/);
        if (match) {
          const obj = JSON.parse(match[1]);
          if (obj.data?.status === 'success' && obj.data.downloadUrls?.[0]) {
            imageUrl = obj.data.downloadUrls[0];
            break;
          }
          if (obj.data?.status && obj.data.status !== 'waiting') {
            throw new Error('Gagal generate gambar, bray!');
          }
        }
      }

      if (imageUrl) break;
      await new Promise(res => setTimeout(res, 3000));
    }

    if (!imageUrl) throw new Error('Task terlalu lama, 3 menit lewat, gambar gak kelar, bray!');
    return imageUrl;
  }

  app.get('/txt2img', async (req, res) => {
    const { prompt } = req.query;

    if (!prompt) {
      return res.status(400).json({
        status: false,
        message: 'Masukkan parameter prompt.'
      });
    }

    try {
      const url = await generateTextToImage(prompt);
      res.json({ status: true, url });
    } catch (error) {
      res.status(500).json({
        status: false,
        message: error.message
      });
    }
  });
};
