const axios = require('axios');

module.exports = function(app) {
    const API_KEY = 'danz-dev'; // Ganti sesuai kebutuhan
    const BASE_URL = 'https://api.botcahx.eu.org/api/tools/jadwalshalat';

    function getPrayerTimesForToday(data) {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        const todayString = `${day}-${month}-${year}`;

        for (const item of data.result.data) {
            if (item.date.gregorian.date === todayString) {
                return item;
            }
        }
        return null;
    }

    async function fetchPrayerData(kota) {
        try {
            const response = await axios.get(BASE_URL, {
                params: {
                    kota,
                    apikey: API_KEY
                }
            });

            return response.data;
        } catch (err) {
            console.error('Fetch error:', err.message);
            return null;
        }
    }

    app.get('/info/jadwalsholat', async (req, res) => {
        const { kota } = req.query;

        if (!kota) {
            return res.status(400).json({
                status: false,
                error: 'Parameter "kota" diperlukan. Contoh: /jadwal-sholat/api?kota=semarang'
            });
        }

        const data = await fetchPrayerData(kota);

        if (!data || !data.status || data.result.code !== 200) {
            return res.status(500).json({
                status: false,
                error: 'Gagal mendapatkan data dari API eksternal'
            });
        }

        const prayerToday = getPrayerTimesForToday(data);

        if (!prayerToday) {
            return res.status(404).json({
                status: false,
                error: 'Data jadwal sholat untuk hari ini tidak ditemukan'
            });
        }

        const timings = Object.entries(prayerToday.timings).map(([name, time]) => ({
            name,
            time
        }));

        res.json({
            status: true,
            kota,
            tanggal: prayerToday.date.gregorian.date,
            waktu: timings,
            timestamp: new Date().toISOString()
        });
    });
};
