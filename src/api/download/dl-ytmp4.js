const axios = require('axios');

module.exports = function(app) {
    async function getSaveTubeMP4(url) {
        const apiUrl = `https://api.nekorinn.my.id/downloader/savetube?url=${encodeURIComponent(url)}&format=720`;

        try {
            const res = await axios.get(apiUrl, {
                validateStatus: () => true
            });

            const data = res.data;

            if (!data || !data.status || !data.result || !data.result.download) {
                throw new Error('Gagal mendapatkan data dari API SaveTube.');
            }

            return data;
        } catch (err) {
            throw new Error(err.message || 'Gagal mengambil data dari API SaveTube.');
        }
    }

    app.get('/download/ytmp4', async (req, res) => {
        const { url } = req.query;
        if (!url) {
            return res.status(400).json({ status: false, error: 'URL is required' });
        }

        try {
            const saveTubeData = await getSaveTubeMP4(url);
            res.json({
                status: true,
                creator: "Danz-dev",
                result: {
                    title: saveTubeData.result.title,
                    type: saveTubeData.result.type,
                    format: saveTubeData.result.format,
                    quality: saveTubeData.result.quality,
                    duration: saveTubeData.result.duration,
                    thumbnail: saveTubeData.result.thumbnail,
                    download: saveTubeData.result.download
                }
            });
        } catch (err) {
            res.status(500).json({ status: false, error: err.message });
        }
    });
};
