const axios = require('axios');

module.exports = function(app) {
    app.get('/douyin', async (req, res) => {
        const { url } = req.query;

        if (!url || !url.includes('douyin')) {
            return res.status(400).json({
                status: false,
                message: 'URL Douyin tidak valid. Contoh: /douyin/download?url=https://v.douyin.com/xxxxx/'
            });
        }

        try {
            const response = await axios.get(`https://api.botcahx.eu.org/api/dowloader/douyin?url=${encodeURIComponent(url)}&apikey=danz-dev`);
            const data = response.data.result;

            if (!data || !data.video) {
                return res.status(404).json({
                    status: false,
                    message: 'Video tidak ditemukan.'
                });
            }

            res.json({
                status: true,
                result: {
                    title: data.title,
                    audio_title: data.title_audio,
                    video: data.video,
                    audio: data.audio[0] || null
                },
                timestamp: new Date().toISOString()
            });
        } catch (err) {
            console.error('Douyin Download Error:', err.message);
            res.status(500).json({
                status: false,
                message: 'Gagal mengambil data dari API.'
            });
        }
    });
};
