const axios = require('axios');
const cheerio = require('cheerio');

function parseKomikuSearch(html) {
    const $ = cheerio.load(html);
    const mangas = [];

    $('.bge').each((_, el) => {
        const manga = {};
        const bgei = $(el).find('.bgei > a');
        manga.href = `https://komiku.id${bgei.attr('href')}`;
        manga.thumbnail = bgei.find('img').attr('src');

        const tipeGenreText = bgei.find('.tpe1_inf').text().trim();
        const tipe = bgei.find('b').text().trim();
        const genre = tipeGenreText.replace(tipe, '').trim();
        manga.type = tipe;
        manga.genre = genre;

        manga.title = $(el).find('.kan > a > h3').text().trim();
        manga.last_update = $(el).find('.kan > p').text().trim();

        manga.chapters = [];
        $(el).find('.new1 > a').each((_, el2) => {
            manga.chapters.push({
                href: `https://komiku.id${$(el2).attr('href')}`,
                title: $(el2).attr('title'),
                label: $(el2).find('span').last().text().trim()
            });
        });

        mangas.push(manga);
    });

    return mangas;
}

module.exports = function(app) {
    app.get('/komiku/search', async (req, res) => {
        const { q } = req.query;
        if (!q) {
            return res.status(400).json({ status: false, message: 'Query parameter ?q= is required' });
        }

        const url = `https://api.komiku.id/?post_type=manga&s=${encodeURIComponent(q)}`;

        try {
            const { data } = await axios.get(url);
            const results = parseKomikuSearch(data);

            res.json({
                status: true,
                query: q,
                results,
                total: results.length
            });
        } catch (err) {
            console.error('Komiku scrape error:', err.message);
            res.status(500).json({ status: false, message: 'Failed to fetch data from Komiku.' });
        }
    });
};
