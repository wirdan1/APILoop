const axios = require('axios');

module.exports = function(app) {
    const API_KEY = 'danz-dev'; // Ganti dengan API key kamu jika berbeda
    const BASE_URL = 'https://api.botcahx.eu.org/api/search/xnxx';

    async function searchXnxx(query) {
        try {
            const response = await axios.get(BASE_URL, {
                params: {
                    query,
                    apikey: API_KEY
                }
            });

            return response.data.result;
        } catch (error) {
            console.error('XNXX Search Error:', error.message);
            return null;
        }
    }

    app.get('/xnxx/search', async (req, res) => {
        const { query } = req.query;

        if (!query) {
            return res.status(400).json({
                status: false,
                error: 'Query parameter is required. Example: /xnxx/search?query=Big boobs'
            });
        }

        const results = await searchXnxx(query);

        if (!results || results.length === 0) {
            return res.status(404).json({
                status: false,
                error: 'No results found'
            });
        }

        const formattedResults = results.map((item, index) => ({
            no: index + 1,
            title: item.title,
            duration: item.duration,
            link: item.link,
            thumb: item.thumb
        }));

        res.json({
            status: true,
            keywords: query,
            resultCount: formattedResults.length,
            results: formattedResults,
            thumbnail: results[0]?.thumb || null,
            timestamp: new Date().toISOString()
        });
    });
};
