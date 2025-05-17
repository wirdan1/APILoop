const axios = require('axios');
const cheerio = require('cheerio');

module.exports = function (app) {
    app.get('/api/lyrics', async (req, res) => {
        const { title } = req.query;

        if (!title) {
            return res.status(400).json({
                status: false,
                error: 'Parameter "title" diperlukan.'
            });
        }

        const url = `https://r.jina.ai/https://www.google.com/search?q=liirk+lagu+${encodeURIComponent(title)}&hl=en`;

        try {
            const response = await axios.get(url, {
                headers: {
                    'x-return-format': 'html',
                    'x-engine': 'cf-browser-rendering',
                }
            });

            const $ = cheerio.load(response.data);
            const lirik = [];
            const output = [];
            const result = {};
            const metadata = {};

            $('div.PZPZlf').each((i, e) => {
                const penemu = $(e).find('div[jsname="U8S5sf"]').text().trim();
                if (!penemu) output.push($(e).text().trim());
            });

            $('div[jsname="U8S5sf"]').each((i, el) => {
                let out = '';
                $(el).find('span[jsname="YS01Ge"]').each((j, span) => {
                    out += $(span).text() + '\n';
                });
                lirik.push(out.trim());
            });

            result.lyrics = lirik.join('\n\n');
            metadata.title = output.shift();
            metadata.subtitle = output.shift();
            metadata.platform = output.filter(_ => !_.includes(':'));
            output.forEach(_ => {
                if (_.includes(':')) {
                    const [name, value] = _.split(':');
                    result[name.toLowerCase()] = value.trim();
                }
            });

            res.json({ status: true, result, metadata });

        } catch (error) {
            res.status(500).json({
                status: false,
                error: 'Gagal mengambil lirik lagu.',
                message: error.message
            });
        }
    });
};
