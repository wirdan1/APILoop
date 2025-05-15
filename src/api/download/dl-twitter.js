const axios = require('axios');
const cheerio = require('cheerio');

module.exports = function (app) {
    async function fetchTwmate(url) {
        try {
            const response = await axios.post('https://twmate.com/', new URLSearchParams({
                page: url,
                ftype: 'all',
                ajax: '1'
            }), {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                    'Accept': '/',
                    'X-Requested-With': 'XMLHttpRequest',
                    'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Mobile Safari/537.36',
                    'Referer': 'https://twmate.com/',
                }
            });

            const $ = cheerio.load(response.data);
            const videoLinks = [];
            $('.btn-dl').each((index, element) => {
                const quality = $(element).parent().prev().text().trim();
                const downloadUrl = $(element).attr('href');
                videoLinks.push({ quality, downloadUrl });
            });

            return videoLinks;
        } catch (error) {
            throw new Error('Gagal mengambil data dari Twmate.');
        }
    }

    app.get('/download/x', async (req, res) => {
        const { url } = req.query;
        if (!url) {
            return res.status(400).json({ status: false, error: 'Parameter "url" diperlukan' });
        }

        try {
            const result = await fetchTwmate(url);
            res.json({
                status: true,
                creator: "Danz-dev",
                media: result
            });
        } catch (err) {
            res.status(500).json({ status: false, error: err.message });
        }
    });
};
