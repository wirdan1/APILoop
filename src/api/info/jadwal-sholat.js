const axios = require('axios');
const cheerio = require('cheerio');

module.exports = function(app) {
    // Fungsi ubah nama kota menjadi slug
    function formatKotaToSlug(kota) {
        return kota
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, '') // Hapus karakter non-alfanumerik
            .replace(/\s+/g, '-');       // Ganti spasi dengan "-"
    }

    // Fungsi scraping jadwal sholat
    async function getJadwalSholat(kota) {
        const slug = formatKotaToSlug(kota);
        const url = `https://jadwal-sholat.tirto.id/${slug}`;

        try {
            const { data: html } = await axios.get(url);
            const $ = cheerio.load(html);
            const jadwal = [];

            $('.table tbody tr').each((_, element) => {
                const row = $(element);
                jadwal.push({
                    shubuh: row.find('td:nth-child(1)').text().trim(),
                    dzuhur: row.find('td:nth-child(2)').text().trim(),
                    ashar: row.find('td:nth-child(3)').text().trim(),
                    maghrib: row.find('td:nth-child(4)').text().trim(),
                    isya: row.find('td:nth-child(5)').text().trim(),
                });
            });

            return jadwal.length ? jadwal : null;
        } catch (error) {
            console.error(`Scrape error:`, error.message);
            return null;
        }
    }

    // Endpoint Express
    app.get('/info/jadwalsholat', async (req, res) => {
        const { kota } = req.query;

        if (!kota) {
            return res.status(400).json({
                status: false,
                error: 'Parameter "kota" diperlukan. Contoh: /jadwal-sholat?kota=Kab Batu Bara'
            });
        }

        const jadwal = await getJadwalSholat(kota);

        if (!jadwal) {
            return res.status(404).json({
                status: false,
                error: `Gagal mengambil jadwal untuk kota "${kota}"`
            });
        }

        res.json({
            status: true,
            kota: kota,
            slug: formatKotaToSlug(kota),
            tanggal: new Date().toLocaleDateString('id-ID'),
            jadwal,
            timestamp: new Date().toISOString()
        });
    });
};
