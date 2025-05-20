const axios = require('axios');
const cheerio = require('cheerio');

module.exports = function (app) {
    app.get('/freefire/stalk', async (req, res) => {
        const { id } = req.query;

        if (!id) {
            return res.status(400).json({
                status: false,
                error: 'Parameter "id" diperlukan.'
            });
        }

        const url = `https://ff.garena.com/id/chars/${id}`;

        try {
            const response = await axios.get(url);
            const $ = cheerio.load(response.data);

            const char = {
                nama: $('.char-name').text().trim(),
                abstrak: $('.char-abstract').text().trim(),
                kemampuan: $('.skill-profile-name').text().trim(),
                deskripsi_kemampuan: $('.skill-introduction').text().trim(),
                biografi: $('.detail p').text().trim(),
                profil: $('.profile-item').map((i, el) => {
                    return {
                        [$(el).find('.profile-key').text().trim()]: $(el).find('.profile-value').text().trim()
                    };
                }).get(),
                gambar: {
                    karakter: $('.char-pic img').attr('src'),
                    latar_belakang: $('.char-detail-bg-pic div').first().css('background-image')?.match(/url"(.+)"/)?.[1] || null,
                    biografi: $('.pic-img').css('background-image')?.match(/url"(.+)"/)?.[1] || null
                },
                karakter_sebelumnya: {
                    nama: $('.char-prev .pre-next .prev div').text().trim(),
                    link: $('.char-prev a').attr('href')
                },
                karakter_berikutnya: {
                    nama: $('.char-next .pre-next .next div').text().trim(),
                    link: $('.char-next a').attr('href')
                }
            };

            res.json({
                status: true,
                result: char
            });

        } catch (error) {
            res.status(500).json({
                status: false,
                error: 'Gagal mengambil data karakter.',
                message: error.message
            });
        }
    });
};
