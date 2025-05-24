const axios = require('axios');

module.exports = function(app) {
    async function getJadwalSholat(city) {
        const apiUrl = `https://api.vreden.my.id/api/islami/jadwalsholat?city=${encodeURIComponent(city)}`;

        try {
            const res = await axios.get(apiUrl, {
                validateStatus: () => true
            });

            const data = res.data;

            if (!data || !data.result) {
                throw new Error('Gagal mendapatkan data dari API Jadwal Sholat.');
            }

            return data;
        } catch (err) {
            throw new Error(err.message || 'Gagal mengambil data dari API Jadwal Sholat.');
        }
    }

    app.get('/info/jadwalsholat', async (req, res) => {
        const { city } = req.query;
        if (!city) {
            return res.status(400).json({ status: false, error: 'City is required' });
        }

        try {
            const jadwalData = await getJadwalSholat(city);
            res.json({
                status: 200,
                creator: "api.vreden.my.id",
                result: jadwalData.result
            });
        } catch (err) {
            res.status(500).json({ status: false, error: err.message });
        }
    });
};
