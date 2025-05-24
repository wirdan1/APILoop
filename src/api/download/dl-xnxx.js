const axios = require('axios');

module.exports = function(app) {
    const API_KEY = 'danz-dev'; // Ganti jika kamu pakai API key lain
    const BASE_URL = 'https://api.botcahx.eu.org/api/download/xnxxdl';

    async function downloadXnxxVideo(url) {
        try {
            const response = await axios.get(BASE_URL, {
                params: {
                    url,
                    apikey: API_KEY
                }
            });

            return response.data.result;
        } catch (error) {
            console.error('XNXX Download Error:', error.message);
            return null;
        }
    }

    app.get('/xnxx/download', async (req, res) => {
        const { url } = req.query;

        if (!url) {
            return res.status(400).json({
                status: false,
                error: 'Query parameter "url" is required. Example: /xnxx/download?url=https://www.xnxx.com/video-...'
            });
        }

        const result = await downloadXnxxVideo(url);

        if (!result) {
            return res.status(500).json({
                status: false,
                error: 'Failed to fetch download link from API'
            });
        }

        res.json({
            status: true,
            title: result.title || 'N/A',
            duration: result.duration || 'N/A',
            downloadUrl: result.url,
            thumbnail: result.thumb || null,
            info: result.info || null,
            timestamp: new Date().toISOString()
        });
    });
};
