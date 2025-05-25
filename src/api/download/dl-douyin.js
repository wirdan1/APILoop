const axios = require('axios');

module.exports = function(app) {
    const API_KEY = 'danz-dev'; // Ganti sesuai kebutuhan

    app.get('/douyin', async (req, res) => {
        const { url } = req.query;

        if (!url) {
            return res.status(400).json({
                status: false,
                error: 'Masukkan parameter "url". Contoh: /douyin?url=https://v.douyin.com/ikq8axJ/'
            });
        }

        if (!/douyin/gi.test(url)) {
            return res.status(400).json({
                status: false,
                error: 'URL tidak valid atau bukan dari Douyin.'
            });
        }

        try {
            const response = await axios.get(`https://api.botcahx.eu.org/api/dowloader/douyin`, {
                params: {
                    url,
                    apikey: API_KEY
                }
            });

            const data = response.data.result;
            const { video, title, title_audio, audio } = data;

            res.json({
                status: true,
                title,
                title_audio,
                videoUrl: video,
                audioUrl: audio[0],
                caption: `乂 *D O U Y I N*\n\n◦ *Title* : ${title}\n◦ *Audio* : ${title_audio}`,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('Douyin error:', error.message);
            res.status(500).json({
                status: false,
                error: 'Terjadi kesalahan saat mengambil data dari API.'
            });
        }
    });
};
