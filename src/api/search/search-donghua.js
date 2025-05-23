const axios = require('axios');
const cheerio = require('cheerio');

module.exports = function(app) {
    async function searchDonghua(keyword) {
        try {
            const url = `https://anichin.co.id/?s=${encodeURIComponent(keyword)}`;
            const { data } = await axios.get(url);
            const $ = cheerio.load(data);

            const results = [];
            $('.listupd .bs').each((i, el) => {
                const link = $(el).find('.bsx > a').attr('href');
                const img = $(el).find('img').attr('src');
                const namaDonghua = $(el).find('.tt').clone().children().remove().end().text().trim();
                const episode = $(el).find('.epx').text().trim();

                results.push({ 
                    link, 
                    img, 
                    namaDonghua, 
                    episode 
                });
            });

            return results;
        } catch (error) {
            console.error('Donghua search error:', error.message);
            return null;
        }
    }

    app.get('/search/donghua', async (req, res) => {
        try {
            const { keyword } = req.query;
            
            if (!keyword) {
                return res.status(400).json({ 
                    status: false, 
                    error: 'Search keyword is required',
                    example: '/search/donghua?keyword=martial'
                });
            }

            const results = await searchDonghua(keyword);
            
            if (!results) {
                return res.status(500).json({ 
                    status: false, 
                    error: 'Failed to search donghua' 
                });
            }

            res.json({ 
                status: true, 
                result: results,
                timestamp: new Date().toISOString()
            });

        } catch (err) {
            res.status(500).json({ 
                status: false, 
                error: err.message 
            });
        }
    });
};
