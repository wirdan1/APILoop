const axios = require('axios');

module.exports = function(app) {
    async function getLyrics(title) {
        const apiUrl = `https://some-random-api.com/lyrics?title=${encodeURIComponent(title)}`;

        try {
            const res = await axios.get(apiUrl, {
                validateStatus: () => true
            });

            const data = res.data;

            if (!data || !data.title || !data.lyrics) {
                throw new Error('Lirik tidak ditemukan.');
            }

            return data;
        } catch (err) {
            throw new Error(err.message || 'Gagal mengambil data dari API lirik.');
        }
    }

    app.get('/api/lyrics', async (req, res) => {
        const { title } = req.query;
        if (!title) return res.status(400).json({ status: false, error: 'Title is required' });

        try {
            const lyricsData = await getLyrics(title);
            res.json({
                status: true,
                result: lyricsData
            });
        } catch (err) {
            res.status(500).json({ status: false, error: err.message });
        }
    });
};
