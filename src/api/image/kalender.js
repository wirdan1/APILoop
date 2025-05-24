const axios = require('axios');

module.exports = function(app) {
    const IMAGE_URL = 'https://fgsi1-restapi.hf.space/api/maker/calendar';

    app.get('/kalender', async (req, res) => {
        try {
            // Cek apakah gambar tersedia
            const response = await axios.head(IMAGE_URL);

            if (response.status !== 200) {
                throw new Error('Gambar tidak tersedia');
            }

            res.json({
                status: true,
                message: 'Berikut Kalender Hari Ini',
                imageUrl: IMAGE_URL,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('Kalender error:', error.message);

            res.status(500).json({
                status: false,
                error: 'Gagal mengambil kalender. Silakan coba lagi nanti.'
            });
        }
    });
};
